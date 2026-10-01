import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import StudentLiveFeed from './pages/StudentLiveFeed';

// El alumnado solo descarga lo que usa; las pantallas del profesorado se cargan bajo demanda
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const RoomControlPanel = lazy(() => import('./pages/RoomControlPanel'));

export default function App() {
  return (
    <Suspense fallback={<Spinner fullPage label="Cargando…" />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Rutas públicas */}
          <Route index element={<Home />} />
          <Route path="sala/:pin" element={<StudentLiveFeed />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />

          {/* Rutas privadas (profesorado) */}
          <Route path="profesor" element={<ProtectedRoute />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="sala/:roomId" element={<RoomControlPanel />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
