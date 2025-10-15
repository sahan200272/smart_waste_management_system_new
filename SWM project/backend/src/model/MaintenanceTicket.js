import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  binId: {
    type: String,
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['inconsistent_data', 'device_offline', 'mechanism_fault', 'manual_report']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'scheduled', 'done'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
maintenanceTicketSchema.index({ ticketId: 1 });
maintenanceTicketSchema.index({ binId: 1 });
maintenanceTicketSchema.index({ status: 1 });
maintenanceTicketSchema.index({ priority: 1 });

export default mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
