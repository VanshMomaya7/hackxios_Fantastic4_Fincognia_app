/**
 * Email Service using NodeMailer
 * Sends policy application PDF via email
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration
 */
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    const error = new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file.');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Add timeout to prevent hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
}

/**
 * Send policy application PDF via email
 * @param {Object} options - Email options
 * @param {string} options.toEmail - Recipient email address
 * @param {Buffer} options.pdfBuffer - PDF file buffer
 * @param {Object} options.policyData - Policy details for email content
 * @param {string} options.applicantName - Applicant's name
 * @returns {Promise<Object>} Email send result
 */
async function sendPolicyApplicationEmail(options) {
  const { toEmail, pdfBuffer, policyData, applicantName } = options;

  if (!toEmail) {
    throw new Error('Recipient email is required');
  }

  if (!pdfBuffer) {
    throw new Error('PDF buffer is required');
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@paisabuddy.com',
      to: toEmail,
      subject: `Your ${policyData.name || 'Insurance'} Policy Application - ${new Date().toLocaleDateString('en-IN')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066FF;">Policy Application Confirmed</h2>
          
          <p>Dear ${applicantName || 'Valued Customer'},</p>
          
          <p>Thank you for applying for <strong>${policyData.name || 'your insurance policy'}</strong> with <strong>${policyData.provider || 'the insurance provider'}</strong>.</p>
          
          <h3 style="color: #333;">Application Summary:</h3>
          <ul>
            <li><strong>Policy:</strong> ${policyData.name || 'N/A'}</li>
            <li><strong>Provider:</strong> ${policyData.provider || 'N/A'}</li>
            <li><strong>Premium:</strong> ${policyData.premium || 'N/A'}</li>
            <li><strong>Application Date:</strong> ${new Date().toLocaleString('en-IN')}</li>
          </ul>
          
          <p>Please find attached your complete policy application form in PDF format. This document includes:</p>
          <ul>
            <li>Your filled application form</li>
            <li>Selected policy details and coverage</li>
            <li>Terms and conditions</li>
            <li>Digital signature verification</li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Review the attached PDF document</li>
            <li>Keep a copy for your records</li>
            <li>You will receive further communication from the insurance provider regarding policy approval</li>
          </ol>
          
          <p style="margin-top: 30px;">If you have any questions, please contact us at ${process.env.SMTP_USER || 'support@paisabuddy.com'}</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Policy_Application_${policyData.name?.replace(/\s+/g, '_') || 'Application'}_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    console.log(`[Email Service] Sending email to ${toEmail}...`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Service] Email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    throw error;
  }
}

/**
 * Send e-Shram mock form PDF via email
 * @param {Object} options - Email options
 * @param {string} options.toEmail - Recipient email address
 * @param {Buffer} options.pdfBuffer - PDF file buffer
 * @param {string} options.applicantName - Applicant's name
 * @returns {Promise<Object>} Email send result
 */
async function sendEShramEmail(options) {
  const { toEmail, pdfBuffer, applicantName } = options;

  if (!toEmail) {
    throw new Error('Recipient email is required');
  }

  if (!pdfBuffer) {
    throw new Error('PDF buffer is required');
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@paisabuddy.com',
      to: toEmail,
      subject: `Your Mock e-Shram Registration & Benefits Summary - ${new Date().toLocaleDateString('en-IN')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066FF;">Mock e-Shram Registration Generated</h2>
          
          <p>Dear ${applicantName || 'Valued User'},</p>
          
          <p>We've generated your mock e-Shram registration form and benefits summary.</p>
          
          <div style="background-color: #FFF3CD; padding: 15px; border-left: 4px solid #FFC107; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> This is a mock document for educational purposes only. It is not an official e-Shram registration.</p>
          </div>
          
          <h3 style="color: #333;">What's Included:</h3>
          <ul>
            <li>Your mock e-Shram registration form with auto-filled details</li>
            <li>Benefits summary for unorganized workers</li>
            <li>Next steps for real e-Shram registration</li>
          </ul>
          
          <p><strong>To Register for Real e-Shram:</strong></p>
          <ol>
            <li>Visit the official e-Shram portal: <a href="https://eshram.gov.in">https://eshram.gov.in</a></li>
            <li>Provide your Aadhaar number and mobile number linked to Aadhaar</li>
            <li>Complete the registration with accurate personal and work details</li>
            <li>Receive your e-Shram card (12-digit Universal Account Number - UAN)</li>
          </ol>
          
          <p style="margin-top: 30px;">If you have any questions about labour laws or social security benefits, feel free to ask the PaisaBuddy Agent in the app.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply to this email.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Mock_eShram_Registration_${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    console.log(`[Email Service] Sending e-Shram email to ${toEmail}...`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Service] e-Shram email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[Email Service] Error sending e-Shram email:', error);
    throw error;
  }
}

module.exports = {
  sendPolicyApplicationEmail,
  sendEShramEmail,
  createTransporter,
};

