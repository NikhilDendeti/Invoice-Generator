const PdfRecord = require('../models/PdfRecord');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get user's PDF library
// @route   GET /api/pdf/library
// @access  Private
const getPdfLibrary = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'generatedAt',
      sortOrder = 'desc',
      search = '',
      format = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query
    const query = { userId: req.user.id };
    
    if (search) {
      query.$or = [
        { fileName: { $regex: search, $options: 'i' } },
        { 'invoiceId.invoiceNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (format) {
      query.format = format;
    }
    
    if (dateFrom || dateTo) {
      query.generatedAt = {};
      if (dateFrom) query.generatedAt.$gte = new Date(dateFrom);
      if (dateTo) query.generatedAt.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get PDFs with invoice details
    const pdfs = await PdfRecord.find(query)
      .populate('invoiceId', 'invoiceNumber client.name total status issueDate dueDate')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await PdfRecord.countDocuments(query);

    // Get library stats
    const stats = await PdfRecord.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalPdfs: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          lastGenerated: { $max: '$generatedAt' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        pdfs: pdfs.map(pdf => ({
          id: pdf._id,
          fileName: pdf.fileName,
          fileUrl: pdf.fileUrl,
          fileSize: pdf.fileSize,
          format: pdf.format,
          generatedAt: pdf.generatedAt,
          expiresAt: pdf.expiresAt,
          downloadCount: pdf.downloadCount,
          lastDownloaded: pdf.lastDownloaded,
          invoice: pdf.invoiceId ? {
            id: pdf.invoiceId._id,
            invoiceNumber: pdf.invoiceId.invoiceNumber,
            clientName: pdf.invoiceId.client?.name,
            total: pdf.invoiceId.total,
            status: pdf.invoiceId.status,
            issueDate: pdf.invoiceId.issueDate,
            dueDate: pdf.invoiceId.dueDate
          } : null
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        stats: stats[0] || {
          totalPdfs: 0,
          totalSize: 0,
          lastGenerated: null,
          totalDownloads: 0
        }
      }
    });
  } catch (error) {
    console.error('Get PDF library error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching PDF library'
    });
  }
};

// @desc    Get PDF library stats
// @route   GET /api/pdf/library/stats
// @access  Private
const getPdfStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user's PDF stats
    await user.updatePdfStats();

    // Get detailed stats
    const stats = await PdfRecord.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: null,
          totalPdfs: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalDownloads: { $sum: '$downloadCount' },
          avgFileSize: { $avg: '$fileSize' },
          lastGenerated: { $max: '$generatedAt' },
          formatStats: {
            $push: {
              format: '$format',
              size: '$fileSize'
            }
          }
        }
      }
    ]);

    // Get format breakdown
    const formatStats = await PdfRecord.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$format',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      }
    ]);

    // Get recent activity
    const recentPdfs = await PdfRecord.find({ userId: req.user.id })
      .populate('invoiceId', 'invoiceNumber client.name')
      .sort({ generatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        ...stats[0],
        formatBreakdown: formatStats,
        recentPdfs: recentPdfs.map(pdf => ({
          id: pdf._id,
          fileName: pdf.fileName,
          generatedAt: pdf.generatedAt,
          invoiceNumber: pdf.invoiceId?.invoiceNumber,
          clientName: pdf.invoiceId?.client?.name
        }))
      }
    });
  } catch (error) {
    console.error('Get PDF stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching PDF stats'
    });
  }
};

// @desc    Bulk delete PDFs
// @route   DELETE /api/pdf/library/bulk
// @access  Private
const bulkDeletePdfs = async (req, res) => {
  try {
    const { pdfIds } = req.body;

    if (!pdfIds || !Array.isArray(pdfIds) || pdfIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'PDF IDs are required'
      });
    }

    // Get PDFs that belong to user
    const pdfs = await PdfRecord.find({
      _id: { $in: pdfIds },
      userId: req.user.id
    });

    if (pdfs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No PDFs found'
      });
    }

    // Delete files from filesystem
    for (const pdf of pdfs) {
      try {
        if (await fs.access(pdf.filePath).then(() => true).catch(() => false)) {
          await fs.unlink(pdf.filePath);
        }
      } catch (error) {
        console.error(`Error deleting file ${pdf.fileName}:`, error.message);
      }
    }

    // Delete records from database
    await PdfRecord.deleteMany({
      _id: { $in: pdfIds },
      userId: req.user.id
    });

    // Update user stats
    const user = await User.findById(req.user.id);
    if (user) {
      await user.updatePdfStats();
    }

    res.json({
      success: true,
      message: `Successfully deleted ${pdfs.length} PDF(s)`,
      data: {
        deletedCount: pdfs.length
      }
    });
  } catch (error) {
    console.error('Bulk delete PDFs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting PDFs'
    });
  }
};

// @desc    Update PDF settings
// @route   PUT /api/pdf/settings
// @access  Private
const updatePdfSettings = async (req, res) => {
  try {
    const { autoGenerate, defaultFormat, includeTerms, retentionDays } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update PDF settings
    if (autoGenerate !== undefined) user.pdfSettings.autoGenerate = autoGenerate;
    if (defaultFormat) user.pdfSettings.defaultFormat = defaultFormat;
    if (includeTerms !== undefined) user.pdfSettings.includeTerms = includeTerms;
    if (retentionDays) user.pdfSettings.retentionDays = retentionDays;

    await user.save();

    res.json({
      success: true,
      message: 'PDF settings updated successfully',
      data: {
        pdfSettings: user.pdfSettings
      }
    });
  } catch (error) {
    console.error('Update PDF settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating PDF settings'
    });
  }
};

// @desc    Clean up expired PDFs
// @route   POST /api/pdf/cleanup
// @access  Private
const cleanupExpiredPdfs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get expired PDFs for this user
    const expiredPdfs = await PdfRecord.find({
      userId: req.user.id,
      expiresAt: { $lt: new Date() }
    });

    let deletedCount = 0;
    let deletedSize = 0;

    for (const pdf of expiredPdfs) {
      try {
        // Delete file from filesystem
        if (await fs.access(pdf.filePath).then(() => true).catch(() => false)) {
          await fs.unlink(pdf.filePath);
        }
        
        // Delete record
        await PdfRecord.findByIdAndDelete(pdf._id);
        
        deletedCount++;
        deletedSize += pdf.fileSize;
      } catch (error) {
        console.error(`Error cleaning up PDF ${pdf.fileName}:`, error.message);
      }
    }

    // Update user stats
    await user.updatePdfStats();

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired PDF(s)`,
      data: {
        deletedCount,
        deletedSize
      }
    });
  } catch (error) {
    console.error('Cleanup expired PDFs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cleaning up PDFs'
    });
  }
};

module.exports = {
  getPdfLibrary,
  getPdfStats,
  bulkDeletePdfs,
  updatePdfSettings,
  cleanupExpiredPdfs
};
