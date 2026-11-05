import { ArrowUp, DoorClosed, Megaphone, PencilLine, Share2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConnectionBadge from '../components/ConnectionBadge';
import EmptyState from '../components/EmptyState';
import MySubmissions from '../components/MySubmissions';
import ReportButton from '../components/ReportButton';
import ResourceCard from '../components/ResourceCard';
import RoomNotice from '../components/RoomNotice';
import ShareResourceModal from '../components/ShareResourceModal';
import Spinner from '../components/Spinner';
import { RoomProvider } from '../context/RoomContext';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNewArrivals } from '../hooks/useNewArrivals';
import { useRoomFeed } from '../hooks/useRoomFeed';
import { backend } from '../services/backend';
import { formatPin, normalizePin } from '../utils/ids';

/** Ruta pública /sala/:pin — resuelve el PIN y monta el muro del alumno. */
export default function StudentLiveFeed() {
  const pin = normalizePin(useParams().pin);
  const [state, setState] = useState({ loading: true, room: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, room: null, error: null });
    backend.rooms
      .getByPin(pin)
      .then((room) => alive && setState({ loading: false, room, error: null }))
      .catch((e) => alive && setState({ loading: false, room: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [pin]);

  useDocumentTitle(state.room?.name ?? `Sala ${formatPin(pin)}`);

  if (state.loading) return <Spinner fullPage label="Buscando la sala…" />;

  if (!state.room)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <DoorClosed className="mx-auto h-14 w-14 text-stone-600 dark:text-stone-400" />
        <h1 className="mt-4 text-2xl font-bold">Sala no encontrada</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {state.error ?? (
            <>
              No hay ninguna sala abierta con el PIN <span className="font-mono font-bold">{formatPin(pin)}</span>.
              Comprueba el número en la pizarra.
            </>
          )}
        </p>
        <Link to="/" className="btn-primary mt-8">
          Probar otro PIN
        </Link>
        {/* Profesorado: puede unirse aunque la sala esté cerrada */}
        <div className="mt-8 text-left">
          <TeacherJoin pin={pin} />
        </div>
      </div>
    );

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <TeacherJoin pin={pin} roomId={state.room.id} />
      </div>
      <RoomProvider room={state.room} role="student">
        <LiveFeed />
      </RoomProvider>
    </>
  );
}

/**
 * Si quien abre la sala es profesor/a: «Abrir en modo profesor» (si ya la gestiona)
 * o «Colaborar como profesor» (como en los calendarios de clase).
 */
function TeacherJoin({ pin, roomId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canManage, setCanManage] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (!roomId) return setCanManage(false);
    backend.rooms.getById(roomId).then((r) => setCanManage(!!r)).catch(() => setCanManage(false));
  }, [user, roomId]);

  if (!user || canManage === null) return null;

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      navigate(`/profesor/sala/${await backend.rooms.joinByPin(pin)}`);
    } catch (e) {
      setError(e.message);
      setJoining(false);
    }
  };

  return (
    <div className="card flex flex-wrap items-center gap-3 border-brand-200 p-4 dark:border-brand-400/30">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800 dark:bg-brand-400/15 dark:text-brand-300">
        {canManage ? <PencilLine className="h-5 w-5" aria-hidden="true" /> : <Users className="h-5 w-5" aria-hidden="true" />}
      </span>
      <p className="min-w-0 flex-1 text-sm">
        {canManage ? (
          <>Gestionas esta sala. Ábrela en modo profesor para moderar y publicar.</>
        ) : (
          <>
            <strong>Eres profesor/a.</strong> Puedes colaborar en esta sala: moderar las aportaciones, publicar y abrirla o cerrarla.
          </>
        )}
      </p>
      {canManage ? (
        <Link to={`/profesor/sala/${roomId}`} className="btn-primary btn-sm">Abrir en modo profesor</Link>
      ) : (
        <button type="button" className="btn-primary btn-sm" onClick={join} disabled={joining}>
          <Users className="h-4 w-4" aria-hidden="true" />
          {joining ? 'Uniéndome…' : 'Colaborar como profesor'}
        </button>
      )}
      {error && <p role="alert" className="w-full rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    </div>
  );
}

function LiveFeed() {
  const { room, publishedResources, loading, error, connection, roomClosed, isFresh } = useRoomFeed();
  const [shareOpen, setShareOpen] = useState(false);
  const { unseenBelow, jumpToTop } = useNewArrivals(publishedResources, loading, room.name);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {room.module || 'Muro de la clase'}
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{room.name}</h1>
          <p className="mt-1 font-mono text-xs text-stone-600 dark:text-stone-400">PIN {formatPin(room.pin)}</p>
        </div>
        <ConnectionBadge status={connection} />
      </div>

      {roomClosed && (
        <p className="mb-4 rounded-xl bg-sun-100 px-4 py-3 text-sm font-medium text-sun-900 dark:bg-sun-500/15 dark:text-sun-200">
          Esta sala está cerrada. Puedes seguir consultando los recursos, pero ya no se admiten aportaciones.
        </p>
      )}

      <div className="mb-6">
        <MySubmissions />
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

      {loading ? (
        <Spinner fullPage label="Cargando el muro…" />
      ) : publishedResources.length === 0 ? (
        <EmptyState icon={Megaphone} title="El muro está vacío">
          En cuanto el profesor publique código, enunciados o enlaces aparecerán aquí al instante.
        </EmptyState>
      ) : (
        <ol className="space-y-5" aria-live="polite" aria-label="Recursos publicados">
          {publishedResources.map((r) => (
            <li key={r.id} className={isFresh(r.id) ? 'animate-arrive rounded-2xl' : undefined}>
              <ResourceCard resource={r} actions={<ReportButton resource={r} />} />
            </li>
          ))}
        </ol>
      )}

      {!roomClosed && (
        <button
          onClick={() => setShareOpen(true)}
          className="btn-accent fixed bottom-6 right-6 z-20 rounded-full px-5 py-4 text-base shadow-xl shadow-accent-500/25 sm:bottom-8 sm:right-8"
        >
          <Share2 className="h-5 w-5" />
          Compartir recurso
        </button>
      )}
      {unseenBelow > 0 && (
        <button
          onClick={jumpToTop}
          className="btn fixed left-1/2 top-20 z-30 -translate-x-1/2 animate-fade-in-up rounded-full bg-ink-900 px-4 py-2 text-white shadow-lift hover:bg-ink-700 dark:bg-brand-400 dark:text-ink-950 dark:hover:bg-brand-300"
        >
          <ArrowUp className="h-4 w-4" />
          {unseenBelow === 1 ? '1 recurso nuevo' : `${unseenBelow} recursos nuevos`}
        </button>
      )}
      <RoomNotice />
      <ShareResourceModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
