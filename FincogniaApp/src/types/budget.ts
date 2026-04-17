/**
 * Budget Types
 * Type definitions for Adaptive Budgeting feature
 */

export type BudgetMode = 'survival' | 'normal' | 'growth';

export interface BudgetCategoryAllocation {
  id: string; // 'essentials', 'fuel', 'subscriptions', 'leisure', etc.
  label: string;
  monthlyLimit: number;
  spentThisPeriod: number;
  remaining: number;
  dailyRecommended: number; // for velocity
  burnRate: number; // actual daily spend
  daysUntilExhausted: number; // based on burnRate
}

export interface BudgetPlan {
  userId: string;
  month: string; // 'YYYY-MM' format, e.g., '2025-11'
  mode: BudgetMode;
  totalPlanned: number;
  totalIncomeExpected: number;
  bufferTarget: number;
  bufferCurrent: number;
  categories: BudgetCategoryAllocation[];
  confidenceScore: number; // 0–1
  lastRecalculatedAt: string; // ISO date string
  incomeVolatility?: number;
  dailySpendData?: DailySpendData[];
  bufferHistory?: BufferHistoryPoint[];
}

export interface BudgetAlert {
  id: string;
  type:
    | 'SPEND_VELOCITY_HIGH'
    | 'BUFFER_LOW'
    | 'MODE_SUGGESTION'
    | 'CATEGORY_AT_RISK';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction?: string;
}

/**
 * Daily spend data for velocity chart
 */
export interface DailySpendData {
  day: number; // Day of month (1-31)
  actualCumulative: number;
  idealCumulative: number;
  actualDaily: number;
}

/**
 * Buffer history data point
 */
export interface BufferHistoryPoint {
  date: string; // ISO date string
  bufferAmount: number;
  bufferTarget: number;
}

