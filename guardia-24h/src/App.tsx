import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Hud } from './components/Hud';
import { useStore } from './game/store';
import { Biblioteca } from './pages/Biblioteca';
import { Distrito } from './pages/Distrito';
import { Login } from './pages/Login';
import { Mapa } from './pages/Mapa';

export default function App() {
  const { listo, sesion, iniciar } = useStore();
  useEffect(() => { void iniciar(); }, [iniciar]);
  if (!listo) return <p className="p-4">Cargando…</p>;
  if (!sesion) return <Login />;
  return (
    <BrowserRouter>
      <Hud />
      <Routes>
        <Route path="/" element={<Mapa />} />
        <Route path="/distrito/:id" element={<Distrito />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
      </Routes>
    </BrowserRouter>
  );
}
