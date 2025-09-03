import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase-config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName?: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to check if email is authorized
  const isEmailAuthorized = (email: string | null): boolean => {
    if (!email) return false;
    
    const allowedEmails = [
      'anitza@albany.edu',
      'jfboswell197@gmail.com',
      'Salvador.Dura-Bernal@downstate.edu',
      'boswell@albany.edu'
    ];
    
    return email.endsWith('@google.com') || allowedEmails.includes(email);
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if the email is authorized
    const email = result.user?.email;
    if (!isEmailAuthorized(email)) {
      // Sign out the user if they don't have an authorized email
      await signOut(auth);
      throw new Error('Access restricted to @google.com email addresses and authorized users only.');
    }
    
    return result;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if the current user has an authorized email
        const email = user.email;
        if (!isEmailAuthorized(email)) {
          // Sign out the user if they don't have an authorized email
          await signOut(auth);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
