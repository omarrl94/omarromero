// Producción: Firebase Authentication (correo y contraseña) + Cloud Firestore.
// La seguridad la imponen las reglas de firebase/firestore.rules; este módulo mantiene la
// caché DB sincronizada con onSnapshot. Lo que no puede hacer un cliente (cobrar y canjear
// códigos) lo hace la función de Netlify «campus» con la cuenta de servicio.
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, signOut, reauthenticateWithCredential,
  EmailAuthProvider, deleteUser, connectAuthEmulator
} from "firebase/auth";
import {
  initializeFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc,
  addDoc, collection, query, where, onSnapshot, serverTimestamp, writeBatch, getDocs
} from "firebase/firestore";
import { ADMIN_EMAIL, FIREBASE, EMULADOR } from "./constantes.js";
import { CATALOGO_INICIAL, CAMPOS_FORMACION } from "./catalogo.js";
import { DB, idMatricula } from "./estado.js";

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
  "permission-denied": "Operación no permitida.",
  "unavailable": "Sin conexión con la base de datos. Revisa tu red."
};

function traducir(err, contexto) {
  if (err?.code === "permission-denied" && contexto) return new Error(contexto);
  return new Error(MENSAJES[err?.code] || err?.message || "Error inesperado.");
}

const iso = (v) => (v && typeof v.toDate === "function") ? v.toDate().toISOString() : (v ?? null);
const leer = (snap) => {
  const d = snap.data({ serverTimestamps: "estimate" });
  const out = { id: snap.id };
  for (const [k, v] of Object.entries(d)) out[k] = iso(v);
  if (d.consents) out.consents = { privacidad: iso(d.consents.privacidad) };
  return out;
};
const FN = "/.netlify/functions/campus";

export function crearBackendFirebase() {
  const app = initializeApp(FIREBASE);
  const auth = getAuth(app);
  auth.languageCode = "es";
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
  const actual = () => auth.currentUser;
  const esAdminAuth = (u) => u?.email === ADMIN_EMAIL && u.emailVerified;
  const pararEscuchas = () => { escuchas.forEach(f => f()); escuchas = []; };
  const limpiarPrivado = () => { for (const k of ["usuarios", "matriculas", "solicitudes", "pedidos", "codigos", "avisos"]) DB[k] = []; };

  const backend = { modo: "firebase", pagosOnline: false };

  /* ---------- Función de Netlify ---------- */
  async function llamar(body) {
    const token = await actual()?.getIdToken(true);
    const res = await fetch(FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    }).catch(() => null);
    if (!res) throw new Error("No hay conexión con el servidor del campus.");
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) throw new Error("El servidor del campus no responde (la función de Netlify no está desplegada).");
    if (!res.ok) throw new Error(data.error || `Error del servidor (${res.status}).`);
    return data;
  }
  // ¿Hay pasarela de pago configurada? (STRIPE_SECRET_KEY en Netlify)
  fetch(FN, { headers: { Accept: "application/json" } })
    .then(r => r.ok ? r.json() : null)
    .then(d => { backend.pagosOnline = !!d?.pagos; alCambiarDatos(); })
    .catch(() => {});

  /* ---------- Escuchas ---------- */
  const escuchar = (q, clave, filtro) => escuchas.push(onSnapshot(q,
    (snap) => { DB[clave] = snap.docs.map(leer).filter(filtro || (() => true)); alCambiarDatos(); },
    (e) => console.error(`[campus] ${clave}:`, e.code || e.message)));

  function escucharDatos(user, esAdmin) {
    pararEscuchas();
    if (esAdmin) {
      for (const c of ["usuarios", "matriculas", "solicitudes", "pedidos", "codigos", "avisos"]) escuchar(collection(db, c), c);
    } else {
      escuchas.push(onSnapshot(doc(db, "usuarios", user.uid), (s) => {
        DB.usuarios = s.exists() ? [leer(s)] : []; alCambiarDatos();
      }));
      for (const c of ["matriculas", "solicitudes", "pedidos"]) escuchar(query(collection(db, c), where("uid", "==", user.uid)), c);
      escuchar(collection(db, "avisos"), "avisos");
    }
  }

  async function alEntrar(user) {
    let snap;
    try { snap = await getDoc(doc(db, "usuarios", user.uid)); }
    catch (e) { alCambiarAuth({ estado: "error", mensaje: traducir(e).message }); return; }
    if (!snap.exists()) {
      if (registrando) return;   // registrar() crea el perfil y vuelve a llamar
      alCambiarAuth({ estado: "completar", email: user.email });
      return;
    }
    escucharDatos(user, esAdminAuth(user));
    DB.usuarios = DB.usuarios.length ? DB.usuarios : [leer(snap)];
    alCambiarAuth({ estado: "dentro", userId: user.uid, email: user.email, verificado: user.emailVerified });
  }

  const perfilNuevo = (user, nombre) => ({
    nombre, email: user.email.toLowerCase(), role: user.email === ADMIN_EMAIL ? "admin" : "alumno",
    createdAt: serverTimestamp(), consents: { privacidad: serverTimestamp() }
  });
  const yo = () => DB.usuarios.find(u => u.id === actual()?.uid) || { id: actual()?.uid, email: actual()?.email, nombre: actual()?.email };

  Object.assign(backend, {
    iniciar(onAuth, onDatos) {
      alCambiarAuth = onAuth; alCambiarDatos = onDatos;
      // El catálogo es público: se ve sin iniciar sesión
      onSnapshot(collection(db, "formaciones"),
        (snap) => { DB.formaciones = snap.docs.map(leer); alCambiarDatos(); },
        (e) => console.error("[campus] formaciones:", e.code || e.message));
      onAuthStateChanged(auth, (user) => {
        if (!user) { pararEscuchas(); limpiarPrivado(); alCambiarAuth({ estado: "fuera" }); return; }
        alEntrar(user);
      });
    },

    async accesoDemo() { throw new Error("Solo en modo demostración."); },

    async entrar(email, password) {
      try { await signInWithEmailAndPassword(auth, email, password); } catch (e) { throw traducir(e); }
    },

    async registrar({ nombre, email, password }) {
      registrando = true;
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "usuarios", user.uid), perfilNuevo(user, nombre));
        await sendEmailVerification(user).catch(() => {});
        registrando = false;
        await alEntrar(user);
      } catch (e) { registrando = false; throw traducir(e, "No se ha podido crear el perfil."); }
    },

    async completarPerfil({ nombre }) {
      const user = actual();
      try { await setDoc(doc(db, "usuarios", user.uid), perfilNuevo(user, nombre)); } catch (e) { throw traducir(e, "No se ha podido guardar el perfil."); }
      await alEntrar(user);
    },

    async actualizarPerfil({ nombre }) {
      try { await updateDoc(doc(db, "usuarios", actual().uid), { nombre }); } catch (e) { throw traducir(e); }
    },

    async salir() { pararEscuchas(); await signOut(auth); },
    async recuperarPassword(email) {
      try { await sendPasswordResetEmail(auth, email); } catch (e) { if (e?.code !== "auth/user-not-found") throw traducir(e); }
      return "Si existe una cuenta con ese correo, te llegará un enlace para elegir una contraseña nueva.";
    },
    async reenviarVerificacion() { try { await sendEmailVerification(actual()); } catch (e) { throw traducir(e); } },
    async comprobarVerificacion() {
      const user = actual();
      await user.reload();
      if (!user.emailVerified) return false;
      await user.getIdToken(true);   // las reglas leen email_verified del token
      await alEntrar(user);
      return true;
    },

    /* ---------- Alumnado ---------- */
    async matricularGratis(formacionId) {
      const u = yo();
      try {
        await setDoc(doc(db, "matriculas", idMatricula(u.id, formacionId)), {
          uid: u.id, formacionId, origen: "gratuita", estado: "activa", importe: 0,
          fecha: serverTimestamp(), nombre: u.nombre, email: u.email
        });
      } catch (e) { throw traducir(e, "No se ha podido completar la matrícula. Verifica tu correo y comprueba que la matrícula está abierta."); }
    },

    async comprar(formacionId) {
      const { url } = await llamar({ action: "checkout", formacionId });
      location.href = url;   // Stripe Checkout; al terminar vuelve a #/pago/ok
      return { redirigiendo: true };
    },

    async canjearCodigo(codigo) {
      const r = await llamar({ action: "canjear", codigo });
      return DB.formaciones.find(f => f.id === r.formacionId) || { id: r.formacionId };
    },

    async solicitar(formacionId, mensaje) {
      const u = yo();
      if (DB.solicitudes.some(s => s.uid === u.id && s.formacionId === formacionId && s.estado === "pendiente")) throw new Error("Ya tienes una solicitud pendiente para esta formación.");
      try {
        await addDoc(collection(db, "solicitudes"), { uid: u.id, formacionId, mensaje, estado: "pendiente", fecha: serverTimestamp(), nombre: u.nombre, email: u.email });
      } catch (e) { throw traducir(e, "No se ha podido enviar la solicitud."); }
    },
    async cancelarSolicitud(id) { try { await deleteDoc(doc(db, "solicitudes", id)); } catch (e) { throw traducir(e); } },

    /* ---------- Administración ---------- */
    async guardarFormacion(f) {
      const datos = Object.fromEntries(CAMPOS_FORMACION.map(k => [k, f[k] ?? null]));
      try { await setDoc(doc(db, "formaciones", f.id), datos); } catch (e) { throw traducir(e, "Revisa los campos de la formación."); }
    },
    async borrarFormacion(id) { try { await deleteDoc(doc(db, "formaciones", id)); } catch (e) { throw traducir(e); } },
    async cargarCatalogoInicial() {
      const b = writeBatch(db);
      for (const f of CATALOGO_INICIAL) {
        if (DB.formaciones.some(x => x.id === f.id)) continue;
        b.set(doc(db, "formaciones", f.id), Object.fromEntries(CAMPOS_FORMACION.map(k => [k, f[k] ?? null])));
      }
      try { await b.commit(); } catch (e) { throw traducir(e); }
    },
    async asignarMatricula(uid, formacionId) {
      const u = DB.usuarios.find(x => x.id === uid);
      try {
        await setDoc(doc(db, "matriculas", idMatricula(uid, formacionId)), {
          uid, formacionId, origen: "asignada", estado: "activa", importe: 0, fecha: serverTimestamp(), nombre: u.nombre, email: u.email
        });
      } catch (e) { throw traducir(e); }
    },
    async revocarMatricula(id) { try { await updateDoc(doc(db, "matriculas", id), { estado: "revocada", revocadaEn: serverTimestamp() }); } catch (e) { throw traducir(e); } },
    async reactivarMatricula(id) { try { await updateDoc(doc(db, "matriculas", id), { estado: "activa", revocadaEn: null }); } catch (e) { throw traducir(e); } },
    async resolverSolicitud(id, aceptar, respuesta = "") {
      const s = DB.solicitudes.find(x => x.id === id);
      const b = writeBatch(db);
      b.update(doc(db, "solicitudes", id), { estado: aceptar ? "aceptada" : "rechazada", respuesta, resueltaEn: serverTimestamp() });
      if (aceptar) b.set(doc(db, "matriculas", idMatricula(s.uid, s.formacionId)), {
        uid: s.uid, formacionId: s.formacionId, origen: "asignada", estado: "activa", importe: 0, fecha: serverTimestamp(), nombre: s.nombre, email: s.email
      });
      try { await b.commit(); } catch (e) { throw traducir(e); }
    },
    async crearCodigo({ id, formacionId, usosMax, caduca, nota }) {
      const ref = doc(db, "codigos", id);
      if ((await getDoc(ref)).exists()) throw new Error("Ese código ya existe.");
      try { await setDoc(ref, { formacionId, usosMax, usos: 0, caduca: caduca || null, nota, creadoEn: serverTimestamp() }); } catch (e) { throw traducir(e); }
    },
    async borrarCodigo(id) { try { await deleteDoc(doc(db, "codigos", id)); } catch (e) { throw traducir(e); } },
    async publicarAviso({ titulo, texto, formacionId }) {
      try { await addDoc(collection(db, "avisos"), { titulo, texto, formacionId: formacionId || null, fecha: serverTimestamp(), autor: yo().nombre }); } catch (e) { throw traducir(e); }
    },
    async borrarAviso(id) { try { await deleteDoc(doc(db, "avisos", id)); } catch (e) { throw traducir(e); } },
    async eliminarUsuario(id) {
      const b = writeBatch(db);
      for (const c of ["matriculas", "solicitudes"]) (await getDocs(query(collection(db, c), where("uid", "==", id)))).forEach(d => b.delete(d.ref));
      b.delete(doc(db, "usuarios", id));
      try { await b.commit(); } catch (e) { throw traducir(e); }
      return "Datos eliminados. La cuenta de acceso se borra en Firebase → Authentication.";
    },
    async restablecerPassword(id) {
      const u = DB.usuarios.find(x => x.id === id);
      try { await sendPasswordResetEmail(auth, u.email); } catch (e) { throw traducir(e); }
      return `Enlace para elegir contraseña enviado a ${u.email}.`;
    },

    async eliminarMiCuenta(password) {
      const user = actual();
      try { await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password)); } catch (e) { throw traducir(e); }
      const b = writeBatch(db);
      for (const c of ["matriculas", "solicitudes"]) (await getDocs(query(collection(db, c), where("uid", "==", user.uid)))).forEach(d => b.delete(d.ref));
      b.delete(doc(db, "usuarios", user.uid));
      try { await b.commit(); } catch (e) { throw traducir(e); }
      pararEscuchas();
      await deleteUser(user);
    }
  });

  return backend;
}
