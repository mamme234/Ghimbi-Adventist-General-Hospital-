// ========== INSURANCE MODEL ==========
const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
    insuranceId: {
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
    provider: {
        type: String,
        required: true,
        trim: true
    },
    policyNumber: {
        type: String,
        required: true,
        trim: true
    },
    groupNumber: {
        type: String,
        trim: true
    },
    coverageType: {
        type: String,
        enum: ['individual', 'family', 'group', 'employer', 'government'],
        default: 'individual'
    },
    coverageDetails: {
        inpatientCoverage: {
            type: Number,
            default: 80 // percentage
        },
        outpatientCoverage: {
            type: Number,
            default: 70
        },
        prescriptionCoverage: {
            type: Number,
            default: 50
        },
        emergencyCoverage: {
            type: Number,
            default: 90
        },
        annualLimit: {
            type: Number,
            default: 100000
        },
        deductible: {
            type: Number,
            default: 1000
        },
        copay: {
            type: Number,
            default: 20
        }
    },
    validity: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        }
    },
    primaryHolder: {
        name: String,
        relationship: String,
        dateOfBirth: Date
    },
    dependents: [{
        name: String,
        relationship: String,
        dateOfBirth: Date,
        gender: String
    }],
    claims: [{
        claimId: String,
        date: Date,
        amount: Number,
        approvedAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'paid']
        },
        description: String
    }],
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'active'
    },
    isPrimary: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
InsuranceSchema.index({ insuranceId: 1 });
InsuranceSchema.index({ patientId: 1 });
InsuranceSchema.index({ policyNumber: 1 });
InsuranceSchema.index({ provider: 1 });
InsuranceSchema.index({ status: 1 });
InsuranceSchema.index({ 'validity.endDate': 1 });

// ========== VIRTUAL FIELDS ==========
InsuranceSchema.virtual('isActive').get(function() {
    return this.status === 'active' && new Date() <= this.validity.endDate;
});

InsuranceSchema.virtual('isExpired').get(function() {
    return new Date() > this.validity.endDate;
});

// ========== INSTANCE METHODS ==========
InsuranceSchema.methods.checkCoverage = function(serviceType, amount) {
    const coverageMap = {
        inpatient: this.coverageDetails.inpatientCoverage,
        outpatient: this.coverageDetails.outpatientCoverage,
        prescription: this.coverageDetails.prescriptionCoverage,
        emergency: this.coverageDetails.emergencyCoverage
    };
    
    const coverage = coverageMap[serviceType] || 0;
    const coveredAmount = (amount * coverage) / 100;
    const patientPay = amount - coveredAmount;
    
    return {
        covered: coveredAmount,
        patientPay: patientPay,
        coveragePercentage: coverage,
        isCovered: coverage > 0
    };
};

InsuranceSchema.methods.addClaim = function(claimData) {
    this.claims.push({
        claimId: `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...claimData
    });
    return this.save();
};

module.exports = mongoose.model('Insurance', InsuranceSchema);
