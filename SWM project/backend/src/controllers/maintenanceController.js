import MaintenanceTicket from '../model/MaintenanceTicket.js';

class MaintenanceController {
  constructor(io) {
    this.io = io;
  }

  async createTicket(req, res) {
    try {
      const { binId, reason, priority = 'medium', notes = '' } = req.body;

      // Validate required fields
      if (!binId || !reason) {
        return res.status(400).json({
          error: 'Missing required fields: binId, reason'
        });
      }

      // Validate reason
      const validReasons = ['inconsistent_data', 'device_offline', 'mechanism_fault', 'manual_report'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          error: 'Invalid reason. Must be one of: ' + validReasons.join(', ')
        });
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: 'Invalid priority. Must be one of: ' + validPriorities.join(', ')
        });
      }

      // Generate unique ticket ID
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const ticket = new MaintenanceTicket({
        ticketId,
        binId,
        reason,
        priority,
        status: 'open',
        notes
      });

      await ticket.save();

      // Emit socket event
      this.io.emit('maintenance:update', ticket);

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating maintenance ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async scheduleTicket(req, res) {
    try {
      const { id } = req.params;
      const { scheduledAt, notes = '' } = req.body;

      if (!scheduledAt) {
        return res.status(400).json({
          error: 'Missing required field: scheduledAt'
        });
      }

      const ticket = await MaintenanceTicket.findOne({ ticketId: id });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.status !== 'open') {
        return res.status(400).json({
          error: 'Only open tickets can be scheduled'
        });
      }

      ticket.status = 'scheduled';
      ticket.scheduledAt = new Date(scheduledAt);
      ticket.notes = notes;

      await ticket.save();

      // Emit socket event
      this.io.emit('maintenance:update', ticket);

      res.json(ticket);
    } catch (error) {
      console.error('Error scheduling ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async closeTicket(req, res) {
    try {
      const { id } = req.params;
      const { notes = '' } = req.body;

      const ticket = await MaintenanceTicket.findOne({ ticketId: id });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.status === 'done') {
        return res.status(400).json({
          error: 'Ticket is already closed'
        });
      }

      ticket.status = 'done';
      ticket.notes = notes;

      await ticket.save();

      // Emit socket event
      this.io.emit('maintenance:update', ticket);

      res.json(ticket);
    } catch (error) {
      console.error('Error closing ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTickets(req, res) {
    try {
      const { status, priority } = req.query;
      
      let query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const tickets = await MaintenanceTicket
        .find(query)
        .sort({ createdAt: -1 });

      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await MaintenanceTicket.findOne({ ticketId: id });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default MaintenanceController;
