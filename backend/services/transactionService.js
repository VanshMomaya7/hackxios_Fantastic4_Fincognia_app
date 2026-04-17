/**
 * Transaction Service Helper
 * Fetches transactions from Firestore for agent use
 */

const { firestore } = require('../config/firebaseAdmin');

/**
 * Get recent transactions for a user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Array of transactions
 */
async function getRecentTransactions(userId, days = 30) {
  if (!firestore) {
    console.warn('[Transaction Service] Firestore not initialized');
    return [];
  }

  try {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    // Try query with orderBy first (requires composite index)
    let snapshot;
    try {
      snapshot = await firestore
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '>=', cutoffTime)
        .orderBy('timestamp', 'desc')
        .get();
    } catch (indexError) {
      // If composite index doesn't exist, fetch all and filter client-side
      console.warn('[Transaction Service] Composite index not found, using client-side filtering:', indexError.message);
      snapshot = await firestore
        .collection('transactions')
        .where('userId', '==', userId)
        .get();
      
      // Filter and sort client-side
      const allDocs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(tx => tx.timestamp && tx.timestamp >= cutoffTime)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      console.log(`[Transaction Service] Fetched ${allDocs.length} transactions for user ${userId}`);
      return allDocs;
    }

    if (snapshot.empty) {
      console.log(`[Transaction Service] No transactions found for user ${userId} in last ${days} days`);
      return [];
    }

    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`[Transaction Service] Fetched ${transactions.length} transactions for user ${userId}`);
    return transactions;
  } catch (error) {
    console.error('[Transaction Service] Error fetching transactions:', error);
    return [];
  }
}

module.exports = {
  getRecentTransactions,
};

