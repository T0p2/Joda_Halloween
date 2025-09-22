const express = require('express');
const mercadopago = require('mercadopago');
const { getDatabase } = require('../database/setup');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configurar Mercado Pago con variables de entorno
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

if (!accessToken) {
  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
}

mercadopago.configure({
  access_token: accessToken
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

// Webhook para notificaciones de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook received:', req.body);
    const { type, data, action } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información completa del pago
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });
      
      console.log('💳 Payment info:', {
        id: payment.id,
        status: payment.status,
        externalReference: payment.external_reference,
        amount: payment.transaction_amount
      });
      
      if (payment.status === 'approved') {
        await processApprovedPayment(payment);
      } else if (payment.status === 'rejected') {
        await processRejectedPayment(payment);
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Procesar pago aprobado
async function processApprovedPayment(payment) {
  try {
    const db = getDatabase();
    const externalReference = payment.external_reference;
    
    // Buscar la preferencia
    const preference = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM payment_preferences WHERE external_reference = ?', 
        [externalReference], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });
    
    if (!preference) {
      console.error('❌ Preference not found for reference:', externalReference);
      return;
    }
    
    const attendees = JSON.parse(preference.attendees_data);
    
    // Crear entradas para cada asistente
    const ticketPromises = attendees.map(async (attendee) => {
      const ticketCode = uuidv4();
      const qrData = JSON.stringify({
        ticketCode,
        eventId: preference.event_id,
        attendeeName: attendee.name,
        paymentId: payment.id
      });
      
      const qrCodeData = await QRCode.toDataURL(qrData);
      
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO tickets 
          (ticket_code, user_id, event_id, qr_code, status, payment_intent_id, amount_paid, 
           attendee_name, attendee_email, attendee_dni, attendee_phone, created_at)
          VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          ticketCode,
          preference.user_id,
          preference.event_id,
          qrCodeData,
          payment.id,
          payment.transaction_amount / attendees.length,
          attendee.name,
          attendee.email,
          attendee.dni,
          attendee.phone
        ], (err) => {
          if (err) reject(err);
          else resolve(ticketCode);
        });
      });
    });
    
    const createdTickets = await Promise.all(ticketPromises);
    
    // Actualizar entradas disponibles del evento
    await new Promise((resolve, reject) => {
      db.run('UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
        [attendees.length, preference.event_id], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    // Actualizar estado de la preferencia
    await new Promise((resolve, reject) => {
      db.run('UPDATE payment_preferences SET status = ?, payment_id = ? WHERE external_reference = ?',
        ['completed', payment.id, externalReference], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    console.log('✅ Payment processed successfully:', {
      paymentId: payment.id,
      ticketsCreated: createdTickets.length,
      externalReference
    });
    
  } catch (error) {
    console.error('❌ Error processing approved payment:', error);
  }
}

// Procesar pago rechazado
async function processRejectedPayment(payment) {
  try {
    const db = getDatabase();
    
    await new Promise((resolve, reject) => {
      db.run('UPDATE payment_preferences SET status = ? WHERE external_reference = ?',
        ['rejected', payment.external_reference], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    console.log('❌ Payment rejected:', payment.external_reference);
  } catch (error) {
    console.error('❌ Error processing rejected payment:', error);
  }
}

// Obtener información de pago
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
        date_created: payment.date_created,
        payer: payment.payer
      }
    });

  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del pago'
    });
  }
});

// Verificar estado de pago por referencia externa
router.get('/payment-status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const db = getDatabase();
    
    const preference = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM payment_preferences WHERE external_reference = ?', 
        [reference], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });
    
    if (!preference) {
      return res.status(404).json({
        success: false,
        error: 'Referencia de pago no encontrada'
      });
    }
    
    // Si hay un payment_id, obtener información actualizada
    let paymentInfo = null;
    if (preference.payment_id) {
      try {
        const paymentClient = new Payment(client);
        const payment = await paymentClient.get({ id: preference.payment_id });
        paymentInfo = {
          status: payment.status,
          status_detail: payment.status_detail,
          transaction_amount: payment.transaction_amount
        };
      } catch (err) {
        console.error('Error getting payment info:', err);
      }
    }
    
    res.json({
      success: true,
      preference: {
        status: preference.status,
        external_reference: preference.external_reference,
        total_amount: preference.total_amount,
        created_at: preference.created_at
      },
      payment: paymentInfo
    });
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el estado del pago'
    });
  }
});

module.exports = router;
