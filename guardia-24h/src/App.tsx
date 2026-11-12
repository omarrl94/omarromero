import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Hud } from './components/Hud';
import { useStore } from './game/store';
import { Biblioteca } from './pages/Biblioteca';
import { Distrito } from './pages/Distrito';
import { Docente } from './pages/Docente';
import { Nivel } from './pages/Nivel';
import { Notas } from './pages/Notas';
import { Teoria } from './pages/Teoria';
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
      <div className="pb-24 md:pb-8">
      <Routes>
        <Route path="/" element={<Mapa />} />
        <Route path="/distrito/:id" element={<Distrito />} />
        <Route path="/distrito/:id/nivel/:n" element={<Nivel />} />
        <Route path="/distrito/:id/teoria" element={<Teoria />} />
        <Route path="/epilogo" element={<Nivel epilogo />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/docente" element={<Docente />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
      </Routes>
      </div>
    </BrowserRouter>
  );
}
