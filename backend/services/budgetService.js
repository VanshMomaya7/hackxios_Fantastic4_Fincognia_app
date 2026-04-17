/**
 * Adaptive Budgeting Service
 * Generates auto-budgets, monitors spend velocity, enforces buffer, and generates alerts
 */

const { getRecentTransactions } = require('./transactionService');
const { getQuickForecast } = require('./moneyWeatherService');
const { firestore } = require('../config/firebaseAdmin');

// Category mappings
const CATEGORY_MAP = {
  essentials: ['food', 'groceries', 'rent', 'utilities', 'electricity', 'water', 'gas'],
  fuelWork: ['fuel', 'petrol', 'diesel', 'uber', 'rapido', 'zomato', 'swiggy'],
  subscriptions: ['subscription', 'netflix', 'spotify', 'prime', 'disney'],
  discretionary: ['shopping', 'entertainment', 'leisure', 'dining', 'restaurant', 'cafe'],
};

/**
 * Map transaction category to budget category
 */
function mapToBudgetCategory(transactionCategory) {
  if (!transactionCategory) return 'discretionary'; // Default fallback

  const lowerCategory = transactionCategory.toLowerCase();
  
  for (const [budgetCategory, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(keyword => lowerCategory.includes(keyword))) {
      return budgetCategory;
    }
  }
  
  return 'discretionary';
}

/**
 * Estimate expected monthly income from recent transactions
 */
function estimateMonthlyIncome(transactions, months = 2) {
  const now = Date.now();
  const cutoffDate = now - (months * 30 * 24 * 60 * 60 * 1000);
  
  const incomeTransactions = transactions.filter(tx => {
    if (tx.timestamp < cutoffDate) return false;
    return tx.type === 'credit' || (tx.amount && tx.amount > 0);
  });

  if (incomeTransactions.length === 0) return 0;

  const totalIncome = incomeTransactions.reduce((sum, tx) => {
    return sum + Math.abs(tx.amount || 0);
  }, 0);

  const daysCovered = Math.max(1, Math.floor((now - cutoffDate) / (24 * 60 * 60 * 1000)));
  const dailyAvg = totalIncome / daysCovered;
  const monthlyEstimate = dailyAvg * 30;

  return Math.round(monthlyEstimate);
}

/**
 * Calculate average monthly expenses
 */
function calculateAverageMonthlyExpenses(transactions, days = 60) {
  const now = Date.now();
  const cutoffDate = now - (days * 24 * 60 * 60 * 1000);
  
  const expenseTransactions = transactions.filter(tx => {
    if (tx.timestamp < cutoffDate) return false;
    return tx.type === 'debit' || (tx.amount && tx.amount < 0);
  });

  if (expenseTransactions.length === 0) return 10000; // Default fallback

  const totalExpenses = expenseTransactions.reduce((sum, tx) => {
    return sum + Math.abs(tx.amount || 0);
  }, 0);

  const daysCovered = Math.max(1, Math.floor((now - cutoffDate) / (24 * 60 * 60 * 1000)));
  const dailyAvg = totalExpenses / daysCovered;
  const monthlyAvg = dailyAvg * 30;

  return Math.round(monthlyAvg);
}

/**
 * Calculate income volatility (coefficient of variation)
 */
function calculateIncomeVolatility(transactions) {
  const now = Date.now();
  const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000);
  
  const incomeByMonth = {};
  const incomeTransactions = transactions.filter(tx => {
    if (tx.timestamp < threeMonthsAgo) return false;
    return tx.type === 'credit' || (tx.amount && tx.amount > 0);
  });

  incomeTransactions.forEach(tx => {
    const date = new Date(tx.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!incomeByMonth[monthKey]) {
      incomeByMonth[monthKey] = 0;
    }
    incomeByMonth[monthKey] += Math.abs(tx.amount || 0);
  });

  const monthlyIncomes = Object.values(incomeByMonth);
  if (monthlyIncomes.length < 2) return 0.3; // Default medium volatility

  const mean = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
  const variance = monthlyIncomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyIncomes.length;
  const stdDev = Math.sqrt(variance);
  
  return mean > 0 ? stdDev / mean : 0.5; // Coefficient of variation
}

/**
 * Get current buffer amount from user profile or calculate from transactions
 */
async function getBufferCurrent(userId) {
  if (!firestore) {
    // Fallback: estimate from recent positive net balance
    return 0;
  }

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      // Check if user has a saved buffer/savings field (could be added in future)
      if (userData.bufferAmount !== undefined) {
        return userData.bufferAmount || 0;
      }
    }
  } catch (error) {
    console.error('[Budget Service] Error fetching user buffer:', error);
  }

  return 0; // Default to 0 if not available
}

/**
 * Calculate buffer target based on volatility
 */
function calculateBufferTarget(averageMonthlyExpenses, incomeVolatility) {
  // k factor between 0.5 and 1.5 based on volatility
  // Higher volatility = higher buffer needed
  let k = 0.5 + (incomeVolatility * 1.5); // Scale volatility (0-0.5) to k (0.5-1.25)
  k = Math.min(1.5, Math.max(0.5, k)); // Clamp between 0.5 and 1.5
  
  return Math.round(averageMonthlyExpenses * k);
}

/**
 * Get days in current month
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get current day of month
 */
function getCurrentDayOfMonth() {
  return new Date().getDate();
}

/**
 * Generate budget plan for a user and month
 */
async function generateBudgetPlan(userId, month, options = {}) {
  const { modeOverride } = options;
  
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  
  // Check if this is the current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const isCurrentMonth = year === currentYear && monthNum === currentMonth;
  const currentDay = isCurrentMonth ? getCurrentDayOfMonth() : daysInMonth;
  
  // Fetch transactions (last 90 days)
  const transactions = await getRecentTransactions(userId, 90);
  
  // Estimate income and expenses
  const expectedMonthlyIncome = estimateMonthlyIncome(transactions, 2);
  const averageMonthlyExpenses = calculateAverageMonthlyExpenses(transactions, 60);
  const incomeVolatility = calculateIncomeVolatility(transactions);
  
  // Calculate buffer
  const bufferTarget = calculateBufferTarget(averageMonthlyExpenses, incomeVolatility);
  const bufferCurrent = await getBufferCurrent(userId);
  
  // Determine mode
  let mode = modeOverride || 'normal';
  
  // Auto-suggest mode based on buffer
  if (!modeOverride) {
    if (bufferCurrent < 0.25 * bufferTarget) {
      mode = 'survival';
    } else if (bufferCurrent > bufferTarget && expectedMonthlyIncome > averageMonthlyExpenses * 1.2) {
      mode = 'growth';
    }
  }
  
  // Get current month transactions for spending calculation
  const monthStart = new Date(year, monthNum - 1, 1).getTime();
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999).getTime();
  
  const currentMonthTransactions = transactions.filter(tx => {
    if (!tx.timestamp) return false;
    return tx.timestamp >= monthStart && tx.timestamp <= monthEnd;
  });
  
  // Allocate budget across categories
  const totalAvailable = expectedMonthlyIncome;
  const bufferReserve = Math.min(bufferTarget * 0.1, totalAvailable * 0.1); // Reserve 10% for buffer or max 10% of income
  const spendable = totalAvailable - bufferReserve;
  
  // Base allocation percentages
  const baseAllocations = {
    essentials: 0.40,
    fuelWork: 0.25,
    subscriptions: 0.10,
    discretionary: 0.25,
  };
  
  // Apply mode adjustments
  if (mode === 'survival') {
    baseAllocations.essentials = 0.50;
    baseAllocations.fuelWork = 0.25;
    baseAllocations.subscriptions = 0.05;
    baseAllocations.discretionary = 0.20; // Reduced by ~20%
  } else if (mode === 'growth') {
    baseAllocations.essentials = 0.35;
    baseAllocations.fuelWork = 0.20;
    baseAllocations.subscriptions = 0.10;
    baseAllocations.discretionary = 0.25;
    // Growth mode has additional savings allocation (handled separately)
  }
  
  // Create category allocations
  const categories = Object.entries(baseAllocations).map(([id, percentage]) => {
    const monthlyLimit = Math.round(spendable * percentage);
    
    // Calculate spent this period
    const categoryTransactions = currentMonthTransactions.filter(tx => {
      const txCategory = mapToBudgetCategory(tx.category);
      return txCategory === id && (tx.type === 'debit' || (tx.amount && tx.amount < 0));
    });
    
    const spentThisPeriod = categoryTransactions.reduce((sum, tx) => {
      return sum + Math.abs(tx.amount || 0);
    }, 0);
    
    const remaining = Math.max(0, monthlyLimit - spentThisPeriod);
    const dailyRecommended = monthlyLimit / daysInMonth;
    const burnRate = currentDay > 0 ? spentThisPeriod / currentDay : 0;
    const daysUntilExhausted = burnRate > 0 ? remaining / burnRate : Infinity;
    
    return {
      id,
      label: id === 'fuelWork' ? 'Fuel & Work' : id.charAt(0).toUpperCase() + id.slice(1),
      monthlyLimit,
      spentThisPeriod,
      remaining,
      dailyRecommended,
      burnRate,
      daysUntilExhausted: isFinite(daysUntilExhausted) ? Math.round(daysUntilExhausted * 10) / 10 : Infinity,
    };
  });
  
  // Add growth savings bucket if in growth mode
  if (mode === 'growth') {
    const growthAmount = Math.round((expectedMonthlyIncome - averageMonthlyExpenses) * 0.3);
    categories.push({
      id: 'growth',
      label: 'Growth & Savings',
      monthlyLimit: growthAmount,
      spentThisPeriod: 0,
      remaining: growthAmount,
      dailyRecommended: growthAmount / daysInMonth,
      burnRate: 0,
      daysUntilExhausted: Infinity,
    });
  }
  
  return {
    userId,
    month,
    mode,
    totalPlanned: spendable + (mode === 'growth' ? categories.find(c => c.id === 'growth')?.monthlyLimit || 0 : 0),
    totalIncomeExpected: expectedMonthlyIncome,
    bufferTarget,
    bufferCurrent,
    categories,
    confidenceScore: 0.7, // Will be recalculated later
    lastRecalculatedAt: new Date().toISOString(),
    // Additional data for charts
    incomeVolatility,
    dailySpendData: generateDailySpendData(categories, monthStart, monthEnd, currentMonthTransactions, daysInMonth),
    bufferHistory: await generateBufferHistory(userId, 30, bufferTarget),
  };
}

/**
 * Generate daily spend data for velocity chart
 */
function generateDailySpendData(categories, monthStart, monthEnd, transactions, daysInMonth) {
  const dailyTotals = {};
  
  // Initialize all days
  for (let day = 1; day <= daysInMonth; day++) {
    dailyTotals[day] = { actual: 0, ideal: 0 };
  }
  
  // Calculate ideal daily spend per category
  const idealDailyPerCategory = {};
  categories.forEach(cat => {
    idealDailyPerCategory[cat.id] = cat.dailyRecommended;
  });
  
  // Aggregate actual daily spends
  transactions.forEach(tx => {
    if (tx.type === 'debit' || (tx.amount && tx.amount < 0)) {
      const date = new Date(tx.timestamp);
      const day = date.getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailyTotals[day].actual += Math.abs(tx.amount || 0);
      }
    }
  });
  
  // Calculate cumulative
  const dailySpendData = [];
  let actualCumulative = 0;
  let idealCumulative = 0;
  const totalIdealDaily = Object.values(idealDailyPerCategory).reduce((sum, val) => sum + val, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    actualCumulative += dailyTotals[day].actual;
    idealCumulative += totalIdealDaily;
    
    dailySpendData.push({
      day,
      actualCumulative,
      idealCumulative,
      actualDaily: dailyTotals[day].actual,
    });
  }
  
  return dailySpendData;
}

/**
 * Generate buffer history for the last N days
 */
async function generateBufferHistory(userId, days, bufferTarget) {
  // Simplified: return buffer target as constant line
  // In a full implementation, you'd track buffer changes over time from transactions
  const bufferCurrent = await getBufferCurrent(userId);
  const history = [];
  const now = Date.now();
  
  // For demo: assume buffer grows linearly from 50% to current over the period
  const startBuffer = bufferTarget * 0.5;
  const bufferGrowth = (bufferCurrent - startBuffer) / days;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - (i * 24 * 60 * 60 * 1000));
    const daysAgo = days - i;
    const bufferAmount = Math.max(0, startBuffer + (bufferGrowth * daysAgo));
    
    history.push({
      date: date.toISOString().split('T')[0],
      bufferAmount: Math.round(bufferAmount),
      bufferTarget,
    });
  }
  
  return history;
}

/**
 * Apply mode adjustments to budget plan
 */
function applyModeAdjustments(budgetPlan, mode) {
  if (budgetPlan.mode === mode) {
    return budgetPlan; // No change needed
  }
  
  // Regenerate with new mode (simplified - in practice you'd just adjust allocations)
  return budgetPlan; // Will be regenerated with modeOverride
}

/**
 * Compute alerts for budget plan
 */
function computeAlerts(budgetPlan, transactions) {
  const alerts = [];
  const now = Date.now();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const isCurrentMonth = budgetPlan.month === monthStr;
  
  if (!isCurrentMonth) {
    return alerts; // Only generate alerts for current month
  }
  
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = new Date().getDate();
  const remainingDays = daysInMonth - currentDay;
  
  // Check category at risk
  budgetPlan.categories.forEach(category => {
    if (category.id === 'growth') return; // Skip growth bucket
    
    if (category.daysUntilExhausted < 5 && category.daysUntilExhausted < remainingDays && remainingDays > 5) {
      alerts.push({
        id: `category_${category.id}_${Date.now()}`,
        type: 'CATEGORY_AT_RISK',
        severity: category.daysUntilExhausted < 2 ? 'critical' : 'warning',
        message: `${category.label} budget will run out in ${Math.round(category.daysUntilExhausted)} days`,
        suggestedAction: `Reduce spending in ${category.label} or reallocate from another category`,
      });
    }
    
    // Check velocity
    if (category.burnRate > category.dailyRecommended * 1.5) {
      alerts.push({
        id: `velocity_${category.id}_${Date.now()}`,
        type: 'SPEND_VELOCITY_HIGH',
        severity: category.burnRate > category.dailyRecommended * 2 ? 'warning' : 'info',
        message: `${category.label} spending is ${Math.round((category.burnRate / category.dailyRecommended) * 100)}% faster than recommended`,
      });
    }
  });
  
  // Check buffer
  if (budgetPlan.bufferCurrent < 0.3 * budgetPlan.bufferTarget) {
    alerts.push({
      id: `buffer_low_${Date.now()}`,
      type: 'BUFFER_LOW',
      severity: budgetPlan.bufferCurrent < 0.1 * budgetPlan.bufferTarget ? 'critical' : 'warning',
      message: `Your emergency buffer is low (${Math.round((budgetPlan.bufferCurrent / budgetPlan.bufferTarget) * 100)}% of target)`,
      suggestedAction: 'Consider switching to Survival Mode to rebuild your buffer faster',
    });
  }
  
  // Check mode suggestions
  const recentIncome = transactions.filter(tx => {
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    return tx.timestamp >= sevenDaysAgo && (tx.type === 'credit' || (tx.amount && tx.amount > 0));
  }).reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  
  const expectedWeeklyIncome = budgetPlan.totalIncomeExpected / 4;
  
  if (recentIncome < expectedWeeklyIncome * 0.7 && budgetPlan.mode !== 'survival') {
    alerts.push({
      id: `mode_survival_${Date.now()}`,
      type: 'MODE_SUGGESTION',
      severity: 'warning',
      message: 'Recent income is below average. Consider switching to Survival Mode',
      suggestedAction: 'Switch to Survival Mode',
    });
  } else if (recentIncome > expectedWeeklyIncome * 1.2 && budgetPlan.bufferCurrent > budgetPlan.bufferTarget * 0.8 && budgetPlan.mode !== 'growth') {
    alerts.push({
      id: `mode_growth_${Date.now()}`,
      type: 'MODE_SUGGESTION',
      severity: 'info',
      message: 'Income is strong and buffer is healthy. You can switch to Growth Mode',
      suggestedAction: 'Switch to Growth Mode',
    });
  }
  
  return alerts;
}

/**
 * Compute confidence score for budget plan
 */
function computeConfidenceScore(budgetPlan, incomeVolatility, dataCoverageRatio = 0.8) {
  let score = 1.0;
  
  // Factor 1: Income volatility (higher volatility = lower confidence)
  const volatilityFactor = Math.max(0.3, Math.min(1.0, 1 - incomeVolatility));
  score *= volatilityFactor;
  
  // Factor 2: Data coverage (how many days have transactions)
  const coverageFactor = Math.max(0.2, Math.min(1.0, dataCoverageRatio));
  score *= coverageFactor;
  
  // Factor 3: Buffer health
  const bufferRatio = budgetPlan.bufferTarget > 0 
    ? budgetPlan.bufferCurrent / budgetPlan.bufferTarget 
    : 0.5;
  const bufferFactor = Math.max(0.2, Math.min(1.0, bufferRatio));
  score *= bufferFactor;
  
  score = Math.max(0, Math.min(1, score));
  
  return Math.round(score * 100) / 100;
}

/**
 * Main function to get adaptive budget
 */
async function getAdaptiveBudget(userId, month, modeOverride) {
  try {
    // Fetch transactions
    const transactions = await getRecentTransactions(userId, 90);
    
    // Generate budget plan
    let budgetPlan = await generateBudgetPlan(userId, month, { modeOverride });
    
    // Apply mode override if needed
    if (modeOverride && modeOverride !== budgetPlan.mode) {
      budgetPlan = await generateBudgetPlan(userId, month, { modeOverride });
    }
    
    // Compute confidence score
    const dataCoverageRatio = transactions.length > 30 ? 0.9 : transactions.length / 30;
    budgetPlan.confidenceScore = computeConfidenceScore(
      budgetPlan,
      budgetPlan.incomeVolatility || 0.3,
      dataCoverageRatio
    );
    
    // Compute alerts
    const alerts = computeAlerts(budgetPlan, transactions);
    
    return {
      budgetPlan,
      alerts,
    };
  } catch (error) {
    console.error('[Budget Service] Error generating budget:', error);
    
    // Return fallback budget
    return {
      budgetPlan: {
        userId,
        month,
        mode: 'normal',
        totalPlanned: 0,
        totalIncomeExpected: 0,
        bufferTarget: 0,
        bufferCurrent: 0,
        categories: [],
        confidenceScore: 0.25,
        lastRecalculatedAt: new Date().toISOString(),
        incomeVolatility: 0.5,
        dailySpendData: [],
        bufferHistory: [],
      },
      alerts: [{
        id: 'error_fallback',
        type: 'BUFFER_LOW',
        severity: 'warning',
        message: 'Unable to generate budget. Using fallback data.',
      }],
    };
  }
}

module.exports = {
  getAdaptiveBudget,
  generateBudgetPlan,
  applyModeAdjustments,
  computeAlerts,
  computeConfidenceScore,
};

