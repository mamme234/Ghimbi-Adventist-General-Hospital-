// ========== AUDIT LOG MODEL ==========
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW',
            'PRINT', 'EXPORT', 'UPLOAD', 'DOWNLOAD', 'LOGIN_FAILED',
            'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'PERMISSION_CHANGE'
        ]
    },
    resource: {
        type: String,
        required: true
    },
    resourceId: {
        type: String
    },
    details: {
        type: String
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    location: {
        city: String,
        country: String,
        coordinates: [Number]
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ ip: 1 });

// ========== STATIC METHODS ==========
AuditLogSchema.statics.log = function(data) {
    return this.create(data);
};

AuditLogSchema.statics.findByUser = function(userId, limit = 100) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);
