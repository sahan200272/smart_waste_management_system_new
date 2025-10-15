import mongoose from 'mongoose';

const residentNotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  binId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['level', 'segregation', 'maintenance']
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
residentNotificationSchema.index({ userId: 1 });
residentNotificationSchema.index({ binId: 1 });
residentNotificationSchema.index({ read: 1 });
residentNotificationSchema.index({ createdAt: -1 });

export default mongoose.model('ResidentNotification', residentNotificationSchema);
