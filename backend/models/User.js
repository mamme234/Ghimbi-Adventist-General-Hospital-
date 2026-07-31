const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: [
      'super_admin', 'administrator', 'doctor', 'doctor_assistant',
      'nurse', 'receptionist', 'pharmacist', 'laboratory_technician',
      'radiologist', 'finance_officer', 'hr_staff', 'ambulance_staff',
      'patient'
    ],
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  profileImage: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  refreshToken: String,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  permissions: [String],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  hospitalBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HospitalBranch',
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'flexible'],
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  }],
  qualifications: [String],
  experience: Number,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
