// backend/controllers/doctorController.js
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Get all doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', '-password -refreshToken')
      .populate('department', 'name');
    
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', '-password -refreshToken')
      .populate('department', 'name');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create doctor
exports.createDoctor = async (req, res) => {
  try {
    const { email, firstName, lastName, phone, ...doctorData } = req.body;
    
    // Create user first
    const user = new User({
      email,
      firstName,
      lastName,
      phone,
      role: 'doctor',
    });
    await user.save();
    
    // Create doctor
    const doctor = new Doctor({
      ...doctorData,
      user: user._id,
    });
    await doctor.save();
    
    res.status(201).json({
      success: true,
      data: doctor,
      message: 'Doctor created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update doctor
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', '-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.json({
      success: true,
      data: doctor,
      message: 'Doctor updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete doctor
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Also delete the user
    await User.findByIdAndDelete(doctor.user);
    
    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
