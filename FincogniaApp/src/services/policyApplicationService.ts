/**
 * Policy Application Service
 * Handles policy application submission with PDF generation and email
 */

import { useAuthStore } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../config/env';
import type { PolicyFormData } from '../types/policyForm';
import type { PolicyRecommendation } from './documentAnalysisService';

export interface SignatureData {
  timestamp: string;
  authMethod: 'biometric' | 'passcode';
  signatureHash: string;
}

export interface SubmitApplicationResult {
  success: boolean;
  message: string;
  emailMessageId?: string;
}

/**
 * Submit policy application with digital signature
 */
export async function submitPolicyApplication(
  formData: Partial<PolicyFormData>,
  policyData: PolicyRecommendation,
  signatureData: SignatureData
): Promise<SubmitApplicationResult> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('[Policy Application] Submitting application...');

    const response = await fetch(API_ENDPOINTS.submitPolicyApplication, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        formData,
        policyData: {
          name: policyData.name,
          provider: policyData.provider,
          premium: policyData.premium,
          coverage: policyData.coverage,
          exclusions: policyData.exclusions,
        },
        signatureData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Policy Application] API error:', response.status, errorText);
      throw new Error(`Application submission failed: ${response.status}`);
    }

    const result: SubmitApplicationResult = await response.json();

    console.log('[Policy Application] Application submitted successfully');

    return result;
  } catch (error) {
    console.error('[Policy Application] Error submitting application:', error);
    throw error;
  }
}

