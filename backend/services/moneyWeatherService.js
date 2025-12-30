/**
 * Money Weather Service Helper
 * Provides quick forecast data for agent use
 */

const { getRecentTransactions } = require('./transactionService');

/**
 * Get quick forecast summary for a user
 * @param {string} userId - User ID
 * @param {number} days - Forecast period in days
 * @returns {Promise<Object>} Forecast summary
 */
async function getQuickForecast(userId, days = 30) {
  try {
    // Get transactions
    const transactions = await getRecentTransactions(userId, days * 2); // Get more history for better average

    if (transactions.length === 0) {
      return {
        currentBalance: 0,
        projectedMinBalance: 0,
        riskLevel: 'unknown',
        dailyAvgIncome: 0,
        dailyAvgExpenses: 0,
      };
    }

    // Calculate current balance (sum of all transactions)
    const currentBalance = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Calculate daily averages
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const recentTx = transactions.filter(tx => tx.timestamp >= thirtyDaysAgo);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeDays = 0;
    let expenseDays = 0;

    const dailyTotals = {};
    recentTx.forEach(tx => {
      const date = new Date(tx.timestamp);
      const dateKey = date.toISOString().split('T')[0];

      if (!dailyTotals[dateKey]) {
        dailyTotals[dateKey] = { income: 0, expenses: 0 };
      }

      if (tx.type === 'credit' || (tx.amount > 0)) {
        dailyTotals[dateKey].income += Math.abs(tx.amount);
      } else {
        dailyTotals[dateKey].expenses += Math.abs(tx.amount);
      }
    });

    Object.values(dailyTotals).forEach(day => {
      if (day.income > 0) {
        totalIncome += day.income;
        incomeDays++;
      }
      if (day.expenses > 0) {
        totalExpenses += day.expenses;
        expenseDays++;
      }
    });

    const avgDailyIncome = incomeDays > 0 ? totalIncome / incomeDays : 0;
    const avgDailyExpenses = expenseDays > 0 ? totalExpenses / expenseDays : 0;
    const netDaily = avgDailyIncome - avgDailyExpenses;

    // Project minimum balance
    let projectedMinBalance = currentBalance;
    let runningBalance = currentBalance;

    for (let i = 0; i < days; i++) {
      runningBalance += netDaily;
      if (runningBalance < projectedMinBalance) {
        projectedMinBalance = runningBalance;
      }
    }

    // Determine risk level
    let riskLevel = 'low';
    if (projectedMinBalance < 0) {
      riskLevel = 'high';
    } else if (projectedMinBalance < (avgDailyExpenses * 7)) {
      riskLevel = 'medium';
    }

    return {
      currentBalance,
      projectedMinBalance,
      riskLevel,
      dailyAvgIncome: avgDailyIncome,
      dailyAvgExpenses: avgDailyExpenses,
      netDaily,
    };
  } catch (error) {
    console.error('[Money Weather Service] Error generating forecast:', error);
    return {
      currentBalance: 0,
      projectedMinBalance: 0,
      riskLevel: 'unknown',
      dailyAvgIncome: 0,
      dailyAvgExpenses: 0,
    };
  }
}

module.exports = {
  getQuickForecast,
};

