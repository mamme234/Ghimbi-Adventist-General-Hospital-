const { body, param, query, validationResult } = require('express-validator');

// Validation rules for different endpoints
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  };
};

// User validation rules
const userValidation = {
  register: [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase, one lowercase, one number, and one special character'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
  ],
  login: [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
};

// Appointment validation
const appointmentValidation = {
  create: [
    body('patient').isMongoId().withMessage('Invalid patient ID'),
    body('doctor').isMongoId().withMessage('Invalid doctor ID'),
    body('department').isMongoId().withMessage('Invalid department ID'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('type').isIn(['regular', 'follow-up', 'emergency', 'telemedicine', 'surgery']),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
};

// Patient validation
const patientValidation = {
  create: [
    body('user').isMongoId().withMessage('Invalid user ID'),
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  ],
};

// Medicine validation
const medicineValidation = {
  create: [
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('genericName').notEmpty().withMessage('Generic name is required'),
    body('category').isIn(['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'cream', 'inhaler', 'drops']),
    body('unitPrice').isNumeric().withMessage('Unit price must be a number'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('expiryDate').isISO8601().withMessage('Invalid expiry date'),
  ],
};

module.exports = {
  validate,
  userValidation,
  appointmentValidation,
  patientValidation,
  medicineValidation,
};
