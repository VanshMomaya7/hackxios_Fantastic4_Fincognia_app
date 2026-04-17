/**
 * Goal Service
 * Handles financial goals CRUD operations with Firestore
 */

import { firebaseFirestore } from '../config/firebase';
import { useAuthStore } from '../store/useAuthStore';
import type { Goal } from '../types';

/**
 * Get all goals for the current user
 */
export async function getGoals(): Promise<Goal[]> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const snapshot = await firebaseFirestore
      .collection('goals')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Goal));
  } catch (error) {
    console.error('[Goal Service] Error fetching goals:', error);
    throw error;
  }
}

/**
 * Create a new goal
 */
export async function createGoal(goalData: {
  name: string;
  targetAmount: number;
  targetDate: number;
  currentAmount?: number;
  monthlyContribution?: number;
}): Promise<string> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const now = Date.now();

  const goal: Omit<Goal, 'id'> = {
    name: goalData.name,
    targetAmount: goalData.targetAmount,
    targetDate: goalData.targetDate,
    currentAmount: goalData.currentAmount || 0,
    monthlyContribution: goalData.monthlyContribution || 0,
  };

  try {
    const docRef = await firebaseFirestore.collection('goals').add({
      userId,
      ...goal,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error('[Goal Service] Error creating goal:', error);
    throw error;
  }
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, 'name' | 'targetAmount' | 'targetDate' | 'currentAmount' | 'monthlyContribution'>>
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const goalRef = firebaseFirestore.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('Goal not found');
    }

    const goalData = goalDoc.data();
    if (goalData?.userId !== userId) {
      throw new Error('Unauthorized: Goal does not belong to user');
    }

    await goalRef.update({
      ...updates,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('[Goal Service] Error updating goal:', error);
    throw error;
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const goalRef = firebaseFirestore.collection('goals').doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('Goal not found');
    }

    const goalData = goalDoc.data();
    if (goalData?.userId !== userId) {
      throw new Error('Unauthorized: Goal does not belong to user');
    }

    await goalRef.delete();
  } catch (error) {
    console.error('[Goal Service] Error deleting goal:', error);
    throw error;
  }
}

