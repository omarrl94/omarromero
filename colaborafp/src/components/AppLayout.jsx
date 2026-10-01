import { LayoutDashboard, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { isDemoMode } from '../services/backend';
import { CENTER_NAME } from '../utils/constants';
import Logo from './Logo';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isStudentRoom = pathname.startsWith('/sala/');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-ink-800 dark:bg-ink-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to={user ? '/profesor' : '/'} className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            <Logo />
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {isDemoMode && (
              <span
                className="chip hidden bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 md:inline-flex"
                title="Sin credenciales de Supabase: datos locales sincronizados entre pestañas de este navegador"
              >
                Modo demo
              </span>
            )}
            {user ? (
              <>
                <Link to="/profesor" className="btn-ghost btn-sm">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Mis salas</span>
                </Link>
                <button onClick={signOut} className="btn-ghost btn-sm" title={`Cerrar sesión (${user.email})`}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </>
            ) : (
              !isStudentRoom && (
                <Link to="/login" className="btn-ghost btn-sm">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Acceso profesorado</span>
                </Link>
              )
            )}
            <button
              onClick={toggleTheme}
              className="btn-ghost btn-sm"
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className={`border-t border-slate-200 pt-5 text-center ${isStudentRoom ? "pb-28" : "pb-5"} text-xs text-slate-500 dark:border-ink-800 dark:text-slate-500`}>
        <p>
          <span className="font-semibold text-slate-700 dark:text-slate-300">ColaboraFP</span> · {CENTER_NAME}
        </p>
        <p className="mt-1">Departamento de Informática y Comunicaciones</p>
      </footer>
    </div>
  );
}
