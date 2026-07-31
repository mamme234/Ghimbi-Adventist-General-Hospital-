const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const { sendEmail, sendSMS } = require('../services/notification');
const { validateAppointment } = require('../validators');

exports.createAppointment = async (req, res) => {
  try {
    const { patient, doctor, department, date, time, type, reason, ...appointmentData } = req.body;

    // Validate input
    const validation = validateAppointment(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Check doctor exists
    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Check doctor availability
    const existingAppointment = await Appointment.findOne({
      doctor,
      date,
      time,
      status: { $ne: 'cancelled' },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at this time',
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient,
      doctor,
      department,
      date,
      time,
      type,
      reason,
      ...appointmentData,
      createdBy: req.user._id,
    });

    await appointment.save();

    // Send notifications
    const patientUser = await User.findById(patientExists.user);
    const doctorUser = await User.findById(doctorExists.user);

    await sendSMS(
      patientUser.phone,
      `Appointment scheduled with Dr. ${doctorUser.lastName} on ${date} at ${time}`
    );

    await sendEmail(
      patientUser.email,
      'Appointment Confirmation',
      `Your appointment with Dr. ${doctorUser.lastName} has been scheduled for ${date} at ${time}`
    );

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message,
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, doctor, patient, department, dateFrom, dateTo } = req.query;

    const query = {};

    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (patient) query.patient = patient;
    if (department) query.department = department;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    // If user is doctor, only show their appointments
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (doctor) query.doctor = doctor._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'patientId user')
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone',
        },
      })
      .populate('doctor', 'specialization user')
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email phone',
        },
      })
      .populate('department', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, time: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
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
      message: 'Error fetching appointments',
      error: error.message,
    });
  }
};

exports.getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required',
      });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();

    // Get doctor schedule
    const doctor = await Doctor.findById(doctorId)
      .populate('schedule');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999)),
      },
      status: { $nin: ['cancelled'] },
    });

    // Generate available time slots
    const availableSlots = [];
    const schedule = doctor.schedule.find(s => s.day === dayOfWeek);

    if (schedule) {
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      const duration = doctor.appointmentDuration || 30;

      let currentTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      while (currentTime < endDateTime) {
        const timeString = currentTime.toTimeString().substring(0, 5);
        
        // Check if slot is available
        const isBooked = existingAppointments.some(app => 
          app.time === timeString
        );

        if (!isBooked) {
          availableSlots.push(timeString);
        }

        currentTime = new Date(currentTime.getTime() + duration * 60000);
      }
    }

    res.json({
      success: true,
      data: {
        date,
        dayOfWeek,
        availableSlots,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor availability',
      error: error.message,
    });
  }
};
