/**
 * Backend REAL de ColaboraFP sobre Supabase (Auth + Postgres + Realtime).
 * Requiere ejecutar `supabase/schema.sql` en el proyecto y definir
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 *
 * Misma interfaz que `mockBackend.js`.
 */
import { createClient } from '@supabase/supabase-js';
import { generatePin } from '../utils/ids';

const toUser = (u) =>
  u ? { id: u.id, email: u.email, name: u.user_metadata?.full_name || u.email.split('@')[0] } : null;

const toRoom = (r) => r && { ...r, created_at: Date.parse(r.created_at) };

const toResource = (r) =>
  r && {
    id: r.id,
    room_id: r.room_id,
    author: r.author,
    type: r.type,
    content: r.content,
    language: r.language,
    title: r.title,
    status: r.status,
    file_size: r.file_size ?? undefined,
    file_type: r.file_type ?? undefined,
    timestamp: r.created_at ? Date.parse(r.created_at) : Date.now(),
  };

// file_data se descarga solo bajo demanda
const LIST_COLUMNS = 'id, room_id, author, type, content, language, title, status, file_size, file_type, created_at';

const friendlyError = (error) => {
  const msg = error?.message ?? String(error);
  if (/Invalid login credentials/i.test(msg)) return new Error('Correo o contraseña incorrectos.');
  if (/already registered/i.test(msg)) return new Error('Ya existe una cuenta con ese correo.');
  if (error?.code === '23505') return new Error('El PIN de esta sala está en uso por otra sala abierta. Crea una sala nueva.');
  if (/Email not confirmed/i.test(msg)) return new Error('Confirma tu correo antes de iniciar sesión.');
  return new Error(msg);
};

export const createSupabaseBackend = (url, anonKey) => {
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
    realtime: { params: { eventsPerSecond: 20 } },
  });

  const check = ({ data, error }) => {
    if (error) throw friendlyError(error);
    return data;
  };

  const auth = {
    async getUser() {
      const { data } = await supabase.auth.getSession();
      return toUser(data.session?.user ?? null);
    },
    onAuthChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toUser(session?.user ?? null)));
      return () => data.subscription.unsubscribe();
    },
    async signUp({ name, email, password }) {
      const data = check(
        await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } }),
      );
      if (!data.session)
        throw new Error('Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.');
      return toUser(data.user);
    },
    async signIn({ email, password }) {
      return toUser(check(await supabase.auth.signInWithPassword({ email, password })).user);
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  const rooms = {
    async create({ name, module, teacherId }) {
      // Reintenta si el PIN colisiona con otra sala activa (índice único parcial)
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data, error } = await supabase
          .from('rooms')
          .insert({ pin: generatePin(), name: name.trim(), module: module || null, teacher_id: teacherId })
          .select()
          .single();
        if (!error) return toRoom(data);
        if (error.code !== '23505') throw friendlyError(error);
      }
      throw new Error('No se pudo generar un PIN único. Inténtalo de nuevo.');
    },
    async listByTeacher(teacherId) {
      const data = check(
        await supabase
          .from('rooms')
          .select('*, resources(count)')
          .eq('teacher_id', teacherId)
          .eq('resources.status', 'approved')
          .order('created_at', { ascending: false }),
      );
      return data.map((r) => ({ ...toRoom(r), resource_count: r.resources?.[0]?.count ?? 0 }));
    },
    async getById(id) {
      return toRoom(check(await supabase.from('rooms').select('*').eq('id', id).maybeSingle()));
    },
    async getByPin(pin) {
      // RPC security definer: el alumnado no puede listar salas, solo resolver un PIN concreto
      const data = check(await supabase.rpc('get_room_by_pin', { p_pin: pin }));
      return data?.[0] ?? null;
    },
    async setActive(id, isActive) {
      return toRoom(check(await supabase.from('rooms').update({ is_active: isActive }).eq('id', id).select().single()));
    },
    async remove(id) {
      check(await supabase.from('rooms').delete().eq('id', id));
    },
  };

  const resources = {
    async list(roomId) {
      // La RLS ya filtra: el profesor dueño ve pendientes, el alumnado solo aprobados
      const data = check(
        await supabase.from('resources').select(LIST_COLUMNS).eq('room_id', roomId).order('created_at', { ascending: true }),
      );
      return data.map(toResource);
    },
    async create(resource, file) {
      const { timestamp: _ignored, ...row } = resource;
      // Sin .select(): el alumnado no tiene permiso para leer su propia petición pendiente
      check(await supabase.from('resources').insert(file ? { ...row, file_data: file.data } : row));
    },
    async getFile(resource) {
      const data = check(await supabase.from('resources').select('file_data').eq('id', resource.id).maybeSingle());
      if (!data?.file_data) throw new Error('El archivo ya no está disponible.');
      return { data: data.file_data, type: resource.file_type, name: resource.content };
    },
    async setStatus(id, status) {
      // created_at pasa a ser el momento de publicación en el muro
      const patch = status === 'approved' ? { status, created_at: new Date().toISOString() } : { status };
      check(await supabase.from('resources').update(patch).eq('id', id));
    },
    async remove(id) {
      check(await supabase.from('resources').delete().eq('id', id));
    },
  };

  const realtime = {
    subscribeRoom(roomId, { onResource, onRoom, onStatus }) {
      const channel = supabase
        .channel(`room:${roomId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'resources', filter: `room_id=eq.${roomId}` },
          (payload) =>
            onResource?.({ eventType: payload.eventType, new: toResource(payload.new), old: payload.old }),
        )
        // Los DELETE no admiten filtro en Postgres Changes: llegan con solo la PK y se ignoran si no aplican
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'resources' }, (payload) =>
          onResource?.({ eventType: 'DELETE', new: null, old: payload.old }),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          (payload) => onRoom?.({ eventType: 'UPDATE', new: toRoom(payload.new) }),
        )
        .subscribe((status) => onStatus?.(status));
      return () => supabase.removeChannel(channel);
    },
  };

  return { mode: 'supabase', auth, rooms, resources, realtime };
};
