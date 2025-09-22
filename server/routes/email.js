const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/setup');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

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

// Send ticket email
router.post('/send-ticket', [
  body('ticketId').isInt(),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketId, email } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();

    // Get ticket details
    db.get(`
      SELECT t.*, e.name as event_name, e.date as event_date, e.location as event_location, e.description as event_description,
             u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ? AND t.user_id = ?
    `, [ticketId, decoded.userId], async (err, ticket) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (!ticket.payment_intent_id) {
        return res.status(400).json({ error: 'Ticket not paid' });
      }

      try {
        // Generate QR code
        const qrData = JSON.stringify({
          ticketCode: ticket.ticket_code,
          eventName: ticket.event_name,
          eventDate: ticket.event_date,
          eventLocation: ticket.event_location
        });

        const qrCode = await QRCode.toDataURL(qrData);

        // Create email content
        const emailContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Tu Entrada - ${ticket.event_name}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
              .qr-code { text-align: center; margin: 20px 0; }
              .qr-code img { max-width: 200px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .highlight { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Tu Entrada Está Lista!</h1>
                <p>${ticket.event_name}</p>
              </div>
              
              <div class="content">
                <p>Hola <span class="highlight">${ticket.user_name}</span>,</p>
                
                <p>¡Gracias por tu compra! Tu entrada para <strong>${ticket.event_name}</strong> está confirmada.</p>
                
                <div class="ticket-info">
                  <h3>📋 Detalles del Evento</h3>
                  <p><strong>Evento:</strong> ${ticket.event_name}</p>
                  <p><strong>Fecha:</strong> ${new Date(ticket.event_date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Ubicación:</strong> ${ticket.event_location}</p>
                  <p><strong>Código de Entrada:</strong> <span class="highlight">${ticket.ticket_code}</span></p>
                </div>
                
                <div class="qr-code">
                  <h3>📱 Tu Código QR</h3>
                  <p>Presenta este código QR en la entrada del evento:</p>
                  <img src="${qrCode}" alt="QR Code" />
                </div>
                
                <div class="ticket-info">
                  <h3>📝 Información Importante</h3>
                  <ul>
                    <li>Llega 15 minutos antes del inicio del evento</li>
                    <li>Trae tu código QR (puedes mostrarlo en tu teléfono)</li>
                    <li>Este código es único y no transferible</li>
                    <li>En caso de problemas, contacta con soporte</li>
                  </ul>
                </div>
                
                <p>¡Esperamos verte en el evento!</p>
                
                <p>Saludos,<br>El Equipo de Ticketing</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                <p>Si tienes alguna pregunta, contacta con soporte.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email
        const transporter = createTransporter();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: `🎫 Tu Entrada - ${ticket.event_name}`,
          html: emailContent
        };

        await transporter.sendMail(mailOptions);

        // Update ticket with QR code if not already set
        if (!ticket.qr_code) {
          db.run('UPDATE tickets SET qr_code = ? WHERE id = ?', [qrCode, ticketId]);
        }

        res.json({ 
          message: 'Ticket email sent successfully',
          ticketCode: ticket.ticket_code
        });

      } catch (emailError) {
        console.error('Email error:', emailError);
        res.status(500).json({ error: 'Failed to send email' });
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Send multiple tickets email
router.post('/send-tickets', [
  body('ticketIds').isArray(),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketIds, email } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();

    // Get all tickets
    db.all(`
      SELECT t.*, e.name as event_name, e.date as event_date, e.location as event_location, e.description as event_description,
             u.name as user_name, u.email as user_email
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN users u ON t.user_id = u.id
      WHERE t.id IN (${ticketIds.map(() => '?').join(',')}) AND t.user_id = ?
    `, [...ticketIds, decoded.userId], async (err, tickets) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (tickets.length !== ticketIds.length) {
        return res.status(400).json({ error: 'Some tickets not found' });
      }

      // Check if all tickets are paid
      const unpaidTickets = tickets.filter(t => !t.payment_intent_id);
      if (unpaidTickets.length > 0) {
        return res.status(400).json({ error: 'Some tickets are not paid' });
      }

      try {
        // Generate QR codes for all tickets
        const ticketsWithQR = await Promise.all(
          tickets.map(async (ticket) => {
            const qrData = JSON.stringify({
              ticketCode: ticket.ticket_code,
              eventName: ticket.event_name,
              eventDate: ticket.event_date,
              eventLocation: ticket.event_location
            });

            const qrCode = await QRCode.toDataURL(qrData);
            return { ...ticket, qrCode };
          })
        );

        // Create email content for multiple tickets
        const emailContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Tus Entradas - ${tickets[0].event_name}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
              .qr-code { text-align: center; margin: 20px 0; }
              .qr-code img { max-width: 150px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .highlight { color: #667eea; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 ¡Tus Entradas Están Listas!</h1>
                <p>${tickets[0].event_name}</p>
                <p>Has comprado ${tickets.length} entrada${tickets.length > 1 ? 's' : ''}</p>
              </div>
              
              <div class="content">
                <p>Hola <span class="highlight">${tickets[0].user_name}</span>,</p>
                
                <p>¡Gracias por tu compra! Aquí tienes todas tus entradas para <strong>${tickets[0].event_name}</strong>.</p>
                
                ${ticketsWithQR.map((ticket, index) => `
                  <div class="ticket">
                    <h3>🎫 Entrada ${index + 1}</h3>
                    <p><strong>Código:</strong> <span class="highlight">${ticket.ticket_code}</span></p>
                    <div class="qr-code">
                      <img src="${ticket.qrCode}" alt="QR Code ${index + 1}" />
                    </div>
                  </div>
                `).join('')}
                
                <div class="ticket">
                  <h3>📋 Detalles del Evento</h3>
                  <p><strong>Evento:</strong> ${tickets[0].event_name}</p>
                  <p><strong>Fecha:</strong> ${new Date(tickets[0].event_date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Ubicación:</strong> ${tickets[0].event_location}</p>
                </div>
                
                <div class="ticket">
                  <h3>📝 Información Importante</h3>
                  <ul>
                    <li>Llega 15 minutos antes del inicio del evento</li>
                    <li>Trae tus códigos QR (puedes mostrarlos en tu teléfono)</li>
                    <li>Cada código es único y no transferible</li>
                    <li>En caso de problemas, contacta con soporte</li>
                  </ul>
                </div>
                
                <p>¡Esperamos verte en el evento!</p>
                
                <p>Saludos,<br>El Equipo de Ticketing</p>
              </div>
              
              <div class="footer">
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                <p>Si tienes alguna pregunta, contacta con soporte.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email
        const transporter = createTransporter();
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: `🎫 Tus Entradas - ${tickets[0].event_name}`,
          html: emailContent
        };

        await transporter.sendMail(mailOptions);

        // Update tickets with QR codes
        const updatePromises = ticketsWithQR.map(ticket => {
          return new Promise((resolve, reject) => {
            if (!ticket.qr_code) {
              db.run('UPDATE tickets SET qr_code = ? WHERE id = ?', [ticket.qrCode, ticket.id], (err) => {
                if (err) reject(err);
                else resolve();
              });
            } else {
              resolve();
            }
          });
        });

        await Promise.all(updatePromises);

        res.json({ 
          message: 'Tickets email sent successfully',
          ticketCount: tickets.length
        });

      } catch (emailError) {
        console.error('Email error:', emailError);
        res.status(500).json({ error: 'Failed to send email' });
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
