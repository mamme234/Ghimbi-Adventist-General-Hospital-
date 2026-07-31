const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const QRCode = require('qrcode');
const { uploadFile } = require('../upload');

exports.createPatient = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, ...patientData } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'patient',
      hospitalBranch: patientData.hospitalBranch,
    });
    await user.save();

    // Create patient
    const patient = new Patient({
      user: user._id,
      ...patientData,
    });
    await patient.save();

    // Generate QR code
    const qrData = JSON.stringify({
      patientId: patient.patientId,
      name: `${firstName} ${lastName}`,
      phone,
    });
    const qrCode = await QRCode.toDataURL(qrData);
    patient.qrCode = qrCode;
    await patient.save();

    res.status(201).json({
      success: true,
      data: patient,
      message: 'Patient registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message,
    });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(query)
      .populate('user', '-password -refreshToken')
      .populate('primaryPhysician', 'user specialization')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message,
    });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('user', '-password -refreshToken')
      .populate('primaryPhysician', 'user specialization')
      .populate('admissions')
      .populate({
        path: 'medicalHistory.doctor',
        select: 'user specialization',
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message,
    });
  }
};
