/**
 * Spend Verdict Service
 * Handles split-second spending verdict requests
 */

import { API_ENDPOINTS } from '../config/env';

export type VerdictType = 'YES' | 'NO' | 'DEFER';

export interface SpendVerdictRequest {
  userId: string;
  amount: number;
  description?: string;
  timeframeDays?: number; // Default: 7 days
}

export interface SpendVerdictResponse {
  verdict: VerdictType;
  explanation: string;
  projectedMinBalance?: number;
  bufferAmount?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Get spending verdict for a purchase
 */
export async function getSpendVerdict(request: SpendVerdictRequest): Promise<SpendVerdictResponse> {
  try {
    console.log('[Spend Verdict Service] Requesting verdict:', {
      userId: request.userId,
      amount: request.amount,
      description: request.description,
    });

    const response = await fetch(API_ENDPOINTS.spendVerdict, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: request.userId,
        amount: request.amount,
        description: request.description || '',
        timeframeDays: request.timeframeDays || 7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Spend Verdict Service] API error:', response.status, errorText);
      throw new Error(`Spend verdict failed: ${response.status}`);
    }

    const data: SpendVerdictResponse = await response.json();
    
    console.log('[Spend Verdict Service] Verdict received:', data.verdict);
    return data;
  } catch (error) {
    console.error('[Spend Verdict Service] Error getting verdict:', error);
    throw error;
  }
}

