// Firebase Admin para las funciones del campus (cuenta de servicio en FIREBASE_SERVICE_ACCOUNT).
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const env = process.env;
// FIREBASE_PROJECT_ID es la misma variable que usa la compilación de la web
export const projectId = () => env.FIREBASE_PROJECT_ID;
export const emulador = () => !!env.FIRESTORE_EMULATOR_HOST;

export function serviceAccount() {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return null;
  try {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    return sa.client_email && sa.private_key ? { projectId: sa.project_id || projectId(), clientEmail: sa.client_email, privateKey: sa.private_key } : null;
  } catch { return null; }
}

/** La cuenta de servicio solo vale si es del mismo proyecto que la web (nunca la de otra plataforma del centro). */
export function problemaFirebase() {
  if (emulador()) return null;
  const sa = serviceAccount();
  if (!sa) return "Falta FIREBASE_SERVICE_ACCOUNT (o no es el JSON completo de la cuenta de servicio).";
  if (projectId() && sa.projectId !== projectId()) return `FIREBASE_SERVICE_ACCOUNT es del proyecto «${sa.projectId}», pero el campus usa «${projectId()}».`;
  return null;
}

export function firebase() {
  if (!getApps().length) {
    const sa = serviceAccount();
    initializeApp(sa && !emulador() ? { credential: cert(sa), projectId: sa.projectId } : { projectId: projectId() || "demo-campus" });
  }
  return { auth: getAuth(), db: getFirestore() };
}

export const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra }
});

export const ADMIN_EMAIL = "omar.romero@jrotero.es";
export const DOMINIO = "@jrotero.es";

/** Misma regla que motivoAcceso() en src/estado.js. */
export async function motivoAcceso(db, { uid, email, verificado }, formacionId) {
  const correo = String(email || "").toLowerCase();
  if (correo === ADMIN_EMAIL && verificado) return "admin";
  const f = await db.doc(`formaciones/${formacionId}`).get();
  if (!f.exists) return null;
  if (uid) {
    const m = await db.doc(`matriculas/${uid}_${formacionId}`).get();
    if (m.exists && m.data().estado === "activa") return m.data().origen;
  }
  if (f.data().incluidaCentro && correo.endsWith(DOMINIO) && verificado) return "centro";
  return null;
}
