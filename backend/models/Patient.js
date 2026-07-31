const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: String,
    unique: true,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  allergies: [String],
  chronicConditions: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
  },
  insuranceProvider: String,
  insuranceNumber: String,
  primaryPhysician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  qrCode: String,
  medicalHistory: [{
    date: Date,
    condition: String,
    treatment: String,
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    notes: String,
  }],
  admissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased', 'transferred'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Generate patient ID
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
