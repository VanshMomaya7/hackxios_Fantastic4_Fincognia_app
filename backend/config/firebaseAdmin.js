/**
 * Firebase Admin SDK Configuration
 * Used for server-side Firebase operations (e.g., fetching user email from Firestore)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    // Try to use service account key file if available
    const serviceAccountPath = require('path').join(__dirname, '..', 'config', 'firebase-service-account.json');
    const fs = require('fs');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase Admin] Initialized with service account key');
    } else {
      // Fallback: Use environment variables (if configured)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
        console.log('[Firebase Admin] Initialized with environment variables');
      } else {
        console.warn('[Firebase Admin] No service account key found. User email fetching will fail.');
        console.warn('[Firebase Admin] To enable: Add firebase-service-account.json to backend/config/');
      }
    }
  } catch (error) {
    console.error('[Firebase Admin] Error initializing:', error);
  }
}

// Export Firestore instance
const firestore = admin.apps.length > 0 ? admin.firestore() : null;

/**
 * Get user email from Firestore using userId
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<string | null>} User email or null
 */
async function getUserEmail(userId) {
  if (!firestore) {
    console.warn('[Firebase Admin] Firestore not initialized. Cannot fetch user email.');
    return null;
  }

  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.warn(`[Firebase Admin] User document not found for userId: ${userId}`);
      return null;
    }

    const userData = userDoc.data();
    return userData.email || null;
  } catch (error) {
    console.error('[Firebase Admin] Error fetching user email:', error);
    return null;
  }
}

module.exports = {
  getUserEmail,
  firestore,
};

