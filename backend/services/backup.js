const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('../config');
const logger = require('./logger');

class BackupService {
  constructor() {
    this.backupDir = config.backup.directory;
    this.retentionDays = config.backup.retention;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      // Get all collections
      const collections = mongoose.connection.collections;
      const backupData = {};

      for (const [name, collection] of collections.entries()) {
        const documents = await collection.find({}).toArray();
        backupData[name] = documents;
      }

      // Write to file
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      
      // Compress backup
      const compressedFile = `${backupFile}.gz`;
      await this.compressFile(backupFile, compressedFile);
      fs.unlinkSync(backupFile); // Remove uncompressed file

      // Clean old backups
      await this.cleanOldBackups();

      logger.info(`Backup created: ${compressedFile}`);
      return compressedFile;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupFile) {
    try {
      const filePath = path.join(this.backupDir, backupFile);
      
      // Decompress if needed
      let dataFile = filePath;
      if (filePath.endsWith('.gz')) {
        const decompressed = filePath.replace('.gz', '');
        await this.decompressFile(filePath, decompressed);
        dataFile = decompressed;
      }

      // Read backup data
      const backupData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      
      // Restore each collection
      const collections = mongoose.connection.collections;
      for (const [name, data] of Object.entries(backupData)) {
        if (collections[name]) {
          await collections[name].deleteMany({});
          if (data.length > 0) {
            await collections[name].insertMany(data);
          }
        }
      }

      // Clean up decompressed file
      if (dataFile !== filePath) {
        fs.unlinkSync(dataFile);
      }

      logger.info(`Backup restored: ${backupFile}`);
      return { success: true, message: 'Backup restored successfully' };
    } catch (error) {
      logger.error('Backup restoration failed:', error);
      throw error;
    }
  }

  async cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > retentionMs) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning old backups:', error);
    }
  }

  compressFile(input, output) {
    return new Promise((resolve, reject) => {
      exec(`gzip -c ${input} > ${output}`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  decompressFile(input, output) {
    return new Promise((resolve, reject) => {
      exec(`gunzip -c ${input} > ${output}`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

module.exports = new BackupService();
