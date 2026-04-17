/**
 * Buffer Service
 * Handles emergency buffer calculations and tracking
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { getTransactions } from './transactionService';
import { getUserProfile, updateUserProfile } from './userService';
import type { UserProfile } from '../types';
import type { UserProfileData } from './userService';

export interface BufferInfo {
  currentBuffer: number;
  recommendedBuffer: number;
  progress: number; // 0-1
  daysOfExpenses: number;
  volatilityFactor: number;
}

/**
 * Calculate recommended emergency buffer
 */
export async function calculateEmergencyBuffer(): Promise<BufferInfo> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get transactions and user profile
  const transactions = await getTransactions(1000);
  let userProfile: UserProfile | null = null;
  let profileData: UserProfileData | null = null;
  try {
    profileData = await getUserProfile(userId);
    if (profileData) {
      userProfile = {
        id: profileData.uid,
        incomeType: profileData.incomeType || 'mixed',
        fixedObligations: profileData.fixedObligations || 0,
        dependents: profileData.dependents || 0,
        riskTolerance: profileData.riskTolerance || 'medium',
        priorities: profileData.priorities || [],
      };
    }
  } catch (error) {
    console.warn('Could not fetch user profile, using defaults');
  }

  // Calculate current balance (buffer)
  // Check if user has manually set a current buffer, otherwise calculate from transactions
  let currentBuffer: number;
  const customCurrentBuffer = profileData ? (profileData as any)?.customCurrentBuffer : null;
  
  if (customCurrentBuffer !== null && customCurrentBuffer !== undefined && customCurrentBuffer >= 0) {
    // Use manually set current buffer
    currentBuffer = customCurrentBuffer;
  } else {
    // Calculate from transactions
    currentBuffer = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  // Calculate average monthly expenses from last 3 months
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentTransactions = transactions.filter((tx) => tx.timestamp >= threeMonthsAgo);

  const monthlyExpenses: number[] = [];
  const monthlyIncomes: number[] = [];

  // Group by month
  const monthlyData: {
    [month: string]: { income: number; expenses: number };
  } = {};

  recentTransactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    if (tx.type === 'credit') {
      monthlyData[monthKey].income += Math.abs(tx.amount);
    } else {
      monthlyData[monthKey].expenses += Math.abs(tx.amount);
    }
  });

  Object.values(monthlyData).forEach((month) => {
    monthlyExpenses.push(month.expenses);
    monthlyIncomes.push(month.income);
  });

  const avgMonthlyExpenses =
    monthlyExpenses.length > 0
      ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length
      : 0;

  // Calculate income volatility
  let volatilityFactor = 1.0;
  if (monthlyIncomes.length > 1) {
    const avgIncome = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    const variance = monthlyIncomes.reduce(
      (sum, inc) => sum + Math.pow(inc - avgIncome, 2),
      0
    ) / monthlyIncomes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgIncome > 0 ? stdDev / avgIncome : 0;

    // Higher volatility = higher buffer needed
    volatilityFactor = 1 + coefficientOfVariation * 0.5; // 0.5x multiplier
  }

  // Apply risk tolerance multiplier
  const riskTolerance = userProfile?.riskTolerance || 'medium';
  let riskMultiplier = 1.0;
  if (riskTolerance === 'low') {
    riskMultiplier = 1.5; // Conservative: 1.5x
  } else if (riskTolerance === 'high') {
    riskMultiplier = 0.75; // Aggressive: 0.75x
  }

  // Check if user has a custom buffer target set
  let recommendedBuffer: number;
  const customBufferTarget = profileData ? (profileData as any)?.customBufferTarget : null;
  
  if (customBufferTarget && customBufferTarget > 0) {
    // Use custom target if set
    recommendedBuffer = customBufferTarget;
  } else {
    // Recommended buffer = avg monthly expenses × volatility × risk multiplier
    // Typically 3-6 months of expenses
    const baseMonths = 3;
    recommendedBuffer = avgMonthlyExpenses * baseMonths * volatilityFactor * riskMultiplier;
  }

  // Calculate progress (0-1)
  const progress = recommendedBuffer > 0 ? Math.min(1, currentBuffer / recommendedBuffer) : 0;

  // Calculate days of expenses covered
  const avgDailyExpenses = avgMonthlyExpenses / 30;
  const daysOfExpenses = avgDailyExpenses > 0 ? Math.floor(currentBuffer / avgDailyExpenses) : 0;

  return {
    currentBuffer,
    recommendedBuffer,
    progress,
    daysOfExpenses,
    volatilityFactor,
  };
}

/**
 * Get buffer progress (for tracking over time)
 */
export async function getBufferProgress(): Promise<BufferInfo> {
  return calculateEmergencyBuffer();
}

/**
 * Update custom buffer target for user
 */
export async function updateBufferTarget(targetAmount: number): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (targetAmount < 0) {
    throw new Error('Buffer target cannot be negative');
  }

  try {
    await updateUserProfile(userId, {
      customBufferTarget: targetAmount,
    } as any);
  } catch (error) {
    console.error('Error updating buffer target:', error);
    throw error;
  }
}

/**
 * Update current buffer amount (manual override)
 */
export async function updateCurrentBuffer(currentAmount: number): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  if (currentAmount < 0) {
    throw new Error('Current buffer cannot be negative');
  }

  try {
    await updateUserProfile(userId, {
      customCurrentBuffer: currentAmount,
    } as any);
  } catch (error) {
    console.error('Error updating current buffer:', error);
    throw error;
  }
}

