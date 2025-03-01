import { auth } from './firebase-admin';

export async function setUserAsAdmin(email: string) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { admin: true });
    return { success: true };
  } catch (error) {
    console.error('Error setting admin claim:', error);
    return { success: false, error };
  }
} 