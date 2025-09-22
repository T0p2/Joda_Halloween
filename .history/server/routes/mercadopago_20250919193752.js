const expresif (!accessToken) {
  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
} else {
  mercadopago.configure({
    access_token: accessToken
  });
}uire('express');
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
  console.error('  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');
}

mercadopago.configure({
  access_token: accessToken
});

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
      console.warn('  Email credentials not configured, skipping email send');
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
              <div class="celebration"></div>
              <h1>¡Pago Confirmado!</h1>
              <p>Tu entrada está lista para la diversión</p>
            </div>
            
            <div class="content">
              <p>¡Hola <span class="highlight">${attendee.name}</span>!</p>
              
              <p>¡Excelentes noticias! Tu pago ha sido procesado exitosamente y tu entrada para <strong>${event.name}</strong> está confirmada.</p>
              
              <div class="event-info">
                <h3> ${event.name}</h3>
                <p> ${new Date(event.date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p> ${event.location}</p>
              </div>
              
              <div class="tickets-section">
                <h3> ${attendeeTickets.length > 1 ? 'Tus Entradas' : 'Tu Entrada'}</h3>
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
                <h3> Instrucciones Importantes</h3>
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
                  ¡Nos vemos en el evento! 
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>TicketApp</strong> - La mejor forma de vivir experiencias increíbles</p>
              <p>Este es un email automático. Si tienes dudas, contacta nuestro soporte.</p>
              <p style="margin-top: 15px;">
                 ${process.env.EMAIL_USER || 'soporte@ticketapp.com'} |  www.ticketapp.com
              </p>
            </div>
          </div>
        </body>
        </html>
      \`;

      const mailOptions = {
        from: \`"TicketApp " <\${process.env.EMAIL_USER}>\`,
        to: attendee.email,
        subject: \`🎉 ¡Confirmado! Tu entrada para \${event.name}\`,
        html: emailContent
      };

      await transporter.sendMail(mailOptions);
      console.log(\` Confirmation email sent to: \${attendee.email}\`);
    }
  } catch (error) {
    console.error(' Error sending confirmation email:', error);
    // Don't throw error to avoid breaking the payment process
  }
};

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
    console.log(' Received payment request:', req.body);
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
        error: 'Solo hay ' + eventData.available_tickets + ' entradas disponibles'
      });
    }

    // Generar referencia única para el pago
    const externalReference = 'TICKET-' + event.id + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    const preference = {
      items: [
        {
          title: ' ' + event.name,
          description: quantity + ' entrada' + (quantity > 1 ? 's' : '') + ' para ' + event.name,
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
        success: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/success?ref=' + externalReference,
        failure: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/payment?error=payment_failed',
        pending: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/payment?status=pending'
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: (process.env.BACKEND_URL || 'http://localhost:5000') + '/api/mercadopago/webhook',
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

    console.log(' Creating preference:', {
      eventName: event.name,
      quantity,
      totalPrice,
      attendeesCount: attendees.length
    });

    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });
    
    console.log(' MercadoPago preference created:', response.id);
    
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
    console.log(' Webhook received:', req.body);
    const { type, data, action } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información completa del pago
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });
      
      console.log(' Payment info:', {
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
    console.error(' Webhook error:', error);
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
      console.error(' Preference not found for reference:', externalReference);
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
    
    console.log(' Payment processed successfully:', {
      paymentId: payment.id,
      ticketsCreated: createdTickets.length,
      externalReference
    });

    // Obtener datos del evento para el email
    const event = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM events WHERE id = ?', [preference.event_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (event) {
      // Crear array con datos de tickets para email
      const ticketsForEmail = [];
      for (let i = 0; i < attendees.length; i++) {
        ticketsForEmail.push({
          id: createdTickets[i],
          attendee_email: attendees[i].email,
          qr_code: await new Promise((resolve, reject) => {
            db.get('SELECT qr_code FROM tickets WHERE ticket_code = ?', [createdTickets[i]], (err, row) => {
              if (err) reject(err);
              else resolve(row ? row.qr_code : '');
            });
          })
        });
      }

      // Enviar emails de confirmación
      console.log(' Sending confirmation emails...');
      await sendConfirmationEmail(attendees, event, ticketsForEmail);
    }
    
  } catch (error) {
    console.error(' Error processing approved payment:', error);
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
    
    console.log(' Payment rejected:', payment.external_reference);
  } catch (error) {
    console.error(' Error processing rejected payment:', error);
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
