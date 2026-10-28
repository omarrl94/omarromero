// Producción: Firebase Authentication (correo y contraseña) + Cloud Firestore.
// La seguridad la imponen las reglas de firebase/firestore.rules; este módulo
// solo mantiene la caché DB sincronizada con onSnapshot.
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reauthenticateWithCredential,
  EmailAuthProvider, deleteUser, connectAuthEmulator
} from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc,
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
  "auth/operation-not-allowed": "El acceso con correo y contraseña no está activado en Firebase (Authentication → Método de acceso).",
  "auth/configuration-not-found": "Firebase Authentication no está configurado en este proyecto.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La clave de API de Firebase no es válida: revisa FIREBASE_API_KEY.",
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

export function crearBackendFirebase() {
  const app = initializeApp(FIREBASE);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (EMULADOR) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }

  let alCambiarAuth = () => {};
  let alCambiarDatos = () => {};
  let escuchas = [];
  let registrando = false;

  const pararEscuchas = () => { escuchas.forEach(f => f()); escuchas = []; };
  const esAdminAuth = (u) => u?.email === ADMIN_EMAIL && u.emailVerified;

  const mapearUsuario = (snap) => {
    const d = leer(snap);
    return {
      id: snap.id, nombre: d.nombre, email: d.email, role: d.role, ciclo: d.ciclo, curso: d.curso,
      createdAt: iso(d.createdAt),
      consents: { privacidad: iso(d.consents?.privacidad), iaAct: iso(d.consents?.iaAct) },
      progreso: Object.fromEntries(Object.entries(d.progreso || {}).map(([k, v]) => [k, iso(v)]))
    };
  };
  const mapearEntrega = (snap) => {
    const d = leer(snap);
    return { ...d, id: snap.id, ts: iso(d.ts), revisadoEn: iso(d.revisadoEn) };
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
      escuchas.push(onSnapshot(doc(db, "config", "aula"), s => { DB.config = { codigoAula: s.exists() ? s.data().codigo : "" }; alCambiarDatos(); }, fallo));
    } else {
      escuchas.push(onSnapshot(doc(db, "usuarios", user.uid), s => {
        if (!s.exists()) { pararEscuchas(); alCambiarAuth({ estado: "completar", email: user.email, verificado: user.emailVerified }); return; }
        ponerUsuarios([mapearUsuario(s)]); alCambiarDatos();
      }, fallo));
      escuchas.push(onSnapshot(query(collection(db, "entregas"), where("userId", "==", user.uid)), s => { DB.submissions = s.docs.map(mapearEntrega); alCambiarDatos(); }, fallo));
      escuchas.push(onSnapshot(doc(db, "titulos", user.uid), s => { DB.diplomas = s.exists() ? [mapearTitulo(s)] : []; alCambiarDatos(); }, fallo));
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
    try {
      await setDoc(doc(db, "usuarios", user.uid), datos);
    } catch (e) {
      throw traducir(e, esAdmin
        ? "Verifica primero tu correo para activar la cuenta de profesor."
        : "No se ha podido crear el perfil: usa tu correo @jrotero.es o revisa el código de acceso de aula.");
    }
  }

  async function procesarUsuario(user) {
    if (!user) { pararEscuchas(); reemplazarDB({ users: [], progress: {}, submissions: [], diplomas: [], config: { codigoAula: "" } }); alCambiarAuth({ estado: "fuera" }); return; }
    const base = { email: user.email, verificado: user.emailVerified, userId: user.uid };
    let perfil;
    try {
      perfil = await getDoc(doc(db, "usuarios", user.uid));
    } catch (e) {
      alCambiarAuth({ estado: "error", mensaje: traducir(e).message }); return;
    }
    if (!perfil.exists()) {
      // El profesor necesita el correo verificado antes de crear su perfil
      if (user.email === ADMIN_EMAIL) {
        if (!user.emailVerified) { alCambiarAuth({ ...base, estado: "verificar" }); return; }
        await crearPerfil(user, { nombre: ADMIN_NOMBRE });
      } else {
        alCambiarAuth({ ...base, estado: "completar" }); return;
      }
    }
    escucharDatos(user, esAdminAuth(user));
    alCambiarAuth({ ...base, estado: "dentro" });
  }

  const actual = () => auth.currentUser;

  return {
    modo: "firebase",

    iniciar(onAuth, onDatos) {
      alCambiarAuth = onAuth; alCambiarDatos = onDatos;
      onAuthStateChanged(auth, (user) => { if (!registrando) procesarUsuario(user); });
    },

    async entrar(email, password) {
      try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { throw traducir(e); }
    },

    async registrar({ nombre, email, codigo, ciclo, curso, password }) {
      registrando = true;
      try {
        let cred;
        try { cred = await createUserWithEmailAndPassword(auth, email, password); } catch (e) { throw traducir(e); }
        try { await sendEmailVerification(cred.user); } catch {}
        if (email !== ADMIN_EMAIL) {
          try { await crearPerfil(cred.user, { nombre, ciclo, curso, codigo }); }
          catch (e) { alCambiarAuth({ estado: "completar", email, verificado: false, userId: cred.user.uid, error: e.message }); return; }
        }
      } finally {
        registrando = false;
      }
      await procesarUsuario(actual());
    },

    async completarPerfil(datos) {
      await crearPerfil(actual(), datos);
      await procesarUsuario(actual());
    },

    async salir() { pararEscuchas(); await signOut(auth); },

    async recuperarPassword(email) {
      try { await sendPasswordResetEmail(auth, email); } catch (e) { throw traducir(e); }
      return "Si existe una cuenta con ese correo, te hemos enviado un enlace para cambiar la contraseña.";
    },

    async reenviarVerificacion() {
      try { await sendEmailVerification(actual()); } catch (e) { throw traducir(e); }
    },

    async comprobarVerificacion() {
      const u = actual();
      await u.reload();
      await u.getIdToken(true);    // las reglas leen email_verified del token
      await procesarUsuario(auth.currentUser);
      return auth.currentUser.emailVerified;
    },

    async alternarProgreso(n) {
      const u = actual();
      const hecho = DB.progress[u.uid]?.[n];
      try {
        await updateDoc(doc(db, "usuarios", u.uid), { [`progreso.${n}`]: hecho ? deleteField() : serverTimestamp() });
      } catch (e) { throw traducir(e); }
    },

    async guardarEntrega(n, { enlace, pareja, comentario }) {
      const u = actual();
      const id = `${u.uid}_${n}`;
      const yo = DB.users.find(x => x.id === u.uid);
      const existe = DB.submissions.some(s => s.id === id);
      const contenido = { enlace, pareja, comentario, ts: serverTimestamp(), estado: "pendiente" };
      try {
        if (existe) await updateDoc(doc(db, "entregas", id), contenido);
        else await setDoc(doc(db, "entregas", id), { userId: u.uid, sesion: n, nombre: yo.nombre, ciclo: yo.ciclo, curso: yo.curso, ...contenido });
      } catch (e) {
        throw traducir(e, u.emailVerified ? "No se ha podido guardar la entrega." : "Verifica tu correo antes de entregar actividades.");
      }
    },

    async evaluarEntrega(id, { estado, nota, feedback }) {
      try {
        await updateDoc(doc(db, "entregas", id), { estado, nota, feedback, revisadoEn: serverTimestamp(), revisadoPor: ADMIN_EMAIL });
      } catch (e) { throw traducir(e); }
    },

    async emitirTitulo(userId) {
      const a = DB.users.find(u => u.id === userId);
      const codigo = generarCodigoTitulo();
      const lote = writeBatch(db);
      lote.set(doc(db, "titulos", userId), { userId, codigo, emitidoEn: serverTimestamp(), emitidoPor: ADMIN_EMAIL, nota: notaMediaDe(userId), nombre: a.nombre, ciclo: a.ciclo, curso: a.curso });
      lote.set(doc(db, "verificaciones", codigo), { userId, codigo, nombre: a.nombre, ciclo: a.ciclo, curso: a.curso, emitidoEn: serverTimestamp() });
      try { await lote.commit(); } catch (e) { throw traducir(e, "No se puede emitir: el Proyecto Final (Sesión 12) debe estar aprobado."); }
    },

    async revocarTitulo(id) {
      const t = DB.diplomas.find(d => d.id === id);
      const lote = writeBatch(db);
      lote.delete(doc(db, "titulos", id));
      lote.delete(doc(db, "verificaciones", t.codigo));
      try { await lote.commit(); } catch (e) { throw traducir(e); }
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
      try { await sendPasswordResetEmail(auth, u.email); } catch (e) { throw traducir(e); }
      return `Enviado a ${u.email} un enlace para elegir nueva contraseña.`;
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

  // Borra entregas, título, verificación y perfil (supresión RGPD)
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
      lote.delete(doc(db, "usuarios", userId));
      await lote.commit();
    } catch (e) { throw traducir(e); }
  }
}
