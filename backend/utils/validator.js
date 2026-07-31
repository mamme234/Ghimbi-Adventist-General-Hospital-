const validator = require('validator');

exports.validateEmail = (email) => {
  return validator.isEmail(email);
};

exports.validatePhone = (phone) => {
  return validator.isMobilePhone(phone);
};

exports.validatePassword = (password) => {
  // At least 8 characters, with uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

exports.validateDate = (date) => {
  return validator.isISO8601(date);
};

exports.validateTime = (time) => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

exports.validateMongoId = (id) => {
  return validator.isMongoId(id);
};

exports.validateUrl = (url) => {
  return validator.isURL(url);
};

exports.validateUUID = (uuid) => {
  return validator.isUUID(uuid);
};

exports.validateCreditCard = (cardNumber) => {
  return validator.isCreditCard(cardNumber);
};

exports.validateZipCode = (zipCode) => {
  return validator.isPostalCode(zipCode, 'any');
};
