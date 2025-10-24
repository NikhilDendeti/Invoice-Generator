const express = require('express');
const router = express.Router();

// Import controllers
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  searchInvoices,
  getInvoiceStats
} = require('../controllers/invoiceController');

// Import middleware
const { protect } = require('../middleware/auth');
const { validateInvoice, validateParams, validateQuery } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Invoice routes
router.get('/', validateQuery.invoices, getInvoices);
router.get('/stats', validateQuery.invoices, getInvoiceStats);
router.get('/search', validateQuery.search, searchInvoices);
router.get('/:id', validateParams.mongoId, getInvoice);
router.post('/', validateInvoice.create, createInvoice);
router.put('/:id', validateParams.mongoId, validateInvoice.update, updateInvoice);
router.put('/:id/status', validateParams.mongoId, validateInvoice.updateStatus, updateInvoiceStatus);
router.delete('/:id', validateParams.mongoId, deleteInvoice);

module.exports = router;
