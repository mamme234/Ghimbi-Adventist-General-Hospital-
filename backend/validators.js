// backend/validators.js

/**
 * Validation functions for the application
 */

/**
 * Validate email address
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password
 * At least 8 characters with uppercase, lowercase, number, and special character
 */
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date
 */
const validateDate = (date) => {
  return !isNaN(Date.parse(date));
};

/**
 * Validate MongoDB ObjectId
 */
const validateMongoId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate required fields
 */
const validateRequired = (fields, data) => {
  const errors = [];
  for (const field of fields) {
    if (!data[field] || data[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate appointment data
 */
const validateAppointment = (data) => {
  const errors = [];
  
  if (!data.patient) errors.push('Patient ID is required');
  if (!data.doctor) errors.push('Doctor ID is required');
  if (!data.date) errors.push('Date is required');
  if (!data.time) errors.push('Time is required');
  if (!validateDate(data.date)) errors.push('Invalid date format');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateDate,
  validateMongoId,
  validateRequired,
  validateAppointment,
};
