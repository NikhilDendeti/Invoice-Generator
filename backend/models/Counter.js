const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['invoice', 'quote', 'receipt']
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per user, year, and type
counterSchema.index({ userId: 1, year: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
