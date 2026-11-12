/**
 * Conexión con Firebase (Authentication + Firestore). Las claves se leen de variables de entorno de Vite
 * (VITE_FIREBASE_*), nunca van en el código. Si faltan, la app funciona en «modo demostración» sin cuentas.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = import.meta.env as Record<string, string | undefined>;
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain);
export const app: FirebaseApp | null = firebaseConfigured ? initializeApp(cfg) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
