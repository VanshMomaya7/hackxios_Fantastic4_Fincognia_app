/**
 * Global Type Definitions
 */

// Transaction Types
export interface Transaction {
  id: string;
  userId: string;
  timestamp: number;
  amount: number;
  type: 'credit' | 'debit';
  merchant?: string | null;
  category?: string | null;
  source: 'sms' | 'email' | 'manual';
  rawMessageId?: string | null;
  isRecurring?: boolean;
  account?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

// Forecast Types
export interface Forecast {
  date: number;
  predictedBalance: number;
  confidence: number;
}

export interface CashflowForecast {
  period: '7d' | '30d' | '90d';
  forecasts: Forecast[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Goal Types
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: number;
  currentAmount: number;
  monthlyContribution: number;
}

// User Profile Types
export interface UserProfile {
  id: string;
  incomeType: 'gig' | 'freelance' | 'salaried' | 'mixed';
  fixedObligations: number;
  dependents: number;
  riskTolerance: 'low' | 'medium' | 'high';
  priorities: string[];
}

// Health Score Types
export interface HealthScore {
  overall: number; // 0-100
  volatility: number;
  behavioral: number;
  breakdown: {
    billPayments: number;
    overspending: number;
    subscriptions: number;
    bufferDays: number;
  };
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  lastPayment: number; // timestamp
  nextPayment?: number; // timestamp
  status: 'active' | 'paused' | 'cancelled';
  category?: string;
  createdAt: number;
  updatedAt: number;
}

// Event Types
export interface Event {
  id: string;
  userId: string;
  type: 'bill' | 'recurring' | 'festival' | 'one-time';
  date: number; // timestamp
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  isRecurring?: boolean;
  createdAt: number;
}

// Cash Burn Simulation Types
export interface CashBurnSimulation {
  dailySpend: number;
  daysUntilZero: number | null; // null if never hits zero
  projectedBalance: number[];
  currentBalance: number;
}

