// ========== MEDICINE MODEL ==========
const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    genericName: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['antibiotic', 'analgesic', 'antihistamine', 'antidepressant', 'antidiabetic',
               'antihypertensive', 'antiviral', 'antifungal', 'anti-inflammatory', 'vitamin',
               'supplement', 'other'],
        required: true
    },
    form: {
        type: String,
        enum: ['tablet', 'capsule', 'liquid', 'injection', 'ointment', 'cream', 'gel',
               'patch', 'inhaler', 'suppository', 'drops', 'syrup', 'other'],
        required: true
    },
    strength: {
        type: String,
        required: true
    },
    packageSize: {
        type: String
    },
    unit: {
        type: String,
        enum: ['mg', 'g', 'ml', 'IU', 'mcg', 'tablet', 'capsule', 'vial', 'ampoule'],
        required: true
    },
    price: {
        purchasePrice: Number,
        sellingPrice: Number,
        currency: {
            type: String,
            default: 'ETB'
        }
    },
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        minStock: {
            type: Number,
            default: 10
        },
        maxStock: {
            type: Number
        },
        reorderPoint: {
            type: Number,
            default: 5
        }
    },
    supplier: {
        name: String,
        contact: String,
        phone: String,
        email: String
    },
    batchInfo: [{
        batchNumber: String,
        expiryDate: Date,
        quantity: Number,
        receivedDate: Date
    }],
    prescriptionRequired: {
        type: Boolean,
        default: true
    },
    controlledSubstance: {
        type: Boolean,
        default: false
    },
    schedule: {
        type: String,
        enum: ['I', 'II', 'III', 'IV', 'V', 'none'],
        default: 'none'
    },
    sideEffects: [{
        type: String
    }],
    contraindications: [{
        type: String
    }],
    interactions: [{
        with: String,
        effect: String
    }],
    storageConditions: {
        temperature: String,
        humidity: String,
        light: String,
        specialInstructions: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true
    },
    qrCode: {
        type: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// ========== INDEXES ==========
MedicineSchema.index({ name: 1 });
MedicineSchema.index({ brand: 1 });
MedicineSchema.index({ category: 1 });
MedicineSchema.index({ barcode: 1 });
MedicineSchema.index({ 'stock.quantity': 1 });
MedicineSchema.index({ name: 'text', brand: 'text', genericName: 'text' });

// ========== VIRTUAL FIELDS ==========
MedicineSchema.virtual('isLowStock').get(function() {
    return this.stock.quantity <= this.stock.reorderPoint;
});

MedicineSchema.virtual('isOutOfStock').get(function() {
    return this.stock.quantity <= 0;
});

MedicineSchema.virtual('isExpired').get(function() {
    if (!this.batchInfo || this.batchInfo.length === 0) return false;
    return this.batchInfo.some(batch => new Date(batch.expiryDate) < new Date());
});

// ========== INSTANCE METHODS ==========
MedicineSchema.methods.reduceStock = function(quantity) {
    if (this.stock.quantity < quantity) {
        throw new Error('Insufficient stock');
    }
    this.stock.quantity -= quantity;
    return this.save();
};

MedicineSchema.methods.increaseStock = function(quantity, batchInfo) {
    this.stock.quantity += quantity;
    if (batchInfo) {
        this.batchInfo.push(batchInfo);
    }
    return this.save();
};

MedicineSchema.methods.updatePrice = function(purchasePrice, sellingPrice) {
    this.price.purchasePrice = purchasePrice;
    this.price.sellingPrice = sellingPrice;
    return this.save();
};

module.exports = mongoose.model('Medicine', MedicineSchema);
