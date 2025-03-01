import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { action, idToken } = await request.json();
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    if (!decodedToken.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const firestore = getFirestore();

    if (action === 'weeklyProgress') {
      // Migrate weekly progress
      const usersSnapshot = await firestore.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const weeklyProgress = userData.weeklyProgress || [];

        const updatedWeeklyProgress = weeklyProgress.map((progress: any) => {
          if (!progress.timestamp) {
            const now = new Date();
            const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(progress.day);
            const currentDay = now.getDay();
            const diff = dayIndex - currentDay;
            const date = new Date(now);
            date.setDate(date.getDate() + diff);
            
            return {
              ...progress,
              timestamp: date.toISOString()
            };
          }
          return progress;
        });

        await firestore.doc(`users/${userDoc.id}`).update({
          weeklyProgress: updatedWeeklyProgress,
          lastUpdated: new Date()
        });
      }

      return NextResponse.json({ success: true, message: 'Weekly progress migration completed' });
    }

    if (action === 'lastWeekReset') {
      // Add lastWeekReset field
      const usersSnapshot = await firestore.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        await firestore.doc(`users/${userDoc.id}`).update({
          lastWeekReset: new Date(),
          archivedProgress: []
        });
      }

      return NextResponse.json({ success: true, message: 'LastWeekReset field added' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
} 