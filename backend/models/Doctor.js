// ========== DOCTOR MODEL ==========
const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    specialization: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    yearsOfExperience: {
        type: Number,
        min: 0
    },
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    certifications: [{
        name: String,
        issuer: String,
        dateIssued: Date,
        expiryDate: Date
    }],
    languages: [{
        type: String
    }],
    bio: {
        type: String
    },
    profileImage: {
        type: String
    },
    consultationFee: {
        type: Number,
        default: 0
    },
    availability: {
        monday: [{ start: String, end: String }],
        tuesday: [{ start: String, end: String }],
        wednesday: [{ start: String, end: String }],
        thursday: [{ start: String, end: String }],
        friday: [{ start: String, end: String }],
        saturday: [{ start: String, end: String }],
        sunday: [{ start: String, end: String }]
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isAvailable: {
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
DoctorSchema.index({ userId: 1 });
DoctorSchema.index({ department: 1 });
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ isAvailable: 1 });
DoctorSchema.index({ name: 'text', specialization: 'text' });

// ========== VIRTUAL FIELDS ==========
DoctorSchema.virtual('fullName').get(function() {
    return `Dr. ${this.name}`;
});

// ========== STATIC METHODS ==========
DoctorSchema.statics.findByDepartment = function(departmentId) {
    return this.find({ department: departmentId, isAvailable: true });
};

DoctorSchema.statics.findBySpecialization = function(specialization) {
    return this.find({ specialization, isAvailable: true });
};

module.exports = mongoose.model('Doctor', DoctorSchema);
