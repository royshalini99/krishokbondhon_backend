const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  register,
  sendOtp,
  verifyOtp,
  submitExpertProfile,
  getPendingExperts,
  approveExpert,
  updateProfile,
  sendEmailOtp,
  verifyEmailOtp,
  getMe,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/expert/profile', submitExpertProfile);
router.get('/expert/pending', authenticate, requireAdmin, getPendingExperts);
router.patch('/expert/:expertId/approve', authenticate, requireAdmin, approveExpert);
router.patch('/profile/:userId', updateProfile);
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);
router.get('/me', authenticate, getMe);

module.exports = router;