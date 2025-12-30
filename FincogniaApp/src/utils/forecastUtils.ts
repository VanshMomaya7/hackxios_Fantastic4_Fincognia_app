/**
 * Forecast Utility Functions
 * Helper functions for cashflow forecasting calculations
 */

import type { Forecast, Transaction } from '../types';

/**
 * Calculate projected balance forward based on average income/expenses
 */
export function calculateProjectedBalance(
  currentBalance: number,
  transactions: Transaction[],
  days: number
): Forecast[] {
  if (transactions.length === 0) {
    // No data, return flat line
    const forecasts: Forecast[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      forecasts.push({
        date: date.getTime(),
        predictedBalance: currentBalance,
        confidence: 0.1,
      });
    }
    return forecasts;
  }

  // Calculate average daily income and expenses from last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentTransactions = transactions.filter(
    (tx) => tx.timestamp >= thirtyDaysAgo
  );

  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeDays = 0;
  let expenseDays = 0;

  // Group by day to calculate daily averages
  const dailyTotals: { [date: string]: { income: number; expenses: number } } = {};

  recentTransactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const dateKey = date.toISOString().split('T')[0];

    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = { income: 0, expenses: 0 };
    }

    if (tx.type === 'credit') {
      dailyTotals[dateKey].income += Math.abs(tx.amount);
    } else {
      dailyTotals[dateKey].expenses += Math.abs(tx.amount);
    }
  });

  Object.values(dailyTotals).forEach((day) => {
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
  const avgDailyExpense = expenseDays > 0 ? totalExpenses / expenseDays : 0;
  const avgDailyNet = avgDailyIncome - avgDailyExpense;

  // Calculate confidence based on data quality
  const dataPoints = Object.keys(dailyTotals).length;
  const confidence = Math.min(1, dataPoints / 30); // Higher confidence with more data

  // Project forward
  const forecasts: Forecast[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let projectedBalance = currentBalance;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Add daily net change
    projectedBalance += avgDailyNet;

    forecasts.push({
      date: date.getTime(),
      predictedBalance: projectedBalance,
      confidence,
    });
  }

  return forecasts;
}

/**
 * Determine risk level (low/medium/high) from forecast
 */
export function detectRiskLevel(forecasts: Forecast[]): 'low' | 'medium' | 'high' {
  if (forecasts.length === 0) return 'medium';

  // Check if balance goes negative
  const goesNegative = forecasts.some((f) => f.predictedBalance < 0);
  if (goesNegative) {
    // Check how soon it goes negative
    const firstNegative = forecasts.findIndex((f) => f.predictedBalance < 0);
    if (firstNegative < forecasts.length * 0.2) {
      return 'high'; // Goes negative in first 20% of period
    }
    return 'medium'; // Goes negative but later
  }

  // Check if balance is getting very low (less than 10% of starting balance)
  const startingBalance = forecasts[0]?.predictedBalance || 0;
  const minBalance = Math.min(...forecasts.map((f) => f.predictedBalance));
  
  if (startingBalance > 0 && minBalance < startingBalance * 0.1) {
    return 'medium'; // Low buffer
  }

  // Check volatility (variance in balance)
  const balances = forecasts.map((f) => f.predictedBalance);
  const avgBalance = balances.reduce((a, b) => a + b, 0) / balances.length;
  const variance = balances.reduce((sum, b) => sum + Math.pow(b - avgBalance, 2), 0) / balances.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev > avgBalance * 0.3) {
    return 'medium'; // High volatility
  }

  return 'low'; // Stable and positive
}

/**
 * Calculate when balance hits zero (or null if never)
 */
export function findZeroDate(forecasts: Forecast[]): number | null {
  for (const forecast of forecasts) {
    if (forecast.predictedBalance <= 0) {
      return forecast.date;
    }
  }
  return null;
}

/**
 * Calculate days until balance hits zero
 */
export function calculateDaysUntilZero(
  currentBalance: number,
  avgDailyNet: number
): number | null {
  if (avgDailyNet >= 0) {
    return null; // Never hits zero (income >= expenses)
  }

  const days = Math.floor(currentBalance / Math.abs(avgDailyNet));
  return days > 0 ? days : 0;
}


