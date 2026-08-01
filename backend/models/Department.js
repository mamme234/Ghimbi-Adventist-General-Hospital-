// ========== DEPARTMENT MODEL ==========
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        required: true
    },
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    doctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    }],
    nurses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    staff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    location: {
        floor: String,
        wing: String,
        roomNumbers: [String]
    },
    phone: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    services: [{
        name: String,
        description: String,
        price: Number
    }],
    equipment: [{
        name: String,
        quantity: Number,
        status: {
            type: String,
            enum: ['available', 'in-use', 'maintenance', 'broken']
        }
    }],
    capacity: {
        beds: Number,
        rooms: Number,
        currentOccupancy: Number
    },
    isActive: {
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
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ isActive: 1 });

// ========== STATIC METHODS ==========
DepartmentSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

DepartmentSchema.statics.findByCode = function(code) {
    return this.findOne({ code: code.toUpperCase() });
};

module.exports = mongoose.model('Department', DepartmentSchema);
