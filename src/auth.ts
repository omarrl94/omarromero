import { create } from 'zustand';
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from './firebase';

const GUEST_KEY = 'circuitossea:guest';
const DEMO_KEY = 'circuitossea:demofull';
const readDemo = () => { try { return sessionStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } };
const readGuest = () => { try { return sessionStorage.getItem(GUEST_KEY) === '1'; } catch { return false; } };

/** Mensajes de error de Firebase traducidos a algo que el alumno entienda y pueda arreglar. */
export function friendly(code: string): string {
  const m: Record<string, string> = {
    'auth/invalid-email': 'Ese correo no tiene buena pinta. Revisa que esté bien escrito.',
    'auth/missing-password': 'Escribe la contraseña.',
    'auth/weak-password': 'La contraseña es demasiado corta: usa al menos 6 caracteres.',
    'auth/email-already-in-use': 'Ya hay una cuenta con ese correo. Prueba a entrar en lugar de crearla.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'Sin conexión con Firebase. Comprueba tu internet.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
    'auth/invalid-api-key': 'La clave de Firebase no es válida: revisa las variables VITE_FIREBASE_* del despliegue.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La clave de Firebase no es válida: revisa las variables VITE_FIREBASE_* del despliegue.',
    'auth/operation-not-allowed': 'Ese método de acceso no está activado en Firebase (Authentication → Método de acceso).',
  };
  return m[code] ?? 'No se pudo completar la operación. Inténtalo de nuevo.';
}

interface AuthState {
  user: User | null; ready: boolean; guest: boolean; demoFull: boolean; busy: boolean; error: string | null; info: string | null;
  init(): () => void;
  signup(name: string, email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  google(): Promise<void>;
  reset(email: string): Promise<void>;
  logout(): Promise<void>;
  continueGuest(full?: boolean): void;
  openSignup(mode?: 'crear' | 'entrar'): void;
  resendVerification(): Promise<void>;
  clear(): void;
}

const run = async (set: (p: Partial<AuthState>) => void, fn: () => Promise<void>) => {
  set({ busy: true, error: null, info: null });
  try { await fn(); } catch (e) { set({ error: friendly((e as { code?: string }).code ?? '') }); } finally { set({ busy: false }); }
};

export const useAuth = create<AuthState>((set) => ({
  user: null, ready: !firebaseConfigured, guest: readGuest(), demoFull: readDemo(), busy: false, error: null, info: null,
  init() {
    if (!auth) { set({ ready: true }); return () => undefined; }
    return onAuthStateChanged(auth, (u) => set({ user: u, ready: true }));
  },
  signup: (name, email, password) => run(set, async () => {
    const c = await createUserWithEmailAndPassword(auth!, email.trim(), password);
    if (name.trim()) await updateProfile(c.user, { displayName: name.trim() });
    try { await sendEmailVerification(c.user); } catch { /* no es crítico */ }
    set({ user: auth!.currentUser });
  }),
  login: (email, password) => run(set, async () => { await signInWithEmailAndPassword(auth!, email.trim(), password); }),
  google: () => run(set, async () => { await signInWithPopup(auth!, new GoogleAuthProvider()); }),
  reset: (email) => run(set, async () => {
    if (!email.trim()) { set({ error: 'Escribe tu correo arriba y vuelve a pulsar.' }); return; }
    await sendPasswordResetEmail(auth!, email.trim());
    set({ info: 'Te hemos enviado un correo para elegir una contraseña nueva.' });
  }),
  logout: async () => {
    try { sessionStorage.removeItem(GUEST_KEY); sessionStorage.removeItem(DEMO_KEY); } catch { /* ignorar */ }
    if (auth) await signOut(auth);
    set({ user: null, guest: false, demoFull: false });
  },
  continueGuest(full = false) { try { sessionStorage.setItem(GUEST_KEY, '1'); if (full) sessionStorage.setItem(DEMO_KEY, '1'); else sessionStorage.removeItem(DEMO_KEY); } catch { /* ignorar */ } set({ guest: true, demoFull: full && !firebaseConfigured }); },
  /** Sale del modo visitante y lleva al formulario de acceso de la portada. */
  openSignup(mode = 'crear') { try { sessionStorage.removeItem(GUEST_KEY); sessionStorage.removeItem(DEMO_KEY); sessionStorage.setItem('circuitossea:goto', mode); } catch { /* ignorar */ } set({ guest: false, demoFull: false }); },
  resendVerification: () => run(set, async () => { if (auth?.currentUser) { await sendEmailVerification(auth.currentUser); set({ info: 'Te hemos reenviado el correo de verificación.' }); } }),
  clear() { set({ error: null, info: null }); },
}));
