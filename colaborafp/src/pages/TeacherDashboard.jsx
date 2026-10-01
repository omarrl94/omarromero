import { ArrowRight, DoorClosed, DoorOpen, Plus, Presentation, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { backend } from '../services/backend';
import { MODULES } from '../utils/constants';
import { formatDate } from '../utils/format';
import { formatPin } from '../utils/ids';

export default function TeacherDashboard() {
  useDocumentTitle('Mis salas');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', module: MODULES[0] });
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    backend.rooms.listByTeacher(user.id).then(setRooms).catch((e) => setError(e.message));
  }, [user.id]);

  useEffect(load, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const room = await backend.rooms.create({ ...form, teacherId: user.id });
      navigate(`/profesor/sala/${room.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const toggleActive = async (room) => {
    try {
      await backend.rooms.setActive(room.id, !room.is_active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (room) => {
    if (!window.confirm(`¿Eliminar la sala «${room.name}» y todos sus recursos? Esta acción no se puede deshacer.`)) return;
    try {
      await backend.rooms.remove(room.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Hola, {user.name}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Mis salas de clase</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <section className="card h-fit p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Plus className="h-5 w-5 text-brand-600" />
            Nueva sala
          </h2>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="label" htmlFor="room-name">Nombre de la sesión</label>
              <input id="room-name" className="input" required maxLength={120} placeholder="1º DAM · Bucles en Python"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="room-module">Módulo</label>
              <select id="room-module" className="input" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                {MODULES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={creating || !form.name.trim()}>
              <Presentation className="h-4 w-4" />
              {creating ? 'Creando…' : 'Crear sala y generar QR'}
            </button>
          </form>
        </section>

        <section>
          <h2 className="section-title mb-4">Historial de salas</h2>
          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          {rooms === null ? (
            <Spinner label="Cargando salas…" />
          ) : rooms.length === 0 ? (
            <EmptyState icon={Presentation} title="Aún no has creado ninguna sala">
              Crea tu primera sala, proyecta el QR y empieza a compartir código con tu grupo.
            </EmptyState>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room) => (
                <li key={room.id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{room.module}</p>
                      <h3 className="truncate text-lg font-bold">{room.name}</h3>
                    </div>
                    <span className={`chip shrink-0 ${room.is_active ? 'bg-accent-500/15 text-accent-600 dark:text-accent-400' : 'bg-slate-100 text-slate-500 dark:bg-ink-800'}`}>
                      {room.is_active ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">PIN</dt>
                      <dd className="font-mono font-bold">{formatPin(room.pin)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Recursos</dt>
                      <dd className="font-bold">{room.resource_count}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(room.created_at)}</p>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-ink-800">
                    <Link to={`/profesor/sala/${room.id}`} className="btn-primary btn-sm flex-1">
                      Abrir panel
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button className="btn-secondary btn-sm" onClick={() => toggleActive(room)} title={room.is_active ? 'Cerrar sala' : 'Reabrir sala'}>
                      {room.is_active ? <DoorClosed className="h-4 w-4" /> : <DoorOpen className="h-4 w-4" />}
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => remove(room)} title="Eliminar sala" aria-label={`Eliminar ${room.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
