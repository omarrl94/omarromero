/**
 * Backend MOCK de ColaboraFP.
 *
 * Simula Auth + base de datos + Realtime sin servidor:
 *  - Persistencia en localStorage.
 *  - "Tiempo real" entre pestañas/ventanas del mismo navegador con BroadcastChannel
 *    (la sesión de Auth se sincroniza además con el evento `storage`).
 *
 * Expone EXACTAMENTE la misma interfaz que `supabaseBackend.js`, de modo que la UI
 * no sabe qué implementación está usando.
 */
import { generatePin, uuid } from '../utils/ids';

const DB_KEY = 'colaborafp:mockdb:v1';
const SESSION_KEY = 'colaborafp:mocksession:v1';
const CHANNEL_NAME = 'colaborafp-realtime';
const LATENCY_MS = 120;

const delay = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

const emptyDb = () => ({ users: [], rooms: [], resources: [] });

const readDb = () => {
  try {
    return { ...emptyDb(), ...JSON.parse(localStorage.getItem(DB_KEY) || '{}') };
  } catch {
    return emptyDb();
  }
};
const writeDb = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const hash = async (text) => {
  const data = new TextEncoder().encode(`colaborafp::${text}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

// ---------- Bus de eventos (misma pestaña + otras pestañas) ----------
const listeners = new Set();
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

const dispatchLocal = (event) => listeners.forEach((fn) => fn(event));
const emit = (event) => {
  dispatchLocal(event);
  channel?.postMessage(event);
};
channel?.addEventListener('message', (e) => dispatchLocal(e.data));

// ---------- Auth ----------
const authListeners = new Set();
const publicUser = (u) => (u ? { id: u.id, email: u.email, name: u.name } : null);

const getStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};
const setSession = (user) => {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
  else localStorage.removeItem(SESSION_KEY);
  authListeners.forEach((fn) => fn(user ? publicUser(user) : null));
};

window.addEventListener('storage', (e) => {
  if (e.key === SESSION_KEY) authListeners.forEach((fn) => fn(getStoredSession()));
});

const auth = {
  async getUser() {
    return getStoredSession();
  },
  onAuthChange(callback) {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },
  async signUp({ name, email, password }) {
    await delay();
    const db = readDb();
    const normalized = email.trim().toLowerCase();
    if (db.users.some((u) => u.email === normalized))
      throw new Error('Ya existe una cuenta con ese correo.');
    const user = { id: uuid(), name: name.trim(), email: normalized, password: await hash(password) };
    db.users.push(user);
    writeDb(db);
    setSession(user);
    return publicUser(user);
  },
  async signIn({ email, password }) {
    await delay();
    const db = readDb();
    const pw = await hash(password);
    const user = db.users.find((u) => u.email === email.trim().toLowerCase() && u.password === pw);
    if (!user) throw new Error('Correo o contraseña incorrectos.');
    setSession(user);
    return publicUser(user);
  },
  async signOut() {
    setSession(null);
  },
};

// ---------- Salas ----------
const rooms = {
  async create({ name, module, teacherId }) {
    await delay();
    const db = readDb();
    let pin;
    do pin = generatePin();
    while (db.rooms.some((r) => r.pin === pin && r.is_active));
    const room = {
      id: uuid(),
      pin,
      name: name.trim(),
      module: module || null,
      teacher_id: teacherId,
      is_active: true,
      created_at: Date.now(),
    };
    db.rooms.push(room);
    writeDb(db);
    return clone(room);
  },
  async listByTeacher(teacherId) {
    await delay(60);
    const db = readDb();
    return db.rooms
      .filter((r) => r.teacher_id === teacherId)
      .map((r) => ({
        ...r,
        resource_count: db.resources.filter((x) => x.room_id === r.id && x.status === 'approved').length,
      }))
      .sort((a, b) => b.created_at - a.created_at);
  },
  async getById(id) {
    await delay(60);
    return clone(readDb().rooms.find((r) => r.id === id) ?? null);
  },
  async getByPin(pin) {
    await delay();
    const room = readDb().rooms.find((r) => r.pin === pin && r.is_active);
    return room ? { id: room.id, pin: room.pin, name: room.name, module: room.module } : null;
  },
  async setActive(id, isActive) {
    await delay(60);
    const db = readDb();
    const room = db.rooms.find((r) => r.id === id);
    if (!room) throw new Error('Sala no encontrada.');
    if (isActive && db.rooms.some((r) => r.id !== id && r.pin === room.pin && r.is_active))
      throw new Error('El PIN de esta sala está en uso por otra sala abierta. Crea una sala nueva.');
    room.is_active = isActive;
    writeDb(db);
    emit({ table: 'rooms', eventType: 'UPDATE', roomId: id, new: clone(room) });
    return clone(room);
  },
  async remove(id) {
    await delay(60);
    const db = readDb();
    db.rooms = db.rooms.filter((r) => r.id !== id);
    db.resources = db.resources.filter((r) => r.room_id !== id);
    writeDb(db);
    emit({ table: 'rooms', eventType: 'DELETE', roomId: id, old: { id } });
  },
};

// ---------- Recursos ----------
const resources = {
  /** role: 'teacher' ve todo; 'student' solo lo aprobado (equivale a la RLS de Supabase). */
  async list(roomId, { role }) {
    await delay(60);
    return readDb()
      .resources.filter((r) => r.room_id === roomId && (role === 'teacher' || r.status === 'approved'))
      .sort((a, b) => a.timestamp - b.timestamp);
  },
  async create(resource) {
    await delay();
    const db = readDb();
    const room = db.rooms.find((r) => r.id === resource.room_id);
    if (!room || !room.is_active) throw new Error('La sala no existe o está cerrada.');
    db.resources.push(resource);
    writeDb(db);
    emit({ table: 'resources', eventType: 'INSERT', roomId: resource.room_id, new: clone(resource) });
  },
  async setStatus(id, status) {
    await delay(60);
    const db = readDb();
    const res = db.resources.find((r) => r.id === id);
    if (!res) throw new Error('El recurso ya no existe.');
    res.status = status;
    // El timestamp representa el momento de publicación en el muro
    if (status === 'approved') res.timestamp = Date.now();
    writeDb(db);
    emit({ table: 'resources', eventType: 'UPDATE', roomId: res.room_id, new: clone(res) });
  },
  async remove(id) {
    await delay(60);
    const db = readDb();
    const res = db.resources.find((r) => r.id === id);
    db.resources = db.resources.filter((r) => r.id !== id);
    writeDb(db);
    emit({ table: 'resources', eventType: 'DELETE', roomId: res?.room_id, old: { id } });
  },
};

// ---------- Realtime ----------
const realtime = {
  /**
   * Se suscribe a los cambios de una sala.
   * handlers: { onResource({eventType, new, old}), onRoom({eventType, new, old}), onStatus(status) }
   */
  subscribeRoom(roomId, { onResource, onRoom, onStatus }) {
    const fn = (event) => {
      if (event.roomId && event.roomId !== roomId) return;
      if (event.table === 'resources') onResource?.(event);
      if (event.table === 'rooms') onRoom?.(event);
    };
    listeners.add(fn);
    setTimeout(() => onStatus?.('SUBSCRIBED'), 0);
    return () => listeners.delete(fn);
  },
};

export const mockBackend = { mode: 'mock', auth, rooms, resources, realtime };
