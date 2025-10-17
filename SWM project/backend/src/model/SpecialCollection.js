import mongoose from 'mongoose';

const specialCollectionSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true
  },
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    required: true
  },
  wasteType: {
    type: String,
    enum: ['hazardous', 'bulk', 'electronic', 'construction', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTruck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck'
  },
  estimatedDuration: Number,
  actualDuration: Number,
  routeOptimizationData: {
    optimizedRoute: [{
      sequence: Number,
      binId: mongoose.Schema.Types.ObjectId,
      estimatedArrival: Date,
      actualArrival: Date
    }],
    totalDistance: Number,
    estimatedFuelCost: Number,
    trafficConditions: String,
    weatherConditions: String
  },
  specialInstructions: String,
  images: [String]
}, {
  timestamps: true
});

// Index for efficient queries
specialCollectionSchema.index({ scheduledDate: 1, status: 1 });
specialCollectionSchema.index({ residentId: 1, createdAt: -1 });

export default mongoose.model('SpecialCollection', specialCollectionSchema);