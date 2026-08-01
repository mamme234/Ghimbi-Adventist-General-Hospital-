// ========== PATIENT MODEL ==========
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    medicalHistory: [{
        condition: String,
        diagnosisDate: Date,
        notes: String
    }],
    allergies: [{
        type: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe']
        },
        reaction: String
    }],
    currentMedications: [{
        name: String,
        dosage: String,
        frequency: String,
        prescribedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    }],
    insurance: {
        provider: String,
        policyNumber: String,
        expiryDate: Date,
        coverage: String
    },
    qrCode: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deceased'],
        default: 'active'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
PatientSchema.index({ patientId: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ name: 'text' });

// ========== VIRTUAL FIELDS ==========
PatientSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const age = new Date().getFullYear() - this.dateOfBirth.getFullYear();
    const monthDiff = new Date().getMonth() - this.dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < this.dateOfBirth.getDate())) {
        return age - 1;
    }
    return age;
});

// ========== INSTANCE METHODS ==========
PatientSchema.methods.getFullName = function() {
    return this.name;
};

PatientSchema.methods.hasAllergy = function(allergyType) {
    return this.allergies.some(a => a.type === allergyType);
};

module.exports = mongoose.model('Patient', PatientSchema);
