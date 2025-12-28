
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Robust environment variable retriever for Firebase
 */
const firebaseConfig = {
  // Cast import.meta to any to resolve TS error: Property 'env' does not exist on type 'ImportMeta'
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ""
};

// Simple check to warn if keys are missing
if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Check your .env file.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
