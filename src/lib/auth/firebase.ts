import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import type { ProveedorAuth } from './tipos';

export const configFirebase = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function firebaseApp(): FirebaseApp {
  if (!app) app = initializeApp(configFirebase);
  return app;
}

function a(): Auth {
  if (!auth) {
    auth = getAuth(firebaseApp());
    auth.languageCode = 'es';
  }
  return auth;
}

export const proveedorFirebase: ProveedorAuth = {
  tipo: 'firebase',
  escuchar(cb) {
    return onAuthStateChanged(a(), (u) => cb(u && u.email ? { uid: u.uid, email: u.email.toLowerCase(), nombre: u.displayName ?? '' } : null));
  },
  async registrar(email, password, nombre) {
    const c = await createUserWithEmailAndPassword(a(), email, password);
    if (nombre) await updateProfile(c.user, { displayName: nombre });
  },
  async entrar(email, password) {
    await signInWithEmailAndPassword(a(), email, password);
  },
  async salir() {
    await signOut(a());
  },
  async token(forzar = false) {
    const u = a().currentUser;
    if (!u) return null;
    if (forzar) await u.reload();
    return u.getIdToken(forzar);
  },
  async verificacionFirebase() {
    const u = a().currentUser;
    if (u) await sendEmailVerification(u, { url: `${location.origin}/#/entrar?verificado=1` });
  },
};
