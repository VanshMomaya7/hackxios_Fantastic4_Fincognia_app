/**
 * Quick SMTP Configuration Test Script
 * Run this to verify your SMTP setup before testing the full submission
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('='.repeat(50));
console.log('SMTP Configuration Test');
console.log('='.repeat(50));

// Check environment variables
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

console.log('\n1. Environment Variables:');
console.log('   SMTP_HOST:', smtpHost);
console.log('   SMTP_PORT:', smtpPort);
console.log('   SMTP_USER:', smtpUser ? `${smtpUser.substring(0, 3)}***@${smtpUser.split('@')[1] || 'unknown'}` : '❌ NOT SET');
console.log('   SMTP_PASS:', smtpPass ? '***' : '❌ NOT SET');

if (!smtpUser || !smtpPass) {
  console.error('\n❌ ERROR: SMTP credentials not configured!');
  console.error('   Please add SMTP_USER and SMTP_PASS to backend/.env file');
  process.exit(1);
}

console.log('\n2. Creating transporter...');
try {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  console.log('   ✅ Transporter created successfully');

  console.log('\n3. Verifying connection...');
  transporter.verify((error, success) => {
    if (error) {
      console.error('   ❌ Connection verification failed:');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      if (error.code === 'EAUTH') {
        console.error('\n   💡 This is an authentication error. Common causes:');
        console.error('      - Wrong password (for Gmail, use App Password, not regular password)');
        console.error('      - 2FA not enabled (required for Gmail App Passwords)');
        console.error('      - App Password not generated');
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('\n   💡 Connection error. Check:');
        console.error('      - Internet connection');
        console.error('      - Firewall blocking port', smtpPort);
        console.error('      - SMTP host and port are correct');
      }
      process.exit(1);
    } else {
      console.log('   ✅ Connection verified successfully!');
      console.log('   ✅ SMTP configuration is working correctly');
      console.log('\n' + '='.repeat(50));
      console.log('✅ All checks passed! Your SMTP is configured correctly.');
      console.log('='.repeat(50));
      process.exit(0);
    }
  });
} catch (error) {
  console.error('   ❌ Failed to create transporter:');
  console.error('   Error:', error.message);
  process.exit(1);
}

