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
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AuthAction = lazy(() => import('./pages/AuthAction'));
const CalendarTeacher = lazy(() => import('./pages/CalendarTeacher'));
const CalendarStudent = lazy(() => import('./pages/CalendarStudent'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const RoomControlPanel = lazy(() => import('./pages/RoomControlPanel'));
const AvisoLegal = lazy(() => import('./pages/legal/AvisoLegal'));
const Privacidad = lazy(() => import('./pages/legal/Privacidad'));
const Condiciones = lazy(() => import('./pages/legal/Condiciones'));
const Accesibilidad = lazy(() => import('./pages/legal/Accesibilidad'));

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
          <Route path="recuperar-contrasena" element={<ForgotPassword />} />
          <Route path="accion" element={<AuthAction />} />
          <Route path="calendario/:code" element={<CalendarStudent />} />

          {/* Información legal */}
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="condiciones" element={<Condiciones />} />
          <Route path="accesibilidad" element={<Accesibilidad />} />

          {/* Rutas privadas (profesorado) */}
          <Route path="profesor" element={<ProtectedRoute />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="sala/:roomId" element={<RoomControlPanel />} />
            <Route path="calendario/:calId" element={<CalendarTeacher />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
