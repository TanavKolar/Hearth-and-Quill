'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  getFirebaseAuth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
} from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[Firebase Auth Error]', err);
          setError(err.message || 'Failed to authenticate user.');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('[Firebase Auth Init Error]', err);
      const timer = setTimeout(() => {
        setError(err?.message || 'Firebase Auth initialization failed.');
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('[Sign In Error]', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed. Please click Sign In again to authenticate.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('The browser blocked the sign-in popup. Please allow popups for this site or open in a new tab.');
      } else {
        setError(err?.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOutUser();
    } catch (err: any) {
      console.error('[Sign Out Error]', err);
      setError(err?.message || 'Failed to sign out.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn: handleSignIn,
        signOut: handleSignOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
