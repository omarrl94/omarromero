import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dos preferencias independientes:
 *  - 'room': salas de clase (modo oscuro por defecto, ideal para programar/proyectar).
 *  - 'app' : landing, login y dashboard (modo claro por defecto).
 */
const STORAGE_KEY = 'colaborafp:theme:v1';
const DEFAULTS = { room: 'dark', app: 'light' };

export const ThemeContext = createContext(null);

const readPrefs = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
};

export const isRoomPath = (pathname) => /^\/(sala|profesor\/sala)\//.test(pathname);

export function ThemeProvider({ children }) {
  const { pathname } = useLocation();
  const scope = isRoomPath(pathname) ? 'room' : 'app';
  const [prefs, setPrefs] = useState(readPrefs);
  const theme = prefs[scope];

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setPrefs((p) => {
      const next = { ...p, [scope]: p[scope] === 'dark' ? 'light' : 'dark' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [scope]);

  const value = useMemo(() => ({ theme, scope, toggleTheme }), [theme, scope, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
