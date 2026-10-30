// Modo demostración: todo vive en el localStorage de este navegador.
// El pago es simulado: no se cobra nada, pero el recorrido (pedido + matrícula) es el mismo.
import { ADMIN_EMAIL, ADMIN_NOMBRE, STORE_KEY } from "./constantes.js";
import { CATALOGO_INICIAL } from "./catalogo.js";
import { DB, reemplazarDB, idMatricula } from "./estado.js";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const ahora = () => new Date().toISOString();

function estadoInicial() {
  const t = ahora();
  const consents = { privacidad: t };
  return {
    usuarios: [
      { id: "admin", nombre: ADMIN_NOMBRE, email: ADMIN_EMAIL, role: "admin", pwHash: null, salt: uid(), createdAt: t, consents },
      { id: "demo-centro", nombre: "Lucía Pérez (demo)", email: "lucia.perez@jrotero.es", role: "alumno", pwHash: null, salt: uid(), createdAt: t, consents },
      { id: "demo-externo", nombre: "Marcos Gil (demo)", email: "marcos.gil@gmail.com", role: "alumno", pwHash: null, salt: uid(), createdAt: t, consents }
    ],
    formaciones: structuredClone(CATALOGO_INICIAL),
    matriculas: [
      { id: idMatricula("demo-centro", "curso-claude"), uid: "demo-centro", formacionId: "curso-claude", origen: "asignada", estado: "activa", importe: 0, fecha: t, nombre: "Lucía Pérez (demo)", email: "lucia.perez@jrotero.es" }
    ],
    solicitudes: [],
    pedidos: [],
    codigos: [{ id: "JRO-DEMO-2026", formacionId: "master-ia-dam", usosMax: 5, usos: 0, caduca: null, creadoEn: t, nota: "Becas de la 1.ª edición" }],
    avisos: [{ id: uid(), titulo: "¡Bienvenidos al Campus Virtual!", texto: "Desde aquí accedes a todas tus formaciones del centro con una sola cuenta. Si te falta alguna, escríbenos.", formacionId: null, fecha: t, autor: ADMIN_NOMBRE }]
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
  const recordar = (id) => { try { id ? sessionStorage.setItem("jro_campus_uid", id) : sessionStorage.removeItem("jro_campus_uid"); } catch {} };
  const recordado = () => { try { return sessionStorage.getItem("jro_campus_uid"); } catch { return null; } };

  const avisar = (id) => {
    const u = DB.usuarios.find(x => x.id === id);
    alCambiarAuth(u ? { estado: "dentro", userId: u.id, email: u.email, verificado: true } : { estado: "fuera" });
  };
  const yo = () => DB.usuarios.find(x => x.id === recordado());
  const formacion = (id) => {
    const f = DB.formaciones.find(x => x.id === id);
    if (!f) throw new Error("Esa formación ya no está en el catálogo.");
    return f;
  };
  const matricular = (u, f, origen, importe = 0) => {
    const id = idMatricula(u.id, f.id);
    DB.matriculas = DB.matriculas.filter(m => m.id !== id);
    DB.matriculas.push({ id, uid: u.id, formacionId: f.id, origen, estado: "activa", importe, fecha: ahora(), nombre: u.nombre, email: u.email });
  };

  return {
    modo: "demo",
    pagosOnline: true,   // pasarela simulada

    iniciar(onAuth, onDatos) {
      alCambiarAuth = onAuth; alCambiarDatos = onDatos;
      reemplazarDB(cargar());
      guardar();
      avisar(recordado());
    },

    async accesoDemo(id) { recordar(id); avisar(id); },

    async entrar(email, password) {
      const u = DB.usuarios.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new Error("No existe ninguna cuenta con ese correo.");
      if (!u.pwHash) {
        if (password.length < 8) throw new Error("Primer acceso: elige una contraseña de al menos 8 caracteres.");
        u.pwHash = await hashPassword(password, u.salt); guardar();
      } else if (await hashPassword(password, u.salt) !== u.pwHash) {
        throw new Error("Contraseña incorrecta.");
      }
      recordar(u.id); avisar(u.id);
    },

    async registrar({ nombre, email, password }) {
      if (DB.usuarios.some(u => u.email.toLowerCase() === email)) throw new Error("Ya existe una cuenta con ese correo.");
      if (email === ADMIN_EMAIL) throw new Error("La cuenta de administración ya existe en la demostración: usa el acceso rápido.");
      const t = ahora(), salt = uid();
      const nuevo = { id: uid(), nombre, email, role: "alumno", salt, pwHash: await hashPassword(password, salt), createdAt: t, consents: { privacidad: t } };
      DB.usuarios.push(nuevo); guardar();
      recordar(nuevo.id); avisar(nuevo.id);
    },

    async salir() { recordar(null); avisar(null); },
    async recuperarPassword() { throw new Error("En la demostración no se envían correos. Pide al centro que restablezca tu contraseña."); },
    async reenviarVerificacion() {},
    async comprobarVerificacion() { return true; },
    async completarPerfil() {},
    async actualizarPerfil({ nombre }) { yo().nombre = nombre; guardar(); },

    /* ---------- Alumnado ---------- */
    async matricularGratis(formacionId) {
      const f = formacion(formacionId);
      if (Number(f.precio) > 0) throw new Error("Esta formación es de pago.");
      if (f.estado !== "abierta") throw new Error("La matrícula de esta formación no está abierta.");
      matricular(yo(), f, "gratuita"); guardar();
    },

    // Pasarela simulada: en producción es Stripe Checkout (función de Netlify + webhook)
    async comprar(formacionId) {
      const u = yo(), f = formacion(formacionId);
      if (f.estado !== "abierta") throw new Error("La matrícula de esta formación no está abierta.");
      DB.pedidos.push({ id: "demo_" + uid(), uid: u.id, formacionId: f.id, importe: Number(f.precio), moneda: "eur", estado: "pagado", fecha: ahora(), nombre: u.nombre, email: u.email, metodo: "Pago simulado (demostración)" });
      matricular(u, f, "compra", Number(f.precio)); guardar();
      return { simulado: true };
    },

    async canjearCodigo(texto) {
      const c = DB.codigos.find(x => x.id === texto.toUpperCase());
      if (!c) throw new Error("El código no existe.");
      if (c.caduca && new Date(c.caduca) < new Date()) throw new Error("El código ha caducado.");
      if (c.usos >= c.usosMax) throw new Error("El código ya se ha usado todas las veces permitidas.");
      const u = yo(), f = formacion(c.formacionId);
      if (DB.matriculas.some(m => m.uid === u.id && m.formacionId === f.id && m.estado === "activa")) throw new Error("Ya tienes acceso a esta formación.");
      c.usos++;
      matricular(u, f, "codigo"); guardar();
      return f;
    },

    async solicitar(formacionId, mensaje) {
      const u = yo(), f = formacion(formacionId);
      if (DB.solicitudes.some(s => s.uid === u.id && s.formacionId === f.id && s.estado === "pendiente")) throw new Error("Ya tienes una solicitud pendiente para esta formación.");
      DB.solicitudes.push({ id: uid(), uid: u.id, formacionId: f.id, mensaje, estado: "pendiente", fecha: ahora(), nombre: u.nombre, email: u.email });
      guardar();
    },
    async cancelarSolicitud(id) { DB.solicitudes = DB.solicitudes.filter(s => s.id !== id); guardar(); },

    /* ---------- Administración ---------- */
    async guardarFormacion(f) {
      const i = DB.formaciones.findIndex(x => x.id === f.id);
      if (i >= 0) DB.formaciones[i] = { ...DB.formaciones[i], ...f }; else DB.formaciones.push(f);
      guardar();
    },
    async borrarFormacion(id) { DB.formaciones = DB.formaciones.filter(f => f.id !== id); guardar(); },
    async cargarCatalogoInicial() {
      for (const f of CATALOGO_INICIAL) if (!DB.formaciones.some(x => x.id === f.id)) DB.formaciones.push(structuredClone(f));
      guardar();
    },
    async asignarMatricula(uidAlumno, formacionId) {
      const u = DB.usuarios.find(x => x.id === uidAlumno);
      matricular(u, formacion(formacionId), "asignada"); guardar();
    },
    async revocarMatricula(id) {
      const m = DB.matriculas.find(x => x.id === id);
      m.estado = "revocada"; m.revocadaEn = ahora(); guardar();
    },
    async reactivarMatricula(id) {
      const m = DB.matriculas.find(x => x.id === id);
      m.estado = "activa"; delete m.revocadaEn; guardar();
    },
    async resolverSolicitud(id, aceptar, respuesta = "") {
      const s = DB.solicitudes.find(x => x.id === id);
      Object.assign(s, { estado: aceptar ? "aceptada" : "rechazada", respuesta, resueltaEn: ahora() });
      if (aceptar) matricular(DB.usuarios.find(u => u.id === s.uid), formacion(s.formacionId), "asignada");
      guardar();
    },
    async crearCodigo({ id, formacionId, usosMax, caduca, nota }) {
      if (DB.codigos.some(c => c.id === id)) throw new Error("Ese código ya existe.");
      DB.codigos.push({ id, formacionId, usosMax, usos: 0, caduca: caduca || null, nota, creadoEn: ahora() });
      guardar();
    },
    async borrarCodigo(id) { DB.codigos = DB.codigos.filter(c => c.id !== id); guardar(); },
    async publicarAviso({ titulo, texto, formacionId }) {
      DB.avisos.push({ id: uid(), titulo, texto, formacionId: formacionId || null, fecha: ahora(), autor: ADMIN_NOMBRE });
      guardar();
    },
    async borrarAviso(id) { DB.avisos = DB.avisos.filter(a => a.id !== id); guardar(); },
    async eliminarUsuario(id) { borrarDatosDe(id); guardar(); },
    async restablecerPassword(id) { DB.usuarios.find(u => u.id === id).pwHash = null; guardar(); return "Contraseña restablecida: elegirá una nueva en su siguiente acceso."; },

    async eliminarMiCuenta() { const id = yo().id; borrarDatosDe(id); guardar(); recordar(null); avisar(null); }
  };

  function borrarDatosDe(id) {
    DB.usuarios = DB.usuarios.filter(u => u.id !== id);
    DB.matriculas = DB.matriculas.filter(m => m.uid !== id);
    DB.solicitudes = DB.solicitudes.filter(s => s.uid !== id);
    // Los pedidos se conservan: son justificantes de cobro con obligación legal de guardarlos
  }
}
