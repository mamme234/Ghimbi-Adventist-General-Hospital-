const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  items: [{
    description: {
      type: String,
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['consultation', 'procedure', 'laboratory', 'radiology', 'pharmacy', 'admission', 'surgery', 'other'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
  },
  insuranceCoverage: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'bank_transfer', 'mobile_money', 'other'],
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  }],
  insuranceClaim: {
    claimNumber: String,
    insuranceProvider: String,
    claimAmount: Number,
    approvedAmount: Number,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'partial'],
    },
    submittedDate: Date,
    approvedDate: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
invoiceSchema.index({ patient: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ date: -1 });

// Pre-save hook to calculate totals
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate total with tax and discount
  let total = this.subtotal + this.tax - this.discount;
  if (this.discountType === 'percentage') {
    total = this.subtotal + this.tax - (this.subtotal * this.discount / 100);
  }
  
  // Apply insurance coverage
  total = total - this.insuranceCoverage;
  
  this.totalAmount = Math.round(total * 100) / 100;
  next();
});

// Virtual for remaining balance
invoiceSchema.virtual('remainingBalance').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Method to check if overdue
invoiceSchema.methods.isOverdue = function() {
  return this.status === 'pending' && new Date() > this.dueDate;
};

module.exports = mongoose.model('Invoice', invoiceSchema);
