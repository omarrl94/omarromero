import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import RoomControlPanel from './pages/RoomControlPanel';
import StudentLiveFeed from './pages/StudentLiveFeed';
import TeacherDashboard from './pages/TeacherDashboard';

export default function App() {
  return (
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
  );
}
