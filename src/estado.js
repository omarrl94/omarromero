// Caché en memoria que pinta la interfaz. La rellena el backend activo
// (localStorage en modo demostración, Firestore en producción).
export const DB = { users: [], progress: {}, submissions: [], diplomas: [], config: { codigoAula: "" } };

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
