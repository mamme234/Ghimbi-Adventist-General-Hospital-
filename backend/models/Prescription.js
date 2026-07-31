const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  medications: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    name: String,
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      enum: ['oral', 'topical', 'inhalation', 'injection', 'intravenous', 'intramuscular', 'subcutaneous'],
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    refills: {
      type: Number,
      default: 0,
    },
    refillsUsed: {
      type: Number,
      default: 0,
    },
    instructions: String,
    notes: String,
  }],
  diagnosis: String,
  notes: String,
  specialInstructions: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'dispensed', 'completed', 'cancelled'],
    default: 'active',
  },
  isControlled: {
    type: Boolean,
    default: false,
  },
  controlledSubstanceLicense: String,
  qrCode: String,
  barcode: String,
  validUntil: Date,
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  dispensedDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate QR code
prescriptionSchema.pre('save', async function(next) {
  if (!this.qrCode) {
    const QRCode = require('qrcode');
    const qrData = JSON.stringify({
      id: this._id,
      patient: this.patient,
      medications: this.medications.map(m => ({ 
        name: m.medicine, 
        dosage: m.dosage 
      })),
    });
    this.qrCode = await QRCode.toDataURL(qrData);
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
