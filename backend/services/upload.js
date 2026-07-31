// backend/services/upload.js (Simplified - local storage only)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Simple file upload service - Local storage only
 * No AWS S3 required
 */

// Upload file to local storage
const uploadFile = async (file, directory = 'uploads') => {
  try {
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', directory);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    return {
      success: true,
      filePath: `/${directory}/${fileName}`,
      fileName: fileName,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload multiple files
const uploadMultipleFiles = async (files, directory = 'uploads') => {
  try {
    const results = [];
    for (const file of files) {
      const result = await uploadFile(file, directory);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Delete file
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
};
