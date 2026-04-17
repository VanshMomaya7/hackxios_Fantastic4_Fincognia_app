/**
 * Social Security Service
 * Handles e-Shram mock form operations
 */

import { API_ENDPOINTS } from '../config/env';

export interface MockEShramForm {
  name: string;
  mobile: string;
  email: string;
  ageOrDob: string;
  state: string;
  occupation: string;
  incomeRange: string; // e.g., "<1L", "1-3L", "3-5L", ">5L"
}

export interface PrefillResponse extends MockEShramForm {
  notes?: string; // optional comments from the agent
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  pdfUrl?: string;
}

/**
 * Auto-fill mock e-Shram form using AI agent
 */
export async function autoFillMockForm(userId: string): Promise<PrefillResponse> {
  try {
    console.log('[Social Security Service] Auto-filling form for user:', userId);

    const response = await fetch(API_ENDPOINTS.socialSecurityPrefill, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Social Security Service] API error:', response.status, errorText);
      throw new Error(`Form prefill failed: ${response.status}`);
    }

    const data: PrefillResponse = await response.json();
    
    console.log('[Social Security Service] Form pre-filled successfully');
    return data;
  } catch (error) {
    console.error('[Social Security Service] Error auto-filling form:', error);
    throw error;
  }
}

/**
 * Submit mock e-Shram form and generate PDF
 */
export async function submitMockForm(userId: string, form: MockEShramForm): Promise<SubmitResponse> {
  try {
    console.log('[Social Security Service] Submitting form for user:', userId);

    const response = await fetch(API_ENDPOINTS.socialSecuritySubmit, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, form }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Social Security Service] API error:', response.status, errorText);
      throw new Error(`Form submission failed: ${response.status}`);
    }

    const data: SubmitResponse = await response.json();
    
    console.log('[Social Security Service] Form submitted successfully');
    return data;
  } catch (error) {
    console.error('[Social Security Service] Error submitting form:', error);
    throw error;
  }
}

