import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  Timestamp, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  grammarFeedback?: {
    grammar: string;
    suggestions: string;
    coherence: string;
  };
}

interface LessonProgress {
  unlocked: boolean;
  started: boolean;
  completed: boolean;
  minutesSpent: number;
  lastAttempt?: Timestamp;
  completedAt?: Timestamp;
  messages?: any[];
  unlockedAt?: Timestamp;
  createdAt: string;
}

interface UserStats {
  totalMinutes: number;
  lessonsCompleted: number;
  lastCompletedLesson: string;
  lastActiveDay: string;
  weeklyProgress: {
    day: string;
    minutes: number;
    lessonId: string;
    timestamp: string;
  }[];
}

// Helper function to handle Firebase permission errors
const handleFirebaseError = (error: any, fallbackValue: any = null) => {
  console.error('Firebase operation failed:', error);
  
  // Check if it's a permission error
  if (error.code === 'permission-denied' || 
      error.message?.includes('Missing or insufficient permissions')) {
    console.warn('Permission denied. This is likely due to Firestore security rules.');
    
    // Return a fallback value instead of throwing
    return fallbackValue;
  }
  
  // For other errors, we might want to rethrow
  throw error;
};

export const courseProgressService = {
  /**
   * Get lesson progress for a specific user and lesson
   */
  getLessonProgress: async (userId: string, chapterId: string, lessonId: string) => {
    try {
      const progressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        return progressDoc.data() as LessonProgress;
      }
      
      return null;
    } catch (error) {
      return handleFirebaseError(error, null);
    }
  },
  
  /**
   * Get all lesson progress for a chapter
   */
  getChapterProgress: async (userId: string, chapterId: string) => {
    try {
      const progressCollection = collection(db, 'users', userId, 'progress');
      const q = query(progressCollection, where('chapterId', '==', chapterId));
      const querySnapshot = await getDocs(q);
      
      const progress: Record<string, LessonProgress> = {};
      
      querySnapshot.forEach((doc) => {
        const lessonId = doc.id.split('_')[1];
        progress[lessonId] = doc.data() as LessonProgress;
      });
      
      return progress;
    } catch (error) {
      return handleFirebaseError(error, {});
    }
  },
  
  /**
   * Initialize lesson progress if it doesn't exist
   */
  initializeLessonProgress: async (userId: string, chapterId: string, lessonId: string, isFirstLesson: boolean = false) => {
    try {
      const progressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        await setDoc(progressRef, {
          chapterId,
          lessonId,
          unlocked: isFirstLesson,
          started: false,
          completed: false,
          minutesSpent: 0,
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  },
  
  /**
   * Start a lesson session
   */
  startLessonSession: async (userId: string, chapterId: string, lessonId: string) => {
    try {
      const progressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      
      await updateDoc(progressRef, {
        started: true,
        lastAttempt: Timestamp.now(),
        timestamp: serverTimestamp()
      });
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  },
  
  /**
   * Complete a lesson and unlock the next one
   */
  completeLessonAndUnlockNext: async (
    userId: string, 
    chapterId: string, 
    lessonId: string, 
    sessionDuration: number,
    messages: Message[]
  ) => {
    try {
      // Update current lesson progress
      const lessonProgressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      await setDoc(lessonProgressRef, {
        completed: true,
        lastAttempt: Timestamp.now(),
        minutesSpent: Math.floor(sessionDuration / 60),
        messages: messages.map(m => ({
          ...m,
          timestamp: Timestamp.fromDate(m.timestamp)
        })),
        completedAt: Timestamp.now(),
        timestamp: serverTimestamp()
      }, { merge: true });

      // Unlock next lesson
      const nextLessonId = parseInt(lessonId) + 1;
      const nextLessonRef = doc(db, 'users', userId, 'progress', `${chapterId}_${nextLessonId}`);
      const nextLessonDoc = await getDoc(nextLessonRef);
      
      if (!nextLessonDoc.exists()) {
        // Create next lesson progress if it doesn't exist
        await setDoc(nextLessonRef, {
          chapterId,
          lessonId: nextLessonId.toString(),
          unlocked: true,
          started: false,
          completed: false,
          minutesSpent: 0,
          unlockedAt: Timestamp.now(),
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp()
        });
      } else {
        // Update existing next lesson progress
        await updateDoc(nextLessonRef, {
          unlocked: true,
          unlockedAt: Timestamp.now(),
          timestamp: serverTimestamp()
        });
      }

      // Update user stats
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        totalMinutes: increment(Math.floor(sessionDuration / 60)),
        lessonsCompleted: increment(1),
        lastCompletedLesson: `${chapterId}_${lessonId}`,
        lastActiveDay: new Date().toISOString().split('T')[0],
        [`activityLog.${new Date().toISOString().split('T')[0]}`]: increment(1),
        weeklyProgress: arrayUnion({
          day: new Date().toLocaleString('en-US', { weekday: 'short' }),
          minutes: Math.floor(sessionDuration / 60),
          lessonId: `${chapterId}_${lessonId}`,
          timestamp: new Date().toISOString()
        }),
        timestamp: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  },
  
  /**
   * Save partial progress when user leaves a lesson before completion
   */
  savePartialProgress: async (
    userId: string, 
    chapterId: string, 
    lessonId: string, 
    sessionDuration: number,
    messages: Message[]
  ) => {
    try {
      if (sessionDuration <= 0) {
        console.log('No progress to save - session duration is 0');
        return false;
      }

      // First check if the document exists
      const progressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        // Create the document first
        await setDoc(progressRef, {
          chapterId,
          lessonId,
          unlocked: true,
          started: true,
          completed: false,
          minutesSpent: Math.floor(sessionDuration / 60),
          messages: messages.map(m => ({
            ...m,
            timestamp: Timestamp.fromDate(m.timestamp)
          })),
          lastAttempt: Timestamp.now(),
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp()
        });
      } else {
        // Update existing document
        await setDoc(progressRef, {
          lastAttempt: Timestamp.now(),
          minutesSpent: increment(Math.floor(sessionDuration / 60)),
          messages: messages.map(m => ({
            ...m,
            timestamp: Timestamp.fromDate(m.timestamp)
          })),
          timestamp: serverTimestamp()
        }, { merge: true });
      }

      // Update user stats
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          totalMinutes: Math.floor(sessionDuration / 60),
          lessonsCompleted: 0,
          lastActiveDay: new Date().toISOString().split('T')[0],
          [`activityLog.${new Date().toISOString().split('T')[0]}`]: 1,
          weeklyProgress: [{
            day: new Date().toLocaleString('en-US', { weekday: 'short' }),
            minutes: Math.floor(sessionDuration / 60),
            lessonId: `${chapterId}_${lessonId}`,
            timestamp: new Date().toISOString(),
            partial: true
          }],
          timestamp: serverTimestamp()
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          totalMinutes: increment(Math.floor(sessionDuration / 60)),
          lastActiveDay: new Date().toISOString().split('T')[0],
          [`activityLog.${new Date().toISOString().split('T')[0]}`]: increment(1),
          weeklyProgress: arrayUnion({
            day: new Date().toLocaleString('en-US', { weekday: 'short' }),
            minutes: Math.floor(sessionDuration / 60),
            lessonId: `${chapterId}_${lessonId}`,
            timestamp: new Date().toISOString(),
            partial: true
          }),
          timestamp: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  },
  
  /**
   * Save chat message to lesson progress
   */
  saveChatMessage: async (userId: string, chapterId: string, lessonId: string, message: Message) => {
    try {
      const progressRef = doc(db, 'users', userId, 'progress', `${chapterId}_${lessonId}`);
      const progressDoc = await getDoc(progressRef);
      
      if (!progressDoc.exists()) {
        // Create the document first
        await setDoc(progressRef, {
          chapterId,
          lessonId,
          unlocked: true,
          started: true,
          completed: false,
          minutesSpent: 0,
          messages: [{
            ...message,
            timestamp: Timestamp.fromDate(message.timestamp)
          }],
          lastAttempt: Timestamp.now(),
          createdAt: new Date().toISOString(),
          timestamp: serverTimestamp()
        });
      } else {
        // Update existing document
        await updateDoc(progressRef, {
          messages: arrayUnion({
            ...message,
            timestamp: Timestamp.fromDate(message.timestamp)
          }),
          lastAttempt: Timestamp.now(),
          timestamp: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  },
  
  /**
   * Get user learning stats
   */
  getUserStats: async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserStats;
      }
      
      return null;
    } catch (error) {
      return handleFirebaseError(error, null);
    }
  },
  
  /**
   * Update user learning stats
   */
  updateUserStats: async (userId: string, stats: Partial<UserStats>) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create the document if it doesn't exist
        await setDoc(userDocRef, {
          ...stats,
          timestamp: serverTimestamp()
        });
      } else {
        // Update existing document
        await updateDoc(userDocRef, {
          ...stats,
          timestamp: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      return handleFirebaseError(error, false);
    }
  }
};

export default courseProgressService; 