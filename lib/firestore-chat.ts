import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  grammarFeedback?: {
    grammar: string;
    suggestions: string;
    coherence: string;
  };
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createChat(userId: string, chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const chatsRef = collection(db, 'chats');
    const chatDoc = doc(chatsRef);
    const newChat: Chat = {
      ...chatData,
      id: chatDoc.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await setDoc(chatDoc, newChat);
    return newChat;
  } catch (error) {
    console.error('Error creating chat:', error);
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to create chats. Please check if you are logged in.');
      }
    }
    throw new Error('Failed to create chat. Please try again later.');
  }
}

export async function getChat(chatId: string): Promise<Chat | null> {
  try {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return chatSnap.data() as Chat;
    }
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to access this chat.');
      }
    }
    throw new Error('Failed to load chat. Please try again later.');
  }
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  try {
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Chat);
  } catch (error) {
    console.error('Error getting user chats:', error);
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to access your chats. Please check if you are logged in.');
      }
      if (error.code === 'failed-precondition') {
        // This error occurs when the index doesn't exist
        console.warn('Index not built yet. Falling back to unordered query...');
        // Fallback to a simpler query without ordering
        const chatsRef = collection(db, 'chats');
        const fallbackQuery = query(chatsRef, where('userId', '==', userId));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return fallbackSnapshot.docs
          .map(doc => doc.data() as Chat)
          // Sort in memory instead
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    }
    throw new Error('Failed to load chats. Please try again later.');
  }
}

export async function updateChat(chatId: string, messages: ChatMessage[]) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      messages,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to update this chat.');
      }
      if (error.code === 'not-found') {
        throw new Error('Chat not found. It may have been deleted.');
      }
    }
    throw new Error('Failed to update chat. Please try again later.');
  }
}

export async function deleteChat(chatId: string) {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error('Error deleting chat:', error);
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to delete this chat.');
      }
      if (error.code === 'not-found') {
        throw new Error('Chat not found. It may have been already deleted.');
      }
    }
    throw new Error('Failed to delete chat. Please try again later.');
  }
} 