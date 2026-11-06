export interface UsuarioAuth {
  uid: string;
  email: string;
  nombre: string;
}

export interface ProveedorAuth {
  tipo: 'firebase' | 'prueba' | 'sin-configurar';
  /** Se llama con el usuario actual y en cada cambio. Devuelve la función para dejar de escuchar. */
  escuchar(cb: (u: UsuarioAuth | null) => void): () => void;
  registrar(email: string, password: string, nombre: string): Promise<void>;
  entrar(email: string, password: string): Promise<void>;
  salir(): Promise<void>;
  /** ID token para el servidor. `forzar` pide uno nuevo (p. ej. tras verificar el correo). */
  token(forzar?: boolean): Promise<string | null>;
  /** Plan B si el correo del centro no está configurado: Firebase envía la verificación. */
  verificacionFirebase(): Promise<void>;
}

export class ErrorAuth extends Error {}

/** Traduce los errores de Firebase Auth a mensajes claros. */
export function mensajeAuth(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const mapa: Record<string, string> = {
    'auth/email-already-in-use': 'Ya hay una cuenta con ese correo. Inicia sesión o restablece la contraseña.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña es demasiado débil: usa al menos 8 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed': 'No se ha podido conectar con el servicio de cuentas. Comprueba tu conexión; si sigue pasando, avisa a la coordinación de FFE (puede estar bloqueado por la red o por una extensión del navegador).',
    'auth/requires-recent-login': 'Por seguridad, cierra sesión y vuelve a entrar antes de hacer esto.',
  };
  if (mapa[code]) return mapa[code];
  return e instanceof Error ? e.message : 'No se ha podido completar la operación.';
}
