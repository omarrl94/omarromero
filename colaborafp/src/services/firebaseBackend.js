/**
 * Backend REAL de ColaboraFP sobre Firebase (Auth + Cloud Firestore en tiempo real).
 * Plan gratuito "Spark": no requiere tarjeta.
 *
 * Requiere publicar `firebase/firestore.rules` y definir VITE_FIREBASE_CONFIG.
 * Misma interfaz que `mockBackend.js`.
 *
 * Colecciones:
 *   rooms/{id}      { pin, name, module, teacher_id, is_active, created_at }   — solo su profesor
 *   pins/{pin}      { room_id, name, module, teacher_id, active }              — el alumnado resuelve el PIN
 *   resources/{id}  { room_id, author, type, content, language, title, status, timestamp,
 *                     file_size?, file_type?, chunks? }
 *   fileChunks/{id_n} { file_id, room_id, index, data }  — archivo en base64 troceado (≤ 5 MB)
 *
 * Cloud Storage ya no está incluido en el plan gratuito: los archivos se guardan en Firestore.
 */
import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  enableNetwork,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { generatePin } from '../utils/ids';

const CHUNK_SIZE = 900_000; // caracteres base64 por documento (límite de Firestore: 1 MiB)

const PIN_TAKEN = 'El PIN de esta sala está en uso por otra sala abierta. Crea una sala nueva.';

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
  'auth/operation-not-allowed': 'Activa el acceso con correo/contraseña en Firebase (Authentication → Sign-in method).',
  'permission-denied': 'Permiso denegado. ¿Has publicado las reglas de Firestore (firebase/firestore.rules)?',
};

const friendlyError = (error) => new Error(AUTH_ERRORS[error?.code] ?? error?.message ?? String(error));

const wrap = async (fn) => {
  try {
    return await fn();
  } catch (e) {
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

const toUser = (u) => (u ? { id: u.uid, email: u.email, name: u.displayName || u.email.split('@')[0] } : null);
const toResource = (snap) => ({ id: snap.id, ...snap.data(), pending: snap.metadata.hasPendingWrites });

export const createFirebaseBackend = (config, { emulator } = {}) => {
  const app = initializeApp(config);
  const auth = getAuth(app);
  // Long polling automático: funciona también tras proxies/firewalls de centros educativos
  // Caché persistente (IndexedDB, compartida entre pestañas): el muro aparece al instante al entrar o recargar,
  // y las escrituras se muestran antes de que el servidor confirme (compensación de latencia).
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });

  if (emulator) {
    connectAuthEmulator(auth, `http://${emulator}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulator, 8080);
  }

  const roomsCol = collection(db, 'rooms');
  const resourcesCol = collection(db, 'resources');
  const chunksCol = collection(db, 'fileChunks');
  const chunkRef = (fileId, i) => doc(chunksCol, `${fileId}_${i}`);
  const pinRef = (pin) => doc(db, 'pins', pin);

  // ---------- Auth ----------
  const authApi = {
    async getUser() {
      await auth.authStateReady();
      return toUser(auth.currentUser);
    },
    onAuthChange(callback) {
      return onAuthStateChanged(auth, (u) => callback(toUser(u)));
    },
    signUp: ({ name, email, password }) =>
      wrap(async () => {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(user, { displayName: name.trim() });
        return toUser(user);
      }),
    signIn: ({ email, password }) =>
      wrap(async () => toUser((await signInWithEmailAndPassword(auth, email.trim(), password)).user)),
    async signOut() {
      await signOut(auth);
    },
  };

  // ---------- Salas ----------
  const rooms = {
    create: ({ name, module, teacherId }) =>
      wrap(async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          const pin = generatePin();
          const roomRef = doc(roomsCol);
          const room = {
            pin,
            name: name.trim(),
            module: module || null,
            teacher_id: teacherId,
            is_active: true,
            created_at: Date.now(),
          };
          const created = await runTransaction(db, async (tx) => {
            const p = await tx.get(pinRef(pin));
            if (p.exists() && p.data().active) return false; // colisión: probar otro PIN
            tx.set(roomRef, room);
            tx.set(pinRef(pin), { room_id: roomRef.id, name: room.name, module: room.module, teacher_id: teacherId, active: true });
            return true;
          });
          if (created) return { id: roomRef.id, ...room };
        }
        throw new Error('No se pudo generar un PIN único. Inténtalo de nuevo.');
      }),

    listByTeacher: (teacherId) =>
      wrap(async () => {
        const snap = await getDocs(query(roomsCol, where('teacher_id', '==', teacherId)));
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const count = await getCountFromServer(
              query(resourcesCol, where('room_id', '==', d.id), where('status', '==', 'approved')),
            ).catch(() => null);
            return { id: d.id, ...d.data(), resource_count: count?.data().count ?? 0 };
          }),
        );
        return list.sort((a, b) => b.created_at - a.created_at);
      }),

    async getById(id) {
      try {
        const snap = await getDoc(doc(roomsCol, id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch {
        return null; // sin permiso = no es su sala
      }
    },

    getByPin: (pin) =>
      wrap(async () => {
        const snap = await getDoc(pinRef(pin));
        if (!snap.exists() || !snap.data().active) return null;
        const p = snap.data();
        return { id: p.room_id, pin, name: p.name, module: p.module };
      }),

    setActive: (id, isActive) =>
      wrap(async () => {
        const roomRef = doc(roomsCol, id);
        return runTransaction(db, async (tx) => {
          const roomSnap = await tx.get(roomRef);
          if (!roomSnap.exists()) throw new Error('Sala no encontrada.');
          const room = roomSnap.data();
          const p = await tx.get(pinRef(room.pin));
          const pinIsMine = p.exists() && p.data().room_id === id;
          if (isActive && !pinIsMine && p.exists() && p.data().active) throw new Error(PIN_TAKEN);

          tx.update(roomRef, { is_active: isActive });
          if (isActive)
            tx.set(pinRef(room.pin), { room_id: id, name: room.name, module: room.module, teacher_id: room.teacher_id, active: true });
          else if (pinIsMine) tx.update(pinRef(room.pin), { active: false });
          return { id, ...room, is_active: isActive };
        });
      }),

    remove: (id) =>
      wrap(async () => {
        const roomRef = doc(roomsCol, id);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        // Primero los recursos (las reglas comprueban la propiedad a través de la sala)
        const res = await getDocs(query(resourcesCol, where('room_id', '==', id)));
        const refs = res.docs.flatMap((d) => [
          ...Array.from({ length: d.data().chunks || 0 }, (_, i) => chunkRef(d.id, i)),
          d.ref,
        ]);
        for (let i = 0; i < refs.length; i += 400) {
          const batch = writeBatch(db);
          refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
          await batch.commit();
        }
        const p = await getDoc(pinRef(roomSnap.data().pin));
        if (p.exists() && p.data().room_id === id) await deleteDoc(p.ref);
        await deleteDoc(roomRef);
      }),
  };

  // ---------- Recursos ----------
  const roomQuery = (roomId, role) =>
    role === 'teacher'
      ? query(resourcesCol, where('room_id', '==', roomId))
      : query(resourcesCol, where('room_id', '==', roomId), where('status', '==', 'approved'));

  const resources = {
    list: (roomId, { role }) =>
      wrap(async () => {
        const snap = await getDocs(roomQuery(roomId, role));
        return snap.docs.map(toResource).sort((a, b) => a.timestamp - b.timestamp);
      }),
    /** `file` = { data: base64 } para recursos de tipo archivo. Se escribe todo en un único lote atómico. */
    create: ({ id, ...data }, file) =>
      wrap(async () => {
        if (!file) return setDoc(doc(resourcesCol, id), data);
        const parts = [];
        for (let i = 0; i < file.data.length; i += CHUNK_SIZE) parts.push(file.data.slice(i, i + CHUNK_SIZE));
        const batch = writeBatch(db);
        batch.set(doc(resourcesCol, id), { ...data, chunks: parts.length });
        parts.forEach((part, index) =>
          batch.set(chunkRef(id, index), { file_id: id, room_id: data.room_id, index, data: part }),
        );
        await batch.commit();
      }),
    getFile: (resource) =>
      wrap(async () => {
        const chunks = resource.chunks ?? (await getDoc(doc(resourcesCol, resource.id))).data()?.chunks;
        if (!chunks) throw new Error('El archivo ya no está disponible.');
        const snaps = await Promise.all(Array.from({ length: chunks }, (_, i) => getDoc(chunkRef(resource.id, i))));
        if (snaps.some((s) => !s.exists())) throw new Error('El archivo ya no está disponible.');
        return { data: snaps.map((s) => s.data().data).join(''), type: resource.file_type, name: resource.content };
      }),
    setStatus: (id, status) =>
      wrap(() =>
        updateDoc(doc(resourcesCol, id), status === 'approved' ? { status, timestamp: Date.now() } : { status }),
      ),
    remove: (id) =>
      wrap(async () => {
        const ref = doc(resourcesCol, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const batch = writeBatch(db);
        Array.from({ length: snap.data().chunks || 0 }, (_, i) => batch.delete(chunkRef(id, i)));
        batch.delete(ref);
        await batch.commit();
      }),
  };

  // ---------- Realtime ----------
  const EVENT = { added: 'INSERT', modified: 'UPDATE' };

  const realtime = {
    /** Esta implementación entrega la carga inicial por `onInitial`: no hace falta llamar a `list()`. */
    deliversInitialSnapshot: true,

    /** Reactiva la red tras volver a la pestaña o recuperar la conexión (no-op si ya está activa). */
    reconnect: () => enableNetwork(db).catch(() => {}),

    subscribeRoom(roomId, { onResource, onRoom, onStatus, onInitial }, { role, pin } = {}) {
      const unsubs = [];
      let first = true;
      unsubs.push(
        onSnapshot(
          roomQuery(roomId, role),
          { includeMetadataChanges: true },
          (snap) => {
            // fromCache = datos locales mientras (re)conecta con el servidor
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
      // Estado abierta/cerrada de la sala, visible también para el alumnado vía pins/{pin}
      if (pin)
        unsubs.push(
          onSnapshot(
            pinRef(pin),
            (snap) => {
              const open = snap.exists() && snap.data().room_id === roomId && snap.data().active;
              onRoom?.({ eventType: 'UPDATE', new: { is_active: open } });
            },
            () => {},
          ),
        );
      return () => unsubs.forEach((u) => u());
    },

    /** Vigila peticiones concretas (las del propio alumno) para saber si se aprueban o rechazan. */
    watchResources(ids, onResource) {
      const unsubs = ids.map((id) =>
        onSnapshot(
          doc(resourcesCol, id),
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

  return { mode: 'firebase', auth: authApi, rooms, resources, realtime };
};
