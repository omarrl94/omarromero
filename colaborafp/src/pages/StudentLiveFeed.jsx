import { DoorClosed, Megaphone, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConnectionBadge from '../components/ConnectionBadge';
import EmptyState from '../components/EmptyState';
import MySubmissions from '../components/MySubmissions';
import ResourceCard from '../components/ResourceCard';
import ShareResourceModal from '../components/ShareResourceModal';
import Spinner from '../components/Spinner';
import { RoomProvider } from '../context/RoomContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
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
        <DoorClosed className="mx-auto h-14 w-14 text-stone-400" />
        <h1 className="mt-4 text-2xl font-bold">Sala no encontrada</h1>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
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
      </div>
    );

  return (
    <RoomProvider room={state.room} role="student">
      <LiveFeed />
    </RoomProvider>
  );
}

function LiveFeed() {
  const { room, publishedResources, loading, error, connection, roomClosed } = useRoomFeed();
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {room.module || 'Muro de la clase'}
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{room.name}</h1>
          <p className="mt-1 font-mono text-xs text-stone-500">PIN {formatPin(room.pin)}</p>
        </div>
        <ConnectionBadge status={connection} />
      </div>

      {roomClosed && (
        <p className="mb-4 rounded-xl bg-sun-100 px-4 py-3 text-sm font-medium text-sun-900 dark:bg-sun-500/15 dark:text-sun-200">
          El profesor ha cerrado esta sala. Puedes seguir consultando los recursos, pero ya no se admiten aportaciones.
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
            <li key={r.id}>
              <ResourceCard resource={r} />
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
      <ShareResourceModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
