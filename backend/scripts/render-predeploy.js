#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log('🚀 Render Pre-Deploy Script');
console.log('============================');
console.log('');

async function runPreDeploy() {
  try {
    // 1. Create required directories
    console.log('📁 Creating directories...');
    const dirs = ['logs', 'temp', 'uploads', 'backups'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      }
    });

    // 2. Check environment variables
    console.log('\n🔍 Checking environment variables...');
    const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
    const optionalVars = ['SMTP_HOST', 'SMS_ACCOUNT_SID', 'STORAGE_ACCESS_KEY'];
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`  ✅ ${varName}: Set`);
      } else {
        console.log(`  ❌ ${varName}: Missing`);
      }
    });
    
    optionalVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`  ✅ ${varName}: Set`);
      } else {
        console.log(`  ⚠️  ${varName}: Optional (not set)`);
      }
    });

    // 3. Test database connection
    console.log('\n📊 Testing database connection...');
    if (process.env.MONGO_URI) {
      try {
        const conn = await mongoose.createConnection(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        await conn.close();
        console.log('  ✅ Database connection successful');
      } catch (error) {
        console.log('  ⚠️  Database connection failed:', error.message);
        console.log('  ⚠️  Continuing deployment...');
      }
    }

    // 4. Run migrations if enabled
    if (process.env.RUN_MIGRATIONS === 'true') {
      console.log('\n📋 Running migrations...');
      try {
        execSync('npm run db:migrate', { stdio: 'inherit' });
        console.log('  ✅ Migrations completed');
      } catch (error) {
        console.log('  ⚠️  Migrations failed:', error.message);
      }
    }

    // 5. Create indexes if enabled
    if (process.env.CREATE_INDEXES === 'true') {
      console.log('\n🔍 Creating database indexes...');
      try {
        execSync('node scripts/create-indexes.js', { stdio: 'inherit' });
        console.log('  ✅ Indexes created');
      } catch (error) {
        console.log('  ⚠️  Index creation failed:', error.message);
      }
    }

    console.log('\n✅ Pre-deploy completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Pre-deploy failed:', error.message);
    process.exit(1);
  }
}

runPreDeploy();
