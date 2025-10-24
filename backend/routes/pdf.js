const express = require('express');
const router = express.Router();

// Import controllers
const {
  generatePDF,
  downloadPDF,
  getPDFInfo,
  deletePDF,
  emailPDF,
  cleanupPDFs
} = require('../controllers/pdfController');

// Import middleware
const { protect } = require('../middleware/auth');
const { pdfLimiter, emailLimiter } = require('../middleware/rateLimiter');
const { validateParams } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// PDF generation routes
router.post('/:id/generate', pdfLimiter, validateParams.mongoId, generatePDF);
router.get('/download/:filename', downloadPDF);
router.get('/:id/info', validateParams.mongoId, getPDFInfo);
router.delete('/:id/delete', validateParams.mongoId, deletePDF);
router.post('/:id/email', emailLimiter, validateParams.mongoId, emailPDF);
router.post('/cleanup', cleanupPDFs);

module.exports = router;
