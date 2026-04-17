/**
 * Data Ingestion Service
 * Handles saving raw messages and transactions to Firestore
 */

import { firebaseFirestore } from '../config/firebase';

export interface RawMessage {
  id?: string;
  userId: string;
  sender: string;
  body: string;
  receivedAt: number;
  source: 'sms' | 'email';
  parsedTransactionId?: string | null;
  createdAt?: number;
}

export interface TransactionData {
  id?: string;
  userId: string;
  timestamp: number;
  amount: number;
  type: 'credit' | 'debit';
  merchant?: string | null;
  category?: string | null;
  source: 'sms' | 'email' | 'manual';
  rawMessageId?: string | null;
  isRecurring?: boolean;
  account?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Save a raw message (SMS/Email) to Firestore
 */
export async function saveRawMessage(raw: RawMessage): Promise<string> {
  try {
    const messageData: RawMessage = {
      ...raw,
      createdAt: Date.now(),
      parsedTransactionId: raw.parsedTransactionId || null,
    };

    const docRef = await firebaseFirestore.collection('rawMessages').add(messageData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving raw message:', error);
    throw error;
  }
}

/**
 * Save a transaction to Firestore
 */
export async function saveTransaction(tx: TransactionData): Promise<string> {
  try {
    const now = Date.now();
    const transactionData: TransactionData = {
      ...tx,
      createdAt: now,
      updatedAt: now,
      isRecurring: tx.isRecurring || false,
    };

    const docRef = await firebaseFirestore.collection('transactions').add(transactionData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

/**
 * Update a transaction in Firestore
 */
export async function updateTransaction(
  transactionId: string,
  updates: Partial<Omit<TransactionData, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };

    await firebaseFirestore.collection('transactions').doc(transactionId).update(updateData);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

/**
 * Link a raw message to a parsed transaction
 */
export async function linkRawMessageToTransaction(
  rawMessageId: string,
  transactionId: string
): Promise<void> {
  try {
    await firebaseFirestore.collection('rawMessages').doc(rawMessageId).update({
      parsedTransactionId: transactionId,
    });
  } catch (error) {
    console.error('Error linking raw message to transaction:', error);
    throw error;
  }
}


