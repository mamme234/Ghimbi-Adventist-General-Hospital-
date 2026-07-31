// backend/models/Doctor.js
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  hospitalBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HospitalBranch',
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
  }],
  experience: {
    type: Number,
    default: 0,
  },
  licenseNumber: {
    type: String,
    unique: true,
  },
  consultationFee: {
    type: Number,
    default: 0,
  },
  availability: {
    type: String,
    enum: ['available', 'unavailable', 'on_leave'],
    default: 'available',
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: String,
    endTime: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  patients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ licenseNumber: 1 }, { unique: true });
doctorSchema.index({ 'user.firstName': 1, 'user.lastName': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
