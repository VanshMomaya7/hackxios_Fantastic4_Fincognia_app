/**
 * Transaction Service
 * Handles transaction operations with Firestore
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import type { Transaction } from '../types';

/**
 * Get transactions for the current user
 */
export async function getTransactions(
  limit?: number,
  startAfter?: number
): Promise<Transaction[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    let query = firebaseFirestore
      .collection('transactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');

    if (limit) {
      query = query.limit(limit) as any;
    }

    if (startAfter) {
      const startAfterDoc = await firebaseFirestore
        .collection('transactions')
        .where('userId', '==', userId)
        .where('timestamp', '==', startAfter)
        .limit(1)
        .get();
      
      if (!startAfterDoc.empty) {
        query = query.startAfter(startAfterDoc.docs[0]) as any;
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Get transactions grouped by date
 */
export async function getTransactionsGroupedByDate(
  limit?: number
): Promise<{ [date: string]: Transaction[] }> {
  const transactions = await getTransactions(limit);
  
  const grouped: { [date: string]: Transaction[] } = {};
  
  transactions.forEach((tx) => {
    const date = new Date(tx.timestamp);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(tx);
  });
  
  return grouped;
}

/**
 * Update transaction category
 */
export async function updateTransactionCategory(
  transactionId: string,
  category: string
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    await firebaseFirestore.collection('transactions').doc(transactionId).update({
      category,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating transaction category:', error);
    throw error;
  }
}

/**
 * Get transactions by category
 */
export async function getTransactionsByCategory(
  category: string
): Promise<Transaction[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const snapshot = await firebaseFirestore
      .collection('transactions')
      .where('userId', '==', userId)
      .where('category', '==', category)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions by category:', error);
    throw error;
  }
}

/**
 * Search transactions by merchant or category
 */
export async function searchTransactions(
  searchTerm: string
): Promise<Transaction[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Firestore doesn't support full-text search, so we fetch all and filter
    // In production, consider using Algolia or similar
    const allTransactions = await getTransactions(1000);
    
    const lowerSearch = searchTerm.toLowerCase();
    return allTransactions.filter(
      (tx) =>
        tx.merchant?.toLowerCase().includes(lowerSearch) ||
        tx.category?.toLowerCase().includes(lowerSearch)
    );
  } catch (error) {
    console.error('Error searching transactions:', error);
    throw error;
  }
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Verify transaction belongs to user before deleting
    const transactionDoc = await firebaseFirestore
      .collection('transactions')
      .doc(transactionId)
      .get();

    if (!transactionDoc.exists) {
      throw new Error('Transaction not found');
    }

    const transactionData = transactionDoc.data();
    if (transactionData?.userId !== userId) {
      throw new Error('Unauthorized: Transaction does not belong to user');
    }

    // Delete the transaction
    await firebaseFirestore.collection('transactions').doc(transactionId).delete();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

