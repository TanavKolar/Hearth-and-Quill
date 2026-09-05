import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, addDoc, getDocs, query, orderBy, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import rawConfig from '@/firebase-applet-config.json';

// Defensive configuration with fallback to environment variables
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || rawConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || rawConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || rawConfig.appId,
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || rawConfig.firestoreDatabaseId,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    if (!getApps().length) {
      return initializeApp(firebaseConfig);
    }
    return getApp();
  }

  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    const currentApp = getFirebaseApp();
    const databaseId = firebaseConfig.firestoreDatabaseId;
    if (databaseId && databaseId !== '(default)') {
      db = getFirestore(currentApp, databaseId);
    } else {
      db = getFirestore(currentApp);
    }
  }
  return db;
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function signInWithGoogle() {
  const firebaseAuth = getFirebaseAuth();
  return await signInWithPopup(firebaseAuth, googleAuthProvider);
}

export async function signOutUser() {
  const firebaseAuth = getFirebaseAuth();
  return await signOut(firebaseAuth);
}

/**
 * Strips all undefined properties from an object before saving to Firestore.
 * Prevents Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key] = stripUndefined(value);
      } else if (Array.isArray(value)) {
        result[key] = value
          .map((item) => (item !== null && typeof item === 'object' ? stripUndefined(item) : item))
          .filter((item) => item !== undefined);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

export {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  onAuthStateChanged,
};
export type { User };
