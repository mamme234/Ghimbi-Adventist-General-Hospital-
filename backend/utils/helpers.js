const crypto = require('crypto');

exports.generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

exports.generateOTP = (length = 6) => {
  return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
};

exports.formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

exports.calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

exports.generateId = (prefix, length = 6) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(length).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

exports.isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

exports.retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await exports.sleep(delay);
    return exports.retry(fn, retries - 1, delay);
  }
};

exports.paginate = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: data.length,
      pages: Math.ceil(data.length / limit),
    },
  };
};
