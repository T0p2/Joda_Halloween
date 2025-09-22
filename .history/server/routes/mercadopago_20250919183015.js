const express = require('express');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { getDatabase } = require('../database/setup');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const router = express.Router();

// Configurar Mercado Pago con variables de entorno
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

if (!accessToken) {
  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
}

const client = new MercadoPagoConfig({ 
  accessToken: accessToken
});

// Endpoint para obtener la public key
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publicKey: publicKey
  });
});

// Endpoint de prueba para verificar configuración
router.get('/test', async (req, res) => {
  try {
    console.log('Testing MercadoPago configuration...');
    
    res.json({
      success: true,
      message: 'MercadoPago configuration loaded',
      config: {
        hasAccessToken: !!accessToken,
        hasPublicKey: !!publicKey,
        accessTokenPreview: accessToken ? 
          accessToken.substring(0, 20) + '...' : 'Not set',
        publicKeyPreview: publicKey ?
          publicKey.substring(0, 20) + '...' : 'Not set'
      }
    });
  } catch (error) {
    console.error('Error testing MercadoPago config:', error);
    res.status(500).json({
      success: false,
      error: 'Error testing MercadoPago configuration',
      details: error.message
    });
  }
});

// Crear preferencia de pago
router.post('/create-preference', async (req, res) => {
  try {
    console.log('📋 Received payment request:', req.body);
    const { event, attendees, totalPrice, quantity, userId } = req.body;

    // Validación de datos
    if (!event || !attendees || !totalPrice || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos: event, attendees, totalPrice y quantity son requeridos'
      });
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un asistente'
      });
    }

    // Verificar disponibilidad de entradas
    const db = getDatabase();
    const eventData = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM events WHERE id = ?', [event.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!eventData) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    if (eventData.available_tickets < quantity) {
      return res.status(400).json({
        success: false,
        error: `Solo hay ${eventData.available_tickets} entradas disponibles`
      });
    }

    // Generar referencia única para el pago
    const externalReference = `TICKET-${event.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const preference = {
      items: [
        {
          title: `🎫 ${event.name}`,
          description: `${quantity} entrada${quantity > 1 ? 's' : ''} para ${event.name}`,
          unit_price: parseFloat(event.price),
          quantity: parseInt(quantity),
          currency_id: 'ARS'
        }
      ],
      payer: {
        name: attendees[0].name,
        email: attendees[0].email,
        phone: {
          number: attendees[0].phone || ''
        }
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/success?ref=${externalReference}`,
        failure: `${process.env.FRONTEND_URL}/payment?error=payment_failed`,
        pending: `${process.env.FRONTEND_URL}/payment?status=pending`
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
      statement_descriptor: 'ENTRADAS_EVENTO',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      metadata: {
        event_id: event.id,
        user_id: userId,
        attendees_count: quantity,
        attendees: JSON.stringify(attendees)
      }
    };

    console.log('🚀 Creating preference:', {
      eventName: event.name,
      quantity,
      totalPrice,
      attendeesCount: attendees.length
    });

    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log('✅ MercadoPago preference created:', response.id);
    
    // Guardar la preferencia temporalmente en la base de datos
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO payment_preferences 
        (preference_id, external_reference, event_id, user_id, attendees_data, total_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `, [
        response.id,
        externalReference,
        event.id,
        userId,
        JSON.stringify(attendees),
        totalPrice
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
      externalReference: externalReference,
      publicKey: publicKey
    });

  } catch (error) {
    console.error('❌ Error creating MercadoPago preference:', error);
    
    let errorMessage = 'Error al crear la preferencia de pago';
    let details = error.message;
    
    if (error.message.includes('invalid_token') || error.status === 401) {
      errorMessage = 'Credenciales de MercadoPago inválidas';
      details = 'Verifica que el MERCADOPAGO_ACCESS_TOKEN sea correcto en el archivo .env';
    } else if (error.message.includes('bad_request') || error.status === 400) {
      errorMessage = 'Error en los datos de la preferencia';
      details = 'Revisa que todos los datos estén correctos';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: details,
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener información de pago
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { Payment } = require('mercadopago');
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ paymentId });
    
    res.json({
      success: true,
      payment: payment
    });

  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del pago'
    });
  }
});

// Webhook para notificaciones
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const { Payment } = require('mercadopago');
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ paymentId: data.id });
      console.log('Payment received:', payment);
      
      // Aquí puedes procesar el pago (guardar en BD, enviar email, etc.)
      if (payment.status === 'approved') {
        // Pago aprobado - enviar entradas por email
        console.log('Payment approved for:', payment.external_reference);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
