const PDFDocument = require('pdfkit');

/**
 * Generate a PDF document for a report
 * @param {Object} report - The report data
 * @returns {Promise<Buffer>} - The PDF as a buffer
 */
exports.generatePdf = async (report) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });
      
      // Collect the PDF data as a buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add content to the PDF
      generateReportPdf(doc, report);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate the content of a report PDF
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} report - The report data
 */
function generateReportPdf(doc, report) {
  // Add the title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Annual Report', { align: 'center' })
     .moveDown(0.5);
  
  // Add the department name
  doc.fontSize(18)
     .font('Helvetica-Bold')
     .text(report.department?.name || 'Department Report', { align: 'center' })
     .moveDown(0.5);
  
  // Add report title
  doc.fontSize(16)
     .text(report.title, { align: 'center' })
     .moveDown();
  
  // Add a horizontal line
  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke()
     .moveDown();
  
  // Add report metadata
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('Report Details', { underline: true })
     .moveDown(0.5);
  
  const metadata = [
    { label: 'Department', value: report.department?.name || 'Unknown Department' },
    { label: 'Academic Year', value: report.year?.toString() || 'Not specified' },
    { label: 'Status', value: report.status || 'Not specified' },
    { label: 'Uploaded By', value: report.uploaderName || 'Unknown' },
    { label: 'Uploaded On', value: report.createdAt ? formatDate(report.createdAt) : 'Unknown' },
    { label: 'Access Level', value: report.isPublic ? 'Public' : 'Restricted' }
  ];
  
  metadata.forEach(item => {
    doc.font('Helvetica-Bold')
       .text(`${item.label}: `, { continued: true })
       .font('Helvetica')
       .text(item.value)
       .moveDown(0.3);
  });
  
  doc.moveDown();
  
  // Add description
  doc.font('Helvetica-Bold')
     .text('Description', { underline: true })
     .moveDown(0.5)
     .font('Helvetica')
     .text(report.description || 'No description provided')
     .moveDown();
  
  // Add a horizontal line
  doc.moveTo(50, doc.y)
     .lineTo(doc.page.width - 50, doc.y)
     .stroke()
     .moveDown();
  
  // Add a footer
  const footerText = `Report ID: ${report.id} • Generated on: ${formatDate(new Date())}`;
  
  doc.fontSize(10)
     .text(footerText, 50, doc.page.height - 50, {
       align: 'center',
       width: doc.page.width - 100
     });
  
  // Add a page number at the bottom
  doc.fontSize(10)
     .text('Page 1 of 1', 50, doc.page.height - 30, {
       align: 'center',
       width: doc.page.width - 100
     });
}

/**
 * Format a date as a readable string
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date string
 */
function formatDate(date) {
  if (!(date instanceof Date)) {
    try {
      date = new Date(date);
    } catch (error) {
      return 'Invalid Date';
    }
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
