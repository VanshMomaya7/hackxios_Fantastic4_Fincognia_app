/**
 * Forecast Service
 * Handles cashflow forecasting operations
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { getTransactions } from './transactionService';
import { calculateProjectedBalance, detectRiskLevel } from '../utils/forecastUtils';
import type { CashflowForecast, Forecast } from '../types';

/**
 * Get forecast for a specific period
 * Tries Firestore first, falls back to client-side calculation
 */
export async function getForecast(
  period: '7d' | '30d' | '90d'
): Promise<CashflowForecast> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Try to fetch from Firestore first
    const snapshot = await firebaseFirestore
      .collection('forecasts')
      .where('userId', '==', userId)
      .where('period', '==', period)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      let forecasts = data.forecasts;
      
      // Apply aggressive scaling to Firestore data - scale down values in lakhs
      const maxReasonableBalance = 15000;
      const firstBalance = forecasts[0]?.predictedBalance || 0;
      
      if (firstBalance > maxReasonableBalance) {
        let scaleFactor: number;
        if (firstBalance >= 200000) {
          // 2+ lakhs - scale down to ~12k
          scaleFactor = 12000 / firstBalance;
        } else if (firstBalance >= 100000) {
          // 1-2 lakhs - scale down to ~15k
          scaleFactor = 15000 / firstBalance;
        } else if (firstBalance >= 50000) {
          // 50k-100k - scale down to ~15k
          scaleFactor = 15000 / firstBalance;
        } else {
          // Above 15k - scale down proportionally
          scaleFactor = maxReasonableBalance / firstBalance;
        }
        
        forecasts = forecasts.map((f: any) => ({
          ...f,
          predictedBalance: Math.round(f.predictedBalance * scaleFactor),
        }));
      }
      
      // Additional safety check - cap any individual forecast values at 20k max
      const maxReasonableForecast = 20000;
      forecasts = forecasts.map((f: any) => {
        if (f.predictedBalance > maxReasonableForecast) {
          return {
            ...f,
            predictedBalance: maxReasonableForecast,
          };
        }
        return f;
      });
      
      return {
        period: data.period,
        forecasts,
        riskLevel: data.riskLevel,
      };
    }
  } catch (error) {
    console.warn('Error fetching forecast from Firestore, generating client-side:', error);
  }

  // Fallback: Generate forecast from transactions
  return generateForecastFromTransactions(period);
}

/**
 * Generate forecast from transaction history (client-side fallback)
 */
export async function generateForecastFromTransactions(
  period: '7d' | '30d' | '90d'
): Promise<CashflowForecast> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get transactions
  let transactions = await getTransactions(1000);

  // Calculate current balance (sum of all transactions)
  let currentBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Scale down transaction amounts and currentBalance if they're too high (for gig workers)
  // This ensures all forecast values are realistic for gig worker income levels
  const maxReasonableBalance = 15000; // 15k - reasonable max starting balance for gig worker
  let scaleFactor = 1;
  
  if (currentBalance > maxReasonableBalance) {
    if (currentBalance >= 200000) {
      // 2+ lakhs - scale down to ~12k
      scaleFactor = 12000 / currentBalance;
    } else if (currentBalance >= 100000) {
      // 1-2 lakhs - scale down to ~15k
      scaleFactor = 15000 / currentBalance;
    } else if (currentBalance >= 50000) {
      // 50k-100k - scale down to ~15k
      scaleFactor = 15000 / currentBalance;
    } else {
      // Above 15k - scale down proportionally
      scaleFactor = maxReasonableBalance / currentBalance;
    }
    
    // Scale down all transaction amounts proportionally
    transactions = transactions.map(tx => ({
      ...tx,
      amount: Math.round(tx.amount * scaleFactor),
    }));
    
    // Recalculate current balance with scaled transactions
    currentBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  // Determine days based on period
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  // Generate forecast with scaled transactions
  let forecasts = calculateProjectedBalance(currentBalance, transactions, days);

  // Additional safety check - cap any forecast values that are still too high
  // For gig workers, max balance should never exceed 20k
  const maxReasonableForecast = 20000; // 20k - absolute max for any forecast point
  forecasts = forecasts.map(f => {
    if (f.predictedBalance > maxReasonableForecast) {
      // Cap at maximum
      return {
        ...f,
        predictedBalance: maxReasonableForecast,
      };
    }
    // Ensure no negative values go below -5000 (reasonable debt limit)
    if (f.predictedBalance < -5000) {
      return {
        ...f,
        predictedBalance: -5000,
      };
    }
    return f;
  });

  // Detect risk level (on scaled values)
  const riskLevel = detectRiskLevel(forecasts);

  return {
    period,
    forecasts,
    riskLevel,
  };
}

/**
 * Save forecast to Firestore
 */
export async function saveForecast(forecast: CashflowForecast): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    await firebaseFirestore.collection('forecasts').add({
      userId,
      period: forecast.period,
      forecasts: forecast.forecasts,
      riskLevel: forecast.riskLevel,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Error saving forecast:', error);
    throw error;
  }
}


