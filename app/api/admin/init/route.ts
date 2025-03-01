import { NextResponse } from 'next/server';
import { auth, db, isFirebaseAdminInitialized } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // Check if Firebase Admin is initialized
    if (!isFirebaseAdminInitialized()) {
      throw new Error('Firebase Admin is not initialized');
    }

    const targetEmail = 'aniketbankapur@gmail.com';
    console.log('Starting admin initialization for:', targetEmail);

    try {
      // Get the user
      const user = await auth.getUserByEmail(targetEmail);
      console.log('Found user:', user.uid);

      // Set admin claim
      await auth.setCustomUserClaims(user.uid, { admin: true });
      console.log('Set admin claims for user');

      // Add to admins collection
      await db.collection('admins').doc(user.uid).set({
        email: targetEmail,
        createdAt: new Date()
      });
      console.log('Added user to admins collection');

      return NextResponse.json({ 
        success: true, 
        message: `Successfully set ${targetEmail} as admin`,
        uid: user.uid
      });

    } catch (userError: any) {
      console.error('User operation failed:', userError);
      if (userError.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: 'User not found. Please sign up first.' 
        }, { status: 404 });
      }
      throw userError;
    }

  } catch (error: any) {
    console.error('Init admin failed:', error);
    return NextResponse.json({ 
      error: `Setup failed: ${error.message || 'Unknown error'}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 