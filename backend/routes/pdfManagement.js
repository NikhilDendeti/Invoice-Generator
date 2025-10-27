const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pdfLimiter } = require('../middleware/rateLimiter');
const {
  getPdfLibrary,
  getPdfStats,
  bulkDeletePdfs,
  updatePdfSettings,
  cleanupExpiredPdfs
} = require('../controllers/pdfManagementController');

// Apply rate limiting to all routes
router.use(pdfLimiter);

// @route   GET /api/pdf/library
// @desc    Get user's PDF library
// @access  Private
router.get('/library', protect, getPdfLibrary);

// @route   GET /api/pdf/library/stats
// @desc    Get PDF library statistics
// @access  Private
router.get('/library/stats', protect, getPdfStats);

// @route   DELETE /api/pdf/library/bulk
// @desc    Bulk delete PDFs
// @access  Private
router.delete('/library/bulk', protect, bulkDeletePdfs);

// @route   PUT /api/pdf/settings
// @desc    Update PDF settings
// @access  Private
router.put('/settings', protect, updatePdfSettings);

// @route   POST /api/pdf/cleanup
// @desc    Clean up expired PDFs
// @access  Private
router.post('/cleanup', protect, cleanupExpiredPdfs);

module.exports = router;
