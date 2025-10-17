/**
 * @fileoverview Collection Task Model
 * Represents a waste collection task assigned to field workers
 */

import mongoose from 'mongoose';

const collectionTaskSchema = new mongoose.Schema({
  taskNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^CT-\d{4}-\d{6}$/
  },
  
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    required: true
  },
  
  assignedTo: {
    type: String, // User ID from auth system
    required: true,
    index: true
  },
  
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  status: {
    type: String,
    enum: ['Pending', 'InProgress', 'Completed', 'Skipped', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  
  route: {
    routeId: String,
    sequence: Number,
    estimatedDuration: Number // minutes
  },
  
  // Task completion data
  startTime: Date,
  endTime: Date,
  actualDuration: Number, // calculated field
  
  // Skip/cancellation reasons
  skipReasons: [{
    type: String,
    enum: ['Blocked', 'Inaccessible', 'Bin Missing', 'Safety Concern', 'Weather', 'Other']
  }],
  
  notes: String,
  
  // Status history for audit trail
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: String,
    reason: String
  }],
  
  // GPS tracking data
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    accuracy: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
collectionTaskSchema.index({ assignedTo: 1, scheduledDate: 1 });
collectionTaskSchema.index({ status: 1, priority: 1 });
collectionTaskSchema.index({ 'route.routeId': 1, 'route.sequence': 1 });

// Pre-save middleware to generate task number
collectionTaskSchema.pre('save', function(next) {
  if (this.isNew && !this.taskNumber) {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 900000) + 100000;
    this.taskNumber = `CT-${year}-${sequence}`;
  }
  next();
});

// Pre-save middleware to update status history
collectionTaskSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.modifiedBy || 'system'
    });
  }
  next();
});

// Instance methods
collectionTaskSchema.methods.markStarted = function(userId, location) {
  this.status = 'InProgress';
  this.startTime = new Date();
  this.modifiedBy = userId;
  if (location) {
    this.location = location;
  }
  return this.save();
};

collectionTaskSchema.methods.markCompleted = function(userId, notes) {
  this.status = 'Completed';
  this.endTime = new Date();
  this.modifiedBy = userId;
  if (notes) this.notes = notes;
  return this.save();
};

collectionTaskSchema.methods.markSkipped = function(userId, reasons, notes) {
  this.status = 'Skipped';
  this.endTime = new Date();
  this.skipReasons = reasons;
  this.notes = notes;
  this.modifiedBy = userId;
  return this.save();
};

// Static methods
collectionTaskSchema.statics.findByCollector = function(collectorId, options = {}) {
  const query = { assignedTo: collectorId };
  
  if (options.status) {
    query.status = Array.isArray(options.status) ? { $in: options.status } : options.status;
  }
  
  if (options.date) {
    query.scheduledDate = {
      $gte: new Date(options.date.setHours(0, 0, 0, 0)),
      $lt: new Date(options.date.setHours(23, 59, 59, 999))
    };
  }
  
  return this.find(query)
    .populate('binId')
    .sort({ 'route.sequence': 1, scheduledDate: 1 });
};

collectionTaskSchema.statics.getCollectorStats = function(collectorId, dateRange) {
  const matchStage = { assignedTo: collectorId };
  
  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: '$actualDuration' }
      }
    }
  ]);
};

const CollectionTask = mongoose.model('CollectionTask', collectionTaskSchema);

export default CollectionTask;