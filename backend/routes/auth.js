const express = require('express');
const router = express.Router();

// Import controllers
const {
  signup,
  login,
  getProfile,
  updateProfile,
  logout,
  changePassword
} = require('../controllers/authController');

// Import middleware
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateUser } = require('../middleware/validation');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/signup', validateUser.signup, signup);
router.post('/login', validateUser.login, login);

// Protected routes
router.use(protect); // All routes below this line are protected

router.get('/profile', getProfile);
router.put('/profile', validateUser.updateProfile, updateProfile);
router.post('/logout', logout);
router.put('/change-password', changePassword);

module.exports = router;
