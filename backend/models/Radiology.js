// ========== RADIOLOGY MODEL ==========
const mongoose = require('mongoose');

const RadiologySchema = new mongoose.Schema({
    radiologyId: {
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
    imagingType: {
        type: String,
        enum: ['x-ray', 'ct_scan', 'mri', 'ultrasound', 'mammography', 'pet_scan',
               'fluoroscopy', 'angiography', 'echocardiogram', 'other'],
        required: true
    },
    bodyPart: {
        type: String,
        required: true
    },
    clinicalIndication: {
        type: String,
        required: true
    },
    contrastUsed: {
        type: Boolean,
        default: false
    },
    contrastDetails: {
        type: String
    },
    status: {
        type: String,
        enum: ['ordered', 'scheduled', 'performed', 'processing', 'reviewed', 'completed'],
        default: 'ordered'
    },
    urgency: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine'
    },
    performedBy: {
        type: String
    },
    performedAt: {
        type: Date
    },
    images: [{
        url: String,
        thumbnail: String,
        type: String,
        views: [String],
        dicomData: String
    }],
    report: {
        findings: String,
        impression: String,
        recommendations: String,
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        },
        reviewedAt: Date,
        pdfUrl: String
    },
    dicomMetadata: {
        studyUid: String,
        seriesUid: String,
        instanceUid: String,
        modality: String,
        manufacturer: String,
        model: String,
        softwareVersion: String
    },
    radiationDose: {
        dose: Number,
        unit: String,
        technique: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
RadiologySchema.index({ radiologyId: 1 });
RadiologySchema.index({ patientId: 1 });
RadiologySchema.index({ doctorId: 1 });
RadiologySchema.index({ imagingType: 1 });
RadiologySchema.index({ status: 1 });
RadiologySchema.index({ createdAt: -1 });

// ========== INSTANCE METHODS ==========
RadiologySchema.methods.addImage = function(imageData) {
    this.images.push(imageData);
    return this.save();
};

RadiologySchema.methods.submitReport = function(reportData) {
    this.report = {
        findings: reportData.findings,
        impression: reportData.impression,
        recommendations: reportData.recommendations,
        reviewedBy: reportData.reviewedBy,
        reviewedAt: new Date(),
        pdfUrl: reportData.pdfUrl
    };
    this.status = 'completed';
    return this.save();
};

RadiologySchema.methods.getImageUrls = function() {
    return this.images.map(img => img.url);
};

module.exports = mongoose.model('Radiology', RadiologySchema);
