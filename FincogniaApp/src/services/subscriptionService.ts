/**
 * Subscription Service
 * Handles subscription detection and management
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { getTransactions } from './transactionService';
import { detectRecurringPattern, predictNextPayment } from '../utils/subscriptionUtils';
import type { Subscription } from '../types';

/**
 * Detect subscriptions from transaction patterns
 */
export async function detectSubscriptions(): Promise<Subscription[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get transactions
  const transactions = await getTransactions(1000);

  // Detect patterns
  const patterns = detectRecurringPattern(transactions);

  // Convert patterns to subscriptions
  const subscriptions: Subscription[] = patterns.map((pattern) => {
    const nextPayment = predictNextPayment(pattern.lastPayment, pattern.frequency);

    return {
      id: `detected_${pattern.merchant}_${pattern.lastPayment}`, // Temporary ID
      userId,
      merchant: pattern.merchant,
      amount: pattern.amount,
      frequency: pattern.frequency,
      lastPayment: pattern.lastPayment,
      nextPayment,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  // Save detected subscriptions to Firestore (if not already exists)
  for (const sub of subscriptions) {
    try {
      // Check if subscription already exists
      const existing = await firebaseFirestore
        .collection('subscriptions')
        .where('userId', '==', userId)
        .where('merchant', '==', sub.merchant)
        .limit(1)
        .get();

      if (existing.empty) {
        // Create new subscription
        await firebaseFirestore.collection('subscriptions').add({
          userId: sub.userId,
          merchant: sub.merchant,
          amount: sub.amount,
          frequency: sub.frequency,
          lastPayment: sub.lastPayment,
          nextPayment: sub.nextPayment,
          status: sub.status,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        });
      } else {
        // Update existing subscription
        const docId = existing.docs[0].id;
        await firebaseFirestore.collection('subscriptions').doc(docId).update({
          amount: sub.amount,
          lastPayment: sub.lastPayment,
          nextPayment: sub.nextPayment,
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error(`Error saving subscription ${sub.merchant}:`, error);
    }
  }

  return subscriptions;
}

/**
 * Get all subscriptions for the current user
 */
export async function getSubscriptions(): Promise<Subscription[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const snapshot = await firebaseFirestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subscription[];
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscription(
  subscriptionId: string,
  status: 'active' | 'paused' | 'cancelled'
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Verify subscription belongs to user
    const doc = await firebaseFirestore.collection('subscriptions').doc(subscriptionId).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new Error('Subscription not found or unauthorized');
    }

    await firebaseFirestore.collection('subscriptions').doc(subscriptionId).update({
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Add a new subscription manually
 */
export async function addSubscription(
  subscription: Omit<Subscription, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'nextPayment'>
): Promise<Subscription> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const nextPayment = subscription.lastPayment
      ? predictNextPayment(subscription.lastPayment, subscription.frequency)
      : undefined;

    const subscriptionData: any = {
      userId,
      merchant: subscription.merchant,
      amount: subscription.amount,
      frequency: subscription.frequency,
      lastPayment: subscription.lastPayment || Date.now(),
      status: subscription.status || 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Only add nextPayment if it's defined
    if (nextPayment) {
      subscriptionData.nextPayment = nextPayment;
    }

    // Only add category if it's defined
    if (subscription.category) {
      subscriptionData.category = subscription.category;
    }

    const docRef = await firebaseFirestore.collection('subscriptions').add(subscriptionData);

    return {
      id: docRef.id,
      ...subscriptionData,
    } as Subscription;
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
}


