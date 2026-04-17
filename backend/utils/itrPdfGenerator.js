/**
 * ITR PDF Generator Utility
 * Generates ITR draft summary PDF
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate ITR draft summary PDF
 * @param {Object} options - PDF generation options
 * @param {Object} options.itrResult - ITR draft result
 * @param {Object} options.userProfile - User profile data (name, email, etc.)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateItrDraftPDF(options) {
  const { itrResult, userProfile } = options;

  if (!itrResult) {
    throw new Error('itrResult is required for PDF generation');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Helper function to add section
      const addSection = (title, content) => {
        doc.fontSize(14).font('Helvetica-Bold').text(title, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        
        if (typeof content === 'string') {
          doc.text(content);
        } else if (Array.isArray(content)) {
          content.forEach(item => {
            doc.text(`• ${item}`, { indent: 20 });
          });
        }
        
        doc.moveDown(1);
      };

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('ITR Draft Summary – PaisaBuddy', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.moveDown(2);

      // User Information
      if (userProfile) {
        doc.fontSize(14).font('Helvetica-Bold').text('Taxpayer Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Name: ${userProfile.fullName || userProfile.email || 'N/A'}`);
        doc.text(`Income Type: ${userProfile.incomeType || 'gig'}`);
        doc.moveDown(1);
      }

      // ITR Details
      doc.fontSize(14).font('Helvetica-Bold').text('ITR Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`ITR Form: ${itrResult.itrForm || 'ITR-4'}`);
      doc.text(`Financial Year: ${itrResult.financialYear || 'N/A'}`);
      doc.moveDown(1);

      // Gross Receipts
      addSection('Gross Receipts', `₹${itrResult.grossReceipts.toLocaleString('en-IN')}`);

      // Presumptive Income
      addSection('Presumptive Income', `₹${itrResult.presumptiveIncome.toLocaleString('en-IN')}`);

      // Expenses Breakdown
      if (itrResult.expensesSummary && Object.keys(itrResult.expensesSummary).length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Expenses Breakdown', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        Object.entries(itrResult.expensesSummary).forEach(([key, value]) => {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
          doc.text(`${label}: ₹${value.toLocaleString('en-IN')}`, { indent: 20 });
        });
        doc.moveDown(1);
      }

      // TDS Credits
      addSection('TDS Credits', `₹${itrResult.tdsCredits.toLocaleString('en-IN')}`);

      // Tax Payable / Refund
      if (itrResult.taxPayable > 0) {
        addSection('Tax Payable', `₹${itrResult.taxPayable.toLocaleString('en-IN')}`);
      } else {
        addSection('Refund', `₹${Math.abs(itrResult.refund).toLocaleString('en-IN')}`);
      }

      // Explanation
      if (itrResult.explanation) {
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        
        // Split explanation by lines/bullets
        const explanationLines = itrResult.explanation.split('\n').filter(line => line.trim());
        explanationLines.forEach(line => {
          doc.text(line.trim(), { indent: 10 });
        });
        doc.moveDown(1);
      }

      // Required Documents for ITR Filing
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').text('Documents Required for ITR Filing', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      const requiredDocuments = [
        'PAN Card (Permanent Account Number)',
        'Aadhaar Card (linked with PAN)',
        'Form 26AS (Tax Credit Statement) - Download from income tax e-filing portal',
        'Bank account statements for the financial year',
        'Platform payout summaries (Zomato/Uber/Rapido/Swiggy, etc.)',
        'TDS certificates (Form 16, Form 16A) if any tax was deducted',
        'Expense receipts and bills (fuel, maintenance, phone, internet, etc.)',
        'Bank account details for tax refund (if applicable)',
        'Investment proofs (if claiming deductions under Section 80C, 80D, etc.)',
        'Rent receipts or home loan interest certificates (if claiming HRA or home loan deductions)',
        'Insurance premium receipts (health, life insurance)',
        'PPF/ELSS/NSC investment statements (for Section 80C deductions)',
        'Medical bills (if claiming medical expenses deduction)',
        'GST registration details (if registered under GST)',
        'Any other income documents (interest certificates, rental income, etc.)',
      ];

      requiredDocuments.forEach((docName, index) => {
        doc.text(`${index + 1}. ${docName}`, { indent: 20 });
      });

      doc.moveDown(1);
      doc.fontSize(9).font('Helvetica-Oblique').text(
        'Note: Keep all original documents safely. You may be required to produce them during assessment.',
        { color: '#666666' }
      );

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        'Note: This is an AI-generated draft. Please review all details before filing your ITR. Consult a tax professional for complex cases.',
        { align: 'center', color: '#666666' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateItrDraftPDF,
};

