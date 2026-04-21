import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Environment variables take precedence (Vercel Production)
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID
};

// Function to merge and filter out empty/undefined values
const mergeConfig = (base: any, overlay: any) => {
  const merged = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (value !== undefined && value !== null && value !== "") {
      merged[key] = value;
    }
  }
  return merged;
};

// Ensure app is only initialized once
let app: any;
const finalConfig = mergeConfig(firebaseConfig, envConfig);

try {
  if (getApps().length === 0) {
    if (!finalConfig.apiKey || finalConfig.apiKey === 'undefined' || finalConfig.apiKey === '') {
      console.warn('Firebase API Key is missing. Using placeholder config.');
    } else {
      app = initializeApp(finalConfig);
    }
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, finalConfig.firestoreDatabaseId || '(default)') : null;
