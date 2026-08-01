// ========== USER MODEL ==========
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: [
            'super-admin',
            'admin',
            'doctor',
            'doctor-assistant',
            'nurse',
            'receptionist',
            'pharmacist',
            'laboratory',
            'radiology',
            'finance',
            'hr',
            'ambulance',
            'patient',
            'visitor'
        ],
        default: 'patient'
    },
    department: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        default: '/assets/default-avatar.png'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    lastLogin: {
        type: Date
    },
    lastLoginIP: {
        type: String
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        }
    },
    permissions: [{
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
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ isActive: 1 });

// ========== VIRTUAL FIELDS ==========
UserSchema.virtual('fullName').get(function() {
    return this.name;
});

UserSchema.virtual('isLocked').get(function() {
    return this.lockUntil && this.lockUntil > Date.now();
});

// ========== PRE-SAVE HOOKS ==========
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ========== INSTANCE METHODS ==========
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = async function() {
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }
    
    await this.save();
};

UserSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockUntil = null;
    await this.save();
};

UserSchema.methods.hasPermission = function(permission) {
    if (this.role === 'super-admin') return true;
    return this.permissions.includes(permission);
};

// ========== STATIC METHODS ==========
UserSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

UserSchema.statics.findByRole = function(role) {
    return this.find({ role });
};

// ========== TOJSON TRANSFORM ==========
UserSchema.set('toJSON', {
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.twoFactorSecret;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('User', UserSchema);
