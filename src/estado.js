// Caché en memoria que pinta la interfaz. La rellena el backend activo
// (localStorage en modo demostración, Firestore en producción).
export const DB = { users: [], progress: {}, submissions: [], diplomas: [], tests: [], aprobaciones: {}, config: { codigoAula: "" } };

export function reemplazarDB(nuevo) {
  for (const k of Object.keys(DB)) delete DB[k];
  Object.assign(DB, nuevo);
}

export function generarCodigoTitulo() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `JRO-IA-${new Date().getFullYear()}-${hex}`;
}

export function notaMediaDe(userId) {
  const a = DB.submissions.filter(s => s.userId === userId && s.estado === "aprobada" && typeof s.nota === "number");
  return a.length ? Math.round(a.reduce((t, s) => t + s.nota, 0) / a.length * 10) / 10 : null;
}

/* Enlace de entrada del Campus Virtual (?campus=<token firmado>). Se guarda en la sesión del
   navegador hasta que el registro lo use y se quita de la barra de direcciones. Aquí solo se lee
   (correo y nombre para rellenar el formulario); la firma la comprueba el servidor. */
const CLAVE_CAMPUS = "jro_campus_token";
(() => {
  if (typeof location === "undefined") return;
  const url = new URL(location.href);
  const t = url.searchParams.get("campus");
  if (!t) return;
  try { sessionStorage.setItem(CLAVE_CAMPUS, t); } catch {}
  url.searchParams.delete("campus");
  history.replaceState(null, "", url.pathname + url.search + url.hash);
})();
export function tokenCampus() { try { return sessionStorage.getItem(CLAVE_CAMPUS); } catch { return null; } }
export function olvidarTokenCampus() { try { sessionStorage.removeItem(CLAVE_CAMPUS); } catch {} }
export function datosCampus() {
  const t = tokenCampus();
  if (!t) return null;
  try {
    const p = JSON.parse(atob(t.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
    return p.exp * 1000 > Date.now() ? { email: p.e, nombre: p.n } : null;
  } catch { return null; }
}
