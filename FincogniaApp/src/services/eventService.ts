/**
 * Event Service
 * Handles upcoming events, bills, and recurring payments
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { getTransactions } from './transactionService';
import { detectRecurringPattern, predictNextPayment } from '../utils/subscriptionUtils';
import type { Event } from '../types';

/**
 * Get upcoming events (bills, recurring payments, etc.)
 */
export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const events: Event[] = [];

  try {
    // Get events from Firestore
    const snapshot = await firebaseFirestore
      .collection('events')
      .where('userId', '==', userId)
      .where('date', '>=', Date.now())
      .orderBy('date', 'asc')
      .limit(limit)
      .get();

    events.push(
      ...snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[]
    );
  } catch (error) {
    console.warn('Error fetching events from Firestore:', error);
  }

  // Also detect recurring bills from transactions
  const recurringBills = await detectRecurringBills();
  events.push(...recurringBills);

  // Sort by date and limit
  return events
    .sort((a, b) => a.date - b.date)
    .slice(0, limit);
}

/**
 * Detect recurring bills from transaction patterns
 */
export async function detectRecurringBills(): Promise<Event[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Get transactions
  const transactions = await getTransactions(1000);

  // Detect recurring patterns
  const patterns = detectRecurringPattern(transactions);

  // Convert to events (upcoming payments)
  const events: Event[] = patterns
    .filter((pattern) => {
      // Only include monthly bills (not subscriptions like Netflix)
      return pattern.frequency === 'monthly';
    })
    .map((pattern) => {
      const nextPayment = predictNextPayment(pattern.lastPayment, pattern.frequency);

      return {
        id: `bill_${pattern.merchant}_${nextPayment}`,
        userId,
        type: 'bill' as const,
        date: nextPayment,
        amount: pattern.amount,
        description: `${pattern.merchant} - Monthly Bill`,
        merchant: pattern.merchant,
        isRecurring: true,
        createdAt: Date.now(),
      };
    })
    .filter((event) => event.date >= Date.now()); // Only future events

  return events;
}

/**
 * Create a new event
 */
export async function createEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<string> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = await firebaseFirestore.collection('events').add({
      ...event,
      userId,
      createdAt: Date.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Verify event belongs to user
    const doc = await firebaseFirestore.collection('events').doc(eventId).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new Error('Event not found or unauthorized');
    }

    await firebaseFirestore.collection('events').doc(eventId).delete();
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}


