const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Item description is required'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0'],
    max: [999999, 'Quantity is too large']
  },
  rate: {
    type: Number,
    required: [true, 'Rate is required'],
    min: [0, 'Rate cannot be negative'],
    max: [999999, 'Rate is too large']
  },
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%']
  },
  total: {
    type: Number,
    required: false,
    min: [0, 'Total cannot be negative']
  }
});

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot be more than 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [300, 'Address cannot be more than 300 characters']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  gst: {
    type: String,
    trim: true,
    maxlength: [15, 'GST number cannot be more than 15 characters'],
    set: function(value) {
      return value ? value.substring(0, 15) : value;
    }
  }
});

const discountSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['percent', 'fixed'],
    default: 'fixed'
  },
  value: {
    type: Number,
    default: 0,
    min: [0, 'Discount value cannot be negative']
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Invoice number cannot be more than 50 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  client: {
    type: clientSchema,
    required: [true, 'Client information is required']
  },
  items: [lineItemSchema],
  subtotal: {
    type: Number,
    required: false,
    min: [0, 'Subtotal cannot be negative']
  },
  discount: {
    type: discountSchema,
    default: { type: 'fixed', value: 0 }
  },
  taxTotal: {
    type: Number,
    required: false,
    min: [0, 'Tax total cannot be negative']
  },
  total: {
    type: Number,
    required: false,
    min: [0, 'Total cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  terms: {
    type: String,
    trim: true,
    maxlength: [1000, 'Terms cannot be more than 1000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  pdfUrl: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [50, 'Payment method cannot be more than 50 characters']
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference cannot be more than 100 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ 'client.name': 1 });

// Virtual for checking if invoice is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      item.total = itemTotal;
      return sum + itemTotal;
    }, 0);

    // Calculate tax total
    this.taxTotal = this.items.reduce((sum, item) => {
      return sum + (item.total * item.taxRate / 100);
    }, 0);

    // Calculate discount amount
    let discountAmount = 0;
    if (this.discount.type === 'percent') {
      discountAmount = (this.subtotal * this.discount.value) / 100;
    } else {
      discountAmount = this.discount.value;
    }

    // Calculate final total
    this.total = this.subtotal + this.taxTotal - discountAmount;
  }
  next();
});

// Method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function(userId, prefix = 'INV') {
  const year = new Date().getFullYear();
  
  // Get Counter model dynamically to avoid circular dependencies
  const Counter = mongoose.model('Counter');
  
  // Check if counter exists, if not initialize it based on existing invoices
  let counter = await Counter.findOne({ 
    userId, 
    year,
    type: 'invoice' 
  });
  
  if (!counter) {
    // Count existing invoices for this user and year
    const existingCount = await this.countDocuments({ 
      userId, 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    
    // Create counter with the next number
    counter = await Counter.create({
      userId,
      year,
      type: 'invoice',
      count: existingCount
    });
  }
  
  // Atomically increment the counter
  counter = await Counter.findOneAndUpdate(
    { 
      userId, 
      year,
      type: 'invoice' 
    },
    { 
      $inc: { count: 1 } 
    },
    { 
      new: true
    }
  );
  
  const sequence = String(counter.count).padStart(4, '0');
  return `${prefix}-${year}-${sequence}`;
};

// Method to update payment status
invoiceSchema.methods.updatePaymentStatus = function() {
  if (this.status === 'paid') {
    this.paymentStatus = 'paid';
    this.paymentDate = new Date();
  } else if (this.isOverdue) {
    this.paymentStatus = 'overdue';
  } else {
    this.paymentStatus = 'pending';
  }
  return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);
