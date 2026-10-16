import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { backend } from '../services/backend';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    backend.auth.getUser().then((u) => {
      if (!alive) return;
      setUser(u);
      setLoading(false);
    });
    const unsubscribe = backend.auth.onAuthChange((u) => setUser(u));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const u = await backend.auth.signIn(credentials);
    setUser(u);
    return u;
  }, []);

  /** Devuelve { verificationSent } (Firebase envía un correo) o inicia sesión directamente (modo demo). */
  const signUp = useCallback(async (data) => {
    const result = await backend.auth.signUp(data);
    if (result?.user) setUser(result.user);
    return result;
  }, []);

  const resendVerification = useCallback((credentials) => backend.auth.resendVerification(credentials), []);

  const deleteAccount = useCallback(async (password) => {
    await backend.auth.deleteAccount(password);
    setUser(null);
  }, []);

  const signOut = useCallback(async () => {
    await backend.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, signIn, signUp, signOut, resendVerification, deleteAccount }),
    [user, loading, signIn, signUp, signOut, resendVerification, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
