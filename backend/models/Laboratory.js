// ========== LABORATORY MODEL ==========
const mongoose = require('mongoose');

const LaboratorySchema = new mongoose.Schema({
    labId: {
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
    testType: {
        type: String,
        enum: ['blood', 'urine', 'stool', 'culture', 'biopsy', 'pathology', 'genetic',
               'hormone', 'tumor_marker', 'allergy', 'drug_test', 'pregnancy', 'other'],
        required: true
    },
    testName: {
        type: String,
        required: true
    },
    testCode: {
        type: String,
        required: true
    },
    tests: [{
        name: String,
        result: mongoose.Schema.Types.Mixed,
        unit: String,
        referenceRange: String,
        abnormal: Boolean,
        comments: String
    }],
    sampleType: {
        type: String,
        enum: ['blood', 'urine', 'stool', 'tissue', 'saliva', 'sputum', 'cerebrospinal',
               'amniotic', 'biopsy', 'other']
    },
    sampleCollected: {
        date: Date,
        by: String,
        method: String
    },
    sampleProcessed: {
        date: Date,
        by: String,
        method: String
    },
    status: {
        type: String,
        enum: ['ordered', 'collected', 'processing', 'reviewed', 'completed', 'rejected'],
        default: 'ordered'
    },
    urgency: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine'
    },
    results: {
        date: Date,
        by: String,
        notes: String,
        pdfUrl: String
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    reviewedAt: {
        type: Date
    },
    interpretation: {
        type: String
    },
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
LaboratorySchema.index({ labId: 1 });
LaboratorySchema.index({ patientId: 1 });
LaboratorySchema.index({ doctorId: 1 });
LaboratorySchema.index({ status: 1 });
LaboratorySchema.index({ testCode: 1 });
LaboratorySchema.index({ createdAt: -1 });

// ========== VIRTUAL FIELDS ==========
LaboratorySchema.virtual('isCompleted').get(function() {
    return this.status === 'completed';
});

LaboratorySchema.virtual('isPending').get(function() {
    return ['ordered', 'collected', 'processing'].includes(this.status);
});

// ========== INSTANCE METHODS ==========
LaboratorySchema.methods.submitResults = async function(results) {
    this.results = {
        date: new Date(),
        by: results.by,
        notes: results.notes,
        pdfUrl: results.pdfUrl
    };
    this.status = 'completed';
    this.tests = results.tests || this.tests;
    await this.save();
};

LaboratorySchema.methods.addTestResult = function(testName, result, unit, referenceRange) {
    this.tests.push({
        name: testName,
        result: result,
        unit: unit,
        referenceRange: referenceRange,
        abnormal: this.isAbnormal(result, referenceRange)
    });
    return this.save();
};

LaboratorySchema.methods.isAbnormal = function(result, referenceRange) {
    if (!referenceRange) return false;
    const range = referenceRange.split('-');
    if (range.length === 2) {
        const min = parseFloat(range[0]);
        const max = parseFloat(range[1]);
        const value = parseFloat(result);
        return value < min || value > max;
    }
    return false;
};

module.exports = mongoose.model('Laboratory', LaboratorySchema);
