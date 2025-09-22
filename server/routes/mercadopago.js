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
  process.exit(1);
}

if (!publicKey) {
  console.error('⚠️  MERCADOPAGO_PUBLIC_KEY no está configurado en .env');
  process.exit(1);
}

// Inicializar cliente de MercadoPago v2
const client = new MercadoPagoConfig({ 
  accessToken: accessToken,
  options: { timeout: 5000 }
});

console.log('✅ MercadoPago configurado correctamente');

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
      version: 'v2 API',
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

    // Validación de datos mejorada
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

    if (attendees.length !== quantity) {
      return res.status(400).json({
        success: false,
        error: 'La cantidad de asistentes no coincide con la cantidad solicitada'
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

    // Generar referencia única
    const externalReference = `TICKET-${event.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Crear preferencia de pago siguiendo documentación oficial
    const preference = {
      items: [{
        title: `🎫 ${eventData.name}`,
        description: `${quantity} entrada${quantity > 1 ? 's' : ''} para ${eventData.name}`,
        unit_price: parseFloat(eventData.price || totalPrice),
        quantity: parseInt(quantity),
        currency_id: 'ARS'
      }],
      payer: {
        name: attendees[0].name,
        email: attendees[0].email,
        phone: {
          number: attendees[0].phone || ''
        }
      },
      // URLs de retorno según documentación oficial
      back_urls: {
        success: `${process.env.CLIENT_URL}/success?ref=${externalReference}`,
        failure: `${process.env.CLIENT_URL}/payment?error=payment_failed&ref=${externalReference}`,
        pending: `${process.env.CLIENT_URL}/payment?status=pending&ref=${externalReference}`
      },
      auto_return: 'approved', // Redirección automática cuando se aprueba el pago
      external_reference: externalReference,
      notification_url: `${process.env.SERVER_URL}/api/mercadopago/webhook`,
      statement_descriptor: 'ENTRADAS_EVENTO',
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      metadata: {
        event_id: eventData.id.toString(),
        user_id: (userId || 'guest').toString(),
        attendees_count: quantity.toString(),
        attendees: JSON.stringify(attendees)
      }
    };

    console.log('� Creating preference with v2 API:', {
      eventName: event.name,
      quantity,
      totalPrice,
      attendeesCount: attendees.length
    });

    // Usar la API v2 de MercadoPago
    const preferenceClient = new Preference(client);
    const response = await preferenceClient.create({ body: preference });

    if (!response || !response.init_point) {
      console.error('❌ Error: Invalid response from MercadoPago:', response);
      return res.status(500).json({
        success: false,
        error: 'Error al crear la preferencia de pago',
        details: 'Respuesta inválida de MercadoPago'
      });
    }

    // Guardar en base de datos
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO payment_preferences 
        (preference_id, external_reference, event_id, user_id, attendees_data, total_amount, quantity, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
      `, [
        response.id,
        externalReference,
        event.id,
        userId || 'guest',
        JSON.stringify(attendees),
        totalPrice,
        quantity
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ Payment preference created successfully:', {
      id: response.id,
      external_reference: externalReference,
      init_point: response.init_point
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
      details = 'Verifica que el MERCADOPAGO_ACCESS_TOKEN sea correcto';
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

// Webhook de MercadoPago siguiendo documentación oficial
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 MercadoPago webhook received');
    console.log('📋 Headers:', req.headers);
    console.log('📋 Query params:', req.query);
    console.log('📋 Body:', req.body);

    // 1. VALIDACIÓN DE ORIGEN según documentación oficial
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    
    if (!xSignature || !xRequestId) {
      console.error('❌ Missing required headers for webhook validation');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing x-signature or x-request-id header' 
      });
    }

    // Extraer data.id de query params
    const dataId = req.query['data.id'];
    if (!dataId) {
      console.error('❌ Missing data.id in query params');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing data.id parameter' 
      });
    }

    // Validar origen usando x-signature
    const isValidSignature = await validateWebhookSignature(xSignature, xRequestId, dataId);
    if (!isValidSignature) {
      console.error('❌ Invalid webhook signature - possible fraud attempt');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }

    console.log('✅ Webhook signature validated successfully');

    // 2. PROCESAR EVENTO según documentación
    const { action, type, data } = req.body;
    
    console.log('📤 Processing event:', { action, type, paymentId: data.id });

    if (type === 'payment') {
      // Manejar eventos de pago según documentación
      if (action === 'payment.updated' || action === 'payment.created') {
        await processPaymentEvent(data.id);
      }
    }

    // 3. RESPONDER HTTP 200 según documentación
    // "debes devolver un HTTP STATUS 200 (OK) o 201 (CREATED)"
    console.log('✅ Webhook processed successfully');
    return res.status(200).json({ 
      success: true,
      message: 'Webhook received and processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    // Devolver 200 incluso en error para evitar reintentos innecesarios
    // según mejores prácticas de webhooks
    return res.status(200).json({ 
      success: false,
      error: 'Internal error processing webhook',
      timestamp: new Date().toISOString()
    });
  }
});

// Función para validar firma de webhook según documentación oficial
async function validateWebhookSignature(xSignature, xRequestId, dataId) {
  try {
    // Extraer timestamp (ts) y hash (v1) del header x-signature
    const parts = xSignature.split(',');
    let ts = null;
    let hash = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key.trim() === 'ts') {
        ts = value.trim();
      } else if (key.trim() === 'v1') {
        hash = value.trim();
      }
    }

    if (!ts || !hash) {
      console.error('❌ Invalid x-signature format');
      return false;
    }

    // Crear manifest string según documentación
    // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    console.log('🔐 Validating signature with manifest:', manifest);

    // Generar HMAC SHA256 según documentación
    const crypto = require('crypto');
    const secretKey = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!secretKey) {
      console.error('❌ Missing webhook secret key');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(manifest)
      .digest('hex');

    // Comparar firmas
    const isValid = expectedSignature === hash;
    
    if (isValid) {
      console.log('✅ Webhook signature validation passed');
      
      // Validar timestamp para evitar ataques de replay
      const currentTimestamp = Date.now();
      const webhookTimestamp = parseInt(ts);
      const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);
      const tolerance = 5 * 60 * 1000; // 5 minutos

      if (timeDifference > tolerance) {
        console.warn('⚠️ Webhook timestamp is too old, possible replay attack');
        return false;
      }
    } else {
      console.error('❌ Webhook signature validation failed');
      console.error('Expected:', expectedSignature);
      console.error('Received:', hash);
    }

    return isValid;
    
  } catch (error) {
    console.error('❌ Error validating webhook signature:', error);
    return false;
  }
}

// Función para procesar eventos de pago según documentación
async function processPaymentEvent(paymentId) {
  try {
    console.log('💳 Processing payment event for ID:', paymentId);
    
    // Obtener información completa del pago usando API v2
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });
    
    console.log('💳 Payment details:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount
    });
    
    if (payment.status === 'approved') {
      await processApprovedPayment(payment);
    } else if (payment.status === 'rejected') {
      await processRejectedPayment(payment);
    } else if (payment.status === 'pending') {
      await processPendingPayment(payment);
    }
    
  } catch (error) {
    console.error('❌ Error processing payment event:', error);
    throw error;
  }
}

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
    
    // Obtener información del evento
    const event = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM events WHERE id = ?', [preference.event_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!event) {
      console.error('❌ Event not found for ID:', preference.event_id);
      return;
    }
    
    // Crear entradas para cada asistente
    const ticketPromises = attendees.map(async (attendee) => {
      const ticketCode = uuidv4();
      const qrData = JSON.stringify({
        ticketCode,
        eventId: preference.event_id,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location,
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
        ], function(err) {
          if (err) reject(err);
          else resolve({
            ticketId: this.lastID,
            ticket_code: ticketCode,
            attendee_name: attendee.name,
            attendee_email: attendee.email,
            attendee_dni: attendee.dni,
            attendee_phone: attendee.phone,
            qr_code: qrCodeData
          });
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
    
    // Enviar email de confirmación
    await sendConfirmationEmail(createdTickets, event, preference);
    
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
      db.run('UPDATE payment_preferences SET status = ?, rejection_reason = ? WHERE external_reference = ?',
        ['rejected', payment.status_detail || 'Payment rejected', payment.external_reference], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    console.log('❌ Payment rejected:', payment.external_reference);
  } catch (error) {
    console.error('❌ Error processing rejected payment:', error);
  }
}

// Procesar pago pendiente según documentación
async function processPendingPayment(payment) {
  try {
    const db = getDatabase();
    
    await new Promise((resolve, reject) => {
      db.run('UPDATE payment_preferences SET status = ?, payment_id = ?, pending_reason = ? WHERE external_reference = ?',
        ['pending', payment.id, payment.status_detail || 'Payment pending', payment.external_reference], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
    
    console.log('⏳ Payment pending (offline payment method):', {
      paymentId: payment.id,
      externalReference: payment.external_reference,
      paymentMethod: payment.payment_method_id,
      statusDetail: payment.status_detail
    });
    
    // Para medios de pago offline, el usuario debe ir a un punto de pago físico
    // Aquí podrías enviar un email con instrucciones de cómo completar el pago
    
  } catch (error) {
    console.error('❌ Error processing pending payment:', error);
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

// Consultar estado de pago por referencia externa
router.get('/payment-status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    console.log('🔍 Checking payment status for reference:', reference);

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

// Función para enviar email de confirmación
const sendConfirmationEmail = async (tickets, event, preference) => {
  try {
    // Verificar que tenemos configuración de email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email configuration not found. Skipping email sending.');
      console.warn('⚠️  Please configure EMAIL_USER and EMAIL_PASS in .env file');
      return;
    }

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
    const buyerEmail = tickets[0].attendee_email;
    
    // Formatear fecha del evento
    const eventDate = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Crear contenido del email para cada ticket
    const ticketsHtml = tickets.map((ticket, index) => `
      <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
        <h3 style="color: #667eea; margin-bottom: 10px;">🎫 Entrada ${index + 1}</h3>
        <p><strong>Nombre:</strong> ${ticket.attendee_name}</p>
        <p><strong>Código:</strong> <span style="color: #667eea; font-weight: bold;">${ticket.ticket_code}</span></p>
        <p><strong>DNI:</strong> ${ticket.attendee_dni}</p>
        <p><strong>Teléfono:</strong> ${ticket.attendee_phone}</p>
        <div style="text-align: center; margin: 15px 0;">
          <img src="${ticket.qr_code}" alt="Código QR" style="max-width: 150px;" />
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