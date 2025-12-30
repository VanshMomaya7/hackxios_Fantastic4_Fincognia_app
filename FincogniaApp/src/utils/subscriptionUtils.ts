/**
 * Subscription Utility Functions
 * Helper functions for subscription detection and analysis
 */

import type { Transaction, Subscription } from '../types';

/**
 * Detect recurring payment patterns from transactions
 */
export function detectRecurringPattern(
  transactions: Transaction[]
): Array<{
  merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  occurrences: number;
  lastPayment: number;
}> {
  if (transactions.length === 0) return [];

  // Group by merchant
  const merchantGroups: {
    [merchant: string]: Transaction[];
  } = {};

  transactions.forEach((tx) => {
    if (!tx.merchant || tx.merchant === 'Other') return;

    const merchant = tx.merchant.trim();
    if (!merchantGroups[merchant]) {
      merchantGroups[merchant] = [];
    }
    merchantGroups[merchant].push(tx);
  });

  const patterns: Array<{
    merchant: string;
    amount: number;
    frequency: 'weekly' | 'monthly' | 'yearly';
    occurrences: number;
    lastPayment: number;
  }> = [];

  Object.entries(merchantGroups).forEach(([merchant, txs]) => {
    // Need at least 2 transactions to detect a pattern
    if (txs.length < 2) return;

    // Sort by timestamp
    const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate average amount (within 10% variance)
    const amounts = sorted.map((tx) => Math.abs(tx.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Check if amounts are similar (within 1 standard deviation)
    const isSimilarAmount = amounts.every((amt) => Math.abs(amt - avgAmount) <= stdDev * 1.5);

    if (!isSimilarAmount) return;

    // Calculate intervals between payments
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const interval = sorted[i].timestamp - sorted[i - 1].timestamp;
      intervals.push(interval);
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const daysInterval = avgInterval / (24 * 60 * 60 * 1000);

    // Determine frequency
    let frequency: 'weekly' | 'monthly' | 'yearly';
    if (daysInterval >= 25 && daysInterval <= 35) {
      frequency = 'monthly';
    } else if (daysInterval >= 6 && daysInterval <= 9) {
      frequency = 'weekly';
    } else if (daysInterval >= 350 && daysInterval <= 380) {
      frequency = 'yearly';
    } else {
      // Not a clear pattern, skip
      return;
    }

    // Check if intervals are consistent (within 20% variance)
    const intervalVariance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    const intervalStdDev = Math.sqrt(intervalVariance);
    const isConsistent = intervals.every((int) => Math.abs(int - avgInterval) <= intervalStdDev * 1.5);

    if (!isConsistent) return;

    // Found a pattern!
    patterns.push({
      merchant,
      amount: avgAmount,
      frequency,
      occurrences: sorted.length,
      lastPayment: sorted[sorted.length - 1].timestamp,
    });
  });

  return patterns;
}

/**
 * Calculate total monthly subscription cost
 */
export function calculateMonthlySubscriptionCost(
  subscriptions: Subscription[]
): number {
  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');

  let total = 0;

  activeSubscriptions.forEach((sub) => {
    if (sub.frequency === 'monthly') {
      total += sub.amount;
    } else if (sub.frequency === 'weekly') {
      total += sub.amount * 4.33; // Approximate weeks per month
    } else if (sub.frequency === 'yearly') {
      total += sub.amount / 12;
    }
  });

  return total;
}

/**
 * Predict next payment date for a subscription
 */
export function predictNextPayment(
  lastPayment: number,
  frequency: 'weekly' | 'monthly' | 'yearly'
): number {
  const lastDate = new Date(lastPayment);
  const nextDate = new Date(lastDate);

  if (frequency === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate.getTime();
}


