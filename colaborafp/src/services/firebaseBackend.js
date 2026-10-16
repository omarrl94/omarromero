/**
 * Backend de ColaboraFP sobre Firebase (Auth + Cloud Firestore en tiempo real). Plan gratuito «Spark».
 *
 * Requiere publicar `firebase/firestore.rules` y definir VITE_FIREBASE_CONFIG.
 * Misma interfaz que `mockBackend.js`.
 *
 * Modelo de datos (todo el contenido vive DENTRO de su sala, así nadie puede listar recursos de otras salas):
 *   rooms/{roomId}                              { pin, name, module, teacher_id, is_active, created_at, closes_at, expire_at }
 *   rooms/{roomId}/resources/{resId}            { room_id, author, type, content, language, title, status, timestamp,
 *                                                 file_size?, file_type?, chunks?, expire_at }
 *   rooms/{roomId}/resources/{resId}/chunks/{n} { index, data, expire_at }   — archivo en base64 troceado (≤ 5 MB)
 *   rooms/{roomId}/reports/{reportId}           { resource_id, reason, details, created_at, expire_at }
 *   pins/{pin}                                  { room_id, name, module, teacher_id, active, closes_at, expire_at }
 *
 * Plazos (ver utils/constants): una sala se cierra sola a las ROOM_OPEN_HOURS horas y TODO su contenido
 * se borra en la fecha que elige el profesor (por defecto RETENTION_DAYS días; máximo MAX_RETENTION_DAYS) (expire_at: apto para una política TTL de Firestore).
 */
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  enableNetwork,
  getCountFromServer,
  getDoc,
  getDocs,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { isTeacherEmail, ROOM_OPEN_HOURS, RETENTION_DAYS, TEACHER_EMAIL_DOMAINS } from '../utils/constants';
import { clampExpiry, defaultExpiry } from '../utils/retention';
import { generatePin, uuid } from '../utils/ids';

const CHUNK_SIZE = 900_000; // caracteres base64 por documento (límite de Firestore: 1 MiB)
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const PIN_TAKEN = 'El PIN de esta sala lo está usando otra sala abierta. Crea una sala nueva.';

const ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es demasiado débil.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a escribir tu contraseña.',
  'auth/operation-not-allowed': 'Activa el acceso con correo/contraseña en Firebase (Authentication → Sign-in method).',
  'permission-denied': 'Permiso denegado. Comprueba que tu cuenta está verificada y que las reglas de Firestore están publicadas.',
};

const friendlyError = (error) => {
  const e = new Error(ERRORS[error?.code] ?? error?.message ?? String(error));
  e.code = error?.code;
  return e;
};

let diagnose = async () => null; // se define al crear el backend (necesita auth y db)

const wrap = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    if (e?.code === 'permission-denied') {
      // diagnose() renueva además el token de sesión: si ese era el problema, basta con reintentar
      const reason = await diagnose().catch(() => null);
      if (reason) {
        const err = new Error(reason);
        err.code = e.code;
        throw err;
      }
      try {
        return await fn();
      } catch (e2) {
        throw friendlyError(e2);
      }
    }
    throw friendlyError(e);
  }
};

/**
 * Acepta el objeto tal cual lo muestra la consola de Firebase:
 *   const firebaseConfig = { apiKey: "...", authDomain: "...", ... };
 * o un JSON normal.
 */
export const parseFirebaseConfig = (raw) => {
  if (!raw) return null;
  try {
    const text = String(raw)
      .replace(/^[^{]*/, '') // quita "const firebaseConfig ="
      .replace(/[^}]*$/, '') // quita ";" final
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')
      .replace(/,\s*}/g, '}');
    const config = JSON.parse(text);
    return config.apiKey && config.projectId ? config : null;
  } catch {
    console.error('[ColaboraFP] VITE_FIREBASE_CONFIG no tiene un formato válido.');
    return null;
  }
};

const toUser = (u) =>
  u ? { id: u.uid, email: u.email, name: u.displayName || u.email.split('@')[0], emailVerified: u.emailVerified } : null;
const ms = (v) => (v instanceof Timestamp ? v.toMillis() : v);
const toResource = (snap) => {
  const d = snap.data();
  return { id: snap.id, ...d, expire_at: ms(d.expire_at), pending: snap.metadata.hasPendingWrites };
};
const toRoom = (id, d) => ({ id, ...d, expire_at: ms(d.expire_at) });

export const createFirebaseBackend = (config, { emulator } = {}) => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  auth.languageCode = 'es'; // correos de verificación en español
  // Caché persistente (IndexedDB, compartida entre pestañas): el muro aparece al instante al entrar o recargar.
  // Long polling automático: funciona también tras proxies/firewalls de centros educativos.
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  if (emulator) {
    connectAuthEmulator(auth, `http://${emulator}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulator, 8080);
  }

  const roomsCol = collection(db, 'rooms');
  const roomRef = (roomId) => doc(roomsCol, roomId);
  const resCol = (roomId) => collection(db, 'rooms', roomId, 'resources');
  const resRef = (roomId, id) => doc(resCol(roomId), id);
  const chunkRef = (roomId, id, i) => doc(db, 'rooms', roomId, 'resources', id, 'chunks', String(i));
  const reportsCol = (roomId) => collection(db, 'rooms', roomId, 'reports');
  const pinRef = (pin) => doc(db, 'pins', pin);

  /** Explica un «permiso denegado»: reglas sin publicar, sesión sin verificar o dominio ajeno. */
  diagnose = async () => {
    // Con las reglas nuevas cualquiera puede leer un recurso concreto por id (aunque no exista)
    const rulesOk = await getDoc(doc(db, 'rooms', 'diagnostico-reglas', 'resources', 'diagnostico-reglas'))
      .then(() => true)
      .catch((e) => (e?.code === 'permission-denied' ? false : null));
    if (rulesOk === false)
      return 'Firestore tiene publicadas unas reglas antiguas. Ve a Firebase → Firestore Database → pestaña «Reglas», pega el contenido de firebase/firestore.rules y pulsa «Publicar».';
    const user = auth.currentUser;
    if (user) {
      const { claims } = await user.getIdTokenResult(true);
      if (!claims.email_verified)
        return 'Tu sesión aún no tiene el correo verificado. Cierra sesión y vuelve a entrar después de pulsar el enlace del correo de verificación.';
      if (!isTeacherEmail(claims.email || ''))
        return `Tu cuenta (${claims.email}) no es del dominio del profesorado. Las reglas de Firestore solo permiten ${TEACHER_EMAIL_DOMAINS.map((d) => '@' + d).join(', ')}.`;
    }
    return null;
  };

  // ---------- Auth ----------
  const domainError = () =>
    new Error(`Solo el profesorado con correo del centro (${TEACHER_EMAIL_DOMAINS.map((d) => '@' + d).join(', ')}) puede crear una cuenta.`);

  const authApi = {
    async getUser() {
      await auth.authStateReady();
      const u = auth.currentUser;
      return u?.emailVerified ? toUser(u) : null;
    },
    onAuthChange(callback) {
      return onAuthStateChanged(auth, (u) => callback(u?.emailVerified ? toUser(u) : null));
    },
    /** Crea la cuenta y envía el correo de verificación. No inicia sesión hasta verificar. */
    signUp: ({ name, email, password }) =>
      wrap(async () => {
        if (!isTeacherEmail(email)) throw domainError();
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(user, { displayName: name.trim() });
        await sendEmailVerification(user);
        await signOut(auth);
        return { verificationSent: true };
      }),
    signIn: ({ email, password }) =>
      wrap(async () => {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!user.emailVerified) {
          await signOut(auth);
          const e = new Error('Tu correo aún no está verificado. Revisa tu bandeja de entrada (y el correo no deseado).');
          e.code = 'unverified';
          throw e;
        }
        await user.getIdToken(true); // token con email_verified actualizado para las reglas
        return toUser(user);
      }),
    resendVerification: ({ email, password }) =>
      wrap(async () => {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!user.emailVerified) await sendEmailVerification(user);
        await signOut(auth);
      }),
    async signOut() {
      await signOut(auth);
    },
    /** Derecho de supresión: borra todas las salas del profesor y su cuenta. */
    deleteAccount: (password) =>
      wrap(async () => {
        const user = auth.currentUser;
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        const snap = await getDocs(query(roomsCol, where('teacher_id', '==', user.uid)));
        for (const d of snap.docs) await removeRoom(d.id, d.data());
        await deleteUser(user);
      }),
  };

  // ---------- Borrado en cascada ----------
  async function commitDeletes(refs) {
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  }
  async function removeRoom(roomId, data) {
    const [res, reps] = await Promise.all([getDocs(resCol(roomId)), getDocs(reportsCol(roomId))]);
    await commitDeletes([
      ...res.docs.flatMap((d) => Array.from({ length: d.data().chunks || 0 }, (_, i) => chunkRef(roomId, d.id, i))),
      ...res.docs.map((d) => d.ref),
      ...reps.docs.map((d) => d.ref),
    ]);
    const room = data ?? (await getDoc(roomRef(roomId))).data();
    if (room?.pin) {
      const p = await getDoc(pinRef(room.pin)).catch(() => null);
      if (p?.exists() && p.data().room_id === roomId) await commitDeletes([p.ref]);
    }
    await commitDeletes([roomRef(roomId)]);
  }

  // ---------- Migración desde la versión anterior ----------
  // Antes: rooms/{id} sin plazos, resources/{id} y fileChunks/{id_n} en colecciones globales.
  // Ahora: plazos (closes_at, expire_at) y todo el contenido dentro de rooms/{id}/resources.
  const LEGACY_KEYS = ['room_id', 'author', 'type', 'content', 'language', 'title', 'status', 'timestamp', 'file_size', 'file_type', 'chunks'];

  const migrations = new Map(); // evita dos migraciones simultáneas de la misma sala
  const migrateLegacyRoom = (roomId, data) => {
    if (!migrations.has(roomId)) migrations.set(roomId, doMigrate(roomId, data).finally(() => migrations.delete(roomId)));
    return migrations.get(roomId);
  };

  async function doMigrate(roomId, data) {
    const now = Date.now();
    const fresh = (await getDoc(roomRef(roomId))).data() ?? data;
    let patch = {};
    if (!fresh.expire_at) {
      // Se cierra (el profesor la reabre cuando quiera) y recibe un PIN alfanumérico: los antiguos eran solo números
      for (let attempt = 0; attempt < 5 && !patch.pin; attempt++) {
        const next = { pin: generatePin(), is_active: false, closes_at: Math.min(now, Number(fresh.closes_at) || now), expire_at: now + RETENTION_DAYS * DAY };
        const done = await runTransaction(db, async (tx) => {
          const p = await tx.get(pinRef(next.pin));
          if (p.exists() && p.data().active && p.data().closes_at > Date.now()) return false;
          const oldPin = fresh.pin ? await tx.get(pinRef(fresh.pin)) : null;
          tx.update(roomRef(roomId), { ...next, expire_at: Timestamp.fromMillis(next.expire_at) });
          tx.set(pinRef(next.pin), pinDoc(roomId, { ...fresh, ...next }));
          if (oldPin?.exists() && oldPin.data().room_id === roomId) tx.delete(oldPin.ref);
          return true;
        });
        if (done) patch = { ...next, expire_at: Timestamp.fromMillis(next.expire_at) };
      }
      if (!patch.pin) throw new Error('No se pudo asignar un PIN nuevo a la sala.');
    }
    const expire_at = patch.expire_at ?? fresh.expire_at;
    const legacy = await getDocs(query(collection(db, 'resources'), where('room_id', '==', roomId)));
    for (const r of legacy.docs) {
      const old = r.data();
      const res = Object.fromEntries(LEGACY_KEYS.filter((k) => old[k] !== undefined).map((k) => [k, old[k]]));
      const parts = [];
      for (let i = 0; i < (old.chunks || 0); i++) parts.push(await getDoc(doc(db, 'fileChunks', `${r.id}_${i}`)));
      // Si ya se copió en un intento anterior, solo queda borrar el original
      if (!(await getDoc(resRef(roomId, r.id))).exists()) {
        const batch = writeBatch(db);
        batch.set(resRef(roomId, r.id), { ...res, expire_at });
        parts.forEach((p, i) => batch.set(chunkRef(roomId, r.id, i), { index: i, data: p.data()?.data ?? '', expire_at }));
        await batch.commit();
      }
      await commitDeletes([...parts.filter((p) => p.exists()).map((p) => p.ref), r.ref]);
    }
    return { ...fresh, ...patch };
  }

  // ---------- Salas ----------
  const pinDoc = (roomId, room) => ({
    room_id: roomId,
    name: room.name,
    module: room.module ?? null,
    teacher_id: room.teacher_id,
    active: room.is_active,
    closes_at: room.closes_at,
    expire_at: Timestamp.fromMillis(room.expire_at),
  });

  const rooms = {
    create: ({ name, module, teacherId, expireAt }) =>
      wrap(async () => {
        const expire_at = clampExpiry(expireAt ?? defaultExpiry());
        for (let attempt = 0; attempt < 5; attempt++) {
          const pin = generatePin();
          const ref = doc(roomsCol);
          const now = Date.now();
          const room = {
            pin,
            name: name.trim(),
            module: module || null,
            teacher_id: teacherId,
            is_active: true,
            created_at: now,
            closes_at: now + ROOM_OPEN_HOURS * HOUR,
            expire_at,
          };
          const created = await runTransaction(db, async (tx) => {
            const p = await tx.get(pinRef(pin));
            if (p.exists() && p.data().active && p.data().closes_at > Date.now()) return false; // colisión
            tx.set(ref, { ...room, expire_at: Timestamp.fromMillis(room.expire_at) });
            tx.set(pinRef(pin), pinDoc(ref.id, room));
            return true;
          });
          if (created) return { id: ref.id, ...room };
        }
        throw new Error('No se pudo generar un PIN único. Inténtalo de nuevo.');
      }),

    /** Lista las salas del profesor y borra las que han superado el plazo de conservación. */
    listByTeacher: (teacherId) =>
      wrap(async () => {
        const snap = await getDocs(query(roomsCol, where('teacher_id', '==', teacherId)));
        const now = Date.now();
        const docs = snap.docs; // ojo: cada acceso a snap.docs crea objetos nuevos
        // Salas de la versión anterior (sin expire_at): se migran, NUNCA se borran
        const migrated = new Map();
        for (const d of docs.filter((x) => !x.data().expire_at)) {
          migrated.set(d.id, await migrateLegacyRoom(d.id, d.data()).catch((e) => (console.error('[ColaboraFP] migración', e), null)));
        }
        const dataOf = (d) => migrated.get(d.id) ?? d.data();
        const expiredIds = new Set(docs.filter((d) => dataOf(d).expire_at && ms(dataOf(d).expire_at) <= now).map((d) => d.id));
        await Promise.all(docs.filter((d) => expiredIds.has(d.id)).map((d) => removeRoom(d.id, d.data()).catch(() => {})));
        const alive = docs.filter((d) => !expiredIds.has(d.id));
        const list = await Promise.all(
          alive.map(async (d) => {
            const count = await getCountFromServer(query(resCol(d.id), where('status', '==', 'approved'))).catch(() => null);
            return { ...toRoom(d.id, dataOf(d)), resource_count: count?.data().count ?? 0 };
          }),
        );
        return list.sort((a, b) => b.created_at - a.created_at);
      }),

    async getById(id) {
      try {
        const snap = await getDoc(roomRef(id));
        return snap.exists() ? toRoom(snap.id, snap.data()) : null;
      } catch {
        return null; // sin permiso = no es su sala
      }
    },

    async getByPin(pin) {
      try {
        const snap = await getDoc(pinRef(pin));
        if (!snap.exists()) return null;
        const p = snap.data();
        if (!p.active || p.closes_at <= Date.now()) return null;
        return { id: p.room_id, pin, name: p.name, module: p.module, is_active: true, closes_at: p.closes_at, expire_at: ms(p.expire_at) };
      } catch {
        return null; // las reglas solo dejan leer PIN de salas abiertas
      }
    },

    /** Abrir (otras ROOM_OPEN_HOURS horas) o cerrar una sala. */
    setActive: (id, isActive) =>
      wrap(async () =>
        runTransaction(db, async (tx) => {
          const snap = await tx.get(roomRef(id));
          if (!snap.exists()) throw new Error('Sala no encontrada.');
          const room = toRoom(id, snap.data());
          if (room.expire_at <= Date.now()) throw new Error('Esta sala ha superado el plazo de conservación y se va a eliminar.');
          const p = await tx.get(pinRef(room.pin));
          const pinIsMine = p.exists() && p.data().room_id === id;
          const pinBusy = p.exists() && !pinIsMine && p.data().active && p.data().closes_at > Date.now();
          if (isActive && pinBusy) throw new Error(PIN_TAKEN);
          const closes_at = isActive ? Date.now() + ROOM_OPEN_HOURS * HOUR : Math.min(room.closes_at, Date.now());
          tx.update(roomRef(id), { is_active: isActive, closes_at });
          const next = { ...room, is_active: isActive, closes_at };
          if (isActive || pinIsMine) tx.set(pinRef(room.pin), pinDoc(id, next));
          return next;
        }),
      ),

    /** Cambia la fecha de borrado de la sala y de todo su contenido (máximo MAX_RETENTION_DAYS). */
    setExpiry: (id, expireAt) =>
      wrap(async () => {
        const expire_at = Timestamp.fromMillis(clampExpiry(expireAt));
        const snap = await getDoc(roomRef(id));
        if (!snap.exists()) throw new Error('Sala no encontrada.');
        const room = toRoom(id, snap.data());
        await updateDoc(roomRef(id), { expire_at });
        const next = { ...room, expire_at: expire_at.toMillis() };
        // El PIN, los recursos, sus trozos y las notificaciones llevan el mismo plazo (TTL de Firestore)
        const p = await getDoc(pinRef(room.pin)).catch(() => null);
        const refs = p?.exists() && p.data().room_id === id ? [p.ref] : [];
        const [res, reps] = await Promise.all([getDocs(resCol(id)), getDocs(reportsCol(id))]);
        res.docs.forEach((d) => {
          refs.push(d.ref);
          for (let i = 0; i < (d.data().chunks || 0); i++) refs.push(chunkRef(id, d.id, i));
        });
        reps.docs.forEach((d) => refs.push(d.ref));
        for (let i = 0; i < refs.length; i += 400) {
          const batch = writeBatch(db);
          refs.slice(i, i + 400).forEach((ref) => batch.update(ref, { expire_at }));
          await batch.commit();
        }
        return next;
      }),

    remove: (id) => wrap(() => removeRoom(id)),
  };

  // ---------- Recursos ----------
  const roomQuery = (roomId, role) =>
    role === 'teacher' ? resCol(roomId) : query(resCol(roomId), where('status', '==', 'approved'));

  const toWrite = ({ id: _id, pending: _p, expire_at, ...data }) => ({ ...data, expire_at: Timestamp.fromMillis(expire_at) });

  const resources = {
    list: (roomId, { role }) =>
      wrap(async () => (await getDocs(roomQuery(roomId, role))).docs.map(toResource).sort((a, b) => a.timestamp - b.timestamp)),

    /** `file` = { data: base64 } para archivos. Recurso y trozos se escriben en un único lote atómico. */
    create: (resource, file) =>
      wrap(async () => {
        const data = toWrite(resource);
        const ref = resRef(resource.room_id, resource.id);
        if (!file) return setDoc(ref, data);
        const parts = [];
        for (let i = 0; i < file.data.length; i += CHUNK_SIZE) parts.push(file.data.slice(i, i + CHUNK_SIZE));
        const batch = writeBatch(db);
        batch.set(ref, { ...data, chunks: parts.length });
        parts.forEach((part, index) =>
          batch.set(chunkRef(resource.room_id, resource.id, index), { index, data: part, expire_at: data.expire_at }),
        );
        await batch.commit();
      }),

    getFile: (resource) =>
      wrap(async () => {
        const chunks = resource.chunks ?? (await getDoc(resRef(resource.room_id, resource.id))).data()?.chunks;
        if (!chunks) throw new Error('El archivo ya no está disponible.');
        const snaps = await Promise.all(Array.from({ length: chunks }, (_, i) => getDoc(chunkRef(resource.room_id, resource.id, i))));
        if (snaps.some((s) => !s.exists())) throw new Error('El archivo ya no está disponible.');
        return { data: snaps.map((s) => s.data().data).join(''), type: resource.file_type, name: resource.content };
      }),

    setStatus: (roomId, id, status) =>
      wrap(() => updateDoc(resRef(roomId, id), status === 'approved' ? { status, timestamp: Date.now() } : { status })),

    remove: (roomId, id) =>
      wrap(async () => {
        const ref = resRef(roomId, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const batch = writeBatch(db);
        Array.from({ length: snap.data().chunks || 0 }, (_, i) => batch.delete(chunkRef(roomId, id, i)));
        batch.delete(ref);
        await batch.commit();
      }),
  };

  // ---------- Notificaciones de contenido (LSSI) ----------
  const reports = {
    create: ({ room, resourceId, reason, details }) =>
      wrap(() =>
        setDoc(doc(reportsCol(room.id), uuid()), {
          resource_id: resourceId,
          reason,
          details: String(details || '').slice(0, 500),
          created_at: Date.now(),
          expire_at: Timestamp.fromMillis(room.expire_at),
        }),
      ),
    remove: (roomId, reportId) => wrap(() => commitDeletes([doc(reportsCol(roomId), reportId)])),
  };

  // ---------- Realtime ----------
  const EVENT = { added: 'INSERT', modified: 'UPDATE' };

  const realtime = {
    /** Esta implementación entrega la carga inicial por `onInitial`: no hace falta llamar a `list()`. */
    deliversInitialSnapshot: true,

    /** Reactiva la red tras volver a la pestaña o recuperar la conexión (no-op si ya está activa). */
    reconnect: () => enableNetwork(db).catch(() => {}),

    subscribeRoom(roomId, { onResource, onRoom, onStatus, onInitial, onReports }, { role, pin } = {}) {
      const unsubs = [];
      let first = true;
      unsubs.push(
        onSnapshot(
          roomQuery(roomId, role),
          { includeMetadataChanges: true },
          (snap) => {
            onStatus?.(snap.metadata.fromCache ? 'CONNECTING' : 'SUBSCRIBED');
            if (first) {
              // Caché vacía (primer acceso en este dispositivo): esperar al servidor para no mostrar "vacío"
              if (snap.metadata.fromCache && snap.empty) return;
              first = false;
              onInitial?.(snap.docs.map(toResource));
              return;
            }
            snap.docChanges({ includeMetadataChanges: true }).forEach((change) => {
              if (change.type === 'removed') onResource?.({ eventType: 'DELETE', old: { id: change.doc.id } });
              else onResource?.({ eventType: EVENT[change.type], new: toResource(change.doc) });
            });
          },
          (error) => {
            console.error('[ColaboraFP] realtime', error);
            onStatus?.('CHANNEL_ERROR');
          },
        ),
      );
      if (role === 'teacher' && onReports)
        unsubs.push(
          onSnapshot(
            reportsCol(roomId),
            (snap) => onReports(snap.docs.map((d) => ({ id: d.id, ...d.data(), expire_at: ms(d.data().expire_at) }))),
            () => {},
          ),
        );
      // Estado abierta/cerrada de la sala, visible también para el alumnado vía pins/{pin}
      if (pin)
        unsubs.push(
          onSnapshot(
            pinRef(pin),
            (snap) => {
              const d = snap.exists() ? snap.data() : null;
              const open = !!d && d.room_id === roomId && d.active && d.closes_at > Date.now();
              onRoom?.({ eventType: 'UPDATE', new: { is_active: open, closes_at: d?.closes_at, expire_at: d ? ms(d.expire_at) : undefined } });
            },
            () => onRoom?.({ eventType: 'UPDATE', new: { is_active: false } }), // sin permiso = sala cerrada
          ),
        );
      return () => unsubs.forEach((u) => u());
    },

    /** Vigila peticiones concretas (las del propio alumno) para saber si se aprueban o rechazan. */
    watchResources(roomId, ids, onResource) {
      const unsubs = ids.map((id) =>
        onSnapshot(
          resRef(roomId, id),
          (snap) => {
            if (!snap.exists()) onResource({ eventType: 'DELETE', old: { id } });
            else onResource({ eventType: 'UPDATE', new: toResource(snap) });
          },
          () => {},
        ),
      );
      return () => unsubs.forEach((u) => u());
    },
  };

  return { mode: 'firebase', auth: authApi, rooms, resources, reports, realtime };
};
