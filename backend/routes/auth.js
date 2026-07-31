const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  register, 
  login, 
  logout, 
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  setup2FA,
  verify2FA,
  disable2FA
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.post('/change-password', changePassword);
router.post('/setup-2fa', setup2FA);
router.post('/verify-2fa', verify2FA);
router.post('/disable-2fa', disable2FA);

module.exports = router;
