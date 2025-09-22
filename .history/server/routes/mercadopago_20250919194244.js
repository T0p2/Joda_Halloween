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
    
    db.run(`
      INSERT INTO payment_preferences 
      (external_reference, preference_id, event_id, user_id, quantity, total_amount, attendees_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      externalReference,
      response.body.id,
      event.id,
      userId || 'guest',
      quantity,
      totalPrice,
      JSON.stringify(attendees)
    ], function(err) {
      if (err) {
        console.error('❌ Error saving payment preference to database:', err);
      } else {
        console.log('✅ Payment preference saved to database with ID:', this.lastID);
      }
    });

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

// Función para enviar email de confirmación
const sendConfirmationEmail = async (tickets, event, preference) => {
  try {
    const nodemailer = require('nodemailer');
    
    // Configurar transporter de email
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email del primer asistente (comprador)
    const buyerEmail = tickets[0].attendee.email;
    
    // Formatear fecha del evento
    const eventDate = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Crear contenido del email
    const ticketsHtml = tickets.map((ticket, index) => `
      <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
        <h3 style="color: #667eea; margin-bottom: 10px;">🎫 Entrada ${index + 1}</h3>
        <p><strong>Nombre:</strong> ${ticket.attendee.name}</p>
        <p><strong>Código:</strong> <span style="color: #667eea; font-weight: bold;">${ticket.ticketCode}</span></p>
        <div style="text-align: center; margin: 15px 0;">
          <img src="${ticket.qrCode}" alt="QR Code" style="max-width: 150px;" />
        </div>
      </div>
    `).join('');

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>¡Pago Confirmado! - ${event.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { color: #667eea; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Pago Confirmado!</h1>
            <h2>${event.name}</h2>
            <p>Tu compra de ${tickets.length} entrada${tickets.length > 1 ? 's' : ''} ha sido procesada exitosamente</p>
          </div>
          
          <div class="content">
            <p>¡Hola!</p>
            
            <p>Te confirmamos que tu pago ha sido procesado correctamente y tus entradas ya están listas.</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
              <h3>📋 Detalles del Evento</h3>
              <p><strong>Evento:</strong> ${event.name}</p>
              <p><strong>Fecha:</strong> ${eventDate}</p>
              <p><strong>Ubicación:</strong> ${event.location}</p>
              <p><strong>Total Pagado:</strong> <span class="highlight">$${preference.total_amount} ARS</span></p>
            </div>

            ${ticketsHtml}
            
            <div style="background: #e8f4fd; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>📝 Información Importante</h3>
              <ul>
                <li>✅ Llega 15 minutos antes del inicio del evento</li>
                <li>📱 Presenta tus códigos QR en la entrada (puedes mostrarlos desde tu teléfono)</li>
                <li>🎫 Cada código es único y personal</li>
                <li>❓ En caso de problemas, contacta con soporte</li>
              </ul>
            </div>
            
            <p><strong>¡Te esperamos en el evento!</strong></p>
            
            <p>Saludos,<br><strong>El Equipo de Ticketing</strong></p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático generado por el sistema de pagos.</p>
            <p>Si tienes alguna pregunta, contacta con nuestro soporte.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar y enviar email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: buyerEmail,
      subject: `🎫 ¡Pago Confirmado! - ${event.name}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Confirmation email sent successfully to:', buyerEmail);

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // No lanzamos el error para que no afecte el proceso de pago
  }
};

module.exports = router;