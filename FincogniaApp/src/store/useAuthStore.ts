/**
 * Authentication Store (Zustand)
 * Manages authentication state with Firebase Auth
 */

import { create } from 'zustand';
import { firebaseAuth } from '../config/firebase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: string;
    email?: string;
    phone?: string;
  } | null;
  login: (user: AuthState['user']) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: (user) => set({ isAuthenticated: true, user, isLoading: false }),
  logout: async () => {
    try {
      await firebaseAuth.signOut();
      set({ isAuthenticated: false, user: null, isLoading: false });
    } catch (error) {
      console.error('Logout error:', error);
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
  initialize: async () => {
    try {
      // Listen to auth state changes
      firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          set({
            isAuthenticated: true,
            user: {
              id: user.uid,
              email: user.email || undefined,
              phone: user.phoneNumber || undefined,
            },
            isLoading: false,
          });
        } else {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },
}));

