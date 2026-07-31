const mongoose = require('mongoose');

const laboratoryRequestSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  tests: [{
    name: {
      type: String,
      required: true,
    },
    code: String,
    category: {
      type: String,
      enum: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'pathology', 'genetics', 'other'],
      required: true,
    },
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine',
    },
    notes: String,
  }],
  clinicalNotes: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },
  sampleType: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'sputum', 'csf', 'tissue', 'swab', 'other'],
  },
  sampleCollectionDate: Date,
  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sampleReceivedDate: Date,
  sampleReceivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  results: [{
    test: String,
    result: String,
    referenceRange: String,
    unit: String,
    abnormal: Boolean,
    remarks: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedDate: Date,
  reportUrl: String,
  qrCode: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
laboratoryRequestSchema.index({ patient: 1, status: 1 });
laboratoryRequestSchema.index({ doctor: 1 });
laboratoryRequestSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('LaboratoryRequest', laboratoryRequestSchema);
