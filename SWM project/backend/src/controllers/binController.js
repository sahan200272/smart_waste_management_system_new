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

      // Find or create bin
      let bin = await Bin.findOne({ binId });
      
      if (!bin) {
        // Create new bin with default location (can be updated later)
        bin = new Bin({
          binId,
          location: {
            lat: 6.9271 + (Math.random() - 0.5) * 0.1, // Random location in Colombo area
            lng: 79.8612 + (Math.random() - 0.5) * 0.1,
            address: `Location for ${binId}`
          },
          level,
          category,
          mixed: mixed || false,
          lastSeenAt: deviceTs ? new Date(deviceTs) : new Date()
        });
      } else {
        // Update existing bin
        bin.level = level;
        bin.category = category;
        bin.mixed = mixed || false;
        bin.lastSeenAt = deviceTs ? new Date(deviceTs) : new Date();
      }

      // Business logic for status updates
      let statusChanged = false;
      const previousStatus = bin.status;

      // Check for mixed waste
      if (bin.mixed && bin.status !== 'segregation_required') {
        bin.status = 'segregation_required';
        bin.faultCode = 'mixed_waste_detected';
        statusChanged = true;
      } else if (!bin.mixed && bin.status === 'segregation_required') {
        bin.status = 'ok';
        bin.faultCode = null;
        statusChanged = true;
      }

      // Check for high fill level
      if (bin.level >= 85 && bin.status === 'ok') {
        // Create resident notification for high fill level
        await this.notificationService.notifyResident({
          userId: 'residents',
          binId: bin.binId,
          type: 'level',
          message: `Bin ${bin.binId} is ${bin.level}% full and needs attention`
        });
      }

      await bin.save();

      // Emit socket events
      this.io.emit('bin:update', bin);

      if (statusChanged) {
        if (bin.status === 'segregation_required') {
          // Emit alert for segregation required
          this.io.emit('bin:alert', {
            binId: bin.binId,
            message: `Bin ${bin.binId} requires segregation - mixed waste detected`,
            type: 'segregation',
            timestamp: new Date()
          });

          // Notify residents about segregation requirement
          await this.notificationService.notifyResident({
            userId: 'residents',
            binId: bin.binId,
            type: 'segregation',
            message: `Bin ${bin.binId} requires segregation - mixed waste detected`
          });
        } else if (bin.status === 'ok' && previousStatus === 'segregation_required') {
          // Segregation completed
          this.io.emit('bin:alert', {
            binId: bin.binId,
            message: `Bin ${bin.binId} segregation completed`,
            type: 'segregation_resolved',
            timestamp: new Date()
          });
        }
      }

      res.json(bin);
    } catch (error) {
      console.error('Error ingesting sensor data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async listBins(req, res) {
    try {
      const bins = await Bin.find().sort({ binId: 1 });
      res.json(bins);
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

      res.json(bin);
    } catch (error) {
      console.error('Error fetching bin:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markSegregationDone(req, res) {
    try {
      const { binId } = req.params;
      const bin = await Bin.findOne({ binId });

      if (!bin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      if (bin.status === 'segregation_required') {
        bin.status = 'ok';
        bin.mixed = false;
        bin.faultCode = null;
        await bin.save();

        // Emit updates
        this.io.emit('bin:update', bin);
        this.io.emit('bin:alert', {
          binId: bin.binId,
          message: `Bin ${bin.binId} segregation completed`,
          type: 'segregation_resolved',
          timestamp: new Date()
        });

        res.json(bin);
      } else {
        res.status(400).json({ error: 'Bin does not require segregation' });
      }
    } catch (error) {
      console.error('Error marking segregation done:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createBin(req, res) {
    try {
      const { binId, category, location, level = 0, mixed = false } = req.body;

      // Validate required fields
      if (!binId || !category) {
        return res.status(400).json({
          error: 'Missing required fields: binId, category'
        });
      }

      // Validate category
      if (!['biodegradable', 'recyclable', 'non_biodegradable'].includes(category)) {
        return res.status(400).json({
          error: 'Invalid category. Must be: biodegradable, recyclable, or non_biodegradable'
        });
      }

      // Check if bin already exists
      const existingBin = await Bin.findOne({ binId });
      if (existingBin) {
        return res.status(409).json({ error: 'Bin with this ID already exists' });
      }

      // Validate level
      if (level < 0 || level > 100) {
        return res.status(400).json({
          error: 'Level must be between 0 and 100'
        });
      }

      // Create new bin
      const bin = new Bin({
        binId,
        category,
        level,
        mixed,
        location: location || {
          lat: 6.9271 + (Math.random() - 0.5) * 0.1, // Random location in Colombo area
          lng: 79.8612 + (Math.random() - 0.5) * 0.1,
          address: location?.address || `Location for ${binId}`
        },
        status: mixed ? 'segregation_required' : (level >= 85 ? 'maintenance_needed' : 'ok'),
        faultCode: mixed ? 'mixed_waste_detected' : null,
        lastSeenAt: new Date()
      });

      await bin.save();

      // Emit socket event
      this.io.emit('bin:update', bin);

      // Send notifications if needed
      if (bin.status === 'segregation_required') {
        await this.notificationService.notifyResident({
          userId: 'residents',
          binId: bin.binId,
          type: 'segregation',
          message: `New bin ${bin.binId} requires segregation - mixed waste detected`
        });
      } else if (bin.level >= 85) {
        await this.notificationService.notifyResident({
          userId: 'residents',
          binId: bin.binId,
          type: 'level',
          message: `New bin ${bin.binId} is ${bin.level}% full and needs attention`
        });
      }

      res.status(201).json(bin);
    } catch (error) {
      console.error('Error creating bin:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default BinController;
