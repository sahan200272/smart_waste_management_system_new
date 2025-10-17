/**
 * @fileoverview Collection Event Model
 * Tracks individual collection operations and measurements
 */

import mongoose from 'mongoose';

const collectionEventSchema = new mongoose.Schema({
  eventNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^CE-\d{4}-\d{6}$/
  },
  
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollectionTask',
    required: true,
    index: true
  },
  
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    required: true,
    index: true
  },
  
  collectorId: {
    type: String,
    required: true,
    index: true
  },
  
  // Event timing
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endTime: Date,
  
  status: {
    type: String,
    enum: ['InProgress', 'Completed', 'Abandoned'],
    default: 'InProgress',
    index: true
  },
  
  // Collection measurements
  measured: {
    weightKg: {
      type: Number,
      min: 0,
      max: 1000
    },
    fillPct: {
      type: Number,
      min: 0,
      max: 100
    },
    wasteType: {
      type: String,
      enum: ['General', 'Recyclable', 'Organic', 'Hazardous', 'Mixed']
    },
    photos: [String], // Photo URLs/paths
    notes: String
  },
  
  // Location data
  gpsData: {
    start: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      accuracy: Number,
      timestamp: { type: Date, default: Date.now }
    },
    end: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: Date
    }
  },
  
  // Collection irregularities
  irregularity: {
    type: {
      type: String,
      enum: ['SegregationIssue', 'ContainerDamage', 'OverflowSpillage', 'ContaminatedWaste', 'Other']
    },
    description: String,
    severity: {
      type: String,
      enum: ['Minor', 'Moderate', 'Severe'],
      default: 'Minor'
    },
    photos: [String],
    notes: String
  },
  
  // Action timeline for audit
  timeline: [{
    action: {
      type: String,
      enum: ['START', 'SCAN', 'MEASURE', 'PHOTO', 'COMPLETE', 'ABANDON'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed,
    notes: String
  }],
  
  // Quality metrics
  quality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100
    },
    timeliness: {
      type: Number,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
collectionEventSchema.index({ collectorId: 1, startTime: -1 });
collectionEventSchema.index({ status: 1, createdAt: -1 });
collectionEventSchema.index({ binId: 1, startTime: -1 });
collectionEventSchema.index({ 'gpsData.start': '2dsphere' });

// Virtual for duration calculation
collectionEventSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for completion percentage
collectionEventSchema.virtual('completionPct').get(function() {
  let score = 0;
  let total = 4;
  
  if (this.measured?.weightKg !== undefined) score++;
  if (this.measured?.fillPct !== undefined) score++;
  if (this.measured?.wasteType) score++;
  if (this.status === 'Completed') score++;
  
  return Math.round((score / total) * 100);
});

// Pre-save middleware to generate event number
collectionEventSchema.pre('save', function(next) {
  if (this.isNew && !this.eventNumber) {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 900000) + 100000;
    this.eventNumber = `CE-${year}-${sequence}`;
  }
  next();
});

// Pre-save middleware to add timeline entries
collectionEventSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      action: 'START',
      timestamp: this.startTime,
      data: { gps: this.gpsData.start }
    });
  }
  next();
});

// Instance methods
collectionEventSchema.methods.addTimelineAction = function(action, data, notes) {
  this.timeline.push({
    action,
    timestamp: new Date(),
    data,
    notes
  });
  return this.save();
};

collectionEventSchema.methods.recordMeasurement = function(measurementData) {
  this.measured = {
    ...this.measured,
    ...measurementData
  };
  
  return this.addTimelineAction('MEASURE', measurementData);
};

collectionEventSchema.methods.complete = function(endGps, notes) {
  this.status = 'Completed';
  this.endTime = new Date();
  
  if (endGps) {
    this.gpsData.end = {
      ...endGps,
      timestamp: new Date()
    };
  }
  
  return this.addTimelineAction('COMPLETE', { endGps }, notes);
};

collectionEventSchema.methods.abandon = function(reason, notes) {
  this.status = 'Abandoned';
  this.endTime = new Date();
  
  return this.addTimelineAction('ABANDON', { reason }, notes);
};

// Static methods
collectionEventSchema.statics.getCollectionStats = function(collectorId, dateRange) {
  const matchStage = { 
    collectorId,
    status: 'Completed'
  };
  
  if (dateRange) {
    matchStage.startTime = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCollections: { $sum: 1 },
        totalWeight: { $sum: '$measured.weightKg' },
        avgFillPct: { $avg: '$measured.fillPct' },
        avgDuration: { $avg: { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000] } },
        byWasteType: {
          $push: {
            type: '$measured.wasteType',
            weight: '$measured.weightKg'
          }
        }
      }
    },
    {
      $project: {
        totalCollections: 1,
        totalWeight: { $round: ['$totalWeight', 2] },
        avgFillPct: { $round: ['$avgFillPct', 1] },
        avgDuration: { $round: ['$avgDuration', 1] },
        byWasteType: {
          $reduce: {
            input: '$byWasteType',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[{
                    k: '$$this.type',
                    v: { 
                      count: { $add: [{ $ifNull: [{ $getField: { field: '$$this.type', input: '$$value' } }, 0] }, 1] },
                      totalWeight: { $add: [{ $ifNull: [{ $getField: { field: { $concat: ['$$this.type', '.totalWeight'] }, input: '$$value' } }, 0] }, '$$this.weight'] }
                    }
                  }]]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

const CollectionEvent = mongoose.model('CollectionEvent', collectionEventSchema);

export default CollectionEvent;