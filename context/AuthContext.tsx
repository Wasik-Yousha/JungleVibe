import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Gender } from '../types';
import { firebaseAuth, firebaseUsers } from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<FirebaseUser>;
  completeProfile: (name: string, gender: Gender, avatarUrl: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  needsProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // Check if user has a profile in Firestore
        const existingUser = await firebaseUsers.getUserById(fbUser.uid);
        if (existingUser) {
          setUser(existingUser);
          setNeedsProfile(false);
          // Update online status
          firebaseUsers.setOnlineStatus(fbUser.uid, true);
        } else {
          // User authenticated but needs to complete profile
          setNeedsProfile(true);
          setUser(null);
        }
      } else {
        setUser(null);
        setNeedsProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set offline when window closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        firebaseUsers.setOnlineStatus(user.id, false);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const signInWithGoogle = async (): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      const fbUser = await firebaseAuth.signInWithGoogle();
      return fbUser;
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (name: string, gender: Gender, avatarUrl: string) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    
    setLoading(true);
    try {
      const newUser = await firebaseUsers.createOrUpdateUser(firebaseUser, name, gender, avatarUrl);
      setUser(newUser);
      setNeedsProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (user) {
      await firebaseUsers.setOnlineStatus(user.id, false);
    }
    await firebaseAuth.signOut();
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      signInWithGoogle, 
      completeProfile, 
      logout, 
      loading,
      needsProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};