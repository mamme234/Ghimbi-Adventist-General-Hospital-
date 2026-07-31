// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import all controller functions - MAKE SURE THEY EXIST
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

// ===== PUBLIC ROUTES =====
// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', verifyEmail);

// ===== PROTECTED ROUTES (require authentication) =====
router.use(protect);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/change-password
router.post('/change-password', changePassword);

// POST /api/auth/setup-2fa
router.post('/setup-2fa', setup2FA);

// POST /api/auth/verify-2fa
router.post('/verify-2fa', verify2FA);

// POST /api/auth/disable-2fa
router.post('/disable-2fa', disable2FA);

module.exports = router;
