const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const PdfRecord = require('../models/PdfRecord');

class PdfService {
  constructor() {
    this.browser = null;
    this.templatePath = path.join(__dirname, '../templates/invoiceTemplate.html');
  }

  // Initialize browser instance
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  // Close browser instance
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Generate invoice HTML template
  async generateInvoiceHTML(invoice, user, options = {}) {
    const {
      format = 'A4',
      includeTerms = true,
      includeLogo = true
    } = options;

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: user.settings.currency || 'USD'
      }).format(amount);
    };

    // Format date
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Calculate totals
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxTotal = invoice.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate;
      return sum + (itemTotal * item.taxRate / 100);
    }, 0);
    
    const discountAmount = invoice.discount.type === 'percent' 
      ? (subtotal * invoice.discount.value) / 100 
      : invoice.discount.value;
    
    const total = subtotal + taxTotal - discountAmount;

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-logo {
            margin-bottom: 20px;
        }
        
        .company-logo img {
            max-height: 60px;
            max-width: 200px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .company-details {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 20px;
        }
        
        .invoice-dates {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .date-item {
            display: flex;
            justify-content: space-between;
            min-width: 200px;
        }
        
        .date-label {
            font-weight: 600;
            color: #374151;
        }
        
        .date-value {
            color: #6b7280;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 10px;
        }
        
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        
        .client-section {
            margin: 40px 0;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
        }
        
        .client-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .client-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }
        
        .client-details {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .items-section {
            margin: 40px 0;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            padding: 16px 12px;
            text-align: left;
            font-size: 14px;
        }
        
        .items-table td {
            padding: 16px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .item-description {
            font-weight: 500;
            color: #1f2937;
        }
        
        .item-quantity, .item-rate, .item-tax, .item-total {
            text-align: right;
            color: #6b7280;
        }
        
        .item-total {
            font-weight: 600;
            color: #1f2937;
        }
        
        .totals-section {
            margin: 40px 0;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-box {
            background: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            min-width: 300px;
            border: 1px solid #e5e7eb;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .total-row:last-child {
            margin-bottom: 0;
            padding-top: 12px;
            border-top: 2px solid #e5e7eb;
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
        }
        
        .total-label {
            color: #6b7280;
        }
        
        .total-value {
            color: #1f2937;
            font-weight: 600;
        }
        
        .footer-section {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .notes-section, .terms-section {
            margin-bottom: 20px;
        }
        
        .notes-content, .terms-content {
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.6;
            color: #6b7280;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body { margin: 0; }
            .invoice-container { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                ${includeLogo && user.company.logo ? `
                <div class="company-logo">
                    <img src="${user.company.logo}" alt="${user.company.name || 'Company Logo'}" />
                </div>
                ` : ''}
                <div class="company-name">${user.company.name || user.name}</div>
                <div class="company-details">
                    ${user.company.address ? `<div>${user.company.address}</div>` : ''}
                    ${user.company.phone ? `<div>Phone: ${user.company.phone}</div>` : ''}
                    ${user.company.gst ? `<div>GST: ${user.company.gst}</div>` : ''}
                </div>
            </div>
            
            <div class="invoice-meta">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div class="invoice-dates">
                    <div class="date-item">
                        <span class="date-label">Issue Date:</span>
                        <span class="date-value">${formatDate(invoice.issueDate)}</span>
                    </div>
                    <div class="date-item">
                        <span class="date-label">Due Date:</span>
                        <span class="date-value">${formatDate(invoice.dueDate)}</span>
                    </div>
                </div>
                <div class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</div>
            </div>
        </div>
        
        <!-- Client Information -->
        <div class="client-section">
            <div class="section-title">Bill To:</div>
            <div class="client-info">
                <div class="client-name">${invoice.client.name}</div>
                <div class="client-details">
                    ${invoice.client.email ? `<div>Email: ${invoice.client.email}</div>` : ''}
                    ${invoice.client.phone ? `<div>Phone: ${invoice.client.phone}</div>` : ''}
                    ${invoice.client.address ? `<div>${invoice.client.address}</div>` : ''}
                    ${invoice.client.gst ? `<div>GST: ${invoice.client.gst}</div>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <div class="items-section">
            <div class="section-title">Items</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Rate</th>
                        <th style="text-align: center;">Tax</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                    <tr>
                        <td class="item-description">${item.description}</td>
                        <td class="item-quantity" style="text-align: center;">${item.quantity}</td>
                        <td class="item-rate" style="text-align: right;">${formatCurrency(item.rate)}</td>
                        <td class="item-tax" style="text-align: center;">${item.taxRate}%</td>
                        <td class="item-total" style="text-align: right;">${formatCurrency(item.quantity * item.rate)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">${formatCurrency(subtotal)}</span>
                </div>
                ${discountAmount > 0 ? `
                <div class="total-row">
                    <span class="total-label">Discount (${invoice.discount.type === 'percent' ? invoice.discount.value + '%' : 'Fixed'}):</span>
                    <span class="total-value">-${formatCurrency(discountAmount)}</span>
                </div>
                ` : ''}
                ${taxTotal > 0 ? `
                <div class="total-row">
                    <span class="total-label">Tax:</span>
                    <span class="total-value">${formatCurrency(taxTotal)}</span>
                </div>
                ` : ''}
                <div class="total-row">
                    <span class="total-label">Total:</span>
                    <span class="total-value">${formatCurrency(total)}</span>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-section">
            ${invoice.notes ? `
            <div class="notes-section">
                <div class="section-title">Notes</div>
                <div class="notes-content">${invoice.notes}</div>
            </div>
            ` : ''}
            
            ${includeTerms && invoice.terms ? `
            <div class="terms-section">
                <div class="section-title">Terms & Conditions</div>
                <div class="terms-content">${invoice.terms}</div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  // Generate PDF from invoice data
  async generatePDF(invoiceId, options = {}) {
    try {
      const Invoice = require('../models/Invoice');
      const User = require('../models/User');
      
      // Get invoice and user data
      const invoice = await Invoice.findById(invoiceId).populate('userId');
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const user = await User.findById(invoice.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate HTML
      const html = await this.generateInvoiceHTML(invoice, user, options);

      // Initialize browser
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set content and wait for fonts to load
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        displayHeaderFooter: false
      });

      await page.close();

      // Save PDF to file
      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(process.env.PDF_STORAGE_PATH || './generated-pdfs', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);

      // Create PDF record
      const pdfRecord = await PdfRecord.create({
        invoiceId: invoice._id,
        userId: user._id,
        fileName,
        filePath,
        fileUrl: `${process.env.PDF_BASE_URL || 'http://localhost:5002/api/pdf/download'}/${fileName}`,
        fileSize: pdfBuffer.length,
        format: options.format || 'A4',
        includeTerms: options.includeTerms !== false
      });

      return {
        pdfBuffer,
        pdfRecord,
        fileName,
        filePath
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  // Get PDF by filename
  async getPDF(fileName) {
    try {
      const filePath = path.join(process.env.PDF_STORAGE_PATH || './generated-pdfs', fileName);
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer;
    } catch (error) {
      console.error('PDF retrieval error:', error);
      throw error;
    }
  }

  // Clean up expired PDFs
  async cleanupExpiredPDFs() {
    try {
      await PdfRecord.cleanupExpired();
    } catch (error) {
      console.error('PDF cleanup error:', error);
    }
  }
}

module.exports = new PdfService();
