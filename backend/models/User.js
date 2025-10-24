const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  company: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot be more than 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot be more than 200 characters']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot be more than 20 characters']
    },
    gst: {
      type: String,
      trim: true,
      maxlength: [15, 'GST number cannot be more than 15 characters']
    },
    logo: {
      type: String,
      trim: true
    }
  },
  settings: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    defaultTax: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
      trim: true,
      maxlength: [10, 'Invoice prefix cannot be more than 10 characters']
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    invoiceNumbering: {
      type: String,
      default: 'sequential',
      enum: ['sequential', 'year-based']
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);
