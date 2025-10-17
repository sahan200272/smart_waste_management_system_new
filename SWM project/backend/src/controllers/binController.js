import Bin from '../model/Bin.js';
import MaintenanceTicket from '../model/MaintenanceTicket.js';

class BinController {
  constructor(io, notificationService) {
    this.io = io;
    this.notificationService = notificationService;
  }

  async ingestSensorData(req, res) {
    try {
      const { binId, level, category, mixed, deviceTs } = req.body;

      // Validate required fields
      if (!binId || level === undefined || !category) {
        return res.status(400).json({
          error: 'Missing required fields: binId, level, category'
        });
      }

      // Validate data types and ranges
      if (level < 0 || level > 100) {
        return res.status(400).json({
          error: 'Level must be between 0 and 100'
        });
      }

      if (!['biodegradable', 'recyclable', 'non_biodegradable'].includes(category)) {
        return res.status(400).json({
          error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable'
        });
      }

      const now = deviceTs ? new Date(deviceTs) : new Date();

      // Determine status based on business rules
      let newStatus = 'ok';
      let faultCode = null;
      if (mixed) {
        newStatus = 'segregation_required';
        faultCode = 'mixed_waste_detected';
      }

      // Upsert bin and set fields atomically
      const updated = await Bin.findOneAndUpdate(
        { binId },
        {
          $set: {
            binId,
            level,
            category,
            mixed: !!mixed,
            lastSeenAt: now,
            status: newStatus,
            faultCode,
            // Provide a default location on first insert
            location: {
              lat: 6.9271 + (Math.random() - 0.5) * 0.1,
              lng: 79.8612 + (Math.random() - 0.5) * 0.1,
              address: `Location for ${binId}`
            }
          }
        },
        { upsert: true, new: true }
      );

      // Emit updates
      this.io.emit('bin:update', updated);

      // High level notification (keep separate from segregation)
      if (!mixed && level >= 90) {
        await this.notificationService.notifyResident({
          userId: 'residents',
          binId: updated.binId,
          type: 'level',
          message: `Bin ${updated.binId} is ${level}% full and needs attention`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Sensor data processed successfully',
        data: updated
      });
    } catch (error) {
      console.error('Error ingesting sensor data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllBins(req, res) {
    try {
      const { status, category } = req.query || {};
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;

      const bins = await Bin.find(filter);
      res.status(200).json({ success: true, data: bins });
    } catch (error) {
      console.error('Error fetching bins:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBinById(req, res) {
    try {
      const { binId } = req.params;
      const bin = await Bin.findOne({ binId });

      if (!bin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      res.status(200).json({ success: true, data: bin });
    } catch (error) {
      console.error('Error fetching bin:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markSegregationDone(req, res) {
    try {
      const { binId } = req.params;
      const updated = await Bin.findOneAndUpdate(
        { binId },
        { mixed: false },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      // Emit updates
      this.io.emit('bin:update', updated);

      res.status(200).json({
        success: true,
        message: 'Segregation marked as completed',
        data: updated
      });
    } catch (error) {
      console.error('Error marking segregation done:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default BinController;
