const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Importar credenciales
const credentials = require('../mercadopago-credentials');

// Función para guardar datos en CSV
const saveToCSV = (peopleData, event, quantity, totalPrice, preferenceId) => {
  try {
    const csvPath = path.join(__dirname, '../data/tickets.csv');
    
    // Crear directorio si no existe
    const dataDir = path.dirname(csvPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Crear archivo CSV si no existe con headers
    if (!fs.existsSync(csvPath)) {
      const headers = 'Fecha,Evento,Precio_Unitario,Cantidad_Total,Precio_Total,Preference_ID,Nombre,DNI,Email,Telefono,Numero_Entrada\n';
      fs.writeFileSync(csvPath, headers);
    }

    // Agregar datos de cada persona
    const timestamp = new Date().toISOString();
    const csvLines = peopleData.map((person, index) => 
      `${timestamp},"${event.name}",${event.price},${quantity},${totalPrice},"${preferenceId}","${person.name}","${person.dni}","${person.email}","${person.phone}",${index + 1}`
    );

    fs.appendFileSync(csvPath, csvLines.join('\n') + '\n');
    console.log('Datos guardados en CSV:', csvPath);
    
  } catch (error) {
    console.error('Error al guardar en CSV:', error);
    throw error;
  }
};

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
    const { event, peopleData, quantity, totalPrice } = req.body;

    if (!event || !peopleData || !quantity || !totalPrice) {
      return res.status(400).json({
        success: false,
        error: 'Datos incompletos: event, peopleData, quantity y totalPrice son requeridos'
      });
    }

    // Validar que la cantidad de personas coincida con la cantidad de entradas
    if (peopleData.length !== quantity) {
      return res.status(400).json({
        success: false,
        error: 'La cantidad de personas no coincide con la cantidad de entradas'
      });
    }

    const preference = {
      items: [
        {
          title: `${event.name} - ${quantity} ${quantity === 1 ? 'entrada' : 'entradas'}`,
          unit_price: parseFloat(totalPrice),
          quantity: 1,
          currency_id: 'ARS'
        }
      ],
      payer: {
        name: peopleData[0].name, // Usar datos de la primera persona como comprador principal
        email: peopleData[0].email,
        phone: {
          number: peopleData[0].phone || ''
        }
      },
      back_urls: {
        success: 'http://localhost:3000/payment-success',
        failure: 'http://localhost:3000/payment-failure',
        pending: 'http://localhost:3000/payment-pending'
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
