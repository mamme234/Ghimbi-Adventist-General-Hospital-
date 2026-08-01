// ========== NOTIFICATION MODEL ==========
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['appointment', 'medical', 'pharmacy', 'payment', 'general', 'emergency', 'system'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        enum: ['Appointment', 'Patient', 'Doctor', 'Payment', 'MedicalRecord', 'Prescription']
    },
    link: {
        type: String
    },
    icon: {
        type: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ========== STATIC METHODS ==========
NotificationSchema.statics.getUnread = function(userId) {
    return this.find({ userId, isRead: false })
        .sort({ priority: -1, createdAt: -1 });
};

NotificationSchema.statics.markAllRead = function(userId) {
    return this.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
    );
};

module.exports = mongoose.model('Notification', NotificationSchema);
