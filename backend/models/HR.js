// ========== HR MODEL ==========
const mongoose = require('mongoose');

const HRSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        },
        maritalStatus: {
            type: String,
            enum: ['single', 'married', 'divorced', 'widowed']
        },
        nationality: String,
        religion: String,
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String
        }
    },
    employment: {
        position: {
            type: String,
            required: true
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        employmentType: {
            type: String,
            enum: ['full-time', 'part-time', 'contract', 'temporary', 'intern'],
            default: 'full-time'
        },
        joinDate: {
            type: Date,
            required: true
        },
        confirmationDate: Date,
        terminationDate: Date,
        status: {
            type: String,
            enum: ['active', 'probation', 'on_leave', 'suspended', 'terminated'],
            default: 'probation'
        },
        shift: {
            type: String,
            enum: ['day', 'night', 'rotating', 'flexible']
        },
        workSchedule: {
            monday: { start: String, end: String },
            tuesday: { start: String, end: String },
            wednesday: { start: String, end: String },
            thursday: { start: String, end: String },
            friday: { start: String, end: String },
            saturday: { start: String, end: String },
            sunday: { start: String, end: String }
        }
    },
    compensation: {
        basicSalary: {
            type: Number,
            required: true
        },
        allowances: {
            housing: Number,
            transport: Number,
            medical: Number,
            education: Number,
            other: Number
        },
        bonuses: [{
            amount: Number,
            type: String,
            date: Date,
            reason: String
        }],
        deductions: [{
            amount: Number,
            type: String,
            date: Date,
            reason: String
        }],
        bankDetails: {
            bankName: String,
            accountNumber: String,
            accountType: String,
            branch: String
        }
    },
    attendance: [{
        date: Date,
        checkIn: Date,
        checkOut: Date,
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'early_leave', 'holiday', 'leave']
        },
        overtime: Number,
        notes: String
    }],
    leave: {
        annual: {
            total: { type: Number, default: 20 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 20 }
        },
        sick: {
            total: { type: Number, default: 10 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 10 }
        },
        maternity: {
            total: { type: Number, default: 60 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 60 }
        },
        paternity: {
            total: { type: Number, default: 10 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 10 }
        },
        unpaid: {
            total: { type: Number, default: 0 },
            used: { type: Number, default: 0 },
            remaining: { type: Number, default: 0 }
        }
    },
    leaveRequests: [{
        type: {
            type: String,
            enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid']
        },
        startDate: Date,
        endDate: Date,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled']
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: Date,
        updatedAt: Date
    }],
    performance: [{
        reviewPeriod: String,
        date: Date,
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        ratings: {
            quality: { type: Number, min: 1, max: 5 },
            productivity: { type: Number, min: 1, max: 5 },
            teamwork: { type: Number, min: 1, max: 5 },
            communication: { type: Number, min: 1, max: 5 },
            initiative: { type: Number, min: 1, max: 5 }
        },
        strengths: String,
        weaknesses: String,
        goals: String,
        overallRating: { type: Number, min: 1, max: 5 },
        notes: String
    }],
    training: [{
        name: String,
        provider: String,
        date: Date,
        duration: Number,
        certificate: String,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['planned', 'ongoing', 'completed', 'cancelled']
        }
    }],
    documents: [{
        name: String,
        type: String,
        url: String,
        uploadedAt: Date
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
HRSchema.index({ employeeId: 1 });
HRSchema.index({ userId: 1 });
HRSchema.index({ 'personalInfo.firstName': 'text', 'personalInfo.lastName': 'text' });
HRSchema.index({ 'employment.status': 1 });
HRSchema.index({ 'employment.department': 1 });

// ========== VIRTUAL FIELDS ==========
HRSchema.virtual('fullName').get(function() {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

HRSchema.virtual('remainingAnnualLeave').get(function() {
    return this.leave.annual.total - this.leave.annual.used;
});

// ========== INSTANCE METHODS ==========
HRSchema.methods.recordAttendance = function(date, checkIn, checkOut) {
    this.attendance.push({
        date: new Date(date),
        checkIn: checkIn,
        checkOut: checkOut
    });
    return this.save();
};

HRSchema.methods.requestLeave = function(type, startDate, endDate, reason) {
    this.leaveRequests.push({
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'pending',
        createdAt: new Date()
    });
    return this.save();
};

HRSchema.methods.approveLeave = function(requestId, approverId) {
    const request = this.leaveRequests.id(requestId);
    if (request) {
        request.status = 'approved';
        request.approvedBy = approverId;
        request.updatedAt = new Date();
        return this.save();
    }
    throw new Error('Leave request not found');
};

module.exports = mongoose.model('HR', HRSchema);
