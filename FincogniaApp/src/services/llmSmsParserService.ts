/**
 * LLM SMS Parser Service
 * Calls backend Gemini API to parse SMS messages
 */

import { API_ENDPOINTS } from '../config/env';

export interface LlmParsedSms {
  id: string;
  isFinancial: boolean;
  channel: string;
  direction: 'debit' | 'credit' | 'unknown';
  amount: number | null;
  currency: string | null;
  counterpartyName: string | null;
  counterpartyHandle: string | null;
  bank: string | null;
  accountType: string | null;
  timestampHint: string | null;
  category: string | null;
  narration: string | null;
  confidence: number;
  shouldSkip: boolean;
}

export interface SmsMessageInput {
  id: string;
  sender: string;
  body: string;
  receivedAt: number;
}

/**
 * Parse a batch of SMS messages using LLM (Gemini API via backend)
 */
export async function parseSmsBatchWithLLM(input: {
  userId: string;
  messages: SmsMessageInput[];
}): Promise<LlmParsedSms[]> {
  if (!input.messages || input.messages.length === 0) {
    return [];
  }

  try {
    console.log(`[LLM Parser] Sending ${input.messages.length} messages to backend for parsing...`);
    console.log(`[LLM Parser] Backend URL: ${API_ENDPOINTS.parseSmsBatch}`);

    const response = await fetch(API_ENDPOINTS.parseSmsBatch, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: input.userId,
        messages: input.messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LLM Parser] Backend error:', response.status, errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error('[LLM Parser] Invalid response format:', data);
      return [];
    }

    console.log(`[LLM Parser] Received ${data.results.length} parsed results`);

    // Map results to our interface
    return data.results.map((result: any) => ({
      id: result.id,
      isFinancial: result.isFinancial ?? false,
      channel: result.channel || 'unknown',
      direction: result.direction || 'unknown',
      amount: result.amount ?? null,
      currency: result.currency || null,
      counterpartyName: result.counterpartyName || null,
      counterpartyHandle: result.counterpartyHandle || null,
      bank: result.bank || null,
      accountType: result.accountType || null,
      timestampHint: result.timestampHint || null,
      category: result.category || 'unknown',
      narration: result.narration || null,
      confidence: result.confidence ?? 0.0,
      shouldSkip: result.shouldSkip ?? false,
    }));
  } catch (error: any) {
    console.error('[LLM Parser] Error calling backend:', error);
    console.error('[LLM Parser] Error details:', {
      message: error.message,
      stack: error.stack,
      url: API_ENDPOINTS.parseSmsBatch,
    });
    console.warn('[LLM Parser] Falling back to regex parsing only');
    console.warn('[LLM Parser] TROUBLESHOOTING:');
    console.warn('  1. Make sure backend server is running: cd backend && npm start');
    console.warn('  2. For physical device, update BACKEND_BASE_URL in src/config/env.ts with your computer IP');
    console.warn('  3. Ensure phone and computer are on the same WiFi network');
    console.warn('  4. Check Windows Firewall allows connections on port 3000');
    // Return empty array - will fall back to regex parsing
    return [];
  }
}

