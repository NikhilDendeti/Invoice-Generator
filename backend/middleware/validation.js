const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUser = {
  signup: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('company.name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    
    body('company.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    
    body('company.phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone number cannot exceed 20 characters'),
    
    body('company.gst')
      .optional()
      .trim()
      .isLength({ max: 15 })
      .withMessage('GST number cannot exceed 15 characters'),
    
    body('settings.currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'])
      .withMessage('Invalid currency'),
    
    body('settings.defaultTax')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Default tax must be between 0 and 100'),
    
    handleValidationErrors
  ]
};

// Invoice validation rules
const validateInvoice = {
  create: [
    body('client.name')
      .trim()
      .notEmpty()
      .withMessage('Client name is required')
      .isLength({ max: 100 })
      .withMessage('Client name cannot exceed 100 characters'),
    
    body('client.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid client email'),
    
    body('client.address')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Client address cannot exceed 300 characters'),
    
    body('client.phone')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Client phone cannot exceed 20 characters'),
    
    body('client.gst')
      .optional()
      .trim()
      .isLength({ max: 15 })
      .withMessage('GST number cannot exceed 15 characters'),
    
    body('issueDate')
      .isISO8601()
      .withMessage('Issue date must be a valid date'),
    
    body('dueDate')
      .isISO8601()
      .withMessage('Due date must be a valid date')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.issueDate)) {
          throw new Error('Due date must be after issue date');
        }
        return true;
      }),
    
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    
    body('items.*.description')
      .trim()
      .notEmpty()
      .withMessage('Item description is required')
      .isLength({ max: 200 })
      .withMessage('Item description cannot exceed 200 characters'),
    
    body('items.*.quantity')
      .isFloat({ min: 0.01 })
      .withMessage('Quantity must be greater than 0'),
    
    body('items.*.rate')
      .isFloat({ min: 0 })
      .withMessage('Rate cannot be negative'),
    
    body('items.*.taxRate')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Tax rate must be between 0 and 100'),
    
    body('discount.type')
      .optional()
      .isIn(['percent', 'fixed'])
      .withMessage('Discount type must be either percent or fixed'),
    
    body('discount.value')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value cannot be negative'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters'),
    
    body('terms')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Terms cannot exceed 1000 characters'),
    
    handleValidationErrors
  ],

  update: [
    body('client.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Client name must be between 1 and 100 characters'),
    
    body('client.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid client email'),
    
    body('issueDate')
      .optional()
      .isISO8601()
      .withMessage('Issue date must be a valid date'),
    
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    
    body('status')
      .optional()
      .isIn(['draft', 'sent', 'paid', 'cancelled'])
      .withMessage('Invalid status'),
    
    handleValidationErrors
  ],

  updateStatus: [
    body('status')
      .isIn(['draft', 'sent', 'paid', 'cancelled'])
      .withMessage('Status must be one of: draft, sent, paid, cancelled'),
    
    handleValidationErrors
  ]
};

// Parameter validation
const validateParams = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
    
    handleValidationErrors
  ]
};

// Query validation
const validateQuery = {
  invoices: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) {
          return true; // Allow empty values
        }
        return ['draft', 'sent', 'paid', 'cancelled'].includes(value);
      })
      .withMessage('Invalid status filter'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'issueDate', 'dueDate', 'total', 'status'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    
    query('search')
      .optional()
      .custom((value) => {
        if (value === '' || value === null || value === undefined) {
          return true; // Allow empty values
        }
        return value.length >= 1 && value.length <= 100;
      })
      .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
  ],

  search: [
    query('q')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    
    handleValidationErrors
  ]
};

module.exports = {
  validateUser,
  validateInvoice,
  validateParams,
  validateQuery,
  handleValidationErrors
};
