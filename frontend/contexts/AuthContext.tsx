// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

  /**
   * Security Architecture Notice:
   * 1. Email Verification Requirement: Firebase allows unverified email/password registrations.
   *    Checking user.emailVerified prevents attackers from creating arbitrary accounts claiming
   *    allowed domains (e.g. attacker@google.com).
   * 2. Defense-in-Depth / Server-Side Enforcement:
   *    Client-side checks (signOut, allowlists) are designed for frontend navigation gating only.
   *    Authoritative access control is strictly enforced on the backend Cloud Functions:
   *    - therapy-analysis-function verifies ID tokens, decoded_token.get('email_verified'), and caller authorization.
   *    - storage-access-function validates token claims and restricts bucket access.
   *    - streaming-transcription-service validates token claims before WebSocket streaming.
   *    Sensitive email lists should not be exposed in frontend bundles; backend functions enforce authoritative policies.
   */

  // Helper function to check if email is authorized
  const isEmailAuthorized = (email: string | null): boolean => {
    if (!email) return false;
    
    // Get allowed domains and emails from environment variables
    const allowedDomainsStr = import.meta.env.VITE_AUTH_ALLOWED_DOMAINS || '';
    const allowedEmailsStr = import.meta.env.VITE_AUTH_ALLOWED_EMAILS || '';
    
    const allowedDomains = allowedDomainsStr
      ? allowedDomainsStr.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean)
      : [];
    const allowedEmails = allowedEmailsStr
      ? allowedEmailsStr.split(',').map((e: string) => e.trim().toLowerCase()).filter(Boolean)
      : [];
    
    // If no explicit frontend restrictions configured, allow through (backend verifies claims)
    if (allowedDomains.length === 0 && allowedEmails.length === 0) {
      return true;
    }

    const normalizedEmail = email.toLowerCase();

    // Check explicit email allowlist
    if (allowedEmails.includes(normalizedEmail)) {
      return true;
    }
    
    // Check domain allowlist
    const emailDomain = normalizedEmail.split('@')[1];
    return allowedDomains.includes(emailDomain);
  };

  // Helper function to check if user account is verified and authorized
  const isUserAuthorized = (user: User | null): boolean => {
    if (!user || !user.email) return false;

    // Critical check: require email verification for accounts to prevent domain spoofing
    // (users registering unverified accounts matching allowed domains)
    if (!user.emailVerified) {
      return false;
    }

    return isEmailAuthorized(user.email);
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  };

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!isUserAuthorized(result.user)) {
      await signOut(auth);
      if (result.user && !result.user.emailVerified) {
        throw new Error('Please verify your email address before signing in.');
      }
      throw new Error('Access restricted to authorized domains and users.');
    }
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if the user is authorized and email is verified
    if (!isUserAuthorized(result.user)) {
      await signOut(auth);
      if (result.user && !result.user.emailVerified) {
        throw new Error('Please verify your email address before signing in.');
      }
      throw new Error('Access restricted to authorized domains and users.');
    }
    
    return result;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce user authorization and email verification
        if (!isUserAuthorized(user)) {
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
