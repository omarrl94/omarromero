import { ChevronLeft, DoorClosed, DoorOpen, ExternalLink, Inbox, Maximize2, Megaphone, QrCode, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ApprovalInbox from '../components/ApprovalInbox';
import ConnectionBadge from '../components/ConnectionBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ResourceCard from '../components/ResourceCard';
import ResourceForm from '../components/ResourceForm';
import RoomNotice from '../components/RoomNotice';
import RoomQRCode from '../components/RoomQRCode';
import Spinner from '../components/Spinner';
import { RoomProvider } from '../context/RoomContext';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { backend } from '../services/backend';
import { formatPin } from '../utils/ids';

/** Ruta privada /profesor/sala/:roomId — carga la sala y verifica la propiedad. */
export default function RoomControlPanel() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, room: null });

  useEffect(() => {
    let alive = true;
    backend.rooms
      .getById(roomId)
      .then((room) => alive && setState({ loading: false, room: room?.teacher_id === user.id ? room : null }))
      .catch(() => alive && setState({ loading: false, room: null }));
    return () => {
      alive = false;
    };
  }, [roomId, user.id]);

  if (state.loading) return <Spinner fullPage label="Abriendo sala…" />;
  if (!state.room)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sala no disponible</h1>
        <p className="mt-2 text-stone-500">No existe o no pertenece a tu cuenta.</p>
        <Link to="/profesor" className="btn-primary mt-8">Volver a mis salas</Link>
      </div>
    );

  return (
    <RoomProvider room={state.room} role="teacher">
      <ControlPanel onRoomChange={(room) => setState((s) => ({ ...s, room }))} />
    </RoomProvider>
  );
}

const TABS = [
  { id: 'emit', label: 'Emitir', icon: Send },
  { id: 'inbox', label: 'Bandeja', icon: Inbox },
  { id: 'feed', label: 'Muro', icon: Megaphone },
];

function ControlPanel({ onRoomChange }) {
  const { room, publish, publishedResources, pendingRequests, remove, connection, error, isFresh } = useRoomFeed();
  const [tab, setTab] = useState('emit');
  const [qrOpen, setQrOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Aviso en la pestaña del navegador cuando hay peticiones pendientes
  useDocumentTitle(pendingRequests.length ? `(${pendingRequests.length}) ${room.name}` : room.name);

  const toggleActive = async () => {
    try {
      onRoomChange(await backend.rooms.setActive(room.id, !room.is_active));
    } catch (e) {
      setActionError(e.message);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('¿Eliminar este recurso del muro de la clase?')) return;
    try {
      await remove(id);
    } catch (e) {
      setActionError(e.message);
    }
  };

  const panel = (id) => (tab === id ? 'block' : 'hidden lg:block');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Cabecera de la sala */}
      <div className="card mb-6 flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <Link to="/profesor" className="btn-ghost btn-sm" aria-label="Volver a mis salas">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{room.module || 'Sala de clase'}</p>
          <h1 className="truncate text-xl font-extrabold sm:text-2xl">{room.name}</h1>
        </div>
        <button
          onClick={() => setQrOpen(true)}
          className="group flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-2 transition hover:border-brand-400 dark:border-ink-700"
          title="Mostrar QR a pantalla completa"
        >
          <QrCode className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          <span className="text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-stone-500">PIN</span>
            <span className="block font-mono text-xl font-extrabold tracking-widest">{formatPin(room.pin)}</span>
          </span>
          <Maximize2 className="h-4 w-4 text-stone-400 group-hover:text-brand-500" />
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionBadge status={connection} />
          <a href={`/sala/${room.pin}`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm" title="Abrir la vista del alumnado">
            <ExternalLink className="h-4 w-4" />
            Vista alumno
          </a>
          <button onClick={toggleActive} className={room.is_active ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'}>
            {room.is_active ? <DoorClosed className="h-4 w-4" /> : <DoorOpen className="h-4 w-4" />}
            {room.is_active ? 'Cerrar sala' : 'Reabrir'}
          </button>
        </div>
      </div>

      {!room.is_active && (
        <p className="mb-4 rounded-xl bg-sun-100 px-4 py-3 text-sm font-medium text-sun-900 dark:bg-sun-500/15 dark:text-sun-200">
          La sala está cerrada: el PIN no admite nuevos alumnos ni aportaciones.
        </p>
      )}
      {(error || actionError) && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error || actionError}</p>
      )}

      {/* Pestañas en móvil/tablet; columnas en escritorio */}
      <div role="tablist" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-ink-900 lg:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold ${
              tab === id ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-white' : 'text-stone-500'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'inbox' && pendingRequests.length > 0 && (
              <span className="chip absolute -right-1 -top-1 bg-sun-500 px-1.5 text-[10px] text-ink-950">{pendingRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={`card p-5 ${panel('emit')}`} aria-labelledby="emission-heading">
            <h2 id="emission-heading" className="section-title mb-4">
              <Send className="h-4 w-4" />
              Emisión
            </h2>
            <ResourceForm onSubmit={publish} submitLabel="Publicar en el muro" submittingLabel="Publicando…" idPrefix="emit" />
          </section>

          <section className={panel('feed')} aria-labelledby="feed-heading">
            <h2 id="feed-heading" className="section-title mb-3">
              <Megaphone className="h-4 w-4" />
              Muro publicado
              <span className="chip bg-stone-200 text-stone-700 dark:bg-ink-800 dark:text-stone-300">{publishedResources.length}</span>
            </h2>
            {publishedResources.length === 0 ? (
              <EmptyState icon={Megaphone} title="Todavía no hay nada publicado">
                Lo que publiques o apruebes aparecerá aquí y en las pantallas del alumnado.
              </EmptyState>
            ) : (
              <ol className="space-y-4">
                {publishedResources.map((r) => (
                  <li key={r.id} className={isFresh(r.id) ? 'animate-arrive rounded-2xl' : undefined}>
                    <ResourceCard
                      resource={r}
                      maxHeight="20rem"
                      actions={
                        <button onClick={() => handleRemove(r.id)} className="btn-danger btn-sm !px-2" title="Eliminar del muro" aria-label="Eliminar del muro">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className={`lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 scroll-thin ${panel('inbox')}`}>
          <ApprovalInbox />
        </div>
      </div>

      <RoomNotice />
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Únete a la clase" size="full">
        <div className="py-6">
          <RoomQRCode room={room} size="giant" />
        </div>
      </Modal>
    </div>
  );
}
