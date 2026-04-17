/**
 * Budget Planner Service
 * Handles budget planner data fetching and PDF generation
 */

import { API_ENDPOINTS } from '../config/env';

export interface PolicySuggestion {
  name: string;
  type: string;
  description: string;
  premium?: number;
}

export interface GoalAchievementPlan {
  goalName: string;
  strategy: string;
  monthlyContribution?: number;
}

export interface IncomeRisk {
  month: string;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  suggestedActions?: string[];
}

export interface BudgetPlannerData {
  cashBurnout: {
    currentBalance: number;
    daysUntilZero: number | null;
    projectedBalance: number[];
  };
  policySuggestions: PolicySuggestion[];
  savingsTips: string[];
  goalsAchievement: GoalAchievementPlan[];
  incomeRisks: IncomeRisk[];
}

/**
 * Get comprehensive budget planner data
 */
export async function getBudgetPlannerData(userId: string): Promise<BudgetPlannerData> {
  try {
    console.log('[Budget Planner Service] Requesting planner data for user:', userId);

    const response = await fetch(API_ENDPOINTS.budgetPlanner || `${API_ENDPOINTS.adaptiveBudget}/planner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Budget Planner Service] API error:', response.status, errorText);
      throw new Error(`Budget planner failed: ${response.status}`);
    }

    const result: BudgetPlannerData = await response.json();
    console.log('[Budget Planner Service] Planner data received');
    return result;
  } catch (error) {
    console.error('[Budget Planner Service] Error getting planner data:', error);
    throw error;
  }
}

/**
 * Download budget planner PDF
 */
export async function downloadBudgetPlannerPDF(userId: string): Promise<string | null> {
  try {
    console.log('[Budget Planner Service] Requesting PDF generation for user:', userId);

    const response = await fetch(API_ENDPOINTS.budgetPlannerPDF || `${API_ENDPOINTS.adaptiveBudget}/planner/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Budget Planner Service] PDF API error:', response.status, errorText);
      throw new Error(`PDF generation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Budget Planner Service] PDF URL received:', result.pdfUrl);
    return result.pdfUrl || null;
  } catch (error) {
    console.error('[Budget Planner Service] Error downloading PDF:', error);
    throw error;
  }
}

