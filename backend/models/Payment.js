const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'bank_transfer', 'mobile_money', 'other'],
    required: true,
  },
  reference: {
    type: String,
    unique: true,
  },
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  receiptNumber: {
    type: String,
    unique: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: String,
  refundDate: Date,
  refundReason: String,
  metadata: {
    cardType: String,
    cardLastFour: String,
    bankName: String,
    accountNumber: String,
    mobileProvider: String,
    transactionReference: String,
  },
}, {
  timestamps: true,
});

// Generate receipt number
paymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNumber = `RCP-${String(count + 1).padStart(6, '0')}`;
  }
  if (!this.reference) {
    this.reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
