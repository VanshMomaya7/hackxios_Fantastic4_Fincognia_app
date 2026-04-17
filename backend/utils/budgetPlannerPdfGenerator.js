/**
 * Budget Planner PDF Generator Utility
 * Generates comprehensive budget planner PDF
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Budget Planner PDF
 * @param {Object} options - PDF generation options
 * @param {Object} options.plannerData - Budget planner data
 * @param {Object} options.userProfile - User profile data (name, email, etc.)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateBudgetPlannerPDF(options) {
  const { plannerData, userProfile } = options;

  if (!plannerData) {
    throw new Error('plannerData is required for PDF generation');
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
      doc.fontSize(20).font('Helvetica-Bold').text('Budget Planner – PaisaBuddy', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.moveDown(2);

      // User Information
      if (userProfile) {
        doc.fontSize(14).font('Helvetica-Bold').text('User Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Name: ${userProfile.fullName || userProfile.email || 'N/A'}`);
        doc.text(`Income Type: ${userProfile.incomeType || 'gig'}`);
        doc.moveDown(1);
      }

      // Cash Burnout Analysis
      if (plannerData.cashBurnout) {
        doc.fontSize(14).font('Helvetica-Bold').text('💸 Cash Burnout Analysis', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Current Balance: ₹${plannerData.cashBurnout.currentBalance.toLocaleString('en-IN')}`);
        if (plannerData.cashBurnout.daysUntilZero) {
          doc.text(`Days until balance reaches zero: ${plannerData.cashBurnout.daysUntilZero}`);
          doc.text(`⚠️ Warning: Your current spending pattern will deplete your balance in ${plannerData.cashBurnout.daysUntilZero} days.`);
        } else {
          doc.text('✓ Your balance is projected to remain positive over the next 30 days.');
        }
        doc.moveDown(1);
      }

      // Policy Recommendations
      if (plannerData.policySuggestions && plannerData.policySuggestions.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('🛡️ Policy Recommendations', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        plannerData.policySuggestions.forEach((policy, index) => {
          doc.text(`${index + 1}. ${policy.name} (${policy.type})`);
          doc.text(`   ${policy.description}`, { indent: 20 });
          if (policy.premium) {
            doc.text(`   Monthly Premium: ₹${policy.premium.toLocaleString('en-IN')}`, { indent: 20 });
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Savings Tips
      if (plannerData.savingsTips && plannerData.savingsTips.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('💰 How to Save More', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        plannerData.savingsTips.forEach((tip, index) => {
          doc.text(`${index + 1}. ${tip}`, { indent: 10 });
        });
        doc.moveDown(1);
      }

      // Goals Achievement
      if (plannerData.goalsAchievement && plannerData.goalsAchievement.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('🎯 Achieving Your Goals', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        plannerData.goalsAchievement.forEach((goalPlan, index) => {
          doc.text(`${goalPlan.goalName}`, { continued: false });
          doc.text(`Strategy: ${goalPlan.strategy}`, { indent: 20 });
          if (goalPlan.monthlyContribution) {
            doc.text(`Monthly Contribution: ₹${goalPlan.monthlyContribution.toLocaleString('en-IN')}`, { indent: 20 });
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Income Risk Analysis
      if (plannerData.incomeRisks && plannerData.incomeRisks.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('⚠️ Income Risk Analysis by Month', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        plannerData.incomeRisks.forEach((risk, index) => {
          doc.text(`${risk.month} - Risk Level: ${risk.riskLevel.toUpperCase()}`, { continued: false });
          doc.text(`${risk.description}`, { indent: 20 });
          if (risk.suggestedActions && risk.suggestedActions.length > 0) {
            doc.text('Suggested Actions:', { indent: 20 });
            risk.suggestedActions.forEach(action => {
              doc.text(`• ${action}`, { indent: 30 });
            });
          }
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        'Note: This budget planner is AI-generated based on your transaction history. Review and adjust recommendations according to your specific needs.',
        { align: 'center', color: '#666666' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateBudgetPlannerPDF,
};

