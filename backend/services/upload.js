const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: config.storage.accessKey,
  secretAccessKey: config.storage.secretKey,
  region: config.storage.region,
});

// Local storage fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'profileImage') uploadPath += 'profiles/';
    else if (file.fieldname === 'document') uploadPath += 'documents/';
    else if (file.fieldname === 'report') uploadPath += 'reports/';
    else if (file.fieldname === 'prescription') uploadPath += 'prescriptions/';
    else uploadPath += 'misc/';
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Office documents are allowed.'));
  }
};

// Create upload middleware
const createUpload = (fieldName, maxCount = 1, maxSize = 10 * 1024 * 1024) => {
  const storage = config.storage.provider === 's3' ? multerS3({
    s3: s3,
    bucket: config.storage.bucket,
    acl: 'public-read',
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      cb(null, `uploads/${fieldName}/${filename}`);
    },
  }) : localStorage;

  return multer({
    storage: storage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter: fileFilter,
  }).array(fieldName, maxCount);
};

// Single file upload
const uploadSingle = (fieldName, maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const upload = multer({
      storage: config.storage.provider === 's3' ? multerS3({
        s3: s3,
        bucket: config.storage.bucket,
        acl: 'public-read',
        key: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
          cb(null, `uploads/${fieldName}/${filename}`);
        },
      }) : localStorage,
      limits: { fileSize: maxSize },
      fileFilter: fileFilter,
    }).single(fieldName);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
          return res.status(400).json({
            success: false,
            message: 'File too large',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  };
};

// Delete file from storage
const deleteFile = async (fileUrl) => {
  try {
    if (config.storage.provider === 's3') {
      const key = fileUrl.split('/').pop();
      await s3.deleteObject({
        Bucket: config.storage.bucket,
        Key: `uploads/${key}`,
      }).promise();
    } else {
      // Local storage
      const filePath = path.join(__dirname, '..', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Generate signed URL for secure access
const getSignedUrl = (key, expires = 3600) => {
  if (config.storage.provider === 's3') {
    return s3.getSignedUrl('getObject', {
      Bucket: config.storage.bucket,
      Key: key,
      Expires: expires,
    });
  }
  return `/uploads/${key}`;
};

module.exports = {
  createUpload,
  uploadSingle,
  deleteFile,
  getSignedUrl,
  s3,
};
