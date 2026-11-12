import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { Landing } from './ui/Landing';
import { useAuth } from './auth';
import { firebaseConfigured } from './firebase';
import './ui/styles.css';

/** Control de acceso: sin sesión se ve la portada; con sesión (o modo demostración) la aplicación completa. */
function Gate() {
  const { user, ready, guest, init } = useAuth();
  useEffect(() => init(), [init]);
  if (!ready) return <div className="boot" role="status">Cargando…</div>;
  if (user || guest || !firebaseConfigured && guest) return <App />;
  return <Landing />;
}

createRoot(document.getElementById('root')!).render(<Gate />);
