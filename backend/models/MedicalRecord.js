const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['consultation', 'diagnosis', 'treatment', 'procedure', 'surgery', 'follow_up', 'emergency'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  chiefComplaint: String,
  historyOfPresentIllness: String,
  pastMedicalHistory: String,
  familyHistory: String,
  socialHistory: String,
  reviewOfSystems: {
    cardiovascular: String,
    respiratory: String,
    gastrointestinal: String,
    neurological: String,
    musculoskeletal: String,
    psychiatric: String,
    other: String,
  },
  physicalExamination: {
    general: String,
    vitals: {
      bloodPressure: String,
      heartRate: Number,
      respiratoryRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      bmi: Number,
      oxygenSaturation: Number,
    },
    headAndNeck: String,
    chest: String,
    abdomen: String,
    extremities: String,
    neurological: String,
    other: String,
  },
  diagnosis: [{
    code: String,
    description: String,
    type: {
      type: String,
      enum: ['primary', 'secondary', 'differential'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  }],
  investigations: [{
    type: {
      type: String,
      enum: ['laboratory', 'radiology', 'imaging', 'other'],
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'investigations.model',
    },
    model: {
      type: String,
      enum: ['LaboratoryRequest', 'RadiologyRequest'],
    },
    date: Date,
  }],
  treatment: {
    medications: [{
      prescription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
      },
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
    }],
    procedures: [String],
    recommendations: String,
    followUpDate: Date,
  },
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isConfidential: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ doctor: 1, date: -1 });
medicalRecordSchema.index({ diagnosis: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
