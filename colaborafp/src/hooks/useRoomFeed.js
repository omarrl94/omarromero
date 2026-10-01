import { useContext } from 'react';
import { RoomContext } from '../context/RoomContext';

/** Acceso al estado y acciones de la sala actual (publishedResources, pendingRequests, approve…). */
export function useRoomFeed() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoomFeed debe usarse dentro de <RoomProvider>');
  return ctx;
}
