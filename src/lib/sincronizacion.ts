/**
 * Sincroniza los datos del usuario (perfil, seguimiento y datos de tutor) con su documento de
 * Firestore «usuarios/{uid}», para verlos en cualquier dispositivo. Solo con Firebase configurado;
 * en pruebas y en la demo los datos se quedan en el navegador.
 */
import { leer, escribir, suscribirCambios } from './almacen-local';
import { auth } from './auth';

const CLAVES = ['alumno', 'seguimiento', 'tutor', 'tutor-envios'] as const;

let cancelar: (() => void) | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let uidActual: string | null = null;

async function firestore() {
  const [{ getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp }, { firebaseApp }] = await Promise.all([import('firebase/firestore'), import('./auth/firebase')]);
  return { db: getFirestore(firebaseApp()), doc, getDoc, setDoc, deleteDoc, serverTimestamp };
}

function datosLocales() {
  return Object.fromEntries(CLAVES.map((k) => [k, leer<unknown>(k, null)]).filter(([, v]) => v !== null));
}

export async function iniciarSincronizacion(uid: string): Promise<void> {
  if (auth.tipo !== 'firebase' || uidActual === uid) return;
  detenerSincronizacion();
  uidActual = uid;
  try {
    const f = await firestore();
    const ref = f.doc(f.db, 'usuarios', uid);
    const remoto = await f.getDoc(ref);
    if (remoto.exists()) {
      const datos = remoto.data() as Record<string, unknown>;
      for (const k of CLAVES) if (datos[k] !== undefined && datos[k] !== null) escribir(k, datos[k]);
    } else {
      const locales = datosLocales();
      if (Object.keys(locales).length) await f.setDoc(ref, { ...locales, actualizado: f.serverTimestamp() }, { merge: true });
    }
    cancelar = suscribirCambios(() => {
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        void f.setDoc(ref, { ...datosLocales(), actualizado: f.serverTimestamp() }, { merge: true }).catch((e) => console.error('No se pudo guardar en la cuenta', e));
      }, 1200);
    });
  } catch (e) {
    console.error('Sincronización no disponible', e);
  }
}

export function detenerSincronizacion(): void {
  cancelar?.();
  cancelar = null;
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  uidActual = null;
}

/** Borra el documento del usuario en Firestore (al borrar la cuenta). */
export async function borrarDatosRemotos(uid: string): Promise<void> {
  if (auth.tipo !== 'firebase') return;
  const f = await firestore();
  await f.deleteDoc(f.doc(f.db, 'usuarios', uid));
}
