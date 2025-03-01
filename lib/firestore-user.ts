import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface UserData {
  name: string;
  email: string;
  avatar_url?: string;
  role: 'free' | 'pro';
  subscription: 'free_tier' | 'pro_tier';
  created_at: Date;
}

export async function createUserDocument(userId: string, userData: Omit<UserData, 'created_at'>) {
  const userRef = doc(db, 'users', userId);
  const newUser: UserData = {
    ...userData,
    created_at: new Date(),
  };
  await setDoc(userRef, newUser);
}

export async function getUserDocument(userId: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserData;
  } else {
    return null;
  }
}

export async function updateUserDocument(userId: string, updateData: Partial<UserData>) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updateData);
}

export async function updateUserSubscription(userId: string, newSubscription: 'free_tier' | 'pro_tier') {
  await updateUserDocument(userId, { 
    subscription: newSubscription,
    role: newSubscription === 'pro_tier' ? 'pro' : 'free'
  });
}
