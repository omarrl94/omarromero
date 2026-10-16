import { ArrowRight, DoorClosed, DoorOpen, Plus, Presentation, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { backend } from '../services/backend';
import { formatDate, formatDay, isRoomOpen } from '../utils/format';
import { RETENTION_DAYS } from '../utils/constants';
import AccountPanel from '../components/AccountPanel';
import { formatPin } from '../utils/ids';

export default function TeacherDashboard() {
  useDocumentTitle('Mis salas');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '' });
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
      await backend.rooms.setActive(room.id, !isRoomOpen(room));
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
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Panel del profesorado</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950 dark:text-white sm:text-4xl">Hola, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-stone-600 dark:text-stone-400">Gestiona tus salas de clase y lo que compartes con tus grupos.</p>
        </div>
        {rooms && rooms.length > 0 && (
          <dl className="grid grid-cols-3 gap-3">
            {[
              { label: 'Salas', value: rooms.length, tone: 'bg-brand-400' },
              { label: 'Abiertas', value: rooms.filter(isRoomOpen).length, tone: 'bg-accent-300' },
              { label: 'Recursos', value: rooms.reduce((n, r) => n + (r.resource_count || 0), 0), tone: 'bg-sun-400' },
            ].map((s) => (
              <div key={s.label} className="card min-w-[6.5rem] px-4 py-3">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                  <span className={`h-2 w-2 rounded-full ${s.tone}`} />
                  {s.label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-ink-950 dark:text-white">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
        <div className="h-fit space-y-6 lg:sticky lg:top-24">
        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300"><Plus className="h-4 w-4" /></span>
            Nueva sala
          </h2>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="label" htmlFor="room-name">Nombre de la sesión</label>
              <input id="room-name" className="input" required maxLength={120} placeholder="1º DAM · Bucles en Python"
                aria-describedby="room-name-help"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <p id="room-name-help" className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">Indica el curso o grupo y el tema. Válido para cualquier ciclo.</p>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={creating || !form.name.trim()}>
              <Presentation className="h-4 w-4" />
              {creating ? 'Creando…' : 'Crear sala y generar QR'}
            </button>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              La sala se cierra sola a las 12 horas (puedes reabrirla) y su contenido se borra automáticamente a los {RETENTION_DAYS} días.
            </p>
          </form>
        </section>
        <AccountPanel />
        </div>

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
                <li key={room.id} className="card relative flex flex-col overflow-hidden p-5 pt-6 transition hover:shadow-lift">
                  <span className={`absolute inset-x-0 top-0 h-1 ${isRoomOpen(room) ? 'bg-brand-400' : 'bg-stone-200 dark:bg-ink-700'}`} aria-hidden="true" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow truncate">{room.module || 'Sala de clase'}</p>
                      <h3 className="truncate text-lg font-bold">{room.name}</h3>
                    </div>
                    <span className={`chip shrink-0 ${isRoomOpen(room) ? 'bg-accent-100 text-accent-800 dark:bg-accent-300/15 dark:text-accent-300' : 'bg-stone-100 text-stone-700 dark:bg-ink-800 dark:text-stone-300'}`}>
                      {isRoomOpen(room) ? 'Abierta' : 'Cerrada'}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-stone-600 dark:text-stone-400">PIN</dt>
                      <dd className="font-mono text-lg font-bold tracking-wider">{formatPin(room.pin)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-600 dark:text-stone-400">Recursos</dt>
                      <dd className="font-display text-lg font-bold">{room.resource_count}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">Creada el {formatDate(room.created_at)} · se borra el {formatDay(room.expire_at)}</p>
                  <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4 dark:border-ink-800">
                    <Link to={`/profesor/sala/${room.id}`} className="btn-primary btn-sm flex-1">
                      Abrir panel
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button className="btn-secondary btn-sm" onClick={() => toggleActive(room)} title={isRoomOpen(room) ? 'Cerrar sala' : 'Reabrir sala'} aria-label={`${isRoomOpen(room) ? 'Cerrar' : 'Reabrir'} ${room.name}`}>
                      {isRoomOpen(room) ? <DoorClosed className="h-4 w-4" aria-hidden="true" /> : <DoorOpen className="h-4 w-4" aria-hidden="true" />}
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
