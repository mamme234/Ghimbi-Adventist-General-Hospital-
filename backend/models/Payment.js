// ========== PAYMENT MODEL ==========
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    paymentId: {
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
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    invoiceNumber: {
        type: String,
        unique: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'ETB'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'mobile_money', 'other'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    paymentDate: {
        type: Date
    },
    description: {
        type: String
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number
    }],
    insuranceClaim: {
        claimNumber: String,
        provider: String,
        policyNumber: String,
        approvedAmount: Number,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'paid']
        }
    },
    refundDetails: {
        refundId: String,
        amount: Number,
        reason: String,
        date: Date,
        status: {
            type: String,
            enum: ['pending', 'processed', 'completed']
        }
    },
    receiptUrl: {
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
PaymentSchema.index({ paymentId: 1 });
PaymentSchema.index({ patientId: 1 });
PaymentSchema.index({ invoiceNumber: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ paymentDate: -1 });

// ========== VIRTUAL FIELDS ==========
PaymentSchema.virtual('isPaid').get(function() {
    return this.paymentStatus === 'completed';
});

PaymentSchema.virtual('isPending').get(function() {
    return this.paymentStatus === 'pending' || this.paymentStatus === 'processing';
});

// ========== INSTANCE METHODS ==========
PaymentSchema.methods.markAsPaid = async function() {
    this.paymentStatus = 'completed';
    this.paymentDate = new Date();
    await this.save();
};

PaymentSchema.methods.refund = async function(amount, reason) {
    this.paymentStatus = 'refunded';
    this.refundDetails = {
        refundId: `REF-${Date.now()}`,
        amount: amount || this.totalAmount,
        reason: reason,
        date: new Date(),
        status: 'processed'
    };
    await this.save();
};

PaymentSchema.methods.generateInvoiceNumber = function() {
    return `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

module.exports = mongoose.model('Payment', PaymentSchema);
