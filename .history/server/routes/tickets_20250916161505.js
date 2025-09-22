const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/setup');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all events
router.get('/events', async (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT * FROM events ORDER BY date ASC', (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ events });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json({ event });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create ticket
router.post('/create', [
  body('eventId').isInt(),
  body('attendees').isArray({ min: 1, max: 10 }),
  body('attendees.*.name').trim().isLength({ min: 2 }),
  body('attendees.*.email').isEmail().normalizeEmail(),
  body('attendees.*.dni').trim().isLength({ min: 8 }),
  body('attendees.*.phone').trim().isLength({ min: 9 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, attendees } = req.body;
    const quantity = attendees.length;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();

    // Check if event exists and has available tickets
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.available_tickets < quantity) {
        return res.status(400).json({ error: 'Not enough tickets available' });
      }

      // Generate ticket codes and QR codes
      const tickets = [];
      const totalAmount = event.price * quantity;

      for (let i = 0; i < quantity; i++) {
        const ticketCode = uuidv4();
        tickets.push({
          ticketCode,
          userId: decoded.userId,
          eventId,
          amountPaid: event.price
        });
      }

      // Insert tickets into database
      const insertPromises = tickets.map(ticket => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO tickets (ticket_code, user_id, event_id, amount_paid) VALUES (?, ?, ?, ?)',
            [ticket.ticketCode, ticket.userId, ticket.eventId, ticket.amountPaid],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
        });
      });

      Promise.all(insertPromises)
        .then(() => {
          // Update available tickets
          db.run(
            'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
            [quantity, eventId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to update event' });
              }

              res.json({
                message: 'Tickets created successfully',
                tickets: tickets.map(t => ({ ticketCode: t.ticketCode })),
                totalAmount,
                event: {
                  name: event.name,
                  date: event.date,
                  location: event.location
                }
              });
            }
          );
        })
        .catch(err => {
          res.status(500).json({ error: 'Failed to create tickets' });
        });
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user tickets
router.get('/my-tickets', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDatabase();

    db.all(`
      SELECT t.*, e.name as event_name, e.date as event_date, e.location as event_location, e.image_url
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [decoded.userId], (err, tickets) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ tickets });
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate QR code for ticket
router.get('/qr/:ticketCode', async (req, res) => {
  try {
    const { ticketCode } = req.params;
    const db = getDatabase();

    db.get(`
      SELECT t.*, e.name as event_name, e.date as event_date, e.location as event_location
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.ticket_code = ?
    `, [ticketCode], async (err, ticket) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Generate QR code
      const qrData = JSON.stringify({
        ticketCode: ticket.ticket_code,
        eventName: ticket.event_name,
        eventDate: ticket.event_date,
        eventLocation: ticket.event_location
      });

      try {
        const qrCode = await QRCode.toDataURL(qrData);
        
        // Update ticket with QR code
        db.run('UPDATE tickets SET qr_code = ? WHERE ticket_code = ?', [qrCode, ticketCode]);

        res.json({ qrCode, ticket });
      } catch (qrError) {
        res.status(500).json({ error: 'Failed to generate QR code' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Validate ticket (for entry)
router.post('/validate/:ticketCode', async (req, res) => {
  try {
    const { ticketCode } = req.params;
    const db = getDatabase();

    db.get(`
      SELECT t.*, e.name as event_name, e.date as event_date
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.ticket_code = ?
    `, [ticketCode], (err, ticket) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.status !== 'active') {
        return res.status(400).json({ error: 'Ticket is not active' });
      }

      // Check if event date has passed
      const eventDate = new Date(ticket.event_date);
      const now = new Date();
      
      if (eventDate < now) {
        return res.status(400).json({ error: 'Event has already passed' });
      }

      // Mark ticket as used
      db.run('UPDATE tickets SET status = ? WHERE ticket_code = ?', ['used', ticketCode], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update ticket' });
        }

        res.json({
          message: 'Ticket validated successfully',
          ticket: {
            ticketCode: ticket.ticket_code,
            eventName: ticket.event_name,
            eventDate: ticket.event_date,
            status: 'used'
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
