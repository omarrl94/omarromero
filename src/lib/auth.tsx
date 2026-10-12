"use client";

import type { AuthError, Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HAY_SUPABASE } from "./config";
import { getSupabase } from "./supabase";

/**
 * Cuentas de Rollo Madrid.
 *
 * Con Supabase configurado son cuentas de verdad (correo + contraseña).
 * Sin él, la app entra en modo local: un alias guardado en este
 * navegador, suficiente para probar el flujo pero sin servidor detrás.
 */

export interface Usuario {
  id: string;
  alias: string;
  email: string | null;
  origen: "supabase" | "local";
}

export type ModoAcceso = "supabase" | "local";

interface Resultado {
  ok: boolean;
  /** Mensaje para enseñar al usuario, ya traducido. */
  mensaje?: string;
}

interface AuthContexto {
  usuario: Usuario | null;
  /** true mientras se recupera la sesión guardada. */
  cargando: boolean;
  modo: ModoAcceso;
  registrar: (
    email: string,
    password: string,
    alias: string,
  ) => Promise<Resultado>;
  entrar: (email: string, password: string) => Promise<Resultado>;
  /** Solo en modo local: basta con un alias. */
  entrarLocal: (alias: string) => Resultado;
  salir: () => Promise<void>;
}

const CLAVE_LOCAL = "rollo-madrid:cuenta-local";
const Contexto = createContext<AuthContexto | null>(null);

/** Traduce los errores de Supabase, que llegan en inglés. */
function traducir(error: AuthError | Error): string {
  const texto = error.message.toLowerCase();
  if (texto.includes("invalid login credentials"))
    return "Ese correo y esa contraseña no cuadran.";
  if (texto.includes("already registered") || texto.includes("already exists"))
    return "Ese correo ya tiene cuenta. Prueba a entrar.";
  if (texto.includes("password") && texto.includes("6"))
    return "La contraseña necesita al menos 6 caracteres.";
  if (texto.includes("email not confirmed"))
    return "Confirma el correo que te hemos enviado antes de entrar.";
  if (texto.includes("invalid email") || texto.includes("valid email"))
    return "Ese correo no tiene buena pinta.";
  if (texto.includes("rate limit") || texto.includes("too many"))
    return "Demasiados intentos seguidos. Espera un minuto.";
  if (texto.includes("fetch") || texto.includes("network"))
    return "No hemos podido hablar con el servidor de cuentas. Mira la conexión y las variables de Supabase.";
  return error.message;
}

/** Alias por defecto: lo que hay antes de la arroba. */
function aliasDeSesion(session: Session): string {
  const metadato = session.user.user_metadata?.["alias"];
  if (typeof metadato === "string" && metadato.trim()) return metadato.trim();
  return session.user.email?.split("@")[0] ?? "Anónimo con prisa";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const modo: ModoAcceso = HAY_SUPABASE ? "supabase" : "local";

  // Recupera la sesión guardada y se queda escuchando los cambios.
  useEffect(() => {
    const supabase = getSupabase();

    if (!supabase) {
      try {
        const crudo = window.localStorage.getItem(CLAVE_LOCAL);
        if (crudo) setUsuario(JSON.parse(crudo) as Usuario);
      } catch {
        // Sin almacenamiento: se entra como invitado y ya está.
      }
      setCargando(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUsuario({
          id: data.session.user.id,
          alias: aliasDeSesion(data.session),
          email: data.session.user.email ?? null,
          origen: "supabase",
        });
      }
      setCargando(false);
    });

    const { data: suscripcion } = supabase.auth.onAuthStateChange(
      (_evento, session) => {
        setUsuario(
          session
            ? {
                id: session.user.id,
                alias: aliasDeSesion(session),
                email: session.user.email ?? null,
                origen: "supabase",
              }
            : null,
        );
      },
    );

    return () => suscripcion.subscription.unsubscribe();
  }, []);

  const registrar = useCallback(
    async (email: string, password: string, alias: string): Promise<Resultado> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, mensaje: "No hay servidor de cuentas." };

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { alias: alias.trim() } },
      });
      if (error) return { ok: false, mensaje: traducir(error) };

      // Con la confirmación por correo activada no hay sesión todavía.
      if (!data.session) {
        return {
          ok: true,
          mensaje: "Cuenta creada. Confirma el correo que te hemos enviado.",
        };
      }
      return { ok: true, mensaje: "Ya estás dentro. A por esos baños." };
    },
    [],
  );

  const entrar = useCallback(
    async (email: string, password: string): Promise<Resultado> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, mensaje: "No hay servidor de cuentas." };

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { ok: false, mensaje: traducir(error) };
      return { ok: true, mensaje: "Dentro. Cuenta lo que veas." };
    },
    [],
  );

  const entrarLocal = useCallback((alias: string): Resultado => {
    const limpio = alias.trim();
    if (limpio.length < 2) {
      return { ok: false, mensaje: "El alias necesita al menos 2 letras." };
    }
    const cuenta: Usuario = {
      id: `local-${Date.now()}`,
      alias: limpio,
      email: null,
      origen: "local",
    };
    setUsuario(cuenta);
    try {
      window.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(cuenta));
    } catch {
      // Sin almacenamiento la sesión dura lo que dure la pestaña.
    }
    return { ok: true, mensaje: `Hola, ${limpio}.` };
  }, []);

  const salir = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUsuario(null);
    try {
      window.localStorage.removeItem(CLAVE_LOCAL);
    } catch {
      // Da igual: el estado en memoria ya está limpio.
    }
  }, []);

  const valor = useMemo<AuthContexto>(
    () => ({ usuario, cargando, modo, registrar, entrar, entrarLocal, salir }),
    [usuario, cargando, modo, registrar, entrar, entrarLocal, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
