import * as admin from 'firebase-admin'

// Check if there's a Firebase app initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

// Export the auth and firestore instances
export const auth = admin.auth();
export const db = admin.firestore();

// Helper function to check if Firebase Admin is initialized
export function isFirebaseAdminInitialized() {
  return admin.apps.length > 0;
}