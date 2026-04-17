/**
 * Policy Form Service
 * Handles auto-filling policy application forms
 */

import { getUserProfile } from './userService';
import { useAuthStore } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../config/env';
import type { PolicyFormData, AutoFillResult, PolicyType } from '../types/policyForm';
import type { PolicyRecommendation } from './documentAnalysisService';

/**
 * Fetch user data from Firebase
 */
export async function fetchUserDataFromFirebase(userId: string): Promise<any> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }
    
    return {
      email: profile.email || '',
      fullName: profile.fullName || '',
      incomeType: profile.incomeType || null,
      dependents: profile.dependents || 0,
      fixedObligations: profile.fixedObligations || 0,
      riskTolerance: profile.riskTolerance || null,
    };
  } catch (error) {
    console.error('[Policy Form] Error fetching user data:', error);
    throw error;
  }
}

/**
 * Auto-fill form with intelligent data from Firebase + Gemini
 */
export async function autoFillFormWithAI(
  policyType: PolicyType,
  userData: any,
  policyDetails: PolicyRecommendation
): Promise<AutoFillResult> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('[Policy Form] Starting auto-fill with AI...');
    console.log('[Policy Form] Policy type:', policyType);
    console.log('[Policy Form] User data:', userData);

    // Prepare request payload
    const payload = {
      userId,
      policyType,
      userData,
      policyDetails: {
        name: policyDetails.name,
        provider: policyDetails.provider,
        premium: policyDetails.premium,
        coverage: policyDetails.coverage,
      },
    };

    const response = await fetch(API_ENDPOINTS.autoFillForm, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Policy Form] API error:', response.status, errorText);
      throw new Error(`Auto-fill failed: ${response.status}`);
    }

    const result: AutoFillResult = await response.json();

    console.log('[Policy Form] Auto-fill complete:', {
      filledFields: result.filledFields?.length || 0,
      generatedFields: result.generatedFields?.length || 0,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    console.error('[Policy Form] Error auto-filling form:', error);
    throw error;
  }
}

/**
 * Get form fields required for a specific policy type
 */
export function getFormFieldsForPolicyType(policyType: PolicyType): string[] {
  const baseFields = [
    'fullName',
    'dateOfBirth',
    'gender',
    'email',
    'phoneNumber',
    'alternatePhone',
    'aadhaarNumber',
    'currentAddress',
    'city',
    'state',
    'pincode',
    'nomineeName',
    'nomineeRelationship',
    'nomineeDateOfBirth',
    'nomineePhoneNumber',
    'nomineeAddress',
    'paymentMethod',
  ];

  const policySpecificFields = {
    bike: ['bikeMake', 'bikeModel', 'registrationNumber', 'yearOfManufacture', 'engineCC'],
    health: ['height', 'weight', 'bloodGroup', 'preExistingConditions', 'anyExistingHealthInsurance'],
    accident: ['occupation', 'employmentType', 'preferredCoverageAmount'],
    income: ['monthlyIncome', 'occupationDetails', 'disabilityHistory'],
  };

  return [...baseFields, ...policySpecificFields[policyType]];
}

