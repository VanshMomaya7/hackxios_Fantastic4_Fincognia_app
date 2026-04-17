/**
 * Budget Service
 * Handles adaptive budgeting API calls
 */

import { API_ENDPOINTS } from '../config/env';
import type { BudgetPlan, BudgetAlert, BudgetMode } from '../types/budget';

export interface AdaptiveBudgetResponse {
  budgetPlan: BudgetPlan;
  alerts: BudgetAlert[];
}

/**
 * Fetch adaptive budget for a user and month
 */
export async function fetchAdaptiveBudget(params: {
  userId: string;
  month: string; // YYYY-MM format
  mode?: BudgetMode;
}): Promise<AdaptiveBudgetResponse> {
  const { userId, month, mode } = params;

  try {
    // Build query string
    const queryParams = new URLSearchParams({
      userId,
      month,
    });

    if (mode) {
      queryParams.append('mode', mode);
    }

    const url = `${API_ENDPOINTS.adaptiveBudget}?${queryParams.toString()}`;

    console.log('[Budget Service] Fetching adaptive budget:', { userId, month, mode });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Budget Service] API error:', response.status, errorText);
      throw new Error(`Budget fetch failed: ${response.status}`);
    }

    const data: AdaptiveBudgetResponse = await response.json();
    
    console.log('[Budget Service] Budget fetched successfully:', {
      mode: data.budgetPlan.mode,
      confidenceScore: data.budgetPlan.confidenceScore,
      alertsCount: data.alerts.length,
      categoriesCount: data.budgetPlan.categories.length,
    });

    return data;
  } catch (error) {
    console.error('[Budget Service] Error fetching adaptive budget:', error);
    throw error;
  }
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

