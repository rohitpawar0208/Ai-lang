import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase-admin';

export async function migrateWeeklyProgressData(adminUid: string) {
  try {
    // Get admin token to verify permissions
    const adminToken = await getAdminToken(adminUid);
    if (!adminToken?.claims?.admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

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

      await updateDoc(doc(db, 'users', userDoc.id), {
        weeklyProgress: updatedWeeklyProgress,
        lastUpdated: Timestamp.now()
      });

      console.log(`Migrated data for user: ${userDoc.id}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function addLastWeekResetField(adminUid: string) {
  try {
    // Get admin token to verify permissions
    const adminToken = await getAdminToken(adminUid);
    if (!adminToken?.claims?.admin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      await updateDoc(doc(db, 'users', userDoc.id), {
        lastWeekReset: Timestamp.now(),
        archivedProgress: []
      });
    }

    console.log('Added lastWeekReset field to all users');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function getAdminToken(uid: string) {
  try {
    const user = await auth.getUser(uid);
    const { customClaims } = await auth.getUser(uid);
    return { claims: customClaims };
  } catch (error) {
    console.error('Error getting admin token:', error);
    return null;
  }
} 