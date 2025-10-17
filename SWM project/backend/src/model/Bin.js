import mongoose from 'mongoose';

const binSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['biodegradable', 'recyclable', 'non_biodegradable']
  },
  mixed: {
    type: Boolean,
    default: false
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['ok', 'segregation_required', 'maintenance_needed'],
    default: 'ok'
  },
  faultCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries (binId already has unique: true, so we don't need to index it again)
binSchema.index({ status: 1 });
binSchema.index({ lastSeenAt: 1 });

export default mongoose.model('Bin', binSchema);
