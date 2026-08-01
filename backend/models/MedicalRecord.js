// ========== MEDICAL RECORD MODEL ==========
const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
    recordId: {
        type: String,
        required: true,
        unique: true
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['consultation', 'emergency', 'surgery', 'routine', 'follow-up'],
        required: true
    },
    chiefComplaint: {
        type: String,
        required: true
    },
    history: {
        type: String
    },
    examination: {
        type: String
    },
    diagnosis: {
        type: String,
        required: true
    },
    treatmentPlan: {
        type: String
    },
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
    }],
    investigations: [{
        type: String,
        result: String,
        date: Date
    }],
    referrals: [{
        to: String,
        reason: String,
        date: Date
    }],
    followUp: {
        date: Date,
        instructions: String
    },
    notes: {
        type: String
    },
    attachments: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: Date
    }],
    isConfidential: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'final', 'archived'],
        default: 'final'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
MedicalRecordSchema.index({ recordId: 1 });
MedicalRecordSchema.index({ patientId: 1 });
MedicalRecordSchema.index({ doctorId: 1 });
MedicalRecordSchema.index({ date: 1 });
MedicalRecordSchema.index({ diagnosis: 'text' });

// ========== STATIC METHODS ==========
MedicalRecordSchema.statics.findByPatient = function(patientId) {
    return this.find({ patientId })
        .populate('doctorId', 'name specialization')
        .sort({ date: -1 });
};

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
