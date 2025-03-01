import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if the user exists
    const user = await auth.getUserByEmail(email);
    
    // Check if requester is admin or if this is first-time setup
    const adminsSnapshot = await db.collection('admins').get();
    const isFirstSetup = adminsSnapshot.empty;

    if (!isFirstSetup) {
      // For subsequent admin creations, verify the requester is an admin
      const existingAdminDoc = await db.collection('admins').doc(user.uid).get();
      if (!existingAdminDoc.exists) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Set admin claim
    await auth.setCustomUserClaims(user.uid, { admin: true });
    
    // Add to admins collection
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully set ${email} as admin`,
      uid: user.uid
    });

  } catch (error: any) {
    console.error('Admin setup failed:', error);
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ 
        error: 'User not found. Please ensure the user has signed up first.' 
      }, { status: 404 });
    }
    return NextResponse.json({ 
      error: `Setup failed: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
} 