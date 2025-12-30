/**
 * Tax Service
 * Handles ITR draft generation API calls
 */

import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../config/env';

export interface ItrDraftResult {
  itrForm: string;                       // e.g. "ITR-4"
  financialYear: string;                 // e.g. "2024-25"
  grossReceipts: number;
  presumptiveIncome: number;
  expensesSummary: Record<string, number>;  // { fuel: 12000, maintenance: 5000, ... }
  tdsCredits: number;
  taxPayable: number;
  refund: number;
  explanation: string;                   // plain-language summary for user
  pdfUrl?: string;                       // or id/path to download
}

/**
 * Generate ITR draft from uploaded documents
 */
export async function generateItrDraft(params: {
  userId: string;
  financialYear: string;
  payoutImage?: { uri: string; mimeType?: string };
  form26asImage?: { uri: string; mimeType?: string };
  bankStatementImage?: { uri: string; mimeType?: string };
}): Promise<ItrDraftResult> {
  const { userId, financialYear, payoutImage, form26asImage, bankStatementImage } = params;

  try {
    console.log('[Tax Service] Generating ITR draft for user:', userId);

    // Create FormData for multipart/form-data request
    const formData = new FormData();

    // Add text fields
    formData.append('userId', userId);
    formData.append('financialYear', financialYear);

    // Add image files if provided
    if (payoutImage?.uri) {
      const fileUri = payoutImage.uri.startsWith('file://') ? payoutImage.uri : `file://${payoutImage.uri}`;
      formData.append('payoutImage', {
        uri: Platform.OS === 'android' ? fileUri : payoutImage.uri.replace('file://', ''),
        type: payoutImage.mimeType || 'image/jpeg',
        name: 'payout.jpg',
      } as any);
    }

    if (form26asImage?.uri) {
      const fileUri = form26asImage.uri.startsWith('file://') ? form26asImage.uri : `file://${form26asImage.uri}`;
      formData.append('form26asImage', {
        uri: Platform.OS === 'android' ? fileUri : form26asImage.uri.replace('file://', ''),
        type: form26asImage.mimeType || 'image/jpeg',
        name: 'form26as.jpg',
      } as any);
    }

    if (bankStatementImage?.uri) {
      const fileUri = bankStatementImage.uri.startsWith('file://') ? bankStatementImage.uri : `file://${bankStatementImage.uri}`;
      formData.append('bankStatementImage', {
        uri: Platform.OS === 'android' ? fileUri : bankStatementImage.uri.replace('file://', ''),
        type: bankStatementImage.mimeType || 'image/jpeg',
        name: 'bankstatement.jpg',
      } as any);
    }

    console.log('[Tax Service] Sending request to:', API_ENDPOINTS.generateItr);

    const response = await fetch(API_ENDPOINTS.generateItr, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - React Native will set it with boundary for FormData
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tax Service] API error:', response.status, errorText);
      throw new Error(`ITR generation failed: ${response.status}`);
    }

    const result: ItrDraftResult = await response.json();

    console.log('[Tax Service] ITR draft generated successfully');

    return result;
  } catch (error) {
    console.error('[Tax Service] Error generating ITR draft:', error);
    throw error;
  }
}

