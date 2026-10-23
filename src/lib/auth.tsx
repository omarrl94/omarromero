"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HAY_FIREBASE } from "./config";
import { getAuthSeguro } from "./firebase";

/**
 * Cuentas de Rollo Madrid.
 *
 * Con Firebase configurado son cuentas de verdad (correo + contraseña,
 * Firebase Authentication). Sin él, la app entra en modo local: un alias
 * guardado en este navegador, suficiente para probar el flujo pero sin
 * servidor detrás.
 */

export interface Usuario {
  id: string;
  alias: string;
  email: string | null;
  origen: "firebase" | "local";
}

export type ModoAcceso = "firebase" | "local";

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

/** Traduce los códigos de Firebase, que llegan en inglés. */
function traducir(e: unknown): string {
  const codigo =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const mensaje = e instanceof Error ? e.message : String(e);

  switch (codigo) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Ese correo y esa contraseña no cuadran.";
    case "auth/email-already-in-use":
      return "Ese correo ya tiene cuenta. Prueba a entrar.";
    case "auth/weak-password":
      return "La contraseña necesita al menos 6 caracteres.";
    case "auth/invalid-email":
      return "Ese correo no tiene buena pinta.";
    case "auth/too-many-requests":
      return "Demasiados intentos seguidos. Espera un minuto.";
    case "auth/network-request-failed":
      return "No hemos podido hablar con Firebase. Mira la conexión.";
    case "auth/operation-not-allowed":
      return "Falta activar el acceso por correo en Firebase → Authentication → Sign-in method.";
    case "auth/configuration-not-found":
      return "Firebase Authentication no está configurado en este proyecto.";
    default:
      return mensaje;
  }
}

/** Alias por defecto: lo que hay antes de la arroba. */
function aliasDeUsuario(user: User): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  return user.email?.split("@")[0] ?? "Anónimo con prisa";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const modo: ModoAcceso = HAY_FIREBASE ? "firebase" : "local";

  // Recupera la sesión guardada y se queda escuchando los cambios.
  useEffect(() => {
    const auth = getAuthSeguro();

    if (!auth) {
      try {
        const crudo = window.localStorage.getItem(CLAVE_LOCAL);
        if (crudo) setUsuario(JSON.parse(crudo) as Usuario);
      } catch {
        // Sin almacenamiento: se entra como invitado y ya está.
      }
      setCargando(false);
      return;
    }

    return onAuthStateChanged(auth, (user) => {
      setUsuario(
        user
          ? {
              id: user.uid,
              alias: aliasDeUsuario(user),
              email: user.email,
              origen: "firebase",
            }
          : null,
      );
      setCargando(false);
    });
  }, []);

  const registrar = useCallback(
    async (email: string, password: string, alias: string): Promise<Resultado> => {
      const auth = getAuthSeguro();
      if (!auth) return { ok: false, mensaje: "No hay servidor de cuentas." };

      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        // El alias es lo único que se ve en los partes.
        await updateProfile(user, { displayName: alias.trim() });
        setUsuario({
          id: user.uid,
          alias: alias.trim() || aliasDeUsuario(user),
          email: user.email,
          origen: "firebase",
        });
        return { ok: true, mensaje: "Ya estás dentro. A por esos baños." };
      } catch (e) {
        return { ok: false, mensaje: traducir(e) };
      }
    },
    [],
  );

  const entrar = useCallback(
    async (email: string, password: string): Promise<Resultado> => {
      const auth = getAuthSeguro();
      if (!auth) return { ok: false, mensaje: "No hay servidor de cuentas." };

      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        return { ok: true, mensaje: "Dentro. Cuenta lo que veas." };
      } catch (e) {
        return { ok: false, mensaje: traducir(e) };
      }
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
    const auth = getAuthSeguro();
    if (auth) await signOut(auth);
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
