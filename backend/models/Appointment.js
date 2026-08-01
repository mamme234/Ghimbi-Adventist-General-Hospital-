// ========== APPOINTMENT MODEL ==========
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: 30 // minutes
    },
    type: {
        type: String,
        enum: ['in-person', 'telemedicine', 'follow-up'],
        default: 'in-person'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    reason: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    symptoms: [{
        type: String
    }],
    vitals: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        weight: Number,
        height: Number,
        bmi: Number
    },
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
    },
    followUpDate: {
        type: Date
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderDate: {
        type: Date
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
AppointmentSchema.index({ appointmentId: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ date: 1, time: 1 });

// ========== STATIC METHODS ==========
AppointmentSchema.statics.getDoctorSchedule = function(doctorId, date) {
    return this.find({
        doctorId,
        date: {
            $gte: new Date(date.setHours(0, 0, 0, 0)),
            $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: { $nin: ['cancelled', 'no-show'] }
    }).sort({ time: 1 });
};

AppointmentSchema.statics.getPatientAppointments = function(patientId) {
    return this.find({ patientId })
        .populate('doctorId', 'name specialization')
        .sort({ date: -1 });
};

module.exports = mongoose.model('Appointment', AppointmentSchema);
