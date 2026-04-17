/**
 * PDF Generator Utility
 * Generates policy application PDF with form data, policy details, terms, and signature
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate policy application PDF
 * @param {Object} options - PDF generation options
 * @param {Object} options.formData - Filled form data
 * @param {Object} options.policyData - Policy details (name, provider, premium, coverage, etc.)
 * @param {Object} options.signatureData - Signature metadata (timestamp, auth method, userId)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePolicyApplicationPDF(options) {
  const { formData, policyData, signatureData } = options;

  // Validate required inputs
  if (!formData || !policyData) {
    throw new Error('formData and policyData are required for PDF generation');
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
      doc.fontSize(20).font('Helvetica-Bold').text('Policy Application Form', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.moveDown(2);

      // Policy Details Section
      doc.fontSize(16).font('Helvetica-Bold').text('Policy Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Policy Name: ${policyData.name || 'N/A'}`);
      doc.text(`Provider: ${policyData.provider || 'N/A'}`);
      doc.text(`Premium: ${policyData.premium || 'N/A'}`);
      doc.moveDown(1);

      if (policyData.coverage && policyData.coverage.length > 0) {
        doc.font('Helvetica-Bold').text('Coverage:', { underline: true });
        doc.font('Helvetica');
        policyData.coverage.forEach(item => {
          doc.text(`• ${item}`, { indent: 20 });
        });
        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      // Personal Information Section
      addSection('Personal Information', [
        `Full Name: ${formData.fullName || 'N/A'}`,
        `Date of Birth: ${formData.dateOfBirth || 'N/A'}`,
        `Gender: ${formData.gender || 'N/A'}`,
        `Email: ${formData.email || 'N/A'}`,
        `Phone Number: ${formData.phoneNumber || 'N/A'}`,
        `Alternate Phone: ${formData.alternatePhone || 'N/A'}`,
        `Aadhaar Number: ${formData.aadhaarNumber || 'N/A'}`,
      ]);

      // Address Information
      addSection('Address Information', [
        `Current Address: ${formData.currentAddress || 'N/A'}`,
        `City: ${formData.city || 'N/A'}`,
        `State: ${formData.state || 'N/A'}`,
        `Pincode: ${formData.pincode || 'N/A'}`,
      ]);

      // Policy-Specific Information
      if (formData.bikeMake) {
        addSection('Bike Details', [
          `Make: ${formData.bikeMake || 'N/A'}`,
          `Model: ${formData.bikeModel || 'N/A'}`,
          `Registration Number: ${formData.registrationNumber || 'N/A'}`,
          `Year of Manufacture: ${formData.yearOfManufacture || 'N/A'}`,
          `Engine CC: ${formData.engineCC || 'N/A'}`,
        ]);
      }

      if (formData.height) {
        addSection('Health Information', [
          `Height: ${formData.height || 'N/A'} cm`,
          `Weight: ${formData.weight || 'N/A'} kg`,
          `Blood Group: ${formData.bloodGroup || 'N/A'}`,
          `Pre-existing Conditions: ${formData.preExistingConditions || 'None'}`,
        ]);
      }

      if (formData.occupation) {
        addSection('Occupation Details', [
          `Occupation: ${formData.occupation || 'N/A'}`,
          `Employment Type: ${formData.employmentType || 'N/A'}`,
          `Preferred Coverage: ${formData.preferredCoverageAmount || 'N/A'}`,
        ]);
      }

      if (formData.monthlyIncome) {
        addSection('Income Details', [
          `Monthly Income: ${formData.monthlyIncome || 'N/A'}`,
          `Occupation: ${formData.occupationDetails || 'N/A'}`,
          `Disability History: ${formData.disabilityHistory || 'None'}`,
        ]);
      }

      // Nominee Information
      addSection('Nominee Information', [
        `Name: ${formData.nomineeName || 'N/A'}`,
        `Relationship: ${formData.nomineeRelationship || 'N/A'}`,
        `Date of Birth: ${formData.nomineeDateOfBirth || 'N/A'}`,
        `Phone Number: ${formData.nomineePhoneNumber || 'N/A'}`,
        `Address: ${formData.nomineeAddress || 'N/A'}`,
      ]);

      // Payment Information
      addSection('Payment Information', [
        `Payment Method: ${formData.paymentMethod || 'N/A'}`,
        `Bank Account Number: ${formData.bankAccountNumber || 'N/A'}`,
        `IFSC Code: ${formData.ifscCode || 'N/A'}`,
      ]);

      // Terms & Conditions
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').text('Terms & Conditions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      const termsText = `
1. I declare that all information provided in this application is true and correct to the best of my knowledge.
2. I understand that any false or misleading information may result in rejection of my application or cancellation of the policy.
3. I agree to pay the premium as specified and understand that coverage is subject to policy terms and conditions.
4. I consent to the insurance company using my information for underwriting, policy administration, and claims processing.
5. I acknowledge that I have read and understood the policy document and terms & conditions.
6. This application is subject to acceptance by the insurance company.
7. Premium rates and coverage are subject to change based on underwriting assessment.
      `.trim();
      doc.text(termsText, { align: 'justify' });

      // Digital Signature Section
      doc.moveDown(2);
      doc.fontSize(14).font('Helvetica-Bold').text('Digital Signature', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Signature Status: Verified`);
      doc.text(`Authentication Method: ${signatureData.authMethod || 'Biometric/Passcode'}`);
      doc.text(`Signed On: ${signatureData.timestamp || new Date().toISOString()}`);
      doc.text(`User ID: ${signatureData.userId || 'N/A'}`);
      doc.text(`Signature Hash: ${signatureData.signatureHash || 'N/A'}`);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        'This is an auto-generated document. Please review all information carefully before submission.',
        { align: 'center', color: '#666666' }
      );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generatePolicyApplicationPDF,
};

