const express = require('express');
const { getDatabase } = require('../database/setup');
const XLSX = require('xlsx');
const { authenticateToken, requireAdmin, exportRateLimit } = require('../middleware/auth');
const router = express.Router();

// Protect all export routes with authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);
router.use(exportRateLimit);

// Export attendees to Excel for a specific event
router.get('/event/:eventId/excel', async (req, res) => {
  try {
    const { eventId } = req.params;
    const db = getDatabase();

    // Get event details
    db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Get all tickets for this event with attendee data
      db.all(`
        SELECT 
          t.ticket_code,
          t.attendee_name,
          t.attendee_email,
          t.attendee_dni,
          t.attendee_phone,
          t.amount_paid,
          t.status,
          t.created_at,
          u.name as buyer_name,
          u.email as buyer_email
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.event_id = ? AND t.payment_intent_id IS NOT NULL
        ORDER BY t.created_at ASC
      `, [eventId], (err, tickets) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Prepare data for Excel
        const excelData = tickets.map((ticket, index) => ({
          'N°': index + 1,
          'Código de Entrada': ticket.ticket_code,
          'Nombre del Asistente': ticket.attendee_name,
          'Email del Asistente': ticket.attendee_email,
          'DNI del Asistente': ticket.attendee_dni,
          'Teléfono del Asistente': ticket.attendee_phone,
          'Precio Pagado': `$${ticket.amount_paid}`,
          'Estado': ticket.status === 'active' ? 'Activa' : ticket.status === 'used' ? 'Usada' : 'Cancelada',
          'Fecha de Compra': new Date(ticket.created_at).toLocaleString('es-ES'),
          'Comprador': ticket.buyer_name,
          'Email del Comprador': ticket.buyer_email
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
          { wch: 5 },   // N°
          { wch: 25 },  // Código de Entrada
          { wch: 25 },  // Nombre del Asistente
          { wch: 30 },  // Email del Asistente
          { wch: 15 },  // DNI del Asistente
          { wch: 20 },  // Teléfono del Asistente
          { wch: 15 },  // Precio Pagado
          { wch: 12 },  // Estado
          { wch: 20 },  // Fecha de Compra
          { wch: 25 },  // Comprador
          { wch: 30 }   // Email del Comprador
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistentes');

        // Add summary sheet
        const summaryData = [
          ['Resumen del Evento'],
          [''],
          ['Nombre del Evento:', event.name],
          ['Fecha:', new Date(event.date).toLocaleString('es-ES')],
          ['Ubicación:', event.location],
          ['Precio por Entrada:', `$${event.price}`],
          [''],
          ['Estadísticas de Ventas'],
          ['Total de Entradas Vendidas:', tickets.length],
          ['Total Recaudado:', `$${tickets.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0)}`],
          ['Entradas Activas:', tickets.filter(t => t.status === 'active').length],
          ['Entradas Usadas:', tickets.filter(t => t.status === 'used').length],
          ['Entradas Canceladas:', tickets.filter(t => t.status === 'cancelled').length],
          [''],
          ['Fecha de Exportación:', new Date().toLocaleString('es-ES')]
        ];

        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        const fileName = `asistentes_${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        res.send(excelBuffer);
      });
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

// Export all events data to Excel
router.get('/all-events/excel', async (req, res) => {
  try {
    const db = getDatabase();

    // Get all events with their attendees
    db.all(`
      SELECT 
        e.name as event_name,
        e.date as event_date,
        e.location as event_location,
        e.price as event_price,
        t.ticket_code,
        t.attendee_name,
        t.attendee_email,
        t.attendee_dni,
        t.attendee_phone,
        t.amount_paid,
        t.status,
        t.created_at,
        u.name as buyer_name,
        u.email as buyer_email
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id AND t.payment_intent_id IS NOT NULL
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY e.date ASC, t.created_at ASC
    `, [], (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Group by event
      const eventsData = {};
      data.forEach(row => {
        if (!eventsData[row.event_name]) {
          eventsData[row.event_name] = {
            event: {
              name: row.event_name,
              date: row.event_date,
              location: row.event_location,
              price: row.event_price
            },
            attendees: []
          };
        }
        
        if (row.ticket_code) {
          eventsData[row.event_name].attendees.push({
            ticket_code: row.ticket_code,
            attendee_name: row.attendee_name,
            attendee_email: row.attendee_email,
            attendee_dni: row.attendee_dni,
            attendee_phone: row.attendee_phone,
            amount_paid: row.amount_paid,
            status: row.status,
            created_at: row.created_at,
            buyer_name: row.buyer_name,
            buyer_email: row.buyer_email
          });
        }
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create a sheet for each event
      Object.values(eventsData).forEach((eventData, index) => {
        const excelData = eventData.attendees.map((ticket, ticketIndex) => ({
          'N°': ticketIndex + 1,
          'Código de Entrada': ticket.ticket_code,
          'Nombre del Asistente': ticket.attendee_name,
          'Email del Asistente': ticket.attendee_email,
          'DNI del Asistente': ticket.attendee_dni,
          'Teléfono del Asistente': ticket.attendee_phone,
          'Precio Pagado': `$${ticket.amount_paid}`,
          'Estado': ticket.status === 'active' ? 'Activa' : ticket.status === 'used' ? 'Usada' : 'Cancelada',
          'Fecha de Compra': new Date(ticket.created_at).toLocaleString('es-ES'),
          'Comprador': ticket.buyer_name,
          'Email del Comprador': ticket.buyer_email
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const sheetName = eventData.event.name.substring(0, 31); // Excel sheet name limit
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Create summary sheet
      const summaryData = [
        ['Resumen de Todos los Eventos'],
        [''],
        ['Fecha de Exportación:', new Date().toLocaleString('es-ES')],
        [''],
        ['Eventos:']
      ];

      Object.values(eventsData).forEach(eventData => {
        const event = eventData.event;
        const attendees = eventData.attendees;
        summaryData.push([
          event.name,
          `${attendees.length} entradas vendidas - $${attendees.reduce((sum, t) => sum + parseFloat(t.amount_paid), 0)} recaudado`
        ]);
      });

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen General');

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      const fileName = `todos_los_eventos_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      res.send(excelBuffer);
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
});

module.exports = router;
