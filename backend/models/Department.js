const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  services: [String],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  emergencyServices: {
    type: Boolean,
    default: false,
  },
  capacity: {
    total: Number,
    current: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
  },
  contactInfo: {
    phone: String,
    email: String,
    floor: String,
    building: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);
