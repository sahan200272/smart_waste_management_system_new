/**
 * @fileoverview Field Operations Controller
 * Handles HTTP requests for field operations (collection and maintenance)
 */

import CollectionTask from '../model/CollectionTask.js';
import CollectionEvent from '../model/CollectionEvent.js';
import MaintenanceTicket from '../model/MaintenanceTicket.js';
import Bin from '../model/Bin.js';

/**
 * Field Operations Controller Class
 * Centralized controller for all field operations endpoints
 */
class FieldOpsController {
  // ==================== TASK MANAGEMENT ====================
  
  /**
   * Get tasks for a collector
   * GET /api/fieldops/tasks
   */
  async getTasks(req, res) {
    try {
      const { 
        collectorId = req.user?.id,
        status,
        date,
        page = 1,
        limit = 20 
      } = req.query;

      if (!collectorId) {
        return res.status(400).json({
          success: false,
          message: 'Collector ID is required'
        });
      }

      const options = {};
      if (status) {
        options.status = status.split(',');
      }
      if (date) {
        options.date = new Date(date);
      }

      const tasks = await CollectionTask.findByCollector(collectorId, options)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await CollectionTask.countDocuments({
        assignedTo: collectorId,
        ...(options.status && { status: { $in: options.status } }),
        ...(options.date && {
          scheduledDate: {
            $gte: new Date(options.date.setHours(0, 0, 0, 0)),
            $lt: new Date(options.date.setHours(23, 59, 59, 999))
          }
        })
      });

      res.json({
        success: true,
        data: tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('getTasks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks',
        error: error.message
      });
    }
  }

  /**
   * Get single task details
   * GET /api/fieldops/tasks/:id
   */
  async getTask(req, res) {
    try {
      const { id } = req.params;
      
      const task = await CollectionTask.findById(id)
        .populate('binId')
        .lean();

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      // Check if user can access this task
      if (task.assignedTo !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('getTask error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch task',
        error: error.message
      });
    }
  }

  // ==================== SCANNING ====================

  /**
   * Validate QR scan
   * POST /api/fieldops/scan/validate
   */
  async validateScan(req, res) {
    try {
      const { qrTag, binId, gps, taskId } = req.body;
      const userId = req.user?.id;

      if (!qrTag && !binId) {
        return res.status(400).json({
          success: false,
          message: 'Either QR tag or bin ID is required',
          retryable: false
        });
      }

      if (!gps || !gps.latitude || !gps.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Valid GPS coordinates are required',
          retryable: false
        });
      }

      // Find bin by QR tag or ID
      let bin;
      if (qrTag) {
        // Validate QR format
        if (!/^QR_BIN\d+_LOC_\w+$/.test(qrTag)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid QR code format',
            retryable: true
          });
        }
        
        bin = await Bin.findOne({ qrTag }).lean();
      } else {
        bin = await Bin.findById(binId).lean();
      }

      if (!bin) {
        return res.status(404).json({
          success: false,
          message: 'QR code not recognized. Please try scanning again.',
          retryable: true
        });
      }

      // Check bin status
      if (bin.status === 'Blocked' || bin.status === 'OutOfService') {
        return res.status(400).json({
          success: false,
          message: `Bin is currently ${bin.status.toLowerCase()}`,
          bin: bin,
          retryable: false
        });
      }

      // Validate location proximity (within 100 meters)
      const distance = this.calculateDistance(
        gps.latitude, gps.longitude,
        bin.location.coordinates[1], bin.location.coordinates[0]
      );

      if (distance > 0.1) { // 100 meters
        return res.status(400).json({
          success: false,
          message: 'Location mismatch. You may not be at the correct bin location.',
          bin: bin,
          distance: Math.round(distance * 1000),
          retryable: true
        });
      }

      // Add scan timestamp
      bin.scanTimestamp = new Date();

      res.json({
        success: true,
        message: 'Scan validated successfully',
        bin: bin,
        location_verified: true,
        distance: Math.round(distance * 1000)
      });

    } catch (error) {
      console.error('validateScan error:', error);
      res.status(500).json({
        success: false,
        message: 'Scan validation failed',
        error: error.message,
        retryable: true
      });
    }
  }

  // ==================== COLLECTIONS ====================

  /**
   * Start collection
   * POST /api/fieldops/collections/start
   */
  async startCollection(req, res) {
    try {
      const { taskId, binId, collectorId, gpsData } = req.body;
      const userId = req.user?.id || collectorId;

      // Validate required fields
      if (!taskId || !binId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID, bin ID, and collector ID are required'
        });
      }

      // Check if task exists and is assigned to collector
      const task = await CollectionTask.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Collection task not found'
        });
      }

      if (task.assignedTo !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Task is not assigned to this collector'
        });
      }

      if (task.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: `Task is already ${task.status.toLowerCase()}`
        });
      }

      // Create collection event
      const eventData = {
        taskId,
        binId,
        collectorId: userId,
        startTime: new Date(),
        gpsData: {
          start: {
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            accuracy: gpsData.accuracy,
            timestamp: new Date()
          }
        }
      };

      const event = await CollectionEvent.create(eventData);

      // Update task status
      await task.markStarted(userId, {
        coordinates: [gpsData.longitude, gpsData.latitude],
        accuracy: gpsData.accuracy
      });

      res.json({
        success: true,
        message: 'Collection started successfully',
        event: event,
        task: task
      });

    } catch (error) {
      console.error('startCollection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start collection',
        error: error.message
      });
    }
  }

  /**
   * Record measurement
   * POST /api/fieldops/collections/measure
   */
  async recordMeasurement(req, res) {
    try {
      const { eventId, weightKg, fillPct, wasteType, photos, notes } = req.body;

      // Validate measurements
      if (weightKg !== undefined && (weightKg < 0 || weightKg > 1000)) {
        return res.status(400).json({
          success: false,
          message: 'Weight must be between 0 and 1000 kg'
        });
      }

      if (fillPct !== undefined && (fillPct < 0 || fillPct > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Fill percentage must be between 0 and 100'
        });
      }

      const event = await CollectionEvent.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Collection event not found'
        });
      }

      if (event.status !== 'InProgress') {
        return res.status(400).json({
          success: false,
          message: 'Cannot record measurement for completed collection'
        });
      }

      // Record measurement
      const measurementData = {
        ...(weightKg !== undefined && { weightKg }),
        ...(fillPct !== undefined && { fillPct }),
        ...(wasteType && { wasteType }),
        ...(photos && { photos }),
        ...(notes && { notes })
      };

      await event.recordMeasurement(measurementData);

      res.json({
        success: true,
        message: 'Measurement recorded successfully',
        event: event
      });

    } catch (error) {
      console.error('recordMeasurement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record measurement',
        error: error.message
      });
    }
  }

  /**
   * Complete collection
   * POST /api/fieldops/collections/complete
   */
  async completeCollection(req, res) {
    try {
      const { eventId, notes, irregularity } = req.body;

      const event = await CollectionEvent.findById(eventId).populate('taskId');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Collection event not found'
        });
      }

      if (event.status !== 'InProgress') {
        return res.status(400).json({
          success: false,
          message: 'Collection is not in progress'
        });
      }

      // Complete the event
      await event.complete(req.body.gpsData, notes);

      // Add irregularity if reported
      if (irregularity) {
        event.irregularity = irregularity;
        await event.save();
      }

      // Update task status
      if (event.taskId) {
        await event.taskId.markCompleted(req.user?.id, notes);
      }

      // Update bin status
      await Bin.findByIdAndUpdate(event.binId, {
        status: 'Empty',
        fillLevel: 0,
        lastCollected: new Date(),
        lastCollectedBy: event.collectorId
      });

      // Generate confirmation response
      const confirmation = {
        type: 'COLLECTION_COMPLETE',
        message: irregularity ? 
          'Collection completed with irregularities noted' : 
          'Collection completed successfully',
        visual: {
          color: irregularity ? 'orange' : 'green',
          icon: irregularity ? 'warning' : 'check'
        },
        audio: {
          tone: irregularity ? 'warning' : 'success'
        }
      };

      res.json({
        success: true,
        message: 'Collection completed successfully',
        event: event,
        confirmation: confirmation
      });

    } catch (error) {
      console.error('completeCollection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete collection',
        error: error.message
      });
    }
  }

  // ==================== UTILITY METHODS ====================

  // ==================== ISSUE REPORTING ====================

  /**
   * Report maintenance issue
   * POST /api/fieldops/report-issue
   */
  async reportIssue(req, res) {
    try {
      console.log('=== REPORT ISSUE REQUEST RECEIVED ===');
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
      
      const {
        type,
        priority,
        description,
        location,
        binId,
        photos = []
      } = req.body;

      const collectorId = req.user?.id;
      console.log('Collector ID:', collectorId);

      if (!collectorId) {
        console.log('❌ Missing collector ID');
        return res.status(400).json({
          success: false,
          message: 'Collector ID is required'
        });
      }

      // Validate required fields
      if (!type || !priority || !description || !location) {
        console.log('❌ Missing required fields:', { type, priority, description, location });
        return res.status(400).json({
          success: false,
          message: 'Type, priority, description, and location are required'
        });
      }

      console.log('✅ All validations passed');

      // Generate unique ticket ID
      const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Map frontend priority to backend format
      const priorityMap = {
        'Low': 'low',
        'Medium': 'medium', 
        'High': 'high',
        'Critical': 'high' // Map Critical to high since model only has low/medium/high
      };

      // Create maintenance ticket
      const maintenanceTicket = new MaintenanceTicket({
        ticketId,
        binId: binId || 'UNKNOWN', // Use provided binId or default
        reason: 'manual_report',
        priority: priorityMap[priority] || 'medium',
        status: 'open',
        notes: `Issue Type: ${type}\nLocation: ${location}\nDescription: ${description}\nReported by: ${collectorId}\nPhotos: ${photos.length > 0 ? `${photos.length} photo(s) attached` : 'None'}`
      });

      console.log('💾 Saving ticket to database:', ticketId);
      await maintenanceTicket.save();
      console.log('✅ Ticket saved successfully');

      // Log the report for audit trail
      console.log(`Issue reported by collector ${collectorId}:`, {
        ticketId,
        type,
        priority,
        location,
        binId
      });

      res.status(201).json({
        success: true,
        message: 'Issue reported successfully',
        data: {
          ticketId,
          type,
          priority,
          description,
          location,
          reportedAt: new Date(),
          status: 'submitted'
        }
      });

    } catch (error) {
      console.error('Error reporting issue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report issue',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get maintenance tickets for a collector
   * GET /api/fieldops/tickets
   */
  async getTickets(req, res) {
    try {
      const { 
        status,
        priority,
        page = 1,
        limit = 20 
      } = req.query;

      const filter = {};
      if (status) {
        filter.status = status;
      }
      if (priority) {
        filter.priority = priority;
      }

      const tickets = await MaintenanceTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await MaintenanceTicket.countDocuments(filter);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

export default new FieldOpsController();