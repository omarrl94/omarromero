import { useEffect, useState } from 'react';

/** Marca de tiempo que se refresca cada `intervalMs` (para textos tipo "hace 2 minutos"). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
