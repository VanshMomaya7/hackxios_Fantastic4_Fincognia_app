/**
 * User Service
 * Handles user profile operations in Firestore
 */

import { firebaseFirestore } from '../config/firebase';
import type { UserProfile } from '../types';

export interface UserProfileData {
  uid: string;
  email: string;
  fullName?: string | null;
  createdAt: number;
  updatedAt: number;
  onboardingComplete: boolean;
  incomeType?: 'gig' | 'freelance' | 'salaried' | 'mixed' | null;
  fixedObligations?: number;
  dependents?: number;
  riskTolerance?: 'low' | 'medium' | 'high' | null;
  priorities?: string[];
}

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(
  uid: string,
  email: string,
  additionalData?: Partial<UserProfileData>
): Promise<void> {
  const now = Date.now();
  
  const userData: UserProfileData = {
    uid,
    email,
    fullName: null,
    createdAt: now,
    updatedAt: now,
    onboardingComplete: false,
    incomeType: null,
    fixedObligations: 0,
    dependents: 0,
    riskTolerance: null,
    priorities: [],
    ...additionalData,
  };

  try {
    await firebaseFirestore.collection('users').doc(uid).set(userData);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const doc = await firebaseFirestore.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return doc.data() as UserProfileData;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfileData, 'uid' | 'createdAt' | 'email'>>
): Promise<void> {
  try {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    };
    
    await firebaseFirestore.collection('users').doc(uid).update(updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Check if user profile exists
 */
export async function userProfileExists(uid: string): Promise<boolean> {
  try {
    const doc = await firebaseFirestore.collection('users').doc(uid).get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
}


