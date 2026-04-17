/**
 * Document Analysis Service
 * Handles document understanding and policy comparison
 */

import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

export interface KeyFigure {
  label: string;
  value: string;
}

export interface DocumentAnalysisResult {
  docType: string;
  summary: string;
  keyFigures: KeyFigure[];
  risks: string[];
  actions: string[];
  confidence: number;
}

export interface PolicySummary {
  name: string | null;
  summary: string;
  premium: string | null;
  coverage: string[];
  exclusions: string[];
  idealFor: string | null;
}

export interface PolicyRecommendation {
  id: string;
  name: string;
  provider: string;
  premium: string;
  coverage: string[];
  exclusions: string[];
  pros: string[];
  cons: string[];
  idealFor: string;
  whyRecommended: string;
}

export interface PolicyAdvisorResult {
  detectedPolicy: PolicySummary | null;
  recommendations: PolicyRecommendation[];
  verdict: {
    bestPolicyId: string;
    reason: string;
  };
}

export interface PolicyComparisonResult {
  policyA: PolicySummary;
  policyB: PolicySummary;
  comparison: {
    betterForGigWorker: 'A' | 'B' | 'depends';
    reason: string;
    keyDifferences: string[];
  };
}

/**
 * Analyze a single document image
 */
export async function analyzeDocument(
  imageUri: string,
  base64Data?: string,
  mimeType?: string
): Promise<DocumentAnalysisResult> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Prepare form data (React Native FormData)
    const formData = new FormData();

    // Add userId
    formData.append('userId', userId);

    // Add image file using React Native FormData format
    // React Native FormData expects { uri, type, name } format for files
    // Ensure the URI is properly formatted for React Native
    const fileUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
    
    formData.append('file', {
      uri: Platform.OS === 'android' ? fileUri : imageUri.replace('file://', ''),
      type: mimeType || 'image/jpeg',
      name: 'document.jpg',
    } as any);

    console.log('[Document Analysis] Sending document for analysis...');
    console.log('[Document Analysis] API URL:', API_ENDPOINTS.analyzeDocument);
    console.log('[Document Analysis] Image URI:', imageUri.substring(0, 50) + '...');

    const apiResponse = await fetch(API_ENDPOINTS.analyzeDocument, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - React Native will set it with boundary for FormData
        'Accept': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[Document Analysis] API error:', apiResponse.status, errorText);
      throw new Error(`Document analysis failed: ${apiResponse.status}`);
    }

    const result: DocumentAnalysisResult = await apiResponse.json();

    console.log('[Document Analysis] Analysis complete:', result.docType);

    return result;
  } catch (error) {
    console.error('[Document Analysis] Error analyzing document:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message?.includes('Network request failed')) {
      const errorMsg = 
        'Network request failed!\n\n' +
        'Troubleshooting steps:\n\n' +
        '1. Ensure backend server is running:\n   cd backend && npm start\n\n' +
        '2. Check IP address in src/config/env.ts\n   Current URL: ' + API_ENDPOINTS.analyzeDocument + '\n\n' +
        '3. Device and computer must be on same WiFi network\n\n' +
        '4. Test backend connectivity:\n   Open http://YOUR_IP:3000/health in device browser\n\n' +
        '5. Check firewall allows port 3000\n\n' +
        'See DOCUMENT_ASSISTANT_TROUBLESHOOTING.md for detailed help.';
      
      throw new Error(errorMsg);
    }
    
    throw error;
  }
}

/**
 * Get policy advice - either analyze existing policy or recommend new policies
 */
export async function getPolicyAdvice(
  options: {
    imageUri?: string;
    base64Data?: string;
    mimeType?: string;
    policyType?: 'bike' | 'health' | 'accident' | 'income';
    budget?: 'low' | 'medium' | 'high';
    priority?: 'accident' | 'hospital' | 'family' | 'income';
  }
): Promise<PolicyAdvisorResult> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Prepare form data
    const formData = new FormData();

    // Add userId
    formData.append('userId', userId);

    // If image provided, add it (existing policy mode)
    if (options.imageUri) {
      formData.append('file', {
        uri: options.imageUri,
        type: options.mimeType || 'image/jpeg',
        name: 'policy.jpg',
      } as any);
    } else {
      // New policy mode - add form fields
      if (!options.policyType || !options.budget || !options.priority) {
        throw new Error('policyType, budget, and priority are required when no image is provided');
      }
      formData.append('policyType', options.policyType);
      formData.append('budget', options.budget);
      formData.append('priority', options.priority);
    }

    console.log('[Policy Advisor] Sending request...', {
      hasImage: !!options.imageUri,
      policyType: options.policyType,
      budget: options.budget,
      priority: options.priority,
    });

    const apiResponse = await fetch(API_ENDPOINTS.policyAdvisor, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let fetch set it with boundary for FormData
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[Policy Advisor] API error:', apiResponse.status, errorText);
      throw new Error(`Policy advice failed: ${apiResponse.status}`);
    }

    const result: PolicyAdvisorResult = await apiResponse.json();

    console.log('[Policy Advisor] Advice received:', {
      recommendationsCount: result.recommendations?.length || 0,
      hasDetectedPolicy: !!result.detectedPolicy,
    });

    return result;
  } catch (error) {
    console.error('[Policy Advisor] Error getting policy advice:', error);
    throw error;
  }
}

/**
 * Compare two policy documents (deprecated - kept for backward compatibility)
 */
export async function comparePolicies(
  imageUriA: string,
  imageUriB: string,
  base64DataA?: string,
  base64DataB?: string,
  mimeTypeA?: string,
  mimeTypeB?: string
): Promise<PolicyComparisonResult> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Prepare form data
    const formData = new FormData();

    // Add userId
    formData.append('userId', userId);

    // Add both images using React Native FormData format
    formData.append('fileA', {
      uri: imageUriA,
      type: mimeTypeA || 'image/jpeg',
      name: 'policyA.jpg',
      ...(base64DataA && { data: base64DataA }),
    } as any);

    formData.append('fileB', {
      uri: imageUriB,
      type: mimeTypeB || 'image/jpeg',
      name: 'policyB.jpg',
      ...(base64DataB && { data: base64DataB }),
    } as any);

    console.log('[Policy Comparison] Sending policies for comparison...');

    const apiResponse = await fetch(API_ENDPOINTS.comparePolicies, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let fetch set it with boundary for FormData
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[Policy Comparison] API error:', apiResponse.status, errorText);
      throw new Error(`Policy comparison failed: ${apiResponse.status}`);
    }

    const result: PolicyComparisonResult = await apiResponse.json();

    console.log('[Policy Comparison] Comparison complete');

    return result;
  } catch (error) {
    console.error('[Policy Comparison] Error comparing policies:', error);
    throw error;
  }
}

