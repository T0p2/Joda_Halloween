const express = require('express');
const mercadopago = require('mercadopago');
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
        error: 'Faltan datos requeridos: event, attendees, totalPrice, quantity'
      });
    }

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un asistente'
      });
    }

    if (attendees.length !== quantity) {
      return res.status(400).json({
        success: false,
        error: 'La cantidad de asistentes no coincide con la cantidad solicitada'
      });
    }

    // Generar referencia única
    const externalReference = `ticket_${Date.now()}_${uuidv4()}`;

    // Crear preferencia de pago
    const preference = {
      items: [{
        title: `${event.name} - ${quantity} entrada${quantity > 1 ? 's' : ''}`,
        description: `Evento: ${event.name} - Fecha: ${new Date(event.date).toLocaleDateString('es-ES')} - Ubicación: ${event.location}`,
        unit_price: parseFloat(totalPrice),
        quantity: 1,
        currency_id: 'ARS'
      }],
      payer: {
        email: attendees[0].email,
        name: attendees[0].name
      },
      back_urls: {
        success: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}`,
        failure: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment?error=failed`,
        pending: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}&status=pending`
      },
      external_reference: externalReference,
      notification_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/mercadopago/webhook`,
      metadata: {
        event_id: event.id,
        user_id: userId || 'guest',
        quantity: quantity,
        attendees: JSON.stringify(attendees)
      }
    };

    console.log('🔧 Creating MercadoPago preference:', preference);

    // Usar la API v1 de mercadopago
    const response = await mercadopago.preferences.create(preference);

    if (!response.body || !response.body.init_point) {
      console.error('❌ Error: Invalid response from MercadoPago:', response);
      return res.status(500).json({
        success: false,
        error: 'Error al crear la preferencia de pago',
        details: 'Respuesta inválida de MercadoPago'
      });
    }

    // Guardar en base de datos
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO payment_preferences 
      (external_reference, preference_id, event_id, user_id, quantity, total_amount, attendees_data, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      externalReference,
      response.body.id,
      event.id,
      userId || 'guest',
      quantity,
      totalPrice,
      JSON.stringify(attendees),
      'pending'
    );

    console.log('✅ Payment preference created successfully:', {
      id: response.body.id,
      external_reference: externalReference,
      init_point: response.body.init_point
    });

    res.json({
      success: true,
      preferenceId: response.body.id,
      initPoint: response.body.init_point,
      externalReference: externalReference
    });

  } catch (error) {
    console.error('❌ Error creating MercadoPago preference:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
   );
  }
});

// Webhook de MercadoPago
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 MercadoPago webhook received:', req.body);

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago usando API v1
      const payment = await mercadopago.payment.findById(paymentId);

      console.log('💳 Payment details:', payment.body);

      if (payment.body.status === 'approved') {
        const externalReference = payment.body.external_reference;
        
        const db = getDatabase();
        
        // Actualizar estado en base de datos
        db.run(`
          UPDATE payment_preferences 
          SET status = 'completed', payment_id = ?
          WHERE external_reference = ?
        `, ['completed', paymentId], function(err) {
          if (err) {
            console.error('Error updating payment preference:', err);
            return;
          }
        });

        // Obtener datos de la preferencia
        db.get(`
          SELECT * FROM payment_preferences WHERE external_reference = ?
        `, [externalReference], async (err, preference) => {
          if (err || !preference) {
            console.error('Error getting preference:', err);
            return;
          }

          try {
            const attendees = JSON.parse(preference.attendees_data);
            const eventId = preference.event_id;
            const userId = preference.user_id;

            // Obtener información del evento
            db.get('SELECT * FROM events WHERE id = ?', [eventId], async (err, event) => {
              if (err || !event) {
                console.error('Error getting event:', err);
                return;
              }

              // Crear entradas para cada asistente
              const ticketPromises = attendees.map(async (attendee) => {
                const ticketCode = uuidv4();
                const qrData = JSON.stringify({
                  ticketCode: ticketCode,
                  eventName: event.name,
                  eventDate: event.date,
                  eventLocation: event.location,
                  attendeeName: attendee.name
                });

                const qrCode = await QRCode.toDataURL(qrData);

                return new Promise((resolve, reject) => {
                  db.run(`
                    INSERT INTO tickets (
                      ticket_code, user_id, event_id, qr_code, status, 
                      payment_intent_id, amount_paid, attendee_name, 
                      attendee_email, attendee_dni, attendee_phone
                    ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
                  `, [
                    ticketCode,
                    userId,
                    eventId,
                    qrCode,
                    paymentId,
                    preference.total_amount / preference.quantity,
                    attendee.name,
                    attendee.email,
                    attendee.dni,
                    attendee.phone
                  ], function(err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve({
                        ticketId: this.lastID,
                        ticketCode,
                        attendee,
                        qrCode
                      });
                    }
                  });
                });
              });

              try {
                const createdTickets = await Promise.all(ticketPromises);
                console.log('🎫 Tickets created successfully for payment:', paymentId);

                // Enviar email de confirmación
                await sendConfirmationEmail(createdTickets, event, preference);
                
                // Actualizar cantidad de entradas disponibles
                db.run(`
                  UPDATE events 
                  SET available_tickets = available_tickets - ? 
                  WHERE id = ?
                `, [preference.quantity, eventId]);

              } catch (ticketError) {
                console.error('Error creating tickets:', ticketError);
              }
            });
          } catch (parseError) {
            console.error('Error parsing attendees data:', parseError);
          }
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Consultar estado de pago
router.get('/payment-status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('🔍 Checking payment status for reference:', reference);

    const db = getDatabase();
    const preference = db.prepare(`
      SELECT * FROM payment_preferences WHERE external_reference = ?
    `).get(reference);

    if (!preference) {
      return res.status(404).json({
        success: false,
        error: 'Referencia de pago no encontrada'
      });
    }

    let paymentData = null;
    if (preference.payment_id) {
      try {
        const payment = await mercadopago.payment.findById(preference.payment_id);
        paymentData = payment.body;
      } catch (error) {
        console.error('Error fetching payment from MercadoPago:', error);
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
      payment: paymentData
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;