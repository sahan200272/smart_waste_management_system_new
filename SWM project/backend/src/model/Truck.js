import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema({
  truckId: {
    type: String,
    required: true,
    unique: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentLoad: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['available', 'on-route', 'maintenance', 'offline'],
    default: 'available'
  },
  currentLocation: {
    lat: Number,
    lng: Number
  },
  assignedDriver: String,
  specialWasteTypes: [{
    type: String,
    enum: ['hazardous', 'bulk', 'electronic', 'construction', 'other']
  }],
  lastMaintenance: Date,
  nextMaintenance: Date
}, {
  timestamps: true
});

export default mongoose.model('Truck', truckSchema);