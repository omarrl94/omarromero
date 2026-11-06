// Cuentas de jugador: registro con nick + correo + avatar, inicio de sesión,
// perfil público (ranking) y progreso privado sincronizado.
// Dos motores con la misma interfaz: Firebase (Auth + Firestore) y local (navegador).
import { cloudConfigured, getFirebase, COL } from './firebase.js';

export const backend = cloudConfigured ? 'firebase' : 'local';

export const NICK_RE = /^[A-Za-z0-9_-]{3,16}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class AccountError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Prueba a entrar.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión con el servidor. Revisa tu red.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está activado en Firebase (Authentication → Sign-in method).',
  'permission-denied': 'El servidor ha rechazado la operación (reglas de Firestore). Revisa que estén desplegadas.',
  unavailable: 'El servidor no está disponible ahora mismo. Inténtalo de nuevo.',
};

const friendly = (e) => {
  if (e instanceof AccountError) return e;
  const code = e && e.code ? String(e.code) : '';
  return new AccountError(code || 'unknown', FIREBASE_ERRORS[code] || (e && e.message) || 'Algo ha fallado. Inténtalo de nuevo.');
};

export function validateRegistration({ nick, email, password }) {
  if (!NICK_RE.test(nick || '')) throw new AccountError('nick-invalid', 'El nick debe tener de 3 a 16 caracteres: letras, números, _ o -.');
  if (!EMAIL_RE.test(email || '')) throw new AccountError('email-invalid', 'Escribe un correo electrónico válido.');
  if (!password || password.length < 6) throw new AccountError('password-short', 'La contraseña debe tener al menos 6 caracteres.');
}

/** Estadísticas públicas que aparecen en el ranking. */
export function publicStats(stats) {
  return {
    gold: Math.max(0, Math.min(40000, Math.round(stats.gold || 0))),
    xp: Math.max(0, Math.min(100000, Math.round(stats.xp || 0))),
    worlds: Math.max(0, Math.min(10, stats.worlds || 0)),
    conquered: Math.max(0, Math.min(500, stats.conquered || 0)),
  };
}

// ───────────────────────── Motor local ─────────────────────────

const LKEY = 'codeforge.accounts.v1';
const SKEY = 'codeforge.session.v1';
const listeners = new Set();

const readLocal = () => {
  try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch { return {}; }
};
const writeLocal = (db) => {
  try { localStorage.setItem(LKEY, JSON.stringify(db)); } catch { /* almacenamiento no disponible */ }
};
const readSession = () => {
  try { return localStorage.getItem(SKEY); } catch { return null; }
};
const writeSession = (uid) => {
  try { if (uid) localStorage.setItem(SKEY, uid); else localStorage.removeItem(SKEY); } catch { /* sin almacenamiento */ }
};

async function hash(text) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`codeforge:${text}`));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 5381;
    for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
    return `djb2-${h.toString(16)}`;
  }
}

/** Borra el progreso guardado en este dispositivo para un jugador. */
function forgetLocalProgress(uid) {
  try { localStorage.removeItem(`codeforge.progress.v2.${uid}`); } catch { /* sin almacenamiento */ }
}

const toAccount = (uid, rec) => (rec ? { uid, nick: rec.nick, email: rec.email, avatar: rec.avatar, provider: 'local', emailVerified: false, createdAt: rec.createdAt } : null);
const emit = (acc) => listeners.forEach((cb) => cb(acc));

const local = {
  watchSession(cb) {
    listeners.add(cb);
    const uid = readSession();
    const db = readLocal();
    cb(uid && db[uid] ? toAccount(uid, db[uid]) : null);
    return () => listeners.delete(cb);
  },
  async nickAvailable(nick) {
    const lower = nick.toLowerCase();
    return !Object.values(readLocal()).some((r) => r.nick.toLowerCase() === lower);
  },
  async register({ nick, email, password, avatar }) {
    validateRegistration({ nick, email, password });
    const db = readLocal();
    if (Object.values(db).some((r) => r.email.toLowerCase() === email.toLowerCase())) throw new AccountError('email-taken', FIREBASE_ERRORS['auth/email-already-in-use']);
    if (!(await local.nickAvailable(nick))) throw new AccountError('nick-taken', `El nick «${nick}» ya está cogido. Prueba otro.`);
    const uid = `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    db[uid] = { nick, email, avatar, pass: await hash(password), createdAt: Date.now(), stats: publicStats({}) };
    writeLocal(db);
    writeSession(uid);
    const acc = toAccount(uid, db[uid]);
    emit(acc);
    return acc;
  },
  async login({ email, password }) {
    const db = readLocal();
    const entry = Object.entries(db).find(([, r]) => r.email.toLowerCase() === (email || '').toLowerCase());
    if (!entry || entry[1].pass !== (await hash(password || ''))) throw new AccountError('auth/invalid-credential', FIREBASE_ERRORS['auth/invalid-credential']);
    writeSession(entry[0]);
    const acc = toAccount(entry[0], entry[1]);
    emit(acc);
    return acc;
  },
  async logout() {
    writeSession(null);
    emit(null);
  },
  async resetPassword() {
    throw new AccountError('local-reset', 'En modo local no se envían correos. Si olvidaste la contraseña, crea otra cuenta en este navegador.');
  },
  async updateProfile(acc, { nick, avatar }) {
    const db = readLocal();
    const rec = db[acc.uid];
    if (!rec) throw new AccountError('no-account', 'No encuentro tu cuenta.');
    if (nick && nick !== rec.nick) {
      if (!NICK_RE.test(nick)) throw new AccountError('nick-invalid', 'El nick debe tener de 3 a 16 caracteres: letras, números, _ o -.');
      if (!(await local.nickAvailable(nick))) throw new AccountError('nick-taken', `El nick «${nick}» ya está cogido.`);
      rec.nick = nick;
    }
    if (avatar) rec.avatar = avatar;
    writeLocal(db);
    const next = toAccount(acc.uid, rec);
    emit(next);
    return next;
  },
  async loadProgress() {
    return null; // el progreso local ya vive en localStorage (progress.js)
  },
  async deleteAccount(acc, password) {
    const db = readLocal();
    const rec = db[acc.uid];
    if (!rec) throw new AccountError('no-account', 'No encuentro tu cuenta.');
    if (rec.pass !== (await hash(password || ''))) throw new AccountError('auth/invalid-credential', 'La contraseña no es correcta.');
    delete db[acc.uid];
    writeLocal(db);
    forgetLocalProgress(acc.uid);
    writeSession(null);
    emit(null);
  },
  async saveProgress(acc, state, stats) {
    const db = readLocal();
    if (db[acc.uid]) {
      db[acc.uid].stats = publicStats(stats);
      writeLocal(db);
    }
  },
  async leaderboard(limit = 20) {
    return Object.entries(readLocal())
      .map(([uid, r]) => ({ uid, nick: r.nick, avatar: r.avatar, ...publicStats(r.stats || {}) }))
      .sort((a, b) => b.gold - a.gold || b.xp - a.xp)
      .slice(0, limit);
  },
};

// ───────────────────────── Motor Firebase ─────────────────────────

async function fetchPlayer(fb, uid, tries = 6) {
  const { F, db } = fb;
  for (let i = 0; i < tries; i++) {
    const snap = await F.getDoc(F.doc(db, COL.players, uid));
    if (snap.exists()) return snap.data();
    await new Promise((r) => setTimeout(r, 350));
  }
  return null;
}

const cloud = {
  watchSession(cb) {
    let unsub = () => {};
    let cancelled = false;
    getFirebase().then((fb) => {
      if (cancelled) return;
      unsub = fb.A.onAuthStateChanged(fb.auth, async (user) => {
        if (!user) { cb(null); return; }
        try {
          const p = await fetchPlayer(fb, user.uid);
          cb({ uid: user.uid, nick: p ? p.nick : user.displayName || 'piloto', email: user.email, avatar: p ? p.avatar : 'nova', provider: 'firebase', emailVerified: user.emailVerified, incomplete: !p });
        } catch (e) {
          cb({ uid: user.uid, nick: user.displayName || 'piloto', email: user.email, avatar: 'nova', provider: 'firebase', emailVerified: user.emailVerified, offline: true });
        }
      });
    }).catch(() => cb(null));
    return () => { cancelled = true; unsub(); };
  },
  async nickAvailable(nick) {
    const fb = await getFirebase();
    const snap = await fb.F.getDoc(fb.F.doc(fb.db, COL.nicks, nick.toLowerCase()));
    return !snap.exists();
  },
  async register({ nick, email, password, avatar }) {
    validateRegistration({ nick, email, password });
    const fb = await getFirebase();
    const { A, F, auth, db } = fb;
    try {
      if (!(await cloud.nickAvailable(nick))) throw new AccountError('nick-taken', `El nick «${nick}» ya está cogido. Prueba otro.`);
      const cred = await A.createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const lower = nick.toLowerCase();
      try {
        await F.runTransaction(db, async (tx) => {
          const nickRef = F.doc(db, COL.nicks, lower);
          const taken = await tx.get(nickRef);
          if (taken.exists()) throw new AccountError('nick-taken', `El nick «${nick}» ya está cogido. Prueba otro.`);
          tx.set(nickRef, { uid });
          tx.set(F.doc(db, COL.players, uid), {
            nick, nickLower: lower, avatar, ...publicStats({}), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(),
          });
          tx.set(F.doc(db, COL.players, uid, 'private', 'progress'), { email, state: '', updatedAt: F.serverTimestamp() });
        });
      } catch (e) {
        await cred.user.delete().catch(() => {});
        throw e;
      }
      await A.updateProfile(cred.user, { displayName: nick }).catch(() => {});
      A.sendEmailVerification(cred.user).catch(() => {});
      return { uid, nick, email, avatar, provider: 'firebase', emailVerified: false };
    } catch (e) {
      throw friendly(e);
    }
  },
  async login({ email, password }) {
    try {
      const fb = await getFirebase();
      const cred = await fb.A.signInWithEmailAndPassword(fb.auth, email, password);
      const p = await fetchPlayer(fb, cred.user.uid, 2);
      return { uid: cred.user.uid, nick: p ? p.nick : cred.user.displayName, email: cred.user.email, avatar: p ? p.avatar : 'nova', provider: 'firebase', emailVerified: cred.user.emailVerified };
    } catch (e) {
      throw friendly(e);
    }
  },
  async logout() {
    const fb = await getFirebase();
    await fb.A.signOut(fb.auth);
  },
  async resetPassword(email) {
    if (!EMAIL_RE.test(email || '')) throw new AccountError('email-invalid', 'Escribe primero tu correo.');
    try {
      const fb = await getFirebase();
      await fb.A.sendPasswordResetEmail(fb.auth, email);
    } catch (e) {
      throw friendly(e);
    }
  },
  async updateProfile(acc, { nick, avatar }) {
    const fb = await getFirebase();
    const { F, db } = fb;
    try {
      await F.runTransaction(db, async (tx) => {
        const ref = F.doc(db, COL.players, acc.uid);
        const cur = await tx.get(ref);
        const data = cur.data() || {};
        const patch = { updatedAt: F.serverTimestamp() };
        if (avatar) patch.avatar = avatar;
        if (nick && nick !== data.nick) {
          if (!NICK_RE.test(nick)) throw new AccountError('nick-invalid', 'El nick debe tener de 3 a 16 caracteres: letras, números, _ o -.');
          const lower = nick.toLowerCase();
          const newRef = F.doc(db, COL.nicks, lower);
          if (lower !== data.nickLower) {
            const taken = await tx.get(newRef);
            if (taken.exists()) throw new AccountError('nick-taken', `El nick «${nick}» ya está cogido.`);
            tx.set(newRef, { uid: acc.uid });
            if (data.nickLower) tx.delete(F.doc(db, COL.nicks, data.nickLower));
          }
          patch.nick = nick;
          patch.nickLower = lower;
        }
        tx.update(ref, patch);
      });
      if (nick) await fb.A.updateProfile(fb.auth.currentUser, { displayName: nick }).catch(() => {});
      return { ...acc, nick: nick || acc.nick, avatar: avatar || acc.avatar };
    } catch (e) {
      throw friendly(e);
    }
  },
  async deleteAccount(acc, password) {
    try {
      const fb = await getFirebase();
      const { A, F, db, auth } = fb;
      const user = auth.currentUser;
      if (!user) throw new AccountError('no-session', 'Vuelve a entrar en tu cuenta para borrarla.');
      // Firebase exige haber iniciado sesión hace poco: confirmamos con la contraseña.
      await A.reauthenticateWithCredential(user, A.EmailAuthProvider.credential(user.email, password || ''));
      const player = await F.getDoc(F.doc(db, COL.players, acc.uid));
      const batch = F.writeBatch(db);
      batch.delete(F.doc(db, COL.players, acc.uid, 'private', 'progress'));
      batch.delete(F.doc(db, COL.players, acc.uid));
      const lower = player.exists() ? player.data().nickLower : null;
      if (lower) batch.delete(F.doc(db, COL.nicks, lower));
      await batch.commit();
      await A.deleteUser(user);
      forgetLocalProgress(acc.uid);
    } catch (e) {
      const code = e && e.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/missing-password') throw new AccountError(code, 'La contraseña no es correcta.');
      throw friendly(e);
    }
  },
  async loadProgress(acc) {
    const fb = await getFirebase();
    const snap = await fb.F.getDoc(fb.F.doc(fb.db, COL.players, acc.uid, 'private', 'progress'));
    if (!snap.exists()) return null;
    const raw = snap.data().state;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  async saveProgress(acc, state, stats) {
    const fb = await getFirebase();
    const { F, db } = fb;
    const batch = F.writeBatch(db);
    batch.set(F.doc(db, COL.players, acc.uid, 'private', 'progress'), { email: acc.email || '', state: JSON.stringify(state), updatedAt: F.serverTimestamp() });
    batch.update(F.doc(db, COL.players, acc.uid), { ...publicStats(stats), updatedAt: F.serverTimestamp() });
    await batch.commit();
  },
  async leaderboard(limit = 20) {
    const fb = await getFirebase();
    const { F, db } = fb;
    const q = F.query(F.collection(db, COL.players), F.orderBy('gold', 'desc'), F.limit(limit));
    const snap = await F.getDocs(q);
    return snap.docs.map((d) => ({ uid: d.id, nick: d.data().nick, avatar: d.data().avatar, ...publicStats(d.data()) }));
  },
};

const impl = cloudConfigured ? cloud : local;

export const watchSession = (cb) => impl.watchSession(cb);
export const nickAvailable = (nick) => impl.nickAvailable(nick);
export const register = (data) => impl.register(data);
export const login = (data) => impl.login(data);
export const logout = () => impl.logout();
export const resetPassword = (email) => impl.resetPassword(email);
export const updateAccount = (acc, patch) => impl.updateProfile(acc, patch);
export const loadCloudProgress = (acc) => impl.loadProgress(acc);
export const saveCloudProgress = (acc, state, stats) => impl.saveProgress(acc, state, stats);
export const fetchLeaderboard = (limit) => impl.leaderboard(limit);
export const deleteAccount = (acc, password) => impl.deleteAccount(acc, password);
