/**
 * Tax Service Helper
 * Provides quick tax position for agent use
 */

const { firestore } = require('../config/firebaseAdmin');

/**
 * Get quick tax position for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Tax position summary
 */
async function getQuickTaxPosition(userId) {
  if (!firestore) {
    return {
      hasTaxData: false,
      message: 'Tax data service not available',
    };
  }

  try {
    // Check if user has uploaded ITR documents
    // For now, return a simple check - can be enhanced later
    // This is a placeholder that checks for any ITR-related documents
    
    return {
      hasTaxData: false, // Placeholder - enhance with actual document checks
      message: 'You need to upload payout summary and Form 26AS documents first. Use the ITR Filing Assistant in the Coach tab.',
      grossReceipts: 0,
      tdsCredits: 0,
      estimatedTaxableIncome: 0,
    };
  } catch (error) {
    console.error('[Tax Service] Error fetching tax position:', error);
    return {
      hasTaxData: false,
      message: 'Unable to fetch tax position. Please try again later.',
    };
  }
}

module.exports = {
  getQuickTaxPosition,
};

