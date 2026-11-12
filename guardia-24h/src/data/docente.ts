import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { guardaOverridesLocal, leeOverrides, overridesVacios, type Overrides } from '../game/datos';
import { COLECCIONES, fb, firebaseConfigurado } from './firebase';
import { listarAlumnosLocales, repoLocal } from './local';
import type { Intento, Respuesta } from './repo';

export interface AlumnoRes { uid: string; alias: string; clase: string }
export interface DatosAlumno { respuestas: Respuesta[]; intentos: Intento[] }

/** Origen de datos del panel del profesor: este dispositivo (local) o Firestore (nube). */
export interface DocenteBackend {
  modo: 'local' | 'nube';
  listar(): Promise<AlumnoRes[]>;
  datos(uid: string): Promise<DatosAlumno>;
  leeOv(uid: string): Promise<Overrides>;
  guardaOv(uid: string, o: Overrides): Promise<void>;
}

export const docenteLocal: DocenteBackend = {
  modo: 'local',
  listar: listarAlumnosLocales,
  datos: async (uid) => ({ respuestas: await repoLocal.respuestas(uid), intentos: await repoLocal.intentos(uid) }),
  leeOv: async (uid) => leeOverrides(uid),
  guardaOv: async (uid, o) => guardaOverridesLocal(uid, o),
};

export const nubeDisponible = firebaseConfigurado;
export const sesionDocente = () => fb().auth.currentUser?.email ?? null;
export const loginDocente = async (email: string, clave: string) => { await signInWithEmailAndPassword(fb().auth, email, clave); };
export const registraDocente = async (email: string, clave: string) => { await createUserWithEmailAndPassword(fb().auth, email, clave); };
export const salirDocente = () => signOut(fb().auth);

/** Crea una clase (código) asociada al profesor con sesión iniciada. */
export async function crearClase(codigo: string) {
  const { auth, fs } = fb();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Inicia sesión como profesor.');
  const c = codigo.trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,16}$/.test(c)) throw new Error('El código debe tener entre 4 y 16 letras o números.');
  await setDoc(doc(fs, COLECCIONES.clases, c), { profesorUid: uid, creada: Date.now() });
  return c;
}

export const docenteNube: DocenteBackend = {
  modo: 'nube',
  async listar() {
    const { auth, fs } = fb();
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = await getDocs(query(collection(fs, COLECCIONES.alumnos), where('profesorUid', '==', uid)));
    return q.docs.map((d) => ({ uid: d.id, alias: String(d.data().alias), clase: String(d.data().claseCodigo) }));
  },
  async datos(uid) {
    const { fs } = fb();
    const [a, i] = await Promise.all([getDocs(collection(fs, COLECCIONES.alumnos, uid, 'answers')), getDocs(collection(fs, COLECCIONES.alumnos, uid, 'attempts'))]);
    return { respuestas: a.docs.map((d) => d.data() as Respuesta), intentos: i.docs.map((d) => d.data() as Intento) };
  },
  async leeOv(uid) {
    const s = await getDoc(doc(fb().fs, COLECCIONES.alumnos, uid, 'teacher', 'overrides'));
    return { ...overridesVacios(), ...(s.exists() ? (s.data() as Partial<Overrides>) : {}) };
  },
  async guardaOv(uid, o) { await setDoc(doc(fb().fs, COLECCIONES.alumnos, uid, 'teacher', 'overrides'), o); },
};
