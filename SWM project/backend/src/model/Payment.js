import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING']
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'PENDING'
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  receiptUrl: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  billId: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for payment status badge
paymentSchema.virtual('statusBadge').get(function() {
  const statusMap = {
    'SUCCESS': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
    'PENDING': 'bg-yellow-100 text-yellow-800'
  };
  return statusMap[this.status] || 'bg-gray-100 text-gray-800';
});

// Method to generate receipt URL
paymentSchema.methods.generateReceiptUrl = function() {
  if (this.status === 'SUCCESS') {
    this.receiptUrl = `/api/payments/receipt/${this.transactionId}`;
    return this.receiptUrl;
  }
  return null;
};

// Method to mark as successful
paymentSchema.methods.markAsSuccessful = function(gatewayResponse = null) {
  this.status = 'SUCCESS';
  this.paidAt = new Date();
  this.gatewayResponse = gatewayResponse;
  this.generateReceiptUrl();
  return this.save();
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = function(failureReason, gatewayResponse = null) {
  this.status = 'FAILED';
  this.failureReason = failureReason;
  this.gatewayResponse = gatewayResponse;
  return this.save();
};

// Static method to get user payment history
paymentSchema.statics.getUserPayments = function(userId, limit = 10, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get outstanding bills
paymentSchema.statics.getOutstandingBills = function(userId) {
  return this.find({ 
    userId, 
    status: { $in: ['PENDING', 'FAILED'] },
    dueDate: { $gte: new Date() }
  }).sort({ dueDate: 1 });
};

export default mongoose.model('Payment', paymentSchema);
