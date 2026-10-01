import { LayoutDashboard, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { isDemoMode } from '../services/backend';
import { CENTER_NAME } from '../utils/constants';
import Logo, { BrandMark, CenterLockup } from './Logo';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const isStudentRoom = pathname.startsWith('/sala/');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Franja de marca con los tres colores institucionales */}
      <div className="flex h-1" aria-hidden="true">
        <span className="flex-[3] bg-brand-400" />
        <span className="flex-[2] bg-accent-300" />
        <span className="flex-1 bg-sun-400" />
      </div>

      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#faf8f6]/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link to={user ? '/profesor' : '/'} className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
              <Logo />
            </Link>
            <span className="hidden h-8 w-px bg-stone-300 dark:bg-ink-700 md:block" aria-hidden="true" />
            <CenterLockup className="hidden md:inline-flex" />
          </div>

          <nav className="flex items-center gap-1 sm:gap-1.5">
            {isDemoMode && (
              <span
                className="chip hidden border border-sun-300 bg-sun-100 text-sun-800 dark:border-sun-500/30 dark:bg-sun-400/10 dark:text-sun-300 lg:inline-flex"
                title="Sin base de datos configurada: datos locales sincronizados entre pestañas de este navegador"
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
                <Link to="/login" className="btn-secondary btn-sm">
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

      <footer className={`border-t border-stone-200/70 bg-white/60 dark:border-ink-800 dark:bg-ink-900/40 ${isStudentRoom ? 'pb-24' : ''}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <CenterLockup />
          </div>
          <div className="flex items-center gap-2.5 text-sm text-stone-500 dark:text-stone-400">
            <BrandMark className="h-5 w-5" />
            <span>
              <span className="font-display font-bold text-ink-900 dark:text-stone-200">ColaboraFP</span> · Departamento de Informática y Comunicaciones
            </span>
          </div>
        </div>
        <div className="border-t border-stone-200/70 py-3 text-center text-xs text-stone-400 dark:border-ink-800">
          © {new Date().getFullYear()} {CENTER_NAME}
        </div>
      </footer>
    </div>
  );
}
