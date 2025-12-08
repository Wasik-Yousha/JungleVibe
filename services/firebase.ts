import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
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
  // Google Sign In
  signInWithGoogle: async (): Promise<FirebaseUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
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
    const q = query(
      messagesRef, 
      orderBy('timestamp', 'asc'),
      limit(100) // Limit to last 100 messages
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          mode: ChatMode.JUNGLE,
          realSenderName: data.realSenderName
        };
      });
      callback(messages);
    });
  },

  // Subscribe to Private messages (real-time)
  subscribeToPrivateMessages: (userId: string, recipientId: string, callback: (messages: Message[]) => void) => {
    const roomId = [userId, recipientId].sort().join('_');
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          mode: ChatMode.NORMAL,
          realSenderName: data.realSenderName
        };
      });
      callback(messages);
    });
  },

  // Get today's message count for power limit (private chats)
  getTodaysMessageCount: async (userId: string, recipientId: string): Promise<number> => {
    const roomId = [userId, recipientId].sort().join('_');
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    
    // Start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      where('timestamp', '>=', Timestamp.fromDate(startOfDay))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  }
};

export { auth, db };
