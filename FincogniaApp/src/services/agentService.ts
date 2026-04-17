/**
 * Agent Service
 * Handles communication with the financial agent backend
 */

import { API_ENDPOINTS } from '../config/env';
import type { AgentMessage, AgentQueryPayload, AgentQueryResult } from '../types/agent';

/**
 * Query the financial agent
 */
export async function queryAgent(payload: AgentQueryPayload): Promise<AgentQueryResult> {
  const { userId, message, history } = payload;

  try {
    console.log('[Agent Service] Querying agent for user:', userId);

    // Prepare history (last 5-10 messages)
    const recentHistory = history ? history.slice(-10) : [];

    const response = await fetch(API_ENDPOINTS.agentQuery, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        history: recentHistory,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Agent Service] API error:', response.status, errorText);
      throw new Error(`Agent query failed: ${response.status}`);
    }

    const result: AgentQueryResult = await response.json();

    console.log('[Agent Service] Agent response received, intent:', result.intent);

    return result;
  } catch (error) {
    console.error('[Agent Service] Error querying agent:', error);
    throw error;
  }
}

