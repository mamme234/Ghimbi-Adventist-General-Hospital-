const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log('🚀 Running pre-start tasks...');

// Check if required environment variables are set
const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Missing required environment variables in production');
    process.exit(1);
  }
}

// Create directories if they don't exist
const dirs = ['logs', 'temp', 'uploads', 'backups'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('✅ Pre-start completed');
