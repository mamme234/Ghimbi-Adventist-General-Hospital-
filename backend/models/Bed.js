const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  ward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
  },
  bedNumber: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['regular', 'icu', 'ccu', 'nicu', 'pediatric', 'maternity', 'isolation', 'recovery'],
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning'],
    default: 'available',
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  },
  admissionDate: Date,
  expectedDischargeDate: Date,
  features: [String],
  equipment: [String],
  monitoringDevices: [String],
  notes: String,
  isIsolation: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Ensure unique bed numbers within a ward
bedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
