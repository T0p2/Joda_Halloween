const express = require('express');const express = require('express');

const mercadopago = require('mercadopago');const mercadopago = require('mercadopago');

const { getDatabase } = require('../database/setup');const { getDatabase } = require('../database/setup');

const { v4: uuidv4 } = require('uuid');const { v4: uuidv4 } = require('uuid');

const QRCode = require('qrcode');const QRCode = require('qrcode');

const nodemailer = require('nodemailer');const nodemailer = require('nodemailer');

const router = express.Router();const router = express.Router();



// Configurar Mercado Pago con variables de entorno// Create email transporter

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;const createTransporter = () => {

const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;  return nodemailer.createTransporter({

    service: 'gmail',

if (!accessToken) {    auth: {

  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');      user: process.env.EMAIL_USER,

}      pass: process.env.EMAIL_PASS

    }

mercadopago.configure({  });

  access_token: accessToken};

});

// Function to send confirmation email

// Create email transporterconst sendConfirmationEmail = async (attendees, event, tickets) => {

const createTransporter = () => {  try {

  return nodemailer.createTransporter({    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {

    service: 'gmail',      console.warn('⚠️  Email credentials not configured, skipping email send');

    auth: {      return;

      user: process.env.EMAIL_USER,    }

      pass: process.env.EMAIL_PASS

    }    const transporter = createTransporter();

  });

};    // Send email to each attendee

    for (const attendee of attendees) {

// Function to send confirmation email      // Find tickets for this attendee

const sendConfirmationEmail = async (attendees, event, tickets) => {      const attendeeTickets = tickets.filter(t => t.attendee_email === attendee.email);

  try {      

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {      if (attendeeTickets.length === 0) continue;

      console.warn('⚠️  Email credentials not configured, skipping email send');

      return;      // Create email content

    }      const emailContent = `

        <!DOCTYPE html>

    const transporter = createTransporter();        <html>

        <head>

    // Send email to each attendee          <meta charset="utf-8">

    for (const attendee of attendees) {          <title>¡Tu entrada está confirmada! - ${event.name}</title>

      // Find tickets for this attendee          <style>

      const attendeeTickets = tickets.filter(t => t.attendee_email === attendee.email);            body { 

                    font-family: 'Arial', sans-serif; 

      if (attendeeTickets.length === 0) continue;              line-height: 1.6; 

              color: #333; 

      // Create email content              margin: 0; 

      const emailContent = `              padding: 0;

        <!DOCTYPE html>              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

        <html>            }

        <head>            .email-container { 

          <meta charset="utf-8">              max-width: 600px; 

          <title>¡Tu entrada está confirmada! - ${event.name}</title>              margin: 20px auto; 

          <style>              background: white;

            body {               border-radius: 15px;

              font-family: 'Arial', sans-serif;               overflow: hidden;

              line-height: 1.6;               box-shadow: 0 10px 30px rgba(0,0,0,0.3);

              color: #333;             }

              margin: 0;             .header { 

              padding: 0;              background: linear-gradient(135deg, #ff6b6b, #ffa726);

              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);              color: white; 

            }              padding: 40px 30px; 

            .email-container {               text-align: center;

              max-width: 600px;             }

              margin: 20px auto;             .header h1 { 

              background: white;              margin: 0; 

              border-radius: 15px;              font-size: 32px; 

              overflow: hidden;              font-weight: bold;

              box-shadow: 0 10px 30px rgba(0,0,0,0.3);            }

            }            .header p { 

            .header {               margin: 10px 0 0 0; 

              background: linear-gradient(135deg, #ff6b6b, #ffa726);              font-size: 18px; 

              color: white;               opacity: 0.95;

              padding: 40px 30px;             }

              text-align: center;            .content { 

            }              padding: 40px 30px;

            .header h1 {             }

              margin: 0;             .event-info { 

              font-size: 32px;               background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

              font-weight: bold;              color: white;

            }              padding: 25px; 

            .header p {               margin: 25px 0; 

              margin: 10px 0 0 0;               border-radius: 12px;

              font-size: 18px;               text-align: center;

              opacity: 0.95;            }

            }            .event-info h3 { 

            .content {               margin: 0 0 20px 0; 

              padding: 40px 30px;              font-size: 24px;

            }            }

            .event-info {             .event-detail { 

              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);              display: flex; 

              color: white;              align-items: center; 

              padding: 25px;               justify-content: center; 

              margin: 25px 0;               margin: 10px 0;

              border-radius: 12px;              font-size: 16px;

              text-align: center;            }

            }            .tickets-section { 

            .event-info h3 {               margin: 30px 0;

              margin: 0 0 20px 0;             }

              font-size: 24px;            .ticket { 

            }              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

            .event-detail {               color: white;

              display: flex;               padding: 25px; 

              align-items: center;               margin: 20px 0; 

              justify-content: center;               border-radius: 12px;

              margin: 10px 0;              text-align: center;

              font-size: 16px;            }

            }            .ticket h4 { 

            .tickets-section {               margin: 0 0 15px 0; 

              margin: 30px 0;              font-size: 20px;

            }            }

            .ticket {             .ticket-code { 

              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);              background: rgba(255,255,255,0.2); 

              color: white;              padding: 12px 20px; 

              padding: 25px;               border-radius: 8px; 

              margin: 20px 0;               font-family: 'Courier New', monospace; 

              border-radius: 12px;              font-size: 18px; 

              text-align: center;              font-weight: bold;

            }              letter-spacing: 2px;

            .ticket h4 {               margin: 15px 0;

              margin: 0 0 15px 0;             }

              font-size: 20px;            .qr-code { 

            }              text-align: center; 

            .ticket-code {               margin: 20px 0;

              background: rgba(255,255,255,0.2);             }

              padding: 12px 20px;             .qr-code img { 

              border-radius: 8px;               max-width: 180px; 

              font-family: 'Courier New', monospace;               border-radius: 8px;

              font-size: 18px;               background: white;

              font-weight: bold;              padding: 10px;

              letter-spacing: 2px;            }

              margin: 15px 0;            .instructions { 

            }              background: #f8f9fa; 

            .qr-code {               padding: 25px; 

              text-align: center;               margin: 25px 0; 

              margin: 20px 0;              border-radius: 12px;

            }              border-left: 4px solid #667eea;

            .qr-code img {             }

              max-width: 180px;             .instructions h3 { 

              border-radius: 8px;              color: #667eea; 

              background: white;              margin: 0 0 15px 0;

              padding: 10px;            }

            }            .instructions ul { 

            .instructions {               margin: 0; 

              background: #f8f9fa;               padding-left: 20px;

              padding: 25px;             }

              margin: 25px 0;             .instructions li { 

              border-radius: 12px;              margin: 8px 0; 

              border-left: 4px solid #667eea;              color: #555;

            }            }

            .instructions h3 {             .footer { 

              color: #667eea;               text-align: center; 

              margin: 0 0 15px 0;              padding: 30px; 

            }              background: #f8f9fa; 

            .instructions ul {               color: #666; 

              margin: 0;               font-size: 14px;

              padding-left: 20px;              border-top: 1px solid #eee;

            }            }

            .instructions li {             .highlight { 

              margin: 8px 0;               color: #667eea; 

              color: #555;              font-weight: bold;

            }            }

            .footer {             .celebration { 

              text-align: center;               font-size: 24px; 

              padding: 30px;               margin: 10px 0;

              background: #f8f9fa;             }

              color: #666;           </style>

              font-size: 14px;        </head>

              border-top: 1px solid #eee;        <body>

            }          <div class="email-container">

            .highlight {             <div class="header">

              color: #667eea;               <div class="celebration">🎉 🎊 🎈</div>

              font-weight: bold;              <h1>¡Pago Confirmado!</h1>

            }              <p>Tu entrada está lista para la diversión</p>

            .celebration {             </div>

              font-size: 24px;             

              margin: 10px 0;            <div class="content">

            }              <p>¡Hola <span class="highlight">${attendee.name}</span>!</p>

          </style>              

        </head>              <p>¡Excelentes noticias! Tu pago ha sido procesado exitosamente y tu entrada para <strong>${event.name}</strong> está confirmada.</p>

        <body>              

          <div class="email-container">              <div class="event-info">

            <div class="header">                <h3>🎪 ${event.name}</h3>

              <div class="celebration">🎉 🎊 🎈</div>                <div class="event-detail">📅 ${new Date(event.date).toLocaleDateString('es-ES', { 

              <h1>¡Pago Confirmado!</h1>                  weekday: 'long', 

              <p>Tu entrada está lista para la diversión</p>                  year: 'numeric', 

            </div>                  month: 'long', 

                              day: 'numeric',

            <div class="content">                  hour: '2-digit',

              <p>¡Hola <span class="highlight">${attendee.name}</span>!</p>                  minute: '2-digit'

                              })}</div>

              <p>¡Excelentes noticias! Tu pago ha sido procesado exitosamente y tu entrada para <strong>${event.name}</strong> está confirmada.</p>                <div class="event-detail">📍 ${event.location}</div>

                            </div>

              <div class="event-info">              

                <h3>🎪 ${event.name}</h3>              <div class="tickets-section">

                <div class="event-detail">📅 ${new Date(event.date).toLocaleDateString('es-ES', {                 <h3>🎫 ${attendeeTickets.length > 1 ? 'Tus Entradas' : 'Tu Entrada'}</h3>

                  weekday: 'long',                 ${attendeeTickets.map((ticket, index) => `

                  year: 'numeric',                   <div class="ticket">

                  month: 'long',                     <h4>${attendeeTickets.length > 1 ? `Entrada ${index + 1}` : 'Tu Entrada'}</h4>

                  day: 'numeric',                    <div class="ticket-code">${ticket.id}</div>

                  hour: '2-digit',                    <div class="qr-code">

                  minute: '2-digit'                      <p style="margin: 10px 0; font-size: 14px; opacity: 0.9;">Presenta este código QR en el evento:</p>

                })}</div>                      <img src="${ticket.qr_code}" alt="Código QR" />

                <div class="event-detail">📍 ${event.location}</div>                    </div>

              </div>                  </div>

                              `).join('')}

              <div class="tickets-section">              </div>

                <h3>🎫 ${attendeeTickets.length > 1 ? 'Tus Entradas' : 'Tu Entrada'}</h3>              

                ${attendeeTickets.map((ticket, index) => `              <div class="instructions">

                  <div class="ticket">                <h3>📝 Instrucciones Importantes</h3>

                    <h4>${attendeeTickets.length > 1 ? `Entrada ${index + 1}` : 'Tu Entrada'}</h4>                <ul>

                    <div class="ticket-code">${ticket.id}</div>                  <li><strong>Llegada:</strong> Te recomendamos llegar 15-30 minutos antes del evento</li>

                    <div class="qr-code">                  <li><strong>Código QR:</strong> Trae tu código QR (puedes mostrarlo desde tu teléfono)</li>

                      <p style="margin: 10px 0; font-size: 14px; opacity: 0.9;">Presenta este código QR en el evento:</p>                  <li><strong>Identificación:</strong> Lleva tu DNI o documento de identidad</li>

                      <img src="${ticket.qr_code}" alt="Código QR" />                  <li><strong>Transferencia:</strong> Esta entrada es personal e intransferible</li>

                    </div>                  <li><strong>Soporte:</strong> Si tienes problemas, contacta nuestro soporte</li>

                  </div>                </ul>

                `).join('')}              </div>

              </div>              

                            <div style="text-align: center; margin: 30px 0;">

              <div class="instructions">                <p style="font-size: 18px; color: #667eea; font-weight: bold;">

                <h3>📝 Instrucciones Importantes</h3>                  ¡Nos vemos en el evento! 🚀

                <ul>                </p>

                  <li><strong>Llegada:</strong> Te recomendamos llegar 15-30 minutos antes del evento</li>              </div>

                  <li><strong>Código QR:</strong> Trae tu código QR (puedes mostrarlo desde tu teléfono)</li>            </div>

                  <li><strong>Identificación:</strong> Lleva tu DNI o documento de identidad</li>            

                  <li><strong>Transferencia:</strong> Esta entrada es personal e intransferible</li>            <div class="footer">

                  <li><strong>Soporte:</strong> Si tienes problemas, contacta nuestro soporte</li>              <p><strong>TicketApp</strong> - La mejor forma de vivir experiencias increíbles</p>

                </ul>              <p>Este es un email automático. Si tienes dudas, contacta nuestro soporte.</p>

              </div>              <p style="margin-top: 15px;">

                              📧 ${process.env.EMAIL_USER || 'soporte@ticketapp.com'} | 

              <div style="text-align: center; margin: 30px 0;">                🌐 www.ticketapp.com

                <p style="font-size: 18px; color: #667eea; font-weight: bold;">              </p>

                  ¡Nos vemos en el evento! 🚀            </div>

                </p>          </div>

              </div>        </body>

            </div>        </html>

                  `;

            <div class="footer">

              <p><strong>TicketApp</strong> - La mejor forma de vivir experiencias increíbles</p>      const mailOptions = {

              <p>Este es un email automático. Si tienes dudas, contacta nuestro soporte.</p>        from: `"TicketApp 🎫" <${process.env.EMAIL_USER}>`,

              <p style="margin-top: 15px;">        to: attendee.email,

                📧 ${process.env.EMAIL_USER || 'soporte@ticketapp.com'} |         subject: `🎉 ¡Confirmado! Tu entrada para ${event.name}`,

                🌐 www.ticketapp.com        html: emailContent

              </p>      };

            </div>

          </div>      await transporter.sendMail(mailOptions);

        </body>      console.log(`✅ Confirmation email sent to: ${attendee.email}`);

        </html>    }

      `;  } catch (error) {

    console.error('❌ Error sending confirmation email:', error);

      const mailOptions = {    // Don't throw error to avoid breaking the payment process

        from: `"TicketApp 🎫" <${process.env.EMAIL_USER}>`,  }

        to: attendee.email,};quire('express');

        subject: `🎉 ¡Confirmado! Tu entrada para ${event.name}`,const mercadopago = require('mercadopago');

        html: emailContentconst { getDatabase } = require('../database/setup');

      };const { v4: uuidv4 } = require('uuid');

const QRCode = require('qrcode');

      await transporter.sendMail(mailOptions);const nodemailer = require('nodemailer');

      console.log(`✅ Confirmation email sent to: ${attendee.email}`);const router = express.Router();

    }

  } catch (error) {// Create email transporter

    console.error('❌ Error sending confirmation email:', error);const createTransporter = () => {

    // Don't throw error to avoid breaking the payment process  return nodemailer.createTransporter({

  }    service: 'gmail',

};    auth: {

      user: process.env.EMAIL_USER,

// Endpoint para obtener la public key      pass: process.env.EMAIL_PASS

router.get('/config', (req, res) => {    }

  res.json({  });

    success: true,};

    publicKey: publicKey

  });// Configurar Mercado Pago con variables de entorno

});const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

// Endpoint de prueba para verificar configuración

router.get('/test', async (req, res) => {if (!accessToken) {

  try {  console.error('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en .env');

    console.log('Testing MercadoPago configuration...');}

    

    res.json({mercadopago.configure({

      success: true,  access_token: accessToken

      message: 'MercadoPago configuration loaded',});

      config: {

        hasAccessToken: !!accessToken,// Endpoint para obtener la public key

        hasPublicKey: !!publicKey,router.get('/config', (req, res) => {

        accessTokenPreview: accessToken ?   res.json({

          accessToken.substring(0, 20) + '...' : 'Not set',    success: true,

        publicKeyPreview: publicKey ?    publicKey: publicKey

          publicKey.substring(0, 20) + '...' : 'Not set'  });

      }});

    });

  } catch (error) {// Endpoint de prueba para verificar configuración

    console.error('Error testing MercadoPago config:', error);router.get('/test', async (req, res) => {

    res.status(500).json({  try {

      success: false,    console.log('Testing MercadoPago configuration...');

      error: 'Error testing MercadoPago configuration',    

      details: error.message    res.json({

    });      success: true,

  }      message: 'MercadoPago configuration loaded',

});      config: {

        hasAccessToken: !!accessToken,

// Crear preferencia de pago        hasPublicKey: !!publicKey,

router.post('/create-preference', async (req, res) => {        accessTokenPreview: accessToken ? 

  try {          accessToken.substring(0, 20) + '...' : 'Not set',

    console.log('📋 Received payment request:', req.body);        publicKeyPreview: publicKey ?

    const { event, attendees, totalPrice, quantity, userId } = req.body;          publicKey.substring(0, 20) + '...' : 'Not set'

      }

    // Validación de datos    });

    if (!event || !attendees || !totalPrice || !quantity) {  } catch (error) {

      return res.status(400).json({    console.error('Error testing MercadoPago config:', error);

        success: false,    res.status(500).json({

        error: 'Faltan datos requeridos: event, attendees, totalPrice, quantity'      success: false,

      });      error: 'Error testing MercadoPago configuration',

    }      details: error.message

    });

    if (!Array.isArray(attendees) || attendees.length === 0) {  }

      return res.status(400).json({});

        success: false,

        error: 'Se requiere al menos un asistente'// Crear preferencia de pago

      });router.post('/create-preference', async (req, res) => {

    }  try {

    console.log('📋 Received payment request:', req.body);

    if (attendees.length !== quantity) {    const { event, attendees, totalPrice, quantity, userId } = req.body;

      return res.status(400).json({

        success: false,    // Validación de datos

        error: 'La cantidad de asistentes no coincide con la cantidad solicitada'    if (!event || !attendees || !totalPrice || !quantity) {

      });      return res.status(400).json({

    }        success: false,

        error: 'Faltan datos requeridos: event, attendees, totalPrice, quantity'

    // Generar referencia única      });

    const externalReference = `ticket_${Date.now()}_${uuidv4()}`;    }



    // Crear preferencia de pago    if (!Array.isArray(attendees) || attendees.length === 0) {

    const preference = {      return res.status(400).json({

      items: [{        success: false,

        title: `${event.name} - ${quantity} entrada${quantity > 1 ? 's' : ''}`,        error: 'Se requiere al menos un asistente'

        description: `Evento: ${event.name} - Fecha: ${new Date(event.date).toLocaleDateString('es-ES')} - Ubicación: ${event.location}`,      });

        unit_price: parseFloat(totalPrice),    }

        quantity: 1,

        currency_id: 'ARS'    if (attendees.length !== quantity) {

      }],      return res.status(400).json({

      payer: {        success: false,

        email: attendees[0].email,        error: 'La cantidad de asistentes no coincide con la cantidad solicitada'

        name: attendees[0].name      });

      },    }

      back_urls: {

        success: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}`,    // Generar referencia única

        failure: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment?error=failed`,    const externalReference = `ticket_${Date.now()}_${uuidv4()}`;

        pending: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}&status=pending`

      },    // Crear preferencia de pago

      external_reference: externalReference,    const preference = {

      notification_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/mercadopago/webhook`,      items: [{

      metadata: {        title: `${event.name} - ${quantity} entrada${quantity > 1 ? 's' : ''}`,

        event_id: event.id,        description: `Evento: ${event.name} - Fecha: ${new Date(event.date).toLocaleDateString('es-ES')} - Ubicación: ${event.location}`,

        user_id: userId || 'guest',        unit_price: parseFloat(totalPrice),

        quantity: quantity,        quantity: 1,

        attendees: JSON.stringify(attendees)        currency_id: 'ARS'

      }      }],

    };      payer: {

        email: attendees[0].email,

    console.log('🔧 Creating MercadoPago preference:', preference);        name: attendees[0].name

      },

    // Usar la API v1 de mercadopago      back_urls: {

    const response = await mercadopago.preferences.create(preference);        success: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}`,

        failure: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment?error=failed`,

    if (!response.body || !response.body.init_point) {        pending: `${process.env.CLIENT_URL || 'http://localhost:3000'}/success?ref=${externalReference}&status=pending`

      console.error('❌ Error: Invalid response from MercadoPago:', response);      },

      return res.status(500).json({      external_reference: externalReference,

        success: false,      notification_url: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/mercadopago/webhook`,

        error: 'Error al crear la preferencia de pago',      metadata: {

        details: 'Respuesta inválida de MercadoPago'        event_id: event.id,

      });        user_id: userId || 'guest',

    }        quantity: quantity,

        attendees: JSON.stringify(attendees)

    // Guardar en base de datos      }

    const db = getDatabase();    };

    const stmt = db.prepare(`

      INSERT INTO payment_preferences     console.log('🔧 Creating MercadoPago preference:', preference);

      (external_reference, preference_id, event_id, user_id, quantity, total_amount, attendees_data, status, created_at)

      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))    // Usar la API v1 de mercadopago

    `);    const response = await mercadopago.preferences.create(preference);



    stmt.run(    if (!response.body || !response.body.init_point) {

      externalReference,      console.error('❌ Error: Invalid response from MercadoPago:', response);

      response.body.id,      return res.status(500).json({

      event.id,        success: false,

      userId || 'guest',        error: 'Error al crear la preferencia de pago',

      quantity,        details: 'Respuesta inválida de MercadoPago'

      totalPrice,      });

      JSON.stringify(attendees),    }

      'pending'

    );    // Guardar en base de datos

    const db = getDatabase();

    console.log('✅ Payment preference created successfully:', {    const stmt = db.prepare(`

      id: response.body.id,      INSERT INTO payment_preferences 

      external_reference: externalReference,      (external_reference, preference_id, event_id, user_id, quantity, total_amount, attendees_data, status, created_at)

      init_point: response.body.init_point      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))

    });    `);



    res.json({    stmt.run(

      success: true,      externalReference,

      preferenceId: response.body.id,      response.body.id,

      initPoint: response.body.init_point,      event.id,

      externalReference: externalReference      userId || 'guest',

    });      quantity,

      totalPrice,

  } catch (error) {      JSON.stringify(attendees),

    console.error('❌ Error creating MercadoPago preference:', error);      'pending'

    res.status(500).json({    );

      success: false,

      error: 'Error interno del servidor',    console.log('✅ Payment preference created successfully:', {

      details: error.message      id: response.body.id,

    });      external_reference: externalReference,

  }      init_point: response.body.init_point

});    });



// Webhook de MercadoPago    res.json({

router.post('/webhook', async (req, res) => {      success: true,

  try {      preferenceId: response.body.id,

    console.log('🔔 MercadoPago webhook received:', req.body);      initPoint: response.body.init_point,

      externalReference: externalReference

    const { type, data } = req.body;    });



    if (type === 'payment') {  } catch (error) {

      const paymentId = data.id;    console.error('❌ Error creating MercadoPago preference:', error);

          res.status(500).json({

      // Obtener información del pago usando API v1      success: false,

      const payment = await mercadopago.payment.findById(paymentId);      error: 'Error interno del servidor',

      details: error.message

      console.log('💳 Payment details:', payment.body);    });

  }

      if (payment.body.status === 'approved') {});

        const externalReference = payment.body.external_reference;

        // Webhook de MercadoPago

        // Actualizar estado en base de datosrouter.post('/webhook', async (req, res) => {

        const db = getDatabase();  try {

        const updateStmt = db.prepare(`    console.log('🔔 MercadoPago webhook received:', req.body);

          UPDATE payment_preferences 

          SET status = 'completed', payment_id = ?, payment_data = ?    const { type, data } = req.body;

          WHERE external_reference = ?

        `);    if (type === 'payment') {

      const paymentId = data.id;

        updateStmt.run('completed', paymentId, JSON.stringify(payment.body), externalReference);      

      // Obtener información del pago usando API v1

        // Obtener datos de la preferencia      const payment = await mercadopago.payment.findById(paymentId);

        const preference = db.prepare(`

          SELECT * FROM payment_preferences WHERE external_reference = ?      console.log('💳 Payment details:', payment.body);

        `).get(externalReference);

      if (payment.body.status === 'approved') {

        if (preference) {        const externalReference = payment.body.external_reference;

          const attendees = JSON.parse(preference.attendees_data);        

          const eventId = preference.event_id;        // Actualizar estado en base de datos

        const db = getDatabase();

          // Obtener datos del evento        const updateStmt = db.prepare(`

          const event = db.prepare(`          UPDATE payment_preferences 

            SELECT * FROM events WHERE id = ?          SET status = 'completed', payment_id = ?, payment_data = ?

          `).get(eventId);          WHERE external_reference = ?

        `);

          // Crear entradas para cada asistente

          const ticketStmt = db.prepare(`        updateStmt.run('completed', paymentId, JSON.stringify(payment.body), externalReference);

            INSERT INTO tickets (id, event_id, user_id, attendee_name, attendee_email, price, purchase_date, qr_code)

            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)        // Obtener datos de la preferencia

          `);        const preference = db.prepare(`

          SELECT * FROM payment_preferences WHERE external_reference = ?

          const createdTickets = [];        `).get(externalReference);



          for (const attendee of attendees) {        if (preference) {

            const ticketId = uuidv4();          const attendees = JSON.parse(preference.attendees_data);

            const qrCode = await QRCode.toDataURL(ticketId);          const eventId = preference.event_id;



            ticketStmt.run(          // Crear entradas para cada asistente

              ticketId,          const ticketStmt = db.prepare(`

              eventId,            INSERT INTO tickets (id, event_id, user_id, attendee_name, attendee_email, price, purchase_date, qr_code)

              preference.user_id,            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)

              attendee.name,          `);

              attendee.email,

              preference.total_amount / preference.quantity,          for (const attendee of attendees) {

              qrCode            const ticketId = uuidv4();

            );            const qrCode = await QRCode.toDataURL(ticketId);



            createdTickets.push({            ticketStmt.run(

              id: ticketId,              ticketId,

              attendee_email: attendee.email,              eventId,

              qr_code: qrCode              preference.user_id,

            });              attendee.name,

          }              attendee.email,

              preference.total_amount / preference.quantity,

          console.log('🎫 Tickets created successfully for payment:', paymentId);              qrCode

            );

          // Enviar emails de confirmación          }

          if (event) {

            console.log('📧 Sending confirmation emails...');          console.log('🎫 Tickets created successfully for payment:', paymentId);

            await sendConfirmationEmail(attendees, event, createdTickets);        }

          }      }

        }    }

      }

    }    res.status(200).json({ success: true });

  } catch (error) {

    res.status(200).json({ success: true });    console.error('❌ Error processing webhook:', error);

  } catch (error) {    res.status(500).json({ error: error.message });

    console.error('❌ Error processing webhook:', error);  }

    res.status(500).json({ error: error.message });});

  }

});// Consultar estado de pago

router.get('/payment-status/:reference', async (req, res) => {

// Consultar estado de pago  try {

router.get('/payment-status/:reference', async (req, res) => {    const { reference } = req.params;

  try {    console.log('🔍 Checking payment status for reference:', reference);

    const { reference } = req.params;

    console.log('🔍 Checking payment status for reference:', reference);    const db = getDatabase();

    const preference = db.prepare(`

    const db = getDatabase();      SELECT * FROM payment_preferences WHERE external_reference = ?

    const preference = db.prepare(`    `).get(reference);

      SELECT * FROM payment_preferences WHERE external_reference = ?

    `).get(reference);    if (!preference) {

      return res.status(404).json({

    if (!preference) {        success: false,

      return res.status(404).json({        error: 'Referencia de pago no encontrada'

        success: false,      });

        error: 'Referencia de pago no encontrada'    }

      });

    }    let paymentData = null;

    if (preference.payment_id) {

    let paymentData = null;      try {

    if (preference.payment_id) {        const payment = await mercadopago.payment.findById(preference.payment_id);

      try {        paymentData = payment.body;

        const payment = await mercadopago.payment.findById(preference.payment_id);      } catch (error) {

        paymentData = payment.body;        console.error('Error fetching payment from MercadoPago:', error);

      } catch (error) {      }

        console.error('Error fetching payment from MercadoPago:', error);    }

      }

    }    res.json({

      success: true,

    res.json({      preference: {

      success: true,        status: preference.status,

      preference: {        external_reference: preference.external_reference,

        status: preference.status,        total_amount: preference.total_amount,

        external_reference: preference.external_reference,        created_at: preference.created_at

        total_amount: preference.total_amount,      },

        created_at: preference.created_at      payment: paymentData

      },    });

      payment: paymentData

    });  } catch (error) {

    console.error('❌ Error checking payment status:', error);

  } catch (error) {    res.status(500).json({

    console.error('❌ Error checking payment status:', error);      success: false,

    res.status(500).json({      error: 'Error interno del servidor',

      success: false,      details: error.message

      error: 'Error interno del servidor',    });

      details: error.message  }

    });});

  }

});module.exports = router;

module.exports = router;