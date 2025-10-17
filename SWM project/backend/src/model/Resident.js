/**
 * Resident Model
 * Represents a resident in the Smart Waste Management System
 * Integrates with existing Payment model
 */

import mongoose from 'mongoose';

const residentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contact: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  outstandingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'residents'
});

// Index for faster queries
residentSchema.index({ userId: 1 });
residentSchema.index({ email: 1 });

// Virtual for checking if bill is overdue
residentSchema.virtual('isOverdue').get(function() {
  return this.outstandingAmount > 0 && new Date() > this.dueDate;
});

// Method to update outstanding amount after payment
residentSchema.methods.updateOutstandingAmount = function(paidAmount) {
  this.outstandingAmount = Math.max(0, this.outstandingAmount - paidAmount);
  
  if (this.outstandingAmount === 0) {
    this.dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  return this.save();
};

// Static method to find resident by userId (compatible with existing Payment model)
residentSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

const Resident = mongoose.model('Resident', residentSchema);

export default Resident;