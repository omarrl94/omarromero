// Caché en memoria que pinta la interfaz. La rellena el backend activo
// (localStorage en modo demostración, Firestore en producción).
import { DOMINIO } from "./constantes.js";

export const DB = { usuarios: [], formaciones: [], matriculas: [], solicitudes: [], pedidos: [], codigos: [], avisos: [] };

export function reemplazarDB(nuevo) {
  for (const k of Object.keys(DB)) delete DB[k];
  Object.assign(DB, { usuarios: [], formaciones: [], matriculas: [], solicitudes: [], pedidos: [], codigos: [], avisos: [] }, nuevo);
}

export const idMatricula = (uid, formacionId) => `${uid}_${formacionId}`;

export function generarCodigoAcceso(prefijo = "JRO") {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin 0/O ni 1/I para dictarlo sin errores
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const s = Array.from(bytes, b => letras[b % letras.length]).join("");
  return `${prefijo}-${s.slice(0, 4)}-${s.slice(4)}`;
}

export const esDelCentro = (u) => !!u?.email && u.email.toLowerCase().endsWith(DOMINIO);

/**
 * Por qué tiene acceso un usuario a una formación (o null si no lo tiene).
 * La misma regla la aplica la función «campus» cuando otra plataforma pregunta.
 */
export function motivoAcceso(u, f, verificado = true) {
  if (!u || !f) return null;
  if (u.role === "admin") return "admin";
  const m = DB.matriculas.find(x => x.uid === u.id && x.formacionId === f.id && x.estado === "activa");
  if (m) return m.origen;
  if (f.incluidaCentro && esDelCentro(u) && verificado) return "centro";
  return null;
}
