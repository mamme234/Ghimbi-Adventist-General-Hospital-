const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  console.log('📋 Running database migrations...');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Add your migrations here
    // Example: Add new fields, update schemas, etc.
    
    console.log('✅ Migrations completed successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
