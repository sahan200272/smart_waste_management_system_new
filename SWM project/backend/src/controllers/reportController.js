import Bin from '../model/Bin.js';
import MaintenanceTicket from '../model/MaintenanceTicket.js';

class ReportController {
  constructor(io, notificationService) {
    this.io = io;
    this.notificationService = notificationService;
  }

  async manualSegregationReport(req, res) {
    try {
      const { userId, binId, issue } = req.body;

      // Validate required fields
      if (!userId || !binId || !issue) {
        return res.status(400).json({
          error: 'Missing required fields: userId, binId, issue'
        });
      }

      // Find the bin
      const bin = await Bin.findOne({ binId });
      if (!bin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      // Determine priority based on bin status and level
      let priority = 'medium';
      if (bin.mixed || bin.level >= 85) {
        priority = 'high';
      } else if (bin.level >= 70) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Create maintenance ticket
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ticket = new MaintenanceTicket({
        ticketId,
        binId,
        reason: 'manual_report',
        priority,
        status: 'open',
        notes: `Manual report from resident ${userId}: ${issue}`
      });

      await ticket.save();

      // Update bin status if needed
      if (bin.status === 'ok') {
        bin.status = 'segregation_required';
        bin.faultCode = 'manual_report';
        await bin.save();

        // Emit bin update
        this.io.emit('bin:update', bin);
      }

      // Emit maintenance update
      this.io.emit('maintenance:update', ticket);

      // Notify residents about the report
      await this.notificationService.notifyResident({
        userId: 'residents',
        binId: bin.binId,
        type: 'maintenance',
        message: `Manual segregation report received for bin ${bin.binId}: ${issue}`
      });

      res.status(201).json({
        message: 'Manual report submitted successfully',
        ticket
      });
    } catch (error) {
      console.error('Error processing manual report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkSync(req, res) {
    try {
      const { readings } = req.body;

      if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({
          error: 'Invalid readings data. Expected non-empty array'
        });
      }

      const results = [];
      const errors = [];

      for (const reading of readings) {
        try {
          const { binId, level, category, mixed, deviceTs } = reading;

          // Validate required fields
          if (!binId || level === undefined || !category) {
            errors.push({
              binId: binId || 'unknown',
              error: 'Missing required fields: binId, level, category'
            });
            continue;
          }

          // Validate data types and ranges
          if (level < 0 || level > 100) {
            errors.push({
              binId,
              error: 'Level must be between 0 and 100'
            });
            continue;
          }

          if (!['biodegradable', 'recyclable', 'non_biodegradable'].includes(category)) {
            errors.push({
              binId,
              error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable'
            });
            continue;
          }

          // Find or create bin
          let bin = await Bin.findOne({ binId });
          
          if (!bin) {
            bin = new Bin({
              binId,
              location: {
                lat: 6.9271 + (Math.random() - 0.5) * 0.1,
                lng: 79.8612 + (Math.random() - 0.5) * 0.1,
                address: `Location for ${binId}`
              },
              level,
              category,
              mixed: mixed || false,
              lastSeenAt: deviceTs ? new Date(deviceTs) : new Date()
            });
          } else {
            bin.level = level;
            bin.category = category;
            bin.mixed = mixed || false;
            bin.lastSeenAt = deviceTs ? new Date(deviceTs) : new Date();
          }

          // Apply business logic
          if (bin.mixed && bin.status !== 'segregation_required') {
            bin.status = 'segregation_required';
            bin.faultCode = 'mixed_waste_detected';
          } else if (!bin.mixed && bin.status === 'segregation_required') {
            bin.status = 'ok';
            bin.faultCode = null;
          }

          await bin.save();
          results.push(bin);

          // Emit socket event for each bin update
          this.io.emit('bin:update', bin);

          // Check for high fill level
          if (bin.level >= 85) {
            await this.notificationService.notifyResident({
              userId: 'residents',
              binId: bin.binId,
              type: 'level',
              message: `Bin ${bin.binId} is ${bin.level}% full and needs attention`
            });
          }

          // Check for mixed waste
          if (bin.mixed) {
            await this.notificationService.notifyResident({
              userId: 'residents',
              binId: bin.binId,
              type: 'segregation',
              message: `Bin ${bin.binId} requires segregation - mixed waste detected`
            });

            this.io.emit('bin:alert', {
              binId: bin.binId,
              message: `Bin ${bin.binId} requires segregation - mixed waste detected`,
              type: 'segregation',
              timestamp: new Date()
            });
          }

        } catch (readingError) {
          console.error(`Error processing reading for bin ${reading.binId}:`, readingError);
          errors.push({
            binId: reading.binId || 'unknown',
            error: readingError.message
          });
        }
      }

      res.json({
        message: `Bulk sync completed. Processed ${results.length} readings successfully`,
        processed: results.length,
        errors: errors.length,
        results,
        errors
      });
    } catch (error) {
      console.error('Error processing bulk sync:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNotifications(req, res) {
    try {
      const { userId = 'residents', limit = 50 } = req.query;
      
      const notifications = await this.notificationService.getNotificationsForUser(userId, parseInt(limit));
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.markAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default ReportController;
