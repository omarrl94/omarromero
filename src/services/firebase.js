// Configuración de Firebase leída de variables de entorno de Vite (ver .env.example).
// Si no hay configuración, la app funciona en «modo local» (cuentas en el navegador).
// El SDK se carga bajo demanda para no pesar en el modo local.

const env = import.meta.env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const useEmulators = env.VITE_FIREBASE_EMULATORS === '1' || env.VITE_FIREBASE_EMULATORS === 'true';

export const cloudConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/** Prefijo de colecciones: permite convivir con otras apps en el mismo proyecto. */
export const COL = {
  players: 'cyberops_players',
  nicks: 'cyberops_nicks',
};

let cached = null;

/** Inicializa Firebase una sola vez y devuelve los módulos que usa la app. */
export async function getFirebase() {
  if (cached) return cached;
  const [appMod, authMod, fsMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  auth.languageCode = 'es';
  const db = fsMod.getFirestore(app);
  if (useEmulators) {
    const host = env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';
    authMod.connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    fsMod.connectFirestoreEmulator(db, host, 8080);
  }
  cached = { app, auth, db, A: authMod, F: fsMod };
  return cached;
}
