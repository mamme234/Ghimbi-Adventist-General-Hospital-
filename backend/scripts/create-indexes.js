const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
  console.log('🔍 Creating database indexes...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    const User = mongoose.model('User');
    const Patient = mongoose.model('Patient');
    const Appointment = mongoose.model('Appointment');
    const Medicine = mongoose.model('Medicine');
    
    // Create indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ 'firstName': 1, 'lastName': 1 });
    
    await Patient.collection.createIndex({ patientId: 1 }, { unique: true });
    await Patient.collection.createIndex({ 'user.firstName': 1, 'user.lastName': 1 });
    
    await Appointment.collection.createIndex({ doctor: 1, date: 1, time: 1 });
    await Appointment.collection.createIndex({ patient: 1, date: -1 });
    await Appointment.collection.createIndex({ status: 1, date: 1 });
    
    await Medicine.collection.createIndex({ name: 1 });
    await Medicine.collection.createIndex({ barcode: 1 }, { unique: true });
    await Medicine.collection.createIndex({ expiryDate: 1 });
    
    console.log('✅ Indexes created successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Index creation failed:', error.message);
    process.exit(1);
  }
}

createIndexes();
