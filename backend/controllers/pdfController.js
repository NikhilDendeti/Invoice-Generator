const pdfService = require('../services/pdfService');
const PdfRecord = require('../models/PdfRecord');
const Invoice = require('../models/Invoice');
const { pdfLimiter, emailLimiter } = require('../middleware/rateLimiter');

// @desc    Generate PDF for invoice
// @route   POST /api/pdf/:id/generate
// @access  Private
const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'A4', includeTerms = true } = req.query;

    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if PDF already exists and is not expired
    const existingPDF = await PdfRecord.findOne({
      invoiceId: id,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (existingPDF) {
      return res.json({
        success: true,
        message: 'PDF already exists',
        data: {
          pdfUrl: existingPDF.fileUrl,
          fileName: existingPDF.fileName,
          generatedAt: existingPDF.generatedAt,
          expiresAt: existingPDF.expiresAt
        }
      });
    }

    // Generate new PDF
    const result = await pdfService.generatePDF(id, {
      format,
      includeTerms: includeTerms === 'true'
    });

    res.json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        pdfUrl: result.pdfRecord.fileUrl,
        fileName: result.fileName,
        fileSize: result.pdfRecord.fileSize,
        generatedAt: result.pdfRecord.generatedAt,
        expiresAt: result.pdfRecord.expiresAt
      }
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating PDF'
    });
  }
};

// @desc    Download PDF
// @route   GET /api/pdf/download/:filename
// @access  Private
const downloadPDF = async (req, res) => {
  try {
    const { filename } = req.params;

    // Find PDF record
    const pdfRecord = await PdfRecord.findOne({
      fileName: filename,
      userId: req.user.id
    });

    if (!pdfRecord) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    // Check if PDF is expired
    if (pdfRecord.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'PDF has expired'
      });
    }

    // Get PDF file
    const pdfBuffer = await pdfService.getPDF(filename);

    // Update download count
    await pdfRecord.incrementDownload();

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading PDF'
    });
  }
};

// @desc    Get PDF info
// @route   GET /api/pdf/:id/info
// @access  Private
const getPDFInfo = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get PDF records for this invoice
    const pdfRecords = await PdfRecord.find({
      invoiceId: id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        pdfRecords: pdfRecords.map(record => ({
          id: record._id,
          fileName: record.fileName,
          fileUrl: record.fileUrl,
          fileSize: record.fileSize,
          format: record.format,
          generatedAt: record.generatedAt,
          expiresAt: record.expiresAt,
          downloadCount: record.downloadCount,
          lastDownloaded: record.lastDownloaded
        }))
      }
    });
  } catch (error) {
    console.error('Get PDF info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching PDF info'
    });
  }
};

// @desc    Delete PDF
// @route   DELETE /api/pdf/:id/delete
// @access  Private
const deletePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfId } = req.body;

    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Find and delete PDF record
    const pdfRecord = await PdfRecord.findOne({
      _id: pdfId,
      invoiceId: id,
      userId: req.user.id
    });

    if (!pdfRecord) {
      return res.status(404).json({
        success: false,
        message: 'PDF record not found'
      });
    }

    // Delete file from filesystem
    try {
      const fs = require('fs');
      if (fs.existsSync(pdfRecord.filePath)) {
        fs.unlinkSync(pdfRecord.filePath);
      }
    } catch (fileError) {
      console.error('File deletion error:', fileError);
    }

    // Delete PDF record
    await PdfRecord.findByIdAndDelete(pdfId);

    res.json({
      success: true,
      message: 'PDF deleted successfully'
    });
  } catch (error) {
    console.error('Delete PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting PDF'
    });
  }
};

// @desc    Email PDF to client
// @route   POST /api/pdf/:id/email
// @access  Private
const emailPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientEmail, subject, message } = req.body;

    // Check if invoice exists and belongs to user
    const invoice = await Invoice.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get or generate PDF
    let pdfRecord = await PdfRecord.findOne({
      invoiceId: id,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!pdfRecord) {
      // Generate new PDF
      const result = await pdfService.generatePDF(id, {
        format: 'A4',
        includeTerms: true
      });
      pdfRecord = result.pdfRecord;
    }

    // Email service will be implemented separately
    // For now, return success with PDF info
    res.json({
      success: true,
      message: 'PDF email functionality will be implemented',
      data: {
        pdfUrl: pdfRecord.fileUrl,
        fileName: pdfRecord.fileName
      }
    });
  } catch (error) {
    console.error('Email PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error emailing PDF'
    });
  }
};

// @desc    Cleanup expired PDFs (admin endpoint)
// @route   POST /api/pdf/cleanup
// @access  Private
const cleanupPDFs = async (req, res) => {
  try {
    await pdfService.cleanupExpiredPDFs();
    
    res.json({
      success: true,
      message: 'PDF cleanup completed'
    });
  } catch (error) {
    console.error('PDF cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during PDF cleanup'
    });
  }
};

module.exports = {
  generatePDF,
  downloadPDF,
  getPDFInfo,
  deletePDF,
  emailPDF,
  cleanupPDFs
};
