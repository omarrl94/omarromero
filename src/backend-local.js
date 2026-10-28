// Modo demostración: todo vive en el localStorage de este navegador.
import { ADMIN_EMAIL, ADMIN_NOMBRE, CODIGO_AULA_DEMO, DOMINIO, STORE_KEY } from "./constantes.js";
import { DB, reemplazarDB, generarCodigoTitulo, notaMediaDe } from "./estado.js";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const ahora = () => new Date().toISOString();

function estadoInicial() {
  const t = ahora();
  const consents = { privacidad: t, iaAct: t };
  return {
    users: [
      { id: "admin", nombre: ADMIN_NOMBRE, email: ADMIN_EMAIL, role: "admin", ciclo: null, curso: null, pwHash: null, salt: uid(), createdAt: t, consents },
      { id: "demo-dam", nombre: "Alumno DAM (demo)", email: "alumno.dam@jrotero.es", role: "alumno", ciclo: "DAM", curso: "2º", pwHash: null, salt: uid(), createdAt: t, consents },
      { id: "demo-asir", nombre: "Alumna ASIR (demo)", email: "alumna.asir@jrotero.es", role: "alumno", ciclo: "ASIR", curso: "2º", pwHash: null, salt: uid(), createdAt: t, consents }
    ],
    progress: {},
    submissions: [],
    diplomas: [],
    config: { codigoAula: CODIGO_AULA_DEMO }
  };
}

async function hashPassword(pw, salt) {
  const data = new TextEncoder().encode(salt + ":" + pw);
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381; for (const b of data) h = ((h << 5) + h + b) >>> 0;   // contexto no seguro
  return "djb2-" + h.toString(16);
}

export function crearBackendLocal() {
  let memoria = null;
  let alCambiarAuth = () => {};
  let alCambiarDatos = () => {};

  const guardar = () => {
    memoria = structuredClone(DB);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch {}
    alCambiarDatos();
  };
  const cargar = () => {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch {}
    return memoria || estadoInicial();
  };
  const recordar = (id) => { try { id ? sessionStorage.setItem("jro_uid", id) : sessionStorage.removeItem("jro_uid"); } catch {} };
  const recordado = () => { try { return sessionStorage.getItem("jro_uid"); } catch { return null; } };

  const avisar = (id) => {
    const u = DB.users.find(x => x.id === id);
    alCambiarAuth(u ? { estado: "dentro", userId: u.id, email: u.email, verificado: true } : { estado: "fuera" });
  };
  const yo = () => DB.users.find(x => x.id === recordado());
  const borrarDatosDe = (id) => {
    DB.users = DB.users.filter(u => u.id !== id);
    delete DB.progress[id];
    DB.submissions = DB.submissions.filter(s => s.userId !== id);
    DB.diplomas = DB.diplomas.filter(d => d.userId !== id);
  };

  return {
    modo: "demo",

    iniciar(onAuth, onDatos) {
      alCambiarAuth = onAuth; alCambiarDatos = onDatos;
      const datos = cargar();
      datos.config = datos.config || { codigoAula: CODIGO_AULA_DEMO };
      reemplazarDB(datos);
      guardar();
      avisar(recordado());
    },

    async accesoDemo(id) { recordar(id); avisar(id); },

    async entrar(email, password) {
      const u = DB.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new Error("No existe ninguna cuenta con ese correo.");
      if (!u.pwHash) {
        if (password.length < 8) throw new Error("Primer acceso: elige una contraseña de al menos 8 caracteres.");
        u.pwHash = await hashPassword(password, u.salt); guardar();
      } else if (await hashPassword(password, u.salt) !== u.pwHash) {
        throw new Error("Contraseña incorrecta.");
      }
      recordar(u.id); avisar(u.id);
    },

    async registrar({ nombre, email, codigo, ciclo, curso, password }) {
      if (DB.users.some(u => u.email.toLowerCase() === email)) throw new Error("Ya existe una cuenta con ese correo.");
      if (email === ADMIN_EMAIL) throw new Error("La cuenta del profesor ya existe en la demostración: usa el acceso rápido.");
      if (!email.endsWith(DOMINIO) && codigo !== DB.config.codigoAula) throw new Error(`Usa tu correo ${DOMINIO} o el código de acceso de aula que te ha dado el profesor.`);
      const t = ahora(), salt = uid();
      const nuevo = { id: uid(), nombre, email, role: "alumno", ciclo, curso, salt, pwHash: await hashPassword(password, salt), createdAt: t, consents: { privacidad: t, iaAct: t } };
      DB.users.push(nuevo); guardar();
      recordar(nuevo.id); avisar(nuevo.id);
    },

    async salir() { recordar(null); avisar(null); },
    async recuperarPassword() { throw new Error("En la demostración no se envían correos. Pide al profesor que restablezca tu contraseña."); },
    async reenviarVerificacion() {},
    async comprobarVerificacion() {},
    async completarPerfil() {},

    async alternarProgreso(n) {
      const id = yo().id;
      DB.progress[id] = DB.progress[id] || {};
      if (DB.progress[id][n]) delete DB.progress[id][n]; else DB.progress[id][n] = ahora();
      guardar();
    },

    async guardarEntrega(n, { enlace, pareja, comentario }) {
      const u = yo();
      let e = DB.submissions.find(s => s.userId === u.id && s.sesion === n);
      if (e?.estado === "aprobada") throw new Error("Esta entrega ya está aprobada.");
      if (!e) { e = { id: `${u.id}_${n}`, userId: u.id, sesion: n, nombre: u.nombre, ciclo: u.ciclo, curso: u.curso }; DB.submissions.push(e); }
      Object.assign(e, { enlace, pareja, comentario, ts: ahora(), estado: "pendiente" });
      guardar();
    },

    async evaluarEntrega(id, { estado, nota, feedback }) {
      const s = DB.submissions.find(x => x.id === id);
      Object.assign(s, { estado, nota, feedback, revisadoEn: ahora(), revisadoPor: ADMIN_EMAIL });
      guardar();
    },

    async emitirTitulo(userId) {
      const u = DB.users.find(x => x.id === userId);
      if (DB.diplomas.some(d => d.userId === userId)) return;
      if (DB.submissions.find(s => s.userId === userId && s.sesion === 12)?.estado !== "aprobada") throw new Error("Falta aprobar el Proyecto Final (Sesión 12).");
      DB.diplomas.push({ id: userId, userId, codigo: generarCodigoTitulo(), emitidoEn: ahora(), emitidoPor: ADMIN_EMAIL, nota: notaMediaDe(userId), nombre: u.nombre, ciclo: u.ciclo, curso: u.curso });
      guardar();
    },

    async revocarTitulo(id) { DB.diplomas = DB.diplomas.filter(d => d.id !== id); guardar(); },

    async eliminarMiCuenta() { borrarDatosDe(yo().id); guardar(); recordar(null); avisar(null); },
    async eliminarUsuario(id) { borrarDatosDe(id); guardar(); },
    async restablecerPassword(id) { DB.users.find(u => u.id === id).pwHash = null; guardar(); return "Contraseña restablecida: el alumno elegirá una nueva en su siguiente acceso."; },
    async cambiarCodigoAula(codigo) { DB.config.codigoAula = codigo; guardar(); },

    async verificarTitulo(codigo) {
      const d = DB.diplomas.find(x => x.codigo === codigo);
      return d ? { codigo: d.codigo, nombre: d.nombre, ciclo: d.ciclo, curso: d.curso, emitidoEn: d.emitidoEn } : null;
    }
  };
}
