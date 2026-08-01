// ========== CONTROLLERS ==========
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const bwip = require('bwip-js');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// Models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Department = require('./models/Department');
const MedicalRecord = require('./models/MedicalRecord');
const Prescription = require('./models/Prescription');
const Medicine = require('./models/Medicine');
const Payment = require('./models/Payment');
const Insurance = require('./models/Insurance');
const Laboratory = require('./models/Laboratory');
const Radiology = require('./models/Radiology');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');

// ========== AUTH CONTROLLERS ==========
const authController = {
    // Register
    register: async (req, res) => {
        try {
            const { email, password, name, role, phone } = req.body;
            
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }
            
            const hashedPassword = await bcrypt.hash(password, 12);
            
            const user = new User({
                email,
                password: hashedPassword,
                name,
                role: role || 'patient',
                phone,
                isActive: true
            });
            
            await user.save();
            
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );
            
            user.refreshToken = refreshToken;
            await user.save();
            
            // Create patient profile if role is patient
            if (role === 'patient') {
                const patient = new Patient({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                });
                await patient.save();
            }
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: error.message
            });
        }
    },
    
    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }
            
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );
            
            user.refreshToken = refreshToken;
            user.lastLogin = new Date();
            await user.save();
            
            // Log login
            await AuditLog.create({
                userId: user._id,
                action: 'LOGIN',
                details: `User ${user.email} logged in`,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });
            
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        department: user.department
                    },
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: error.message
            });
        }
    },
    
    // Refresh Token
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }
            
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }
            
            const newToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            
            res.json({
                success: true,
                data: { token: newToken }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    },
    
    // Logout
    logout: async (req, res) => {
        try {
            const user = await User.findById(req.userId);
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    },
    
    // Forgot Password
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const resetToken = crypto.randomBytes(32).toString('hex');
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            await user.save();
            
            // Send email with reset link
            const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
            
            // Email logic here...
            
            res.json({
                success: true,
                message: 'Password reset email sent',
                resetToken // Remove in production
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to send reset email'
            });
        }
    },
    
    // Reset Password
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });
            
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }
            
            user.password = await bcrypt.hash(newPassword, 12);
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            
            res.json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Password reset failed'
            });
        }
    }
};

// ========== PATIENT CONTROLLERS ==========
const patientController = {
    // Get all patients
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }
            
            const patients = await Patient.find(query)
                .populate('userId', 'name email role')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });
            
            const total = await Patient.countDocuments(query);
            
            res.json({
                success: true,
                data: patients,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patients',
                error: error.message
            });
        }
    },
    
    // Get single patient
    getOne: async (req, res) => {
        try {
            const patient = await Patient.findById(req.params.id)
                .populate('userId', 'name email role phone')
                .populate('medicalRecords')
                .populate('appointments');
            
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
            
            res.json({
                success: true,
                data: patient
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patient',
                error: error.message
            });
        }
    },
    
    // Create patient
    create: async (req, res) => {
        try {
            const patientData = req.body;
            
            // Check if patient already exists
            const existing = await Patient.findOne({ email: patientData.email });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient already exists with this email'
                });
            }
            
            // Generate patient ID
            patientData.patientId = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const patient = new Patient(patientData);
            await patient.save();
            
            // Generate QR code
            const qrData = JSON.stringify({
                patientId: patient.patientId,
                name: patient.name,
                email: patient.email
            });
            const qrCode = await QRCode.toDataURL(qrData);
            patient.qrCode = qrCode;
            await patient.save();
            
            res.status(201).json({
                success: true,
                message: 'Patient created successfully',
                data: patient
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create patient',
                error: error.message
            });
        }
    },
    
    // Update patient
    update: async (req, res) => {
        try {
            const patient = await Patient.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Patient updated successfully',
                data: patient
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update patient',
                error: error.message
            });
        }
    },
    
    // Delete patient
    delete: async (req, res) => {
        try {
            const patient = await Patient.findByIdAndDelete(req.params.id);
            
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
            
            // Also delete associated user if exists
            if (patient.userId) {
                await User.findByIdAndDelete(patient.userId);
            }
            
            res.json({
                success: true,
                message: 'Patient deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete patient',
                error: error.message
            });
        }
    },
    
    // Get patient by ID
    getByPatientId: async (req, res) => {
        try {
            const patient = await Patient.findOne({ patientId: req.params.patientId });
            
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
            
            res.json({
                success: true,
                data: patient
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patient',
                error: error.message
            });
        }
    },
    
    // Get patient appointments
    getAppointments: async (req, res) => {
        try {
            const appointments = await Appointment.find({ patientId: req.params.id })
                .populate('doctorId', 'name specialization')
                .populate('departmentId', 'name')
                .sort({ date: -1 });
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch appointments',
                error: error.message
            });
        }
    },
    
    // Get patient medical records
    getMedicalRecords: async (req, res) => {
        try {
            const records = await MedicalRecord.find({ patientId: req.params.id })
                .populate('doctorId', 'name specialization')
                .sort({ date: -1 });
            
            res.json({
                success: true,
                data: records
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medical records',
                error: error.message
            });
        }
    },
    
    // Generate patient QR code
    generateQR: async (req, res) => {
        try {
            const patient = await Patient.findById(req.params.id);
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
            
            const qrData = JSON.stringify({
                patientId: patient.patientId,
                name: patient.name,
                email: patient.email,
                phone: patient.phone
            });
            
            const qrCode = await QRCode.toDataURL(qrData);
            
            res.json({
                success: true,
                data: { qrCode }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to generate QR code',
                error: error.message
            });
        }
    }
};

// ========== APPOINTMENT CONTROLLERS ==========
const appointmentController = {
    // Get all appointments
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10, status, date } = req.query;
            const query = {};
            
            if (status) query.status = status;
            if (date) query.date = { $gte: new Date(date) };
            
            const appointments = await Appointment.find(query)
                .populate('patientId', 'name email phone')
                .populate('doctorId', 'name specialization')
                .populate('departmentId', 'name')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ date: 1, time: 1 });
            
            const total = await Appointment.countDocuments(query);
            
            res.json({
                success: true,
                data: appointments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch appointments',
                error: error.message
            });
        }
    },
    
    // Get single appointment
    getOne: async (req, res) => {
        try {
            const appointment = await Appointment.findById(req.params.id)
                .populate('patientId', 'name email phone patientId')
                .populate('doctorId', 'name specialization')
                .populate('departmentId', 'name');
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            
            res.json({
                success: true,
                data: appointment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch appointment',
                error: error.message
            });
        }
    },
    
    // Create appointment
    create: async (req, res) => {
        try {
            const appointmentData = req.body;
            
            // Check availability
            const existing = await Appointment.findOne({
                doctorId: appointmentData.doctorId,
                date: appointmentData.date,
                time: appointmentData.time,
                status: { $ne: 'cancelled' }
            });
            
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'This time slot is already booked'
                });
            }
            
            // Generate appointment ID
            appointmentData.appointmentId = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const appointment = new Appointment(appointmentData);
            await appointment.save();
            
            // Create notification
            await Notification.create({
                userId: appointmentData.patientId,
                title: 'Appointment Confirmed',
                message: `Your appointment with Dr. ${appointmentData.doctorId} is confirmed for ${appointmentData.date}`,
                type: 'appointment',
                relatedId: appointment._id
            });
            
            res.status(201).json({
                success: true,
                message: 'Appointment created successfully',
                data: appointment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create appointment',
                error: error.message
            });
        }
    },
    
    // Update appointment
    update: async (req, res) => {
        try {
            const appointment = await Appointment.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            
            // Create notification for status change
            if (req.body.status) {
                await Notification.create({
                    userId: appointment.patientId,
                    title: `Appointment ${req.body.status}`,
                    message: `Your appointment status has been updated to ${req.body.status}`,
                    type: 'appointment',
                    relatedId: appointment._id
                });
            }
            
            res.json({
                success: true,
                message: 'Appointment updated successfully',
                data: appointment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update appointment',
                error: error.message
            });
        }
    },
    
    // Cancel appointment
    cancel: async (req, res) => {
        try {
            const appointment = await Appointment.findByIdAndUpdate(
                req.params.id,
                { status: 'cancelled' },
                { new: true }
            );
            
            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: 'Appointment not found'
                });
            }
            
            await Notification.create({
                userId: appointment.patientId,
                title: 'Appointment Cancelled',
                message: 'Your appointment has been cancelled',
                type: 'appointment',
                relatedId: appointment._id
            });
            
            res.json({
                success: true,
                message: 'Appointment cancelled successfully',
                data: appointment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to cancel appointment',
                error: error.message
            });
        }
    },
    
    // Get doctor appointments
    getDoctorAppointments: async (req, res) => {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;
            
            const query = { doctorId };
            if (date) query.date = new Date(date);
            
            const appointments = await Appointment.find(query)
                .populate('patientId', 'name email phone')
                .sort({ time: 1 });
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch doctor appointments',
                error: error.message
            });
        }
    },
    
    // Get patient appointments
    getPatientAppointments: async (req, res) => {
        try {
            const { patientId } = req.params;
            
            const appointments = await Appointment.find({ patientId })
                .populate('doctorId', 'name specialization')
                .populate('departmentId', 'name')
                .sort({ date: -1 });
            
            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patient appointments',
                error: error.message
            });
        }
    }
};

// ========== DEPARTMENT CONTROLLERS ==========
const departmentController = {
    // Get all departments
    getAll: async (req, res) => {
        try {
            const departments = await Department.find()
                .populate('head', 'name email')
                .sort({ name: 1 });
            
            res.json({
                success: true,
                data: departments
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch departments',
                error: error.message
            });
        }
    },
    
    // Get single department
    getOne: async (req, res) => {
        try {
            const department = await Department.findById(req.params.id)
                .populate('head', 'name email phone')
                .populate('doctors', 'name specialization');
            
            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }
            
            res.json({
                success: true,
                data: department
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch department',
                error: error.message
            });
        }
    },
    
    // Create department
    create: async (req, res) => {
        try {
            const department = new Department(req.body);
            await department.save();
            
            res.status(201).json({
                success: true,
                message: 'Department created successfully',
                data: department
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create department',
                error: error.message
            });
        }
    },
    
    // Update department
    update: async (req, res) => {
        try {
            const department = await Department.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Department updated successfully',
                data: department
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update department',
                error: error.message
            });
        }
    },
    
    // Delete department
    delete: async (req, res) => {
        try {
            const department = await Department.findByIdAndDelete(req.params.id);
            
            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Department deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete department',
                error: error.message
            });
        }
    }
};

// ========== PHARMACY CONTROLLERS ==========
const pharmacyController = {
    // Get all medicines
    getAllMedicines: async (req, res) => {
        try {
            const { page = 1, limit = 20, search, category } = req.query;
            const query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } }
                ];
            }
            if (category) query.category = category;
            
            const medicines = await Medicine.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ name: 1 });
            
            const total = await Medicine.countDocuments(query);
            
            res.json({
                success: true,
                data: medicines,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medicines',
                error: error.message
            });
        }
    },
    
    // Get single medicine
    getMedicine: async (req, res) => {
        try {
            const medicine = await Medicine.findById(req.params.id);
            
            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicine not found'
                });
            }
            
            res.json({
                success: true,
                data: medicine
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch medicine',
                error: error.message
            });
        }
    },
    
    // Create medicine
    createMedicine: async (req, res) => {
        try {
            const medicine = new Medicine(req.body);
            await medicine.save();
            
            res.status(201).json({
                success: true,
                message: 'Medicine created successfully',
                data: medicine
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create medicine',
                error: error.message
            });
        }
    },
    
    // Update medicine
    updateMedicine: async (req, res) => {
        try {
            const medicine = await Medicine.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicine not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Medicine updated successfully',
                data: medicine
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update medicine',
                error: error.message
            });
        }
    },
    
    // Delete medicine
    deleteMedicine: async (req, res) => {
        try {
            const medicine = await Medicine.findByIdAndDelete(req.params.id);
            
            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicine not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Medicine deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete medicine',
                error: error.message
            });
        }
    },
    
    // Check stock
    checkStock: async (req, res) => {
        try {
            const medicines = await Medicine.find({ stock: { $lt: 10 } })
                .select('name brand stock');
            
            res.json({
                success: true,
                data: medicines,
                lowStockCount: medicines.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check stock',
                error: error.message
            });
        }
    },
    
    // Update stock
    updateStock: async (req, res) => {
        try {
            const { quantity, operation } = req.body;
            
            const medicine = await Medicine.findById(req.params.id);
            if (!medicine) {
                return res.status(404).json({
                    success: false,
                    message: 'Medicine not found'
                });
            }
            
            if (operation === 'add') {
                medicine.stock += quantity;
            } else if (operation === 'subtract') {
                if (medicine.stock < quantity) {
                    return res.status(400).json({
                        success: false,
                        message: 'Insufficient stock'
                    });
                }
                medicine.stock -= quantity;
            }
            
            await medicine.save();
            
            res.json({
                success: true,
                message: 'Stock updated successfully',
                data: medicine
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update stock',
                error: error.message
            });
        }
    }
};

// ========== PAYMENT CONTROLLERS ==========
const paymentController = {
    // Get all payments
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10, status, patientId } = req.query;
            const query = {};
            
            if (status) query.status = status;
            if (patientId) query.patientId = patientId;
            
            const payments = await Payment.find(query)
                .populate('patientId', 'name email patientId')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });
            
            const total = await Payment.countDocuments(query);
            
            res.json({
                success: true,
                data: payments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payments',
                error: error.message
            });
        }
    },
    
    // Get single payment
    getOne: async (req, res) => {
        try {
            const payment = await Payment.findById(req.params.id)
                .populate('patientId', 'name email phone');
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            
            res.json({
                success: true,
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment',
                error: error.message
            });
        }
    },
    
    // Create payment
    create: async (req, res) => {
        try {
            const paymentData = req.body;
            paymentData.paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const payment = new Payment(paymentData);
            await payment.save();
            
            res.status(201).json({
                success: true,
                message: 'Payment created successfully',
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create payment',
                error: error.message
            });
        }
    },
    
    // Update payment
    update: async (req, res) => {
        try {
            const payment = await Payment.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Payment updated successfully',
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update payment',
                error: error.message
            });
        }
    },
    
    // Process payment
    process: async (req, res) => {
        try {
            const { paymentId, amount, method } = req.body;
            
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }
            
            // Process payment logic here (e.g., integrate with payment gateway)
            
            payment.status = 'completed';
            payment.paymentMethod = method;
            payment.processedAt = new Date();
            await payment.save();
            
            res.json({
                success: true,
                message: 'Payment processed successfully',
                data: payment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to process payment',
                error: error.message
            });
        }
    }
};

// ========== DASHBOARD CONTROLLER ==========
const dashboardController = {
    // Get dashboard stats
    getStats: async (req, res) => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const [
                totalPatients,
                totalDoctors,
                totalAppointments,
                todayAppointments,
                pendingAppointments,
                totalRevenue
            ] = await Promise.all([
                Patient.countDocuments(),
                Doctor.countDocuments(),
                Appointment.countDocuments(),
                Appointment.countDocuments({ date: { $gte: today } }),
                Appointment.countDocuments({ status: 'pending' }),
                Payment.aggregate([
                    { $match: { status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ])
            ]);
            
            res.json({
                success: true,
                data: {
                    totalPatients,
                    totalDoctors,
                    totalAppointments,
                    todayAppointments,
                    pendingAppointments,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    recentAppointments: await Appointment.find()
                        .populate('patientId', 'name')
                        .populate('doctorId', 'name')
                        .sort({ createdAt: -1 })
                        .limit(10)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
                error: error.message
            });
        }
    },
    
    // Get patient statistics
    getPatientStats: async (req, res) => {
        try {
            const stats = await Patient.aggregate([
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch patient stats',
                error: error.message
            });
        }
    }
};

// ========== NOTIFICATION CONTROLLER ==========
const notificationController = {
    // Get user notifications
    getUserNotifications: async (req, res) => {
        try {
            const notifications = await Notification.find({
                userId: req.userId
            }).sort({ createdAt: -1 });
            
            const unreadCount = await Notification.countDocuments({
                userId: req.userId,
                isRead: false
            });
            
            res.json({
                success: true,
                data: notifications,
                unreadCount
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message
            });
        }
    },
    
    // Mark as read
    markAsRead: async (req, res) => {
        try {
            const notification = await Notification.findByIdAndUpdate(
                req.params.id,
                { isRead: true },
                { new: true }
            );
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    },
    
    // Mark all as read
    markAllAsRead: async (req, res) => {
        try {
            await Notification.updateMany(
                { userId: req.userId, isRead: false },
                { isRead: true }
            );
            
            res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to mark all as read',
                error: error.message
            });
        }
    },
    
    // Delete notification
    delete: async (req, res) => {
        try {
            const notification = await Notification.findByIdAndDelete(req.params.id);
            
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }
            
            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    }
};

module.exports = {
    authController,
    patientController,
    appointmentController,
    departmentController,
    pharmacyController,
    paymentController,
    dashboardController,
    notificationController
};
