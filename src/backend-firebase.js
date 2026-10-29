// Producción: Firebase Authentication (correo y contraseña) + Cloud Firestore.
// La seguridad la imponen las reglas de firebase/firestore.rules; este módulo
// mantiene la caché DB sincronizada con onSnapshot y envía los correos con el
// mismo sistema que ColaboraFP y la web de exámenes (función de Netlify + buzón del centro).
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reauthenticateWithCredential,
  EmailAuthProvider, deleteUser, connectAuthEmulator, applyActionCode,
  verifyPasswordResetCode, confirmPasswordReset
} from "firebase/auth";
import {
  initializeFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot, serverTimestamp, writeBatch, getDocs, deleteField
} from "firebase/firestore";
import { ADMIN_EMAIL, ADMIN_NOMBRE, FIREBASE, EMULADOR } from "./constantes.js";
import { DB, reemplazarDB, generarCodigoTitulo, notaMediaDe } from "./estado.js";

const MENSAJES = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/user-not-found": "No existe ninguna cuenta con ese correo.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión o recupera la contraseña.",
  "auth/weak-password": "La contraseña es demasiado débil (mínimo 8 caracteres).",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  "auth/network-request-failed": "Sin conexión con el servidor. Revisa tu red.",
  "auth/requires-recent-login": "Por seguridad, vuelve a escribir tu contraseña.",
  "auth/expired-action-code": "El enlace ha caducado. Pide uno nuevo.",
  "auth/invalid-action-code": "Este enlace no es válido o ya se ha usado.",
  "auth/operation-not-allowed": "El acceso con correo y contraseña no está activado en Firebase (Authentication → Método de acceso).",
  "auth/configuration-not-found": "Firebase Authentication no está configurado en este proyecto.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La clave de API de Firebase no es válida: revisa firebase.web.json.",
  "permission-denied": "Operación no permitida.",
  "unavailable": "Sin conexión con la base de datos. Revisa tu red."
};

function traducir(err, contexto) {
  const msg = MENSAJES[err?.code];
  if (err?.code === "permission-denied" && contexto) return new Error(contexto);
  return new Error(msg || err?.message || "Error inesperado.");
}

const iso = (v) => (v && typeof v.toDate === "function") ? v.toDate().toISOString() : (v ?? null);
const leer = (snap) => snap.data({ serverTimestamps: "estimate" });
const VACIO = () => ({ users: [], progress: {}, submissions: [], diplomas: [], tests: [], aprobaciones: {}, config: { codigoAula: "" } });

export function crearBackendFirebase() {
  const app = initializeApp(FIREBASE);
  const auth = getAuth(app);
  auth.languageCode = "es";   // correos de Firebase (reserva) en español
  // Long polling automático: funciona también tras proxies y cortafuegos de centros educativos
  const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  if (EMULADOR) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }

  let alCambiarAuth = () => {};
  let alCambiarDatos = () => {};
  let escuchas = [];
  let registrando = false;
  let estado = { estado: "cargando" };
  const emitir = (e) => { estado = e; alCambiarAuth(e); };

  const pararEscuchas = () => { escuchas.forEach(f => f()); escuchas = []; };
  const esAdminAuth = (u) => u?.email === ADMIN_EMAIL && u.emailVerified;
  const actual = () => auth.currentUser;

  /* ---------- Correo del centro (función de Netlify) ----------
     Si la función no existe o no está configurada (p. ej. en Firebase Hosting), se usan los
     correos normales de Firebase para la cuenta y no se envían avisos. */
  const MAIL_FN = "/.netlify/functions/correo";
  const remitenteFirebase = `noreply@${FIREBASE.projectId}.firebaseapp.com`;
  let mailConfig = null;
  const configCorreo = () => (mailConfig ??= fetch(MAIL_FN, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok && (r.headers.get("content-type") || "").includes("json") ? r.json() : null))
    .catch(() => null));

  /** Respuesta de la función, o null si hay que recurrir a Firebase. Lanza en caso de límite (429). */
  async function correoCentro(body, conSesion) {
    if (!(await configCorreo())?.configured) return null;
    const token = conSesion ? await actual()?.getIdToken() : null;
    const res = await fetch(MAIL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error(data.error);
    if (!res.ok) { console.error("[curso] correo del centro:", data.error || res.status); return null; }
    return data;
  }

  /** Llamada directa a la función (primer acceso del profesor): no depende del envío de correo. */
  async function funcionCuenta(body, conSesion) {
    const token = conSesion ? await actual()?.getIdToken() : null;
    const res = await fetch(MAIL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    return { ok: !!res?.ok, status: res?.status || 0, error: data.error, motivo: data.motivo };
  }

  /** Explica al profesor por qué no ha funcionado la contraseña inicial. */
  function motivoAccesoInicial(r) {
    if (r.status === 0 || r.status === 404)
      return "Correo o contraseña incorrectos. (Contraseña inicial: la función de Netlify no responde; comprueba que el último despliegue terminó en «Published».)";
    if (r.status === 501 || r.status === 502 || r.status === 429) return r.error;
    if (r.motivo === "sin-admin-password")
      return "Correo o contraseña incorrectos. (Contraseña inicial: la función no ve ADMIN_PASSWORD; revisa en Netlify el nombre exacto, que el ámbito incluya «Functions», y vuelve a desplegar.)";
    if (r.motivo === "no-coincide")
      return "Correo o contraseña incorrectos. (Contraseña inicial: no coincide con el valor de ADMIN_PASSWORD en Netlify. Edítala y escribe exactamente la misma, sin espacios; después vuelve a desplegar.)";
    if (r.motivo === "usada")
      return "La contraseña inicial ya se usó y no vale más. Entra con la que elegiste o pulsa «¿Has olvidado tu contraseña?».";
    return r.error || null;
  }

  /** Avisos por correo (entrega, evaluación, título, alta): nunca bloquean la operación. */
  const avisar = (action, datos = {}) => correoCentro({ action, ...datos }, true).catch((e) => { console.error("[curso] aviso", action, e); return null; });

  async function enviarVerificacion(user) {
    const data = await correoCentro({ action: "verify" }, true);
    if (data?.sent || data?.alreadyVerified) return data.from;
    await sendEmailVerification(user);
    return remitenteFirebase;
  }

  /* ---------- Mapeo de documentos a la caché ---------- */
  const mapearUsuario = (snap) => {
    const d = leer(snap);
    return {
      id: snap.id, nombre: d.nombre, email: d.email, role: d.role, ciclo: d.ciclo, curso: d.curso,
      correoVerificado: d.correoVerificado === true,
      createdAt: iso(d.createdAt),
      consents: { privacidad: iso(d.consents?.privacidad), iaAct: iso(d.consents?.iaAct) },
      progreso: Object.fromEntries(Object.entries(d.progreso || {}).map(([k, v]) => [k, iso(v)]))
    };
  };
  const mapearEntrega = (snap) => {
    const d = leer(snap);
    return { ...d, id: snap.id, ts: iso(d.ts), revisadoEn: iso(d.revisadoEn) };
  };
  const mapearTest = (snap) => {
    const d = leer(snap);
    return { ...d, id: snap.id, ts: iso(d.ts) };
  };
  const mapearTitulo = (snap) => {
    const d = leer(snap);
    return { ...d, id: snap.id, emitidoEn: iso(d.emitidoEn) };
  };

  const ponerUsuarios = (lista) => {
    DB.users = lista;
    DB.progress = Object.fromEntries(lista.map(u => [u.id, u.progreso || {}]));
  };

  const fallo = (e) => { console.error(e); alCambiarDatos(); };

  function escucharDatos(user, esAdmin) {
    pararEscuchas();
    if (esAdmin) {
      escuchas.push(onSnapshot(collection(db, "usuarios"), s => { ponerUsuarios(s.docs.map(mapearUsuario)); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(collection(db, "entregas"), s => { DB.submissions = s.docs.map(mapearEntrega); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(collection(db, "titulos"), s => { DB.diplomas = s.docs.map(mapearTitulo); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(collection(db, "tests"), s => { DB.tests = s.docs.map(mapearTest); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(collection(db, "aprobaciones"), s => { DB.aprobaciones = Object.fromEntries(s.docs.map(d => [d.id, leer(d)])); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(doc(db, "config", "aula"), s => { DB.config = { codigoAula: s.exists() ? s.data().codigo : "" }; alCambiarDatos(); }, fallo));
    } else {
      escuchas.push(onSnapshot(doc(db, "usuarios", user.uid), s => {
        if (!s.exists()) { pararEscuchas(); emitir({ estado: "completar", email: user.email, verificado: user.emailVerified, userId: user.uid }); return; }
        ponerUsuarios([mapearUsuario(s)]); alCambiarDatos();
      }, fallo));
      escuchas.push(onSnapshot(query(collection(db, "entregas"), where("userId", "==", user.uid)), s => { DB.submissions = s.docs.map(mapearEntrega); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(doc(db, "titulos", user.uid), s => { DB.diplomas = s.exists() ? [mapearTitulo(s)] : []; alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(query(collection(db, "tests"), where("userId", "==", user.uid)), s => { DB.tests = s.docs.map(mapearTest); alCambiarDatos(); }, fallo));
      // Si el profesor activa la cuenta a mano, el aviso de verificación desaparece al momento
      escuchas.push(onSnapshot(doc(db, "aprobaciones", user.uid), s => {
        const aprobado = s.exists() && s.data().aprobado === true;
        const verificado = user.emailVerified || aprobado;
        if (estado.estado === "dentro" && estado.verificado !== verificado) emitir({ ...estado, verificado, aprobado });
      }, () => {}));
    }
  }

  async function crearPerfil(user, { nombre, ciclo, curso, codigo }) {
    const esAdmin = user.email === ADMIN_EMAIL;
    const datos = {
      nombre, email: user.email, role: esAdmin ? "admin" : "alumno",
      ciclo: esAdmin ? null : ciclo, curso: esAdmin ? null : curso,
      createdAt: serverTimestamp(),
      consents: { privacidad: serverTimestamp(), iaAct: serverTimestamp() },
      progreso: {}
    };
    if (!esAdmin && codigo) datos.codigoAula = codigo;
    if (esAdmin) await user.getIdToken(true);   // las reglas necesitan email_verified en el token
    try {
      await setDoc(doc(db, "usuarios", user.uid), datos);
    } catch (e) {
      throw traducir(e, esAdmin
        ? "Verifica primero tu correo para activar la cuenta de profesor."
        : "No se ha podido crear el perfil: usa tu correo @jrotero.es o revisa el código de acceso de aula.");
    }
    if (!esAdmin) avisar("registro");
  }

  const estaAprobado = (uid) => getDoc(doc(db, "aprobaciones", uid)).then(s => s.exists() && s.data().aprobado === true).catch(() => false);

  // Cada cambio de sesión invalida el anterior: solo el último llega a la interfaz
  let turno = 0;
  async function procesarUsuario(user) {
    const mio = ++turno;
    const vigente = () => mio === turno;
    if (!user) { pararEscuchas(); reemplazarDB(VACIO()); emitir({ estado: "fuera" }); return; }
    // Primer acceso con la contraseña inicial: hay que cambiarla antes de seguir
    const { claims } = await user.getIdTokenResult().catch(() => ({ claims: {} }));
    if (!vigente()) return;
    if (claims.cambiarPassword) { pararEscuchas(); emitir({ estado: "cambiarpw", email: user.email, userId: user.uid, verificado: true }); return; }
    const aprobado = !user.emailVerified && await estaAprobado(user.uid);
    if (!vigente()) return;
    const base = { email: user.email, verificado: user.emailVerified || aprobado, aprobado, userId: user.uid };
    let perfil;
    try {
      perfil = await getDoc(doc(db, "usuarios", user.uid));
    } catch (e) {
      if (vigente()) emitir({ estado: "error", mensaje: traducir(e).message });
      return;
    }
    if (!vigente()) return;
    if (!perfil.exists()) {
      // El profesor necesita el correo verificado antes de crear su perfil
      if (user.email === ADMIN_EMAIL) {
        if (!user.emailVerified) { emitir({ ...base, estado: "verificar" }); return; }
        try { await crearPerfil(user, { nombre: ADMIN_NOMBRE }); }
        catch { if (vigente()) emitir({ ...base, verificado: false, estado: "verificar" }); return; }
        if (!vigente()) return;
      } else {
        emitir({ ...base, estado: "completar" }); return;
      }
    } else if (perfil.data().correoVerificado !== user.emailVerified) {
      // Para que el profesor vea en el panel quién tiene la verificación pendiente
      updateDoc(perfil.ref, { correoVerificado: user.emailVerified }).catch(() => {});
    }
    reemplazarDB(VACIO());
    escucharDatos(user, esAdminAuth(user));
    emitir({ ...base, estado: "dentro" });
  }

  return {
    modo: "firebase",

    iniciar(onAuth, onDatos) {
      alCambiarAuth = onAuth; alCambiarDatos = onDatos;
      onAuthStateChanged(auth, (user) => { if (!registrando) procesarUsuario(user); });
    },

    async entrar(email, password) {
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        await user.getIdToken(true);   // token con email_verified al día para las reglas
      } catch (e) {
        // Primer acceso del profesor con la contraseña inicial (ADMIN_PASSWORD de Netlify)
        const credencial = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-login-credentials"].includes(e?.code);
        if (!(credencial && email === ADMIN_EMAIL)) throw traducir(e);
        const r = await funcionCuenta({ action: "acceso-inicial", email, password });
        if (!r.ok) throw new Error(motivoAccesoInicial(r) || traducir(e).message);
        try { await signInWithEmailAndPassword(auth, email, password); } catch (e2) { throw traducir(e2); }
      }
    },

    async cambiarPasswordInicial(nueva) {
      const u = actual();
      const r = await funcionCuenta({ action: "cambiar-password", nueva }, true);
      if (!r.ok) throw new Error(r.error || "No se ha podido cambiar la contraseña.");
      try { await signInWithEmailAndPassword(auth, u.email, nueva); } catch (e) { throw traducir(e); }
      await actual().getIdToken(true);
      await procesarUsuario(actual());
      return "Contraseña cambiada. Ya tienes acceso al Panel docente.";
    },

    async registrar({ nombre, email, codigo, ciclo, curso, password }) {
      registrando = true;
      let remitente = null;
      try {
        let cred;
        try { cred = await createUserWithEmailAndPassword(auth, email, password); } catch (e) { throw traducir(e); }
        let error = null;
        if (email !== ADMIN_EMAIL) {
          try { await crearPerfil(cred.user, { nombre, ciclo, curso, codigo }); } catch (e) { error = e; }
        }
        // La verificación sale siempre, aunque falte completar el perfil (p. ej. código de aula erróneo)
        remitente = await enviarVerificacion(cred.user).catch(() => null);
        if (error) { emitir({ estado: "completar", email, verificado: false, userId: cred.user.uid, error: error.message }); return; }
      } finally {
        registrando = false;
      }
      await procesarUsuario(actual());
      return remitente
        ? `Cuenta creada. Te hemos enviado el correo de verificación desde ${remitente} (mira también en correo no deseado).`
        : "Cuenta creada. Si no te llega el correo de verificación, el profesor puede activar tu cuenta.";
    },

    async completarPerfil(datos) {
      await crearPerfil(actual(), datos);
      await procesarUsuario(actual());
    },

    async salir() { pararEscuchas(); await signOut(auth); },

    async recuperarPassword(email) {
      const data = await correoCentro({ action: "reset", email });
      if (!data?.sent) {
        try { await sendPasswordResetEmail(auth, email); }
        catch (e) { if (e?.code !== "auth/user-not-found") throw traducir(e); }
      }
      return `Si existe una cuenta con ese correo, te hemos enviado un enlace para cambiar la contraseña desde ${data?.from || remitenteFirebase}.`;
    },

    async reenviarVerificacion() {
      const remitente = await enviarVerificacion(actual()).catch((e) => { throw traducir(e); });
      return `Correo de verificación enviado desde ${remitente}. Mira también en correo no deseado.`;
    },

    async comprobarVerificacion() {
      const u = actual();
      await u.reload();
      await u.getIdToken(true);    // las reglas leen email_verified del token
      await procesarUsuario(auth.currentUser);
      return estado.verificado === true;
    },

    /* ---------- Página /accion (enlaces de los correos) ---------- */
    async comprobarCodigoReset(codigo) { try { return await verifyPasswordResetCode(auth, codigo); } catch (e) { throw traducir(e); } },
    async confirmarReset(codigo, password) { try { await confirmPasswordReset(auth, codigo, password); } catch (e) { throw traducir(e); } },
    async aplicarVerificacion(codigo) {
      try { await applyActionCode(auth, codigo); } catch (e) { throw traducir(e); }
      await auth.authStateReady();
      if (actual()) { await actual().reload().catch(() => {}); await actual().getIdToken(true).catch(() => {}); await procesarUsuario(actual()); }
    },

    async estadoCorreo() {
      const r = await fetch(MAIL_FN + "?comprobar=1", { headers: { Accept: "application/json" } })
        .then((x) => (x.ok && (x.headers.get("content-type") || "").includes("json") ? x.json() : null)).catch(() => null);
      return r || { configured: false, problems: ["La función de correo no está disponible (solo funciona publicada en Netlify)."] };
    },

    async alternarProgreso(n) {
      const u = actual();
      const hecho = DB.progress[u.uid]?.[n];
      try {
        await updateDoc(doc(db, "usuarios", u.uid), { [`progreso.${n}`]: hecho ? deleteField() : serverTimestamp() });
      } catch (e) { throw traducir(e); }
    },

    async guardarEntrega(n, bloque, { enlace, comentario }) {
      const u = actual();
      const id = `${u.uid}_${n}_${bloque}`;
      const yo = DB.users.find(x => x.id === u.uid);
      const existe = DB.submissions.some(s => s.id === id);
      const contenido = { enlace, comentario, ts: serverTimestamp(), estado: "pendiente" };
      try {
        if (existe) await updateDoc(doc(db, "entregas", id), contenido);
        else await setDoc(doc(db, "entregas", id), { userId: u.uid, sesion: n, bloque, nombre: yo.nombre, ciclo: yo.ciclo, curso: yo.curso, ...contenido });
      } catch (e) {
        throw traducir(e, estado.verificado ? "No se ha podido guardar la entrega." : "Verifica tu correo antes de entregar actividades.");
      }
      const r = await avisar("entrega", { sesion: n, bloque });
      return r?.sent ? "Entrega enviada. Te hemos mandado un justificante por correo." : "Entrega enviada al profesor.";
    },

    async guardarTest(n, { aciertos, total, nota }) {
      const u = actual();
      const id = `${u.uid}_${n}`;
      const yo = DB.users.find(x => x.id === u.uid);
      const previo = DB.tests.find(t => t.id === id);
      const datos = {
        userId: u.uid, sesion: n, aciertos, total, nota,
        mejor: previo ? Math.max(previo.mejor, nota) : nota,
        intentos: previo ? previo.intentos + 1 : 1,
        ts: serverTimestamp(), nombre: yo.nombre, ciclo: yo.ciclo, curso: yo.curso
      };
      try { await setDoc(doc(db, "tests", id), datos); } catch (e) { throw traducir(e, "No se ha podido guardar el resultado del test."); }
    },

    async evaluarEntrega(id, { estado: decision, nota, feedback }) {
      try {
        await updateDoc(doc(db, "entregas", id), { estado: decision, nota, feedback, revisadoEn: serverTimestamp(), revisadoPor: ADMIN_EMAIL });
      } catch (e) { throw traducir(e); }
      const r = await avisar("evaluacion", { id });
      const hecho = decision === "aprobada" ? "Entrega aprobada" : "Se han solicitado cambios";
      return r?.sent ? `${hecho}. El alumno recibirá un aviso por correo.` : `${hecho}.`;
    },

    async emitirTitulo(userId) {
      const a = DB.users.find(u => u.id === userId);
      const codigo = generarCodigoTitulo();
      const lote = writeBatch(db);
      lote.set(doc(db, "titulos", userId), { userId, codigo, emitidoEn: serverTimestamp(), emitidoPor: ADMIN_EMAIL, nota: notaMediaDe(userId), nombre: a.nombre, ciclo: a.ciclo, curso: a.curso });
      lote.set(doc(db, "verificaciones", codigo), { userId, codigo, nombre: a.nombre, ciclo: a.ciclo, curso: a.curso, emitidoEn: serverTimestamp() });
      try { await lote.commit(); } catch (e) { throw traducir(e, "No se puede emitir: el Proyecto Final (Sesión 12) debe estar aprobado."); }
      const r = await avisar("titulo", { userId });
      return r?.sent ? "Título emitido y firmado. Se ha avisado al alumno por correo." : "Título emitido y firmado.";
    },

    async revocarTitulo(id) {
      const t = DB.diplomas.find(d => d.id === id);
      const lote = writeBatch(db);
      lote.delete(doc(db, "titulos", id));
      lote.delete(doc(db, "verificaciones", t.codigo));
      try { await lote.commit(); } catch (e) { throw traducir(e); }
    },

    async aprobarCuenta(userId, aprobado) {
      try { await setDoc(doc(db, "aprobaciones", userId), { aprobado, aprobadoEn: serverTimestamp(), por: ADMIN_EMAIL }); }
      catch (e) { throw traducir(e); }
      return aprobado ? "Cuenta activada: ya puede entregar actividades." : "Activación retirada.";
    },

    async eliminarMiCuenta(password) {
      const u = actual();
      try {
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
      } catch (e) { throw traducir(e); }
      pararEscuchas();
      await borrarDatosDe(u.uid, false);
      try { await deleteUser(u); } catch (e) { throw traducir(e); }
    },

    async eliminarUsuario(userId) { await borrarDatosDe(userId, true); },

    async restablecerPassword(userId) {
      const u = DB.users.find(x => x.id === userId);
      const data = await correoCentro({ action: "reset", email: u.email });
      if (!data?.sent) { try { await sendPasswordResetEmail(auth, u.email); } catch (e) { throw traducir(e); } }
      return `Enviado a ${u.email} un enlace para elegir nueva contraseña (remitente ${data?.from || remitenteFirebase}).`;
    },

    async cambiarCodigoAula(codigo) {
      try { await setDoc(doc(db, "config", "aula"), { codigo, actualizado: serverTimestamp() }); } catch (e) { throw traducir(e); }
    },

    async verificarTitulo(codigo) {
      try {
        const s = await getDoc(doc(db, "verificaciones", codigo));
        if (!s.exists()) return null;
        const d = s.data();
        return { codigo: d.codigo, nombre: d.nombre, ciclo: d.ciclo, curso: d.curso, emitidoEn: iso(d.emitidoEn) };
      } catch (e) {
        if (e?.code === "permission-denied") return null;
        throw traducir(e);
      }
    }
  };

  // Borra entregas, título, verificación, activación y perfil (supresión RGPD)
  async function borrarDatosDe(userId, comoAdmin) {
    try {
      const entregas = comoAdmin
        ? DB.submissions.filter(s => s.userId === userId).map(s => s.id)
        : (await getDocs(query(collection(db, "entregas"), where("userId", "==", userId)))).docs.map(d => d.id);
      const titulo = await getDoc(doc(db, "titulos", userId));
      const lote = writeBatch(db);
      entregas.forEach(id => lote.delete(doc(db, "entregas", id)));
      if (titulo.exists()) {
        lote.delete(doc(db, "titulos", userId));
        lote.delete(doc(db, "verificaciones", titulo.data().codigo));
      }
      const tests = comoAdmin
        ? DB.tests.filter(t => t.userId === userId).map(t => t.id)
        : (await getDocs(query(collection(db, "tests"), where("userId", "==", userId)))).docs.map(d => d.id);
      tests.forEach(id => lote.delete(doc(db, "tests", id)));
      lote.delete(doc(db, "aprobaciones", userId));
      lote.delete(doc(db, "usuarios", userId));
      await lote.commit();
    } catch (e) { throw traducir(e); }
  }
}
