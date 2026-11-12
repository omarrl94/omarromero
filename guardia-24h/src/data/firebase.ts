import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, serverTimestamp,
  setDoc, type Firestore,
} from 'firebase/firestore';
import {
  ESTADO_INICIAL, normalizaAlias, normalizaCodigo, validaEntrada,
  type EstadoJuego, type Intento, type Repo, type Sesion,
} from './repo';

const env = import.meta.env;
export const firebaseConfigurado = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID);

// Colecciones con prefijo guardia_ para convivir con otras apps en el mismo proyecto.
const C = { clases: 'guardia_classes', alumnos: 'guardia_students', alias: 'guardia_aliases' } as const;

export function crearRepoFirebase(): Repo {
  const app: FirebaseApp = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const auth: Auth = getAuth(app);
  const fs: Firestore = getFirestore(app);
  if (env.VITE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(fs, '127.0.0.1', 8080);
  }
  const alumnoDoc = (uid: string) => doc(fs, C.alumnos, uid);

  return {
    modo: 'nube',
    async sesionActual() {
      await auth.authStateReady();
      const u = auth.currentUser;
      if (!u) return null;
      const s = await getDoc(alumnoDoc(u.uid));
      if (!s.exists()) return null;
      const d = s.data() as { alias: string; claseCodigo: string };
      return { uid: u.uid, alias: d.alias, claseCodigo: d.claseCodigo, rol: 'alumno' as const };
    },
    async entrarComoAlumno(codigo, alias) {
      const err = validaEntrada(codigo, alias);
      if (err) throw new Error(err);
      const c = normalizaCodigo(codigo), a = normalizaAlias(alias);
      if (!auth.currentUser) await signInAnonymously(auth);
      const uid = auth.currentUser!.uid;
      const clase = await getDoc(doc(fs, C.clases, c));
      if (!clase.exists()) throw new Error('Ese código de clase no existe. Pídeselo a tu profesor.');
      // Alias único dentro de la clase.
      const reserva = doc(fs, C.alias, `${c}__${a.toLowerCase().replace(/[^a-z0-9ñáéíóúü_-]/g, '_')}`);
      const previa = await getDoc(reserva);
      if (previa.exists() && previa.data().uid !== uid) throw new Error('Ese alias ya está en uso en tu clase.');
      await setDoc(reserva, { uid, claseCodigo: c });
      await setDoc(alumnoDoc(uid), { alias: a, aliasLower: a.toLowerCase(), claseCodigo: c, creado: serverTimestamp() });
      return { uid, alias: a, claseCodigo: c, rol: 'alumno' } satisfies Sesion;
    },
    async salir() { await signOut(auth); },
    async cargarEstado(uid) {
      const s = await getDoc(doc(fs, C.alumnos, uid, 'private', 'estado'));
      return s.exists() ? (s.data() as EstadoJuego) : { ...ESTADO_INICIAL };
    },
    async guardarEstado(uid, e) { await setDoc(doc(fs, C.alumnos, uid, 'private', 'estado'), e); },
    async registrarIntento(uid, i) { await addDoc(collection(fs, C.alumnos, uid, 'attempts'), i); },
    async intentos(uid) {
      return (await getDocs(collection(fs, C.alumnos, uid, 'attempts'))).docs.map((d) => d.data() as Intento);
    },
    async registrarEvento(uid, tipo, datos) {
      await addDoc(collection(fs, C.alumnos, uid, 'events'), { tipo, datos: datos ?? null, ts: Date.now() });
    },
  };
}
