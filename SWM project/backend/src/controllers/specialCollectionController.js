import SpecialCollection from '../model/SpecialCollection.js';
import Truck from '../model/Truck.js';
import Bin from '../model/Bin.js';
import RouteOptimizationService from '../services/RouteOptimizationService.js';

class SpecialCollectionController {
  constructor(io, notificationService) {
    this.io = io;
    this.notificationService = notificationService;
    this.routeOptimizationService = new RouteOptimizationService(io, notificationService);
  }

  // Create special collection request
  async createSpecialCollection(req, res) {
    try {
      const { residentId, binId, wasteType, description, scheduledDate, specialInstructions, images } = req.body;

      // Validate bin exists and is operational
      const bin = await Bin.findById(binId);
      if (!bin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      if (bin.status !== 'active') {
        return res.status(400).json({ error: 'Bin is not active' });
      }

      const specialCollection = new SpecialCollection({
        residentId,
        binId,
        wasteType,
        description,
        scheduledDate: new Date(scheduledDate),
        specialInstructions,
        images,
        status: 'pending'
      });

      await specialCollection.save();

      // Notify WMA about new request
      this.notificationService.notifyWMA('new-special-collection', {
        collectionId: specialCollection._id,
        wasteType,
        priority: specialCollection.priority,
        scheduledDate: specialCollection.scheduledDate
      });

      // Emit real-time update
      this.io.emit('special-collection-created', specialCollection);

      res.status(201).json({
        message: 'Special collection request created successfully',
        collection: specialCollection
      });

    } catch (error) {
      console.error('Error creating special collection:', error);
      res.status(500).json({ error: 'Failed to create special collection request' });
    }
  }

  // Get all special collections with filtering
  async getSpecialCollections(req, res) {
    try {
      const { status, wasteType, priority, date, page = 1, limit = 10 } = req.query;
      
      const filter = {};
      if (status) filter.status = status;
      if (wasteType) filter.wasteType = wasteType;
      if (priority) filter.priority = priority;
      if (date) {
        filter.scheduledDate = {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lte: new Date(date + 'T23:59:59.999Z')
        };
      }

      const collections = await SpecialCollection.find(filter)
        .populate('binId')
        .populate('assignedTruck')
        .sort({ scheduledDate: 1, priority: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await SpecialCollection.countDocuments(filter);

      res.json({
        collections,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Error fetching special collections:', error);
      res.status(500).json({ error: 'Failed to fetch special collections' });
    }
  }

  // Approve and schedule special collection
  async approveAndScheduleCollection(req, res) {
    try {
      const { collectionId } = req.params;
      const { truckId } = req.body;

      const collection = await SpecialCollection.findById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection request not found' });
      }

      if (collection.status !== 'pending') {
        return res.status(400).json({ error: 'Collection request already processed' });
      }

      const truck = await Truck.findById(truckId);
      if (!truck || truck.status !== 'available') {
        return res.status(400).json({ error: 'Truck not available' });
      }

      collection.assignedTruck = truckId;
      collection.status = 'scheduled';
      await collection.save();

      // Notify resident
      this.notificationService.notifyResident(collection.residentId, 'collection-scheduled', {
        collectionId: collection._id,
        scheduledDate: collection.scheduledDate,
        wasteType: collection.wasteType
      });

      // Emit real-time update
      this.io.emit('collection-scheduled', collection);

      res.json({
        message: 'Collection scheduled successfully',
        collection
      });

    } catch (error) {
      console.error('Error scheduling collection:', error);
      res.status(500).json({ error: 'Failed to schedule collection' });
    }
  }

  // Bulk route optimization
  async optimizeCollectionRoutes(req, res) {
    try {
      const { date } = req.body;

      // Get all pending and scheduled collections for the date
      const collections = await SpecialCollection.find({
        scheduledDate: {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lte: new Date(date + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'scheduled'] }
      }).populate('binId');

      // Get available trucks
      const trucks = await Truck.find({ status: 'available' });

      if (collections.length === 0) {
        return res.status(400).json({ error: 'No collections to optimize for the selected date' });
      }

      if (trucks.length === 0) {
        return res.status(400).json({ error: 'No available trucks for route optimization' });
      }

      // Generate optimized routes
      const optimizedRoutes = await this.routeOptimizationService.optimizeRoutes(collections, trucks);

      // Update collections with optimized routes
      for (const route of optimizedRoutes) {
        for (const collectionData of route.collections) {
          await SpecialCollection.findByIdAndUpdate(collectionData.collectionId, {
            assignedTruck: route.truckId,
            status: 'scheduled',
            'routeOptimizationData.optimizedRoute': route.collections,
            'routeOptimizationData.totalDistance': route.totalDistance,
            'routeOptimizationData.estimatedFuelCost': route.fuelCost,
            'routeOptimizationData.trafficConditions': route.trafficConditions,
            'routeOptimizationData.weatherConditions': route.weatherConditions
          });
        }

        // Update truck status
        await Truck.findByIdAndUpdate(route.truckId, {
          status: 'on-route'
        });
      }

      res.json({
        message: 'Routes optimized successfully',
        optimizedRoutes,
        totalCollections: collections.length,
        trucksUsed: optimizedRoutes.length
      });

    } catch (error) {
      console.error('Error optimizing routes:', error);
      res.status(500).json({ error: 'Failed to optimize collection routes' });
    }
  }

  // Update collection status
  async updateCollectionStatus(req, res) {
    try {
      const { collectionId } = req.params;
      const { status, actualDuration } = req.body;

      const collection = await SpecialCollection.findById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }

      collection.status = status;
      if (actualDuration) {
        collection.actualDuration = actualDuration;
      }

      if (status === 'completed') {
        collection.routeOptimizationData.optimizedRoute.forEach(route => {
          if (route.collectionId.toString() === collectionId) {
            route.actualArrival = new Date();
          }
        });
      }

      await collection.save();

      // Emit real-time update
      this.io.emit('collection-status-updated', collection);

      res.json({
        message: 'Collection status updated successfully',
        collection
      });

    } catch (error) {
      console.error('Error updating collection status:', error);
      res.status(500).json({ error: 'Failed to update collection status' });
    }
  }

  // Get collection statistics
  async getCollectionStatistics(req, res) {
    try {
      const { period = 'month' } = req.query;
      
      const dateFilter = this.getDateFilter(period);
      
      const stats = await SpecialCollection.aggregate([
        {
          $match: {
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: '$wasteType',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            averageDuration: { $avg: '$actualDuration' }
          }
        }
      ]);

      const totalStats = await SpecialCollection.aggregate([
        {
          $match: {
            createdAt: dateFilter
          }
        },
        {
          $group: {
            _id: null,
            totalCollections: { $sum: 1 },
            completionRate: {
              $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            averageProcessingTime: { $avg: '$actualDuration' }
          }
        }
      ]);

      res.json({
        byWasteType: stats,
        overall: totalStats[0] || {}
      });

    } catch (error) {
      console.error('Error fetching collection statistics:', error);
      res.status(500).json({ error: 'Failed to fetch collection statistics' });
    }
  }

  getDateFilter(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    return { $gte: startDate };
  }
}

export default SpecialCollectionController;