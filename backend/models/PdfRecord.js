const mongoose = require('mongoose');

const pdfRecordSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  format: {
    type: String,
    enum: ['A4', 'Letter'],
    default: 'A4'
  },
  includeTerms: {
    type: Boolean,
    default: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // PDF expires after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
pdfRecordSchema.index({ invoiceId: 1 });
pdfRecordSchema.index({ userId: 1 });
pdfRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to increment download count
pdfRecordSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Static method to clean up expired PDFs
pdfRecordSchema.statics.cleanupExpired = async function() {
  const expiredPdfs = await this.find({ expiresAt: { $lt: new Date() } });
  
  for (const pdf of expiredPdfs) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Delete file from filesystem
      if (fs.existsSync(pdf.filePath)) {
        fs.unlinkSync(pdf.filePath);
      }
      
      // Remove record from database
      await this.findByIdAndDelete(pdf._id);
      
      console.log(`Cleaned up expired PDF: ${pdf.fileName}`);
    } catch (error) {
      console.error(`Error cleaning up PDF ${pdf.fileName}:`, error.message);
    }
  }
};

module.exports = mongoose.model('PdfRecord', pdfRecordSchema);
