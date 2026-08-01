// ========== PRESCRIPTION MODEL ==========
const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    prescriptionId: {
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    medications: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine'
        },
        name: {
            type: String,
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        frequency: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        instructions: {
            type: String
        },
        refills: {
            type: Number,
            default: 0
        },
        refillsUsed: {
            type: Number,
            default: 0
        },
        isGeneric: {
            type: Boolean,
            default: false
        }
    }],
    diagnosis: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    specialInstructions: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'dispensed', 'completed', 'cancelled', 'expired'],
        default: 'active'
    },
    dispensedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispensedAt: {
        type: Date
    },
    expiryDate: {
        type: Date
    },
    isControlled: {
        type: Boolean,
        default: false
    },
    controlledSubstanceLicense: {
        type: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
PrescriptionSchema.index({ prescriptionId: 1 });
PrescriptionSchema.index({ patientId: 1 });
PrescriptionSchema.index({ doctorId: 1 });
PrescriptionSchema.index({ status: 1 });
PrescriptionSchema.index({ date: -1 });

// ========== VIRTUAL FIELDS ==========
PrescriptionSchema.virtual('totalMedications').get(function() {
    return this.medications.length;
});

PrescriptionSchema.virtual('isExpired').get(function() {
    return this.expiryDate && this.expiryDate < new Date();
});

// ========== INSTANCE METHODS ==========
PrescriptionSchema.methods.addRefill = async function() {
    if (this.refillsUsed < this.refills) {
        this.refillsUsed += 1;
        await this.save();
        return true;
    }
    return false;
};

PrescriptionSchema.methods.dispense = async function(pharmacistId) {
    this.status = 'dispensed';
    this.dispensedBy = pharmacistId;
    this.dispensedAt = new Date();
    await this.save();
};

module.exports = mongoose.model('Prescription', PrescriptionSchema);
