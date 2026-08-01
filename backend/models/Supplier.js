// ========== SUPPLIER MODEL ==========
const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    supplierId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    taxId: {
        type: String,
        trim: true
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    categories: [{
        type: String,
        enum: ['pharmaceuticals', 'medical_equipment', 'surgical_supplies', 'laboratory', 'radiology',
               'administrative', 'furniture', 'technology', 'maintenance', 'other']
    }],
    products: [{
        name: String,
        description: String,
        unitPrice: Number,
        minimumOrder: Number
    }],
    paymentTerms: {
        type: String,
        enum: ['cash', 'credit_30', 'credit_60', 'credit_90', 'bank_transfer'],
        default: 'credit_30'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    transactions: [{
        orderId: String,
        date: Date,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'completed', 'cancelled', 'returned']
        }
    }],
    notes: {
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
SupplierSchema.index({ supplierId: 1 });
SupplierSchema.index({ name: 1 });
SupplierSchema.index({ email: 1 });
SupplierSchema.index({ phone: 1 });
SupplierSchema.index({ status: 1 });
SupplierSchema.index({ 'categories': 1 });

// ========== VIRTUAL FIELDS ==========
SupplierSchema.virtual('isActive').get(function() {
    return this.status === 'active';
});

module.exports = mongoose.model('Supplier', SupplierSchema);
