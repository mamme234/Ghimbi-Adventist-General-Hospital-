// ========== AMBULANCE MODEL ==========
const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
    ambulanceId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    vehicleNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['basic', 'advanced', 'mobile_icu', 'helicopter'],
        default: 'basic'
    },
    model: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['available', 'in_transit', 'at_scene', 'returning', 'maintenance', 'out_of_service'],
        default: 'available'
    },
    equipment: [{
        name: String,
        quantity: Number,
        lastChecked: Date,
        expiryDate: Date,
        status: {
            type: String,
            enum: ['functional', 'needs_repair', 'expired']
        }
    }],
    driver: {
        name: String,
        licenseNumber: String,
        phone: String,
        certifications: [String],
        status: {
            type: String,
            enum: ['available', 'on_duty', 'off_duty', 'on_leave']
        }
    },
    crew: [{
        name: String,
        role: {
            type: String,
            enum: ['paramedic', 'nurse', 'emt', 'doctor']
        },
        certification: String
    }],
    location: {
        latitude: Number,
        longitude: Number,
        address: String,
        updatedAt: Date
    },
    currentTrip: {
        tripId: String,
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient'
        },
        pickupLocation: String,
        destination: String,
        priority: {
            type: String,
            enum: ['routine', 'urgent', 'emergency']
        },
        status: {
            type: String,
            enum: ['dispatched', 'en_route', 'arrived', 'transporting', 'completed', 'cancelled']
        },
        dispatchedAt: Date,
        arrivalAt: Date,
        completedAt: Date
    },
    tripHistory: [{
        tripId: String,
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient'
        },
        pickupLocation: String,
        destination: String,
        priority: String,
        status: String,
        dispatchedAt: Date,
        completedAt: Date,
        distance: Number,
        duration: Number
    }],
    maintenanceSchedule: {
        lastMaintenance: Date,
        nextMaintenance: Date,
        serviceType: String,
        notes: String
    },
    fuelLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    mileage: {
        type: Number
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
AmbulanceSchema.index({ ambulanceId: 1 });
AmbulanceSchema.index({ vehicleNumber: 1 });
AmbulanceSchema.index({ licensePlate: 1 });
AmbulanceSchema.index({ status: 1 });
AmbulanceSchema.index({ 'location.coordinates': '2dsphere' });

// ========== VIRTUAL FIELDS ==========
AmbulanceSchema.virtual('isAvailable').get(function() {
    return this.status === 'available' && this.driver.status === 'available';
});

// ========== INSTANCE METHODS ==========
AmbulanceSchema.methods.dispatch = function(tripData) {
    this.status = 'in_transit';
    this.currentTrip = {
        tripId: `TRIP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...tripData,
        dispatchedAt: new Date(),
        status: 'dispatched'
    };
    return this.save();
};

AmbulanceSchema.methods.completeTrip = function() {
    if (this.currentTrip) {
        this.currentTrip.status = 'completed';
        this.currentTrip.completedAt = new Date();
        
        this.tripHistory.push({
            ...this.currentTrip,
            completedAt: new Date()
        });
        
        this.status = 'available';
        this.currentTrip = null;
        return this.save();
    }
};

AmbulanceSchema.methods.updateLocation = function(lat, lng) {
    this.location = {
        latitude: lat,
        longitude: lng,
        updatedAt: new Date()
    };
    return this.save();
};

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
