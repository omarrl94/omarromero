import { createContext, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { backend } from '../services/backend';
import { TEACHER_AUTHOR } from '../utils/constants';
import { buildResource } from '../utils/resource';

/**
 * Motor de sincronización de una sala.
 *
 * Ciclo de vida de un recurso de alumno:
 *   requestShare() → status 'pending' → Bandeja del profesor
 *     → approve() → status 'approved' → feed de toda la clase
 *     → reject()  → se elimina
 *
 * El profesor publica directamente con status 'approved'.
 */
export const RoomContext = createContext(null);

const initialState = { byId: {}, loaded: false };

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': {
      // Mezcla: lo recibido por realtime durante la carga tiene prioridad
      const byId = {};
      action.resources.forEach((r) => {
        if (!action.deleted.has(r.id)) byId[r.id] = r;
      });
      return { byId: { ...byId, ...state.byId }, loaded: true };
    }
    case 'UPSERT': {
      const prev = state.byId[action.resource.id];
      return { ...state, byId: { ...state.byId, [action.resource.id]: { ...prev, ...action.resource } } };
    }
    case 'REMOVE': {
      if (!state.byId[action.id]) return state;
      const { [action.id]: _removed, ...rest } = state.byId;
      return { ...state, byId: rest };
    }
    default:
      return state;
  }
}

// ---- Seguimiento local de "mis aportaciones" (alumnado) ----
const mineKey = (roomId) => `colaborafp:mine:${roomId}`;
const readMine = (roomId) => {
  try {
    return JSON.parse(localStorage.getItem(mineKey(roomId)) || '{}');
  } catch {
    return {};
  }
};

export function RoomProvider({ room, role, children }) {
  const roomId = room.id;
  const isTeacher = role === 'teacher';
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState(null);
  const [roomClosed, setRoomClosed] = useState(room.is_active === false);
  const [mine, setMine] = useState(() => (isTeacher ? {} : readMine(roomId)));
  const deletedRef = useRef(new Set());

  const updateMine = useCallback(
    (updater) => {
      if (isTeacher) return;
      setMine((prev) => {
        const next = updater(prev);
        if (next !== prev) localStorage.setItem(mineKey(roomId), JSON.stringify(next));
        return next;
      });
    },
    [isTeacher, roomId],
  );

  const handleUpsert = useCallback(
    (resource) => {
      // El alumnado nunca ve peticiones pendientes de otros (en Supabase lo garantiza la RLS)
      if (!isTeacher && resource.status !== 'approved') return;
      dispatch({ type: 'UPSERT', resource });
      if (resource.status === 'approved')
        updateMine((m) => (m[resource.id] && m[resource.id].status !== 'approved'
          ? { ...m, [resource.id]: { ...m[resource.id], status: 'approved' } }
          : m));
    },
    [isTeacher, updateMine],
  );

  const handleRemove = useCallback(
    (id) => {
      deletedRef.current.add(id);
      dispatch({ type: 'REMOVE', id });
      updateMine((m) =>
        m[id] && !['rejected', 'removed'].includes(m[id].status)
          ? { ...m, [id]: { ...m[id], status: m[id].status === 'approved' ? 'removed' : 'rejected' } }
          : m,
      );
    },
    [updateMine],
  );

  const handleEvent = useCallback(
    (event) => {
      if (event.eventType === 'DELETE') handleRemove(event.old?.id);
      else if (event.new) handleUpsert(event.new);
    },
    [handleRemove, handleUpsert],
  );

  // Suscripción realtime ANTES de la carga inicial para no perder eventos
  useEffect(() => {
    let alive = true;
    deletedRef.current = new Set();
    const unsubscribe = backend.realtime.subscribeRoom(roomId, {
      onResource: handleEvent,
      onRoom: (event) => {
        if (event.eventType === 'DELETE' || event.new?.is_active === false) setRoomClosed(true);
        else if (event.new?.is_active) setRoomClosed(false);
      },
      onStatus: (status) => {
        if (!alive) return;
        if (status === 'SUBSCRIBED') setConnection('live');
        else if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) setConnection('error');
        else if (status === 'CLOSED') setConnection('connecting');
      },
    }, { role, pin: room.pin });

    backend.resources
      .list(roomId, { role })
      .then((resources) => {
        if (!alive) return;
        dispatch({ type: 'LOAD', resources, deleted: deletedRef.current });
        const approved = new Set(resources.filter((r) => r.status === 'approved').map((r) => r.id));
        updateMine((m) => {
          let changed = false;
          const next = { ...m };
          Object.entries(m).forEach(([id, s]) => {
            if (s.status === 'pending' && approved.has(id)) {
              next[id] = { ...s, status: 'approved' };
              changed = true;
            }
          });
          return changed ? next : m;
        });
      })
      .catch((e) => alive && setError(e.message));

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [roomId, role, room.pin, handleEvent, updateMine]);

  // Backends sin eventos de borrado para el alumnado (Firebase): vigila sus propias peticiones pendientes
  const pendingMineKey = useMemo(
    () => Object.keys(mine).filter((id) => mine[id].status === 'pending').sort().join(','),
    [mine],
  );
  useEffect(() => {
    if (!pendingMineKey || !backend.realtime.watchResources) return undefined;
    return backend.realtime.watchResources(pendingMineKey.split(','), handleEvent);
  }, [pendingMineKey, handleEvent]);

  // ---------------- Acciones ----------------
  const publish = useCallback(
    async (draft) => {
      const { resource, error: err } = buildResource({ roomId, author: TEACHER_AUTHOR, draft, status: 'approved' });
      if (err) throw new Error(err);
      await backend.resources.create(resource);
      handleUpsert(resource);
      return resource;
    },
    [roomId, handleUpsert],
  );

  const requestShare = useCallback(
    async (draft, alias) => {
      const { resource, error: err } = buildResource({ roomId, author: alias, draft, status: 'pending' });
      if (err) throw new Error(err);
      await backend.resources.create(resource);
      updateMine((m) => ({
        ...m,
        [resource.id]: { status: 'pending', type: resource.type, preview: resource.title || resource.content.slice(0, 60), at: resource.timestamp },
      }));
      return resource;
    },
    [roomId, updateMine],
  );

  const approve = useCallback(
    async (id) => {
      await backend.resources.setStatus(id, 'approved');
      const current = state.byId[id];
      if (current) handleUpsert({ ...current, status: 'approved', timestamp: Date.now() });
    },
    [state.byId, handleUpsert],
  );

  const remove = useCallback(
    async (id) => {
      await backend.resources.remove(id);
      handleRemove(id);
    },
    [handleRemove],
  );

  const dismissSubmission = useCallback(
    (id) =>
      updateMine((m) => {
        const { [id]: _gone, ...rest } = m;
        return rest;
      }),
    [updateMine],
  );

  // ---------------- Derivados ----------------
  const all = useMemo(() => Object.values(state.byId), [state.byId]);
  const publishedResources = useMemo(
    () => all.filter((r) => r.status === 'approved').sort((a, b) => b.timestamp - a.timestamp),
    [all],
  );
  const pendingRequests = useMemo(
    () => (isTeacher ? all.filter((r) => r.status === 'pending').sort((a, b) => a.timestamp - b.timestamp) : []),
    [all, isTeacher],
  );
  const mySubmissions = useMemo(
    () => Object.entries(mine).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.at - a.at),
    [mine],
  );

  const value = useMemo(
    () => ({
      room,
      role,
      loading: !state.loaded,
      error,
      connection,
      roomClosed,
      publishedResources,
      pendingRequests,
      mySubmissions,
      publish,
      requestShare,
      approve,
      reject: remove,
      remove,
      dismissSubmission,
    }),
    [room, role, state.loaded, error, connection, roomClosed, publishedResources, pendingRequests, mySubmissions, publish, requestShare, approve, remove, dismissSubmission],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}
