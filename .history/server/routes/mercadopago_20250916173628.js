const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const router = express.Router();

// Endpoint de prueba para verificar configuración
router.get('/test', async (req, res) => {
  try {
    console.log('Testing MercadoPago configuration...');
    console.log('Credentials:', {
      USE_TEST_CREDENTIALS: credentials.USE_TEST_CREDENTIALS,
      HAS_ACCESS_TOKEN: !!credentials.TEST_ACCESS_TOKEN,
      HAS_PUBLIC_KEY: !!credentials.TEST_PUBLIC_KEY
    });

    res.json({
      success: true,
      message: 'MercadoPago configuration loaded',
      config: {
        useTestCredentials: credentials.USE_TEST_CREDENTIALS,
        hasAccessToken: !!credentials.TEST_ACCESS_TOKEN,
        hasPublicKey: !!credentials.TEST_PUBLIC_KEY,
        accessTokenPreview: credentials.TEST_ACCESS_TOKEN ? 
          credentials.TEST_ACCESS_TOKEN.substring(0, 20) + '...' : 'Not set'
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

// Importar credenciales
const credentials = require('../mercadopago-credentials');

// Configurar Mercado Pago con credenciales
const accessToken = credentials.USE_TEST_CREDENTIALS 
  ? credentials.TEST_ACCESS_TOKEN 
  : credentials.PROD_ACCESS_TOKEN;

const client = new MercadoPagoConfig({ 
  accessToken: accessToken
});

// Crear preferencia de pago
router.post('/create-preference', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { event, attendees, totalPrice, quantity } = req.body;

    if (!event || !attendees || !totalPrice || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos: event, attendees, totalPrice y quantity son requeridos'
      });
    }

    const preference = {
      items: [
        {
          title: `${event.name} - ${quantity} entrada${quantity > 1 ? 's' : ''}`,
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
        success: 'http://localhost:3000/success',
        failure: 'http://localhost:3000/events',
        pending: 'http://localhost:3000/events'
      },
      auto_return: 'approved',
      external_reference: `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      notification_url: 'http://localhost:5000/api/mercadopago/webhook',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
    };

    console.log('Creating preference with:', preference);

    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log('Mercado Pago response:', response);
    
    res.json({
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point
    });

  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al crear la preferencia de pago',
      details: error.message
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
