const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');
const { uploadFile } = require('../services/upload');

exports.createDoctor = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, specialization, ...doctorData } = req.body;

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
      role: 'doctor',
      hospitalBranch: doctorData.hospitalBranch,
    });
    await user.save();

    // Create doctor
    const doctor = new Doctor({
      user: user._id,
      specialization,
      ...doctorData,
    });
    await doctor.save();

    res.status(201).json({
      success: true,
      data: doctor,
      message: 'Doctor registered successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message,
    });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { specialization, department, status, search } = req.query;

    const query = {};
    if (specialization) query.specialization = specialization;
    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await Doctor.find(query)
      .populate('user', '-password -refreshToken')
      .populate('department', 'name')
      .populate('hospitalBranch', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ 'user.firstName': 1 });

    const total = await Doctor.countDocuments(query);

    res.json({
      success: true,
      data: doctors,
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
      message: 'Error fetching doctors',
      error: error.message,
    });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', '-password -refreshToken')
      .populate('department', 'name')
      .populate('hospitalBranch', 'name')
      .populate('patients', 'patientId user')
      .populate({
        path: 'patients',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone',
        },
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor',
      error: error.message,
    });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', '-password -refreshToken');

    res.json({
      success: true,
      data: updatedDoctor,
      message: 'Doctor updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message,
    });
  }
};

exports.getDoctorPatients = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const patients = await Patient.find({
      primaryPhysician: doctor._id,
    })
      .populate('user', 'firstName lastName email phone')
      .populate('admissions')
      .sort({ 'user.lastName': 1 });

    res.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor patients',
      error: error.message,
    });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('schedule');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Get appointments for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $nin: ['cancelled', 'completed'] },
    }).populate('patient', 'patientId user');

    // Format schedule with appointments
    const schedule = doctor.schedule.map(day => {
      const dayAppointments = appointments.filter(
        app => app.date.getDay() === day.day
      );
      
      return {
        ...day.toObject(),
        appointments: dayAppointments,
      };
    });

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor schedule',
      error: error.message,
    });
  }
};

exports.updateDoctorSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    doctor.schedule = schedule;
    await doctor.save();

    res.json({
      success: true,
      data: doctor.schedule,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating doctor schedule',
      error: error.message,
    });
  }
};

exports.getDoctorStatistics = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    const [totalPatients, totalAppointments, completedAppointments, prescriptions, averageRating] = await Promise.all([
      Patient.countDocuments({ primaryPhysician: doctorId }),
      Appointment.countDocuments({ doctor: doctorId }),
      Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
      Prescription.countDocuments({ doctor: doctorId }),
      Doctor.findById(doctorId).select('averageRating'),
    ]);

    // Get monthly appointment trends
    const monthlyTrends = await Appointment.aggregate([
      {
        $match: {
          doctor: mongoose.Types.ObjectId(doctorId),
          date: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        totalAppointments,
        completedAppointments,
        pendingAppointments: totalAppointments - completedAppointments,
        totalPrescriptions: prescriptions,
        averageRating: averageRating?.averageRating || 0,
        monthlyTrends,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor statistics',
      error: error.message,
    });
  }
};
