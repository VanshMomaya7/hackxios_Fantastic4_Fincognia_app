/**
 * Firebase Configuration
 * Initialize Firebase App, Auth, and Firestore
 * 
 * NOTE: React Native Firebase automatically reads configuration from:
 * - Android: android/app/google-services.json
 * - iOS: ios/GoogleService-Info.plist
 * 
 * Make sure to download and place these files in the correct locations.
 * See FIREBASE_SETUP.md for detailed instructions.
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// React Native Firebase automatically initializes from native config files
// No need to call initializeApp() manually

// Export Firebase services
export const firebaseAuth = auth();
export const firebaseFirestore = firestore();

// Export types for convenience
export type { FirebaseAuthTypes, FirebaseFirestoreTypes };

