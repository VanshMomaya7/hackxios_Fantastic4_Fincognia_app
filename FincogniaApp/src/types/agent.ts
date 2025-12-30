/**
 * Agent Types
 * Types for the financial agent/chatbot system
 */

export type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

export type AgentIntent =
  | 'generic'
  | 'explain_money'
  | 'can_i_buy'
  | 'fix_month'
  | 'tax_help'
  | 'policy_advice'
  | 'fraud_quiz';

export interface AgentQueryPayload {
  userId: string;
  message: string;
  history?: AgentMessage[];
}

export interface AgentQueryResult {
  messages: AgentMessage[];
  intent: AgentIntent;
  tookActions?: string[];
}

