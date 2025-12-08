import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  limit
} from "firebase/firestore";
import { User, Message, Gender, UserRole, ChatMode } from '../types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVU-1V1bQa0fqhqHj6rAvcVjB6p64Oo8Q",
  authDomain: "junglevibe-95358.firebaseapp.com",
  projectId: "junglevibe-95358",
  storageBucket: "junglevibe-95358.firebasestorage.app",
  messagingSenderId: "99774574068",
  appId: "1:99774574068:web:55887dadf2853b1e0f5da1",
  measurementId: "G-YX3ZBPD2XK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Collections
const USERS_COLLECTION = 'users';
const MESSAGES_COLLECTION = 'messages';
const WILD_MESSAGES_COLLECTION = 'wild_messages';

// ============ AUTH ============

export const firebaseAuth = {
  // Google Sign In - tries popup first, falls back to redirect
  signInWithGoogle: async (): Promise<FirebaseUser | null> => {
    try {
      // Try popup first (works on desktop)
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      // If popup blocked or failed, use redirect
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        console.log('Popup failed, using redirect...');
        await signInWithRedirect(auth, googleProvider);
        return null; // Will be handled by getRedirectResult
      }
      throw error;
    }
  },

  // Check for redirect result (call on app load)
  checkRedirectResult: async (): Promise<FirebaseUser | null> => {
    try {
      const result = await getRedirectResult(auth);
      return result?.user || null;
    } catch (error) {
      console.error('Redirect result error:', error);
      return null;
    }
  },

  // Sign Out
  signOut: async (): Promise<void> => {
    await signOut(auth);
  },

  // Get current Firebase user
  getCurrentUser: (): FirebaseUser | null => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// ============ USERS ============

export const firebaseUsers = {
  // Create or update user profile
  createOrUpdateUser: async (
    firebaseUser: FirebaseUser, 
    name: string, 
    gender: Gender, 
    avatarUrl: string
  ): Promise<User> => {
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    
    const userData: User = {
      id: firebaseUser.uid,
      name,
      gender,
      role: UserRole.USER,
      avatarUrl,
      isOnline: true
    };

    await setDoc(userRef, {
      ...userData,
      email: firebaseUser.email,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });

    return userData;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User | null> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        name: data.name,
        gender: data.gender,
        role: data.role || UserRole.USER,
        avatarUrl: data.avatarUrl,
        isOnline: data.isOnline || false
      };
    }
    return null;
  },

  // Get all online users
  getOnlineUsers: async (): Promise<User[]> => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('isOnline', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        gender: data.gender,
        role: data.role || UserRole.USER,
        avatarUrl: data.avatarUrl,
        isOnline: true
      };
    });
  },

  // Update online status
  setOnlineStatus: async (userId: string, isOnline: boolean): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    });
  },

  // Listen to online users
  subscribeToOnlineUsers: (callback: (users: User[]) => void) => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('isOnline', '==', true));
    
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          gender: data.gender,
          role: data.role || UserRole.USER,
          avatarUrl: data.avatarUrl,
          isOnline: true
        };
      });
      callback(users);
    });
  }
};

// ============ MESSAGES ============

export const firebaseMessages = {
  // Send a message (Wild or Private)
  sendMessage: async (
    senderId: string,
    senderName: string,
    text: string,
    mode: ChatMode,
    recipientId?: string
  ): Promise<void> => {
    const collectionName = mode === ChatMode.JUNGLE ? WILD_MESSAGES_COLLECTION : MESSAGES_COLLECTION;
    const messagesRef = collection(db, collectionName);

    await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
      createdAt: Date.now(), // Fallback timestamp for ordering
      mode,
      realSenderName: senderName,
      recipientId: recipientId || null,
      // For private chats, create a unique room ID
      roomId: mode === ChatMode.JUNGLE ? 'wild_global' : [senderId, recipientId].sort().join('_')
    });
  },

  // Subscribe to Wild Tribe messages (real-time)
  subscribeToWildMessages: (callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, WILD_MESSAGES_COLLECTION);
    // Simple query without orderBy to avoid index requirement
    const q = query(messagesRef, limit(100));
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toMillis() || data.createdAt || Date.now(),
          mode: ChatMode.JUNGLE,
          realSenderName: data.realSenderName
        };
      });
      // Sort locally by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    }, (error) => {
      console.error('Wild messages subscription error:', error);
      callback([]);
    });
  },

  // Subscribe to Private messages (real-time)
  subscribeToPrivateMessages: (userId: string, recipientId: string, callback: (messages: Message[]) => void) => {
    const roomId = [userId, recipientId].sort().join('_');
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    // Query by roomId only, sort locally
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toMillis() || data.createdAt || Date.now(),
          mode: ChatMode.NORMAL,
          realSenderName: data.realSenderName
        };
      });
      // Sort locally by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    }, (error) => {
      console.error('Private messages subscription error:', error);
      callback([]);
    });
  },

  // Get today's message count for power limit (private chats) - recharges at midnight
  getTodaysMessageCount: async (userId: string, recipientId: string): Promise<number> => {
    const roomId = [userId, recipientId].sort().join('_');
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    
    // Start of today (local time)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();
    
    // Query all messages in this room, then filter locally
    const q = query(
      messagesRef,
      where('roomId', '==', roomId)
    );
    
    try {
      const snapshot = await getDocs(q);
      // Filter locally to get today's messages only
      const todaysMessages = snapshot.docs.filter(doc => {
        const data = doc.data();
        const msgTime = data.timestamp?.toMillis() || data.createdAt || 0;
        return msgTime >= startOfDayMs;
      });
      return todaysMessages.length;
    } catch (error) {
      console.error('Error getting today message count:', error);
      return 0;
    }
  }
};

export { auth, db };
