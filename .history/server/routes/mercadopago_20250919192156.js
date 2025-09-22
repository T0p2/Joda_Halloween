const express = require('express');
const mercadopago = require('mercadopago');
const { getDatabase } = require('../database/setup');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Function to send confirmation email
const sendConfirmationEmail = async (attendees, event, tickets) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured, skipping email send');
      return;
    }

    const transporter = createTransporter();

    // Send email to each attendee
    for (const attendee of attendees) {
      // Find tickets for this attendee
      const attendeeTickets = tickets.filter(t => t.attendee_email === attendee.email);
      
      if (attendeeTickets.length === 0) continue;

      // Create email content
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>¡Tu entrada está confirmada! - ${event.name}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .email-container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .header { 
              background: linear-gradient(135deg, #ff6b6b, #ffa726);
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              margin: 0; 
              font-size: 32px; 
              font-weight: bold;
            }
            .header p { 
              margin: 10px 0 0 0; 
              font-size: 18px; 
              opacity: 0.95;
            }
            .content { 
              padding: 40px 30px;
            }
            .event-info { 
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 25px; 
              margin: 25px 0; 
              border-radius: 12px;
              text-align: center;
            }
            .event-info h3 { 
              margin: 0 0 20px 0; 
              font-size: 24px;
            }
            .event-detail { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              margin: 10px 0;
              font-size: 16px;
            }
            .tickets-section { 
              margin: 30px 0;
            }
            .ticket { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px; 
              margin: 20px 0; 
              border-radius: 12px;
              text-align: center;
            }
            .ticket h4 { 
              margin: 0 0 15px 0; 
              font-size: 20px;
            }
            .ticket-code { 
              background: rgba(255,255,255,0.2); 
              padding: 12px 20px; 
              border-radius: 8px; 
              font-family: 'Courier New', monospace; 
              font-size: 18px; 
              font-weight: bold;
              letter-spacing: 2px;
              margin: 15px 0;
            }
            .qr-code { 
              text-align: center; 
              margin: 20px 0;
            }
            .qr-code img { 
              max-width: 180px; 
              border-radius: 8px;
              background: white;
              padding: 10px;
            }
            .instructions { 
              background: #f8f9fa; 
              padding: 25px; 
              margin: 25px 0; 
              border-radius: 12px;
              border-left: 4px solid #667eea;
            }
            .instructions h3 { 
              color: #667eea; 
              margin: 0 0 15px 0;
            }
            .instructions ul { 
              margin: 0; 
              padding-left: 20px;
            }
            .instructions li { 
              margin: 8px 0; 
              color: #555;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f8f9fa; 
              color: #666; 
              font-size: 14px;
              border-top: 1px solid #eee;
            }
            .highlight { 
              color: #667eea; 
              font-weight: bold;
            }
            .celebration { 
              font-size: 24px; 
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="celebration">🎉 🎊 🎈</div>
              <h1>¡Pago Confirmado!</h1>
              <p>Tu entrada está lista para la diversión</p>
            </div>
            
            <div class="content">
              <p>¡Hola <span class="highlight">${attendee.name}</span>!</p>
              
              <p>¡Excelentes noticias! Tu pago ha sido procesado exitosamente y tu entrada para <strong>${event.name}</strong> está confirmada.</p>
              
              <div class="event-info">
                <h3>🎪 ${event.name}</h3>
                <div class="event-detail">📅 ${new Date(event.date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
                <div class="event-detail">📍 ${event.location}</div>
              </div>
              
              <div class="tickets-section">
                <h3>🎫 ${attendeeTickets.length > 1 ? 'Tus Entradas' : 'Tu Entrada'}</h3>
                ${attendeeTickets.map((ticket, index) => `
                  <div class="ticket">
                    <h4>${attendeeTickets.length > 1 ? `Entrada ${index + 1}` : 'Tu Entrada'}</h4>
                    <div class="ticket-code">${ticket.id}</div>
                    <div class="qr-code">
                      <p style="margin: 10px 0; font-size: 14px; opacity: 0.9;">Presenta este código QR en el evento:</p>
                      <img src="${ticket.qr_code}" alt="Código QR" />
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="instructions">
                <h3>📝 Instrucciones Importantes</h3>
                <ul>
                  <li><strong>Llegada:</strong> Te recomendamos llegar 15-30 minutos antes del evento</li>
                  <li><strong>Código QR:</strong> Trae tu código QR (puedes mostrarlo desde tu teléfono)</li>
                  <li><strong>Identificación:</strong> Lleva tu DNI o documento de identidad</li>
                  <li><strong>Transferencia:</strong> Esta entrada es personal e intransferible</li>
                  <li><strong>Soporte:</strong> Si tienes problemas, contacta nuestro soporte</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #667eea; font-weight: bold;">
                  ¡Nos vemos en el evento! 🚀
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>TicketApp</strong> - La mejor forma de vivir experiencias increíbles</p>
              <p>Este es un email automático. Si tienes dudas, contacta nuestro soporte.</p>
              <p style="margin-top: 15px;">
                📧 ${process.env.EMAIL_USER || 'soporte@ticketapp.com'} | 
                🌐 www.ticketapp.com
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"TicketApp 🎫" <${process.env.EMAIL_USER}>`,
        to: attendee.email,
        subject: `🎉 ¡Confirmado! Tu entrada para ${event.name}`,
        html: emailContent
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Confirmation email sent to: ${attendee.email}`);
    }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    // Don't throw error to avoid breaking the payment process
  }
};quire('express');
const mercadopago = require('mercadopago');
const { getDatabase } = require('../database/setup');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

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
    });
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
        
        // Actualizar estado en base de datos
        const db = getDatabase();
        const updateStmt = db.prepare(`
          UPDATE payment_preferences 
          SET status = 'completed', payment_id = ?, payment_data = ?
          WHERE external_reference = ?
        `);

        updateStmt.run('completed', paymentId, JSON.stringify(payment.body), externalReference);

        // Obtener datos de la preferencia
        const preference = db.prepare(`
          SELECT * FROM payment_preferences WHERE external_reference = ?
        `).get(externalReference);

        if (preference) {
          const attendees = JSON.parse(preference.attendees_data);
          const eventId = preference.event_id;

          // Crear entradas para cada asistente
          const ticketStmt = db.prepare(`
            INSERT INTO tickets (id, event_id, user_id, attendee_name, attendee_email, price, purchase_date, qr_code)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)
          `);

          for (const attendee of attendees) {
            const ticketId = uuidv4();
            const qrCode = await QRCode.toDataURL(ticketId);

            ticketStmt.run(
              ticketId,
              eventId,
              preference.user_id,
              attendee.name,
              attendee.email,
              preference.total_amount / preference.quantity,
              qrCode
            );
          }

          console.log('🎫 Tickets created successfully for payment:', paymentId);
        }
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