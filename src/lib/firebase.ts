import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { FIREBASE_CONFIG, HAY_FIREBASE } from "./config";

/**
 * Firebase, creado una sola vez y solo si está configurado.
 *
 * Devuelven null cuando faltan las variables: la app funciona igual, con
 * las cuentas y los datos en modo local.
 */
function getAppSeguro(): FirebaseApp | null {
  if (!HAY_FIREBASE) return null;
  return getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
}

export function getAuthSeguro(): Auth | null {
  const app = getAppSeguro();
  return app ? getAuth(app) : null;
}

export function getDb(): Firestore | null {
  const app = getAppSeguro();
  return app ? getFirestore(app) : null;
}
