import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    // Check if there are any admin users
    const adminsSnapshot = await db.collection('admins').get();
    const isFirstUser = adminsSnapshot.empty;

    // If this is the first user, automatically grant admin access
    if (isFirstUser) {
      await auth.setCustomUserClaims(decodedToken.uid, { admin: true });
      await db.collection('admins').doc(decodedToken.uid).set({
        email: decodedToken.email,
        createdAt: new Date()
      });
      return NextResponse.json({ isAdmin: true });
    }

    const isAdmin = decodedToken.admin === true;
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
} 