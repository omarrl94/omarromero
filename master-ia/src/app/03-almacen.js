/* =====================================================================
 *  Capa de datos con dos implementaciones intercambiables:
 *  - Firebase (Authentication + Firestore): producción, multiusuario. Se
 *    activa cuando la build incluye FIREBASE_CONFIG (firebase.config.json).
 *  - Local (localStorage): demostración sin servidor y pruebas.
 *  Las vistas leen siempre de la caché `db` (misma forma en ambos modos) y
 *  escriben solo a través de `Almacen`. En Firebase, la autorización real
 *  está en firestore.rules: la interfaz solo oculta lo que no corresponde.
 * ===================================================================== */

function errorUsuario(mensaje) { const e = new Error(mensaje); e.usuario = true; return e; }
function mensajeError(e) {
  if (e && e.usuario) return e.message;
  const codigo = e && e.code ? String(e.code) : '';
  const textos = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña es demasiado débil.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'Sin conexión con el servidor. Revisa tu red.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a introducir tu contraseña.',
    'permission-denied': 'No tienes permiso para realizar esta operación.',
    'unavailable': 'El servidor no está disponible. Inténtalo de nuevo en unos segundos.'
  };
  return textos[codigo] || textos[codigo.replace('firestore/', '')] || ('Error inesperado' + (codigo ? ' (' + codigo + ')' : '') + '. Inténtalo de nuevo.');
}

/* ---------------------------------------------------------------------
 *  Implementación local (localStorage)
 * ------------------------------------------------------------------- */
const AlmacenLocal = {
  modo: 'local',
  estado: 'listo',
  capacidades: { importar: true, restablecer: true, recuperarClave: false },
  iniciar() { render(); },
  emailSesion() { return getSesionEmail(); },
  direccionVerificada() { return true; },

  async entrar(email, pw) {
    const u = db.users[email];
    if (!u) throw errorUsuario('No existe ninguna cuenta con ese correo. Si quieres matricularte, usa la pestaña Matrícula.');
    if (esDirector(u) && !u.hash) return { primerAcceso: true };
    if (!pw) throw errorUsuario('Introduce tu contraseña.');
    const { hash } = await derivarHash(pw, u.salt);
    if (hash !== u.hash) throw errorUsuario('Contraseña incorrecta.');
    if (u.estado === 'rechazado') throw errorUsuario('Tu solicitud no ha sido aceptada. Contacta con ' + ADMIN_EMAIL + '.');
    setSesionEmail(email);
    await this.auditar('Inicio de sesión', email);
    return { ok: true };
  },
  async crearDireccion(pw) {
    const admin = db.users[ADMIN_EMAIL];
    if (admin.hash) throw errorUsuario('La contraseña de la Dirección ya está configurada.');
    Object.assign(admin, await derivarHash(pw));
    setSesionEmail(ADMIN_EMAIL);
    await this.auditar('Configuración inicial de la cuenta de Dirección', ADMIN_EMAIL);
    return { ok: true };
  },
  async salir() { setSesionEmail(null); },
  async registrar(perfil, pw, codigo) {
    if (db.users[perfil.email]) throw errorUsuario('Ya existe una cuenta con ese correo.');
    if (Object.values(db.users).some(u => u.dni === perfil.dni)) throw errorUsuario('Ya existe una matrícula con ese DNI/NIE.');
    let codigoObj = null;
    if (codigo) {
      codigoObj = db.codigos.find(x => x.codigo === codigo && !x.usadoPor && !x.revocado);
      if (!codigoObj) throw errorUsuario('El código de admisión no es válido, ya se ha usado o ha sido revocado.');
    }
    const cred = await derivarHash(pw);
    const ahora = new Date().toISOString();
    const estado = codigoObj && perfil.via === 'DAM' ? 'admitido' : 'pendiente';
    db.users[perfil.email] = Object.assign({}, perfil, {
      rol: 'alumno', salt: cred.salt, hash: cred.hash, creado: ahora, estado,
      admision: codigoObj ? 'codigo' : 'dominio', codigo: codigoObj ? codigoObj.codigo : null,
      oposicion: null, limitacion: null, progreso: {}, evaluacion: {}, pfm: null, titulo: null
    });
    if (codigoObj) { codigoObj.usadoPor = perfil.email; codigoObj.fechaUso = ahora; }
    setSesionEmail(perfil.email);
    await this.auditar('Solicitud de matrícula (' + perfil.plaza + ', vía ' + perfil.via + ')', perfil.email);
    return { estado, verificacionEnviada: false };
  },
  async recuperarClave() { throw errorUsuario('En el modo de demostración no hay recuperación de contraseña.'); },
  async reenviarVerificacion() {},
  async comprobarVerificacion() { return true; },

  async guardarPerfil(email, campos) { Object.assign(db.users[email], campos); guardar(); },
  async crearEntrega(e) { db.entregas.push(e); guardar(); },
  async actualizarEntrega(id, campos) { Object.assign(db.entregas.find(x => x.id === id), campos); guardar(); },
  async guardarEvaluacion(email, campos) {
    const a = db.users[email];
    a.evaluacion = a.evaluacion || {};
    for (const [k, v] of Object.entries(campos)) {
      if (k === 'titulo' || k === 'certificado') a[k] = v; else a.evaluacion[k] = v;
    }
    guardar();
  },
  async crearCodigo(c) { db.codigos.push(c); guardar(); },
  async revocarCodigo(codigo) { const x = db.codigos.find(k => k.codigo === codigo); if (x) { x.revocado = new Date().toISOString(); guardar(); } },
  async registrarTitulo(email, titulo, registro) {
    db.users[email].titulo = titulo; db.titulos.push(registro); guardar();
  },
  async registrarCertificado(email, certificado, registro) {
    db.users[email].certificado = certificado; db.certificados.push(registro); guardar();
  },
  async auditar(accion, email) { registrarAuditoria(accion, email); guardar(); },
  async suprimir(email) {
    db.titulos.forEach(t => { if (t.email === email) { t.suprimido = new Date().toISOString(); t.email = null; } });
    db.certificados.forEach(t => { if (t.email === email) { t.suprimido = new Date().toISOString(); t.email = null; } });
    db.entregas = db.entregas.filter(e => e.email !== email);
    db.audit.forEach(a => { if (a.email === email) a.email = '[suprimido]'; });
    db.codigos.forEach(x => { if (x.usadoPor === email) x.usadoPor = '[suprimido]'; });
    delete db.users[email];
    registrarAuditoria('Derecho de supresión ejercido por un alumno', null);
    guardar(); setSesionEmail(null);
  },
  async verificar(codigo) {
    const t = db.titulos.find(x => x.verificacion === codigo);
    if (t) return { tipo: 'diploma', numero: t.numero, nombre: t.nombre, dni: enmascararDni(t.dni), fecha: t.fecha, nota: t.nota, distincion: t.distincion, edicion: t.edicion };
    const c = db.certificados.find(x => x.verificacion === codigo);
    if (c) return { tipo: 'certificado', numero: c.numero, nombre: c.nombre, dni: enmascararDni(c.dni), fecha: c.fecha, horas: c.horas };
    return null;
  },
  exportar() { return db; }
};

/* ---------------------------------------------------------------------
 *  Implementación Firebase (Authentication + Cloud Firestore)
 * ------------------------------------------------------------------- */
const AlmacenFirebase = {
  modo: 'firebase',
  estado: 'cargando',                 // cargando | listo | verificar-direccion | sin-perfil
  capacidades: { importar: false, restablecer: false, recuperarClave: true },
  app: null, auth: null, fs: null, usuario: null,
  _bajas: [], _crudo: null,

  iniciar() {
    this._vaciar();                      // en este modo nunca se usan datos del navegador
    const F = window.FB;
    this.app = F.initializeApp(FIREBASE_CONFIG);
    this.auth = F.getAuth(this.app);
    this.fs = F.initializeFirestore(this.app, {});
    if (FIREBASE_EMULADORES) {
      F.connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      F.connectFirestoreEmulator(this.fs, '127.0.0.1', 8085);
    }
    F.setPersistence(this.auth, F.browserSessionPersistence).catch(() => { /* persistencia por defecto */ });
    F.onAuthStateChanged(this.auth, u => this._cambioSesion(u));
    render();
  },
  _ref(...ruta) { return window.FB.doc(this.fs, ...ruta); },
  _vaciar() {
    this._bajas.forEach(f => f());
    this._bajas = [];
    this._crudo = { usuarios: {}, evaluaciones: {}, entregas: {}, codigos: {}, titulos: {}, certificados: {}, auditoria: {} };
    db = { version: 3, users: {}, codigos: [], entregas: [], titulos: [], certificados: [], audit: [] };
  },
  async _cambioSesion(u) {
    this._vaciar();
    this.usuario = u;
    if (!u) { this.estado = 'listo'; programarRender(); return; }
    const F = window.FB;
    if (u.email === ADMIN_EMAIL) {
      if (!u.emailVerified) { this.estado = 'verificar-direccion'; programarRender(); return; }
      const ref = this._ref('usuarios', u.uid);
      try {
        const snap = await F.getDoc(ref);
        if (!snap.exists()) {
          await F.setDoc(ref, { email: ADMIN_EMAIL, nombre: ADMIN_NAME, rol: 'director', estado: 'admitido', creado: new Date().toISOString(), progreso: {} });
        }
      } catch (e) { toast(mensajeError(e), 'bad'); }
      const col = n => F.collection(this.fs, n);
      this._escuchar(col('usuarios'), 'usuarios');
      this._escuchar(col('evaluaciones'), 'evaluaciones');
      this._escuchar(col('entregas'), 'entregas');
      this._escuchar(col('codigos'), 'codigos');
      this._escuchar(col('titulos'), 'titulos');
      this._escuchar(col('certificados'), 'certificados');
      this._escuchar(F.query(col('auditoria'), F.orderBy('fecha', 'desc'), F.limit(400)), 'auditoria');
    } else {
      this._escucharDoc(this._ref('usuarios', u.uid), 'usuarios');
      this._escucharDoc(this._ref('evaluaciones', u.uid), 'evaluaciones');
      this._escuchar(F.query(F.collection(this.fs, 'entregas'), F.where('uid', '==', u.uid)), 'entregas');
    }
    this.estado = 'cargando';
    programarRender();
  },
  _escuchar(consulta, nombre) {
    this._bajas.push(window.FB.onSnapshot(consulta, snap => {
      const mapa = {};
      snap.forEach(d => { mapa[d.id] = Object.assign({ _id: d.id }, d.data()); });
      this._crudo[nombre] = mapa;
      this._reconstruir();
    }, e => toast(mensajeError(e), 'bad')));
  },
  _escucharDoc(ref, nombre) {
    this._bajas.push(window.FB.onSnapshot(ref, d => {
      this._crudo[nombre] = d.exists() ? { [d.id]: Object.assign({ _id: d.id }, d.data()) } : {};
      if (nombre === 'usuarios') this._perfilRecibido = true;
      this._reconstruir();
    }, e => toast(mensajeError(e), 'bad')));
  },
  _reconstruir() {
    const c = this._crudo;
    const users = {};
    const emailPorUid = {};
    Object.values(c.usuarios).forEach(p => {
      const ev = c.evaluaciones[p._id] || {};
      const u = Object.assign({}, p, { uid: p._id, progreso: p.progreso || {},
        evaluacion: { modulos: ev.modulos || {}, jornadas: ev.jornadas || {}, seminarios: ev.seminarios || {}, tribunal: ev.tribunal || {} },
        titulo: ev.titulo || null, certificado: ev.certificado || null });
      delete u._id;
      users[u.email] = u;
      emailPorUid[u.uid] = u.email;
    });
    db.users = users;
    db.entregas = Object.values(c.entregas).map(e => Object.assign({}, e, { id: e._id }));
    db.codigos = Object.values(c.codigos).map(x => Object.assign({}, x, { codigo: x._id, usadoPor: x.usadoPor ? (emailPorUid[x.usadoPor] || '[suprimido]') : null }));
    db.titulos = Object.values(c.titulos).sort((a, b) => a.fecha.localeCompare(b.fecha));
    db.certificados = Object.values(c.certificados).sort((a, b) => a.fecha.localeCompare(b.fecha));
    db.audit = Object.values(c.auditoria).sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(a => ({ fecha: a.fecha, accion: a.accion, email: emailPorUid[a.uid] || '[suprimido]' }));
    const yo = this.usuario;
    if (yo && yo.email !== ADMIN_EMAIL && this._perfilRecibido && !users[yo.email]) this.estado = 'sin-perfil';
    else if (yo && users[yo.email]) this.estado = 'listo';
    programarRender();
  },

  emailSesion() { return this.usuario ? this.usuario.email : null; },
  direccionVerificada() { return !!(this.usuario && this.usuario.emailVerified); },
  correoVerificado() { return !!(this.usuario && this.usuario.emailVerified); },

  async entrar(email, pw) {
    if (!pw) throw errorUsuario('Introduce tu contraseña.');
    const cred = await window.FB.signInWithEmailAndPassword(this.auth, email, pw);
    if (cred.user.email !== ADMIN_EMAIL) {
      const snap = await window.FB.getDoc(this._ref('usuarios', cred.user.uid));
      if (snap.exists() && snap.data().estado === 'rechazado') {
        await window.FB.signOut(this.auth);
        throw errorUsuario('Tu solicitud no ha sido aceptada. Contacta con ' + ADMIN_EMAIL + '.');
      }
    }
    await this.auditar('Inicio de sesión', email).catch(() => {});
    return { ok: true };
  },
  async crearDireccion(pw) {
    const cred = await window.FB.createUserWithEmailAndPassword(this.auth, ADMIN_EMAIL, pw);
    await window.FB.sendEmailVerification(cred.user);
    return { ok: true, verificacionEnviada: true };
  },
  async salir() { await window.FB.signOut(this.auth); },
  async registrar(perfil, pw, codigo) {
    const F = window.FB;
    const cred = await F.createUserWithEmailAndPassword(this.auth, perfil.email, pw);
    const uidN = cred.user.uid;
    try {
      let codigoOk = null;
      if (codigo) {
        const snap = await F.getDoc(this._ref('codigos', codigo));
        const d = snap.exists() ? snap.data() : null;
        if (!d || d.usadoPor || d.revocado) throw errorUsuario('El código de admisión no es válido, ya se ha usado o ha sido revocado.');
        codigoOk = codigo;
      }
      const ahora = new Date().toISOString();
      const estado = codigoOk && perfil.via === 'DAM' ? 'admitido' : 'pendiente';
      const lote = F.writeBatch(this.fs);
      lote.set(this._ref('dnis', perfil.dni), { uid: uidN });
      if (codigoOk) lote.update(this._ref('codigos', codigoOk), { usadoPor: uidN, fechaUso: ahora });
      lote.set(this._ref('usuarios', uidN), Object.assign({}, perfil, {
        rol: 'alumno', estado, admision: codigoOk ? 'codigo' : 'dominio', codigo: codigoOk, creado: ahora,
        progreso: {}, pfm: null, oposicion: null, limitacion: null
      }));
      try { await lote.commit(); }
      catch (e) {
        if (e.code === 'permission-denied') throw errorUsuario('No se pudo completar la matrícula: el DNI/NIE ya está registrado o algún dato no es válido.');
        throw e;
      }
      await F.sendEmailVerification(cred.user).catch(() => {});
      await this.auditar('Solicitud de matrícula (' + perfil.plaza + ', vía ' + perfil.via + ')').catch(() => {});
      return { estado, verificacionEnviada: true };
    } catch (e) {
      await F.deleteUser(cred.user).catch(() => {});     // no dejar cuentas a medias
      throw e;
    }
  },
  async recuperarClave(email) { await window.FB.sendPasswordResetEmail(this.auth, email); },
  async reenviarVerificacion() { if (this.usuario) await window.FB.sendEmailVerification(this.usuario); },
  async comprobarVerificacion() {
    if (!this.usuario) return false;
    await this.usuario.reload();
    await this.usuario.getIdToken(true);               // refresca el token para las reglas
    if (this.usuario.emailVerified && this.estado === 'verificar-direccion') await this._cambioSesion(this.auth.currentUser);
    programarRender();
    return this.usuario.emailVerified;
  },

  _uid(email) { const u = db.users[email]; if (!u) throw errorUsuario('Usuario no encontrado.'); return u.uid; },
  async guardarPerfil(email, campos) { await window.FB.updateDoc(this._ref('usuarios', this._uid(email)), campos); },
  async crearEntrega(e) {
    const datos = Object.assign({}, e, { uid: this.usuario.uid });
    delete datos.id;
    await window.FB.setDoc(this._ref('entregas', e.id), datos);
  },
  async actualizarEntrega(id, campos) { await window.FB.updateDoc(this._ref('entregas', id), campos); },
  async guardarEvaluacion(email, campos) {
    await window.FB.setDoc(this._ref('evaluaciones', this._uid(email)), campos, { merge: true });
  },
  async crearCodigo(c) {
    const datos = Object.assign({}, c); delete datos.codigo;
    await window.FB.setDoc(this._ref('codigos', c.codigo), datos);
  },
  async revocarCodigo(codigo) { await window.FB.updateDoc(this._ref('codigos', codigo), { revocado: new Date().toISOString() }); },
  async _registrarDocumento(coleccion, email, campo, valor, registro, publico) {
    const lote = window.FB.writeBatch(this.fs);
    lote.set(this._ref(coleccion, registro.numero), registro);
    lote.set(this._ref('verificaciones', registro.verificacion), publico);
    lote.set(this._ref('evaluaciones', this._uid(email)), { [campo]: valor }, { merge: true });
    await lote.commit();
  },
  async registrarTitulo(email, titulo, registro) {
    await this._registrarDocumento('titulos', email, 'titulo', titulo, registro, {
      tipo: 'diploma', numero: registro.numero, nombre: registro.nombre, dni: enmascararDni(registro.dni),
      fecha: registro.fecha, nota: registro.nota, distincion: !!registro.distincion, edicion: registro.edicion });
  },
  async registrarCertificado(email, certificado, registro) {
    await this._registrarDocumento('certificados', email, 'certificado', certificado, registro, {
      tipo: 'certificado', numero: registro.numero, nombre: registro.nombre, dni: enmascararDni(registro.dni),
      fecha: registro.fecha, horas: registro.horas });
  },
  async auditar(accion, sobre) {
    if (!this.usuario) return;
    const texto = (sobre && sobre !== this.usuario.email ? accion + ' · ' + sobre : accion).slice(0, 200);
    await window.FB.setDoc(this._ref('auditoria', uid() + uid()), { fecha: new Date().toISOString(), accion: texto, uid: this.usuario.uid });
  },
  async suprimir(email, pw) {
    const F = window.FB;
    const yo = this.usuario;
    if (!pw) throw errorUsuario('Introduce tu contraseña para confirmar.');
    await F.reauthenticateWithCredential(yo, F.EmailAuthProvider.credential(yo.email, pw));
    const perfil = db.users[email];
    const mias = await F.getDocs(F.query(F.collection(this.fs, 'entregas'), F.where('uid', '==', yo.uid)));
    const lote = F.writeBatch(this.fs);
    mias.forEach(d => lote.delete(d.ref));
    lote.delete(this._ref('evaluaciones', yo.uid));
    if (perfil && perfil.dni) lote.delete(this._ref('dnis', perfil.dni));
    lote.delete(this._ref('usuarios', yo.uid));
    await lote.commit();
    await F.deleteUser(yo);
  },
  async verificar(codigo) {
    const snap = await window.FB.getDoc(this._ref('verificaciones', codigo));
    return snap.exists() ? snap.data() : null;
  },
  exportar() {
    return { exportado: new Date().toISOString(), modo: 'firebase', users: db.users, entregas: db.entregas, codigos: db.codigos,
      titulos: db.titulos, certificados: db.certificados, audit: db.audit };
  }
};

const Almacen = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && window.FB) ? AlmacenFirebase : AlmacenLocal;

/**
 * Re-render provocado por cambios remotos (snapshots). Conserva lo tecleado en los formularios
 * de la vista y el foco, para que una actualización en segundo plano no borre nada.
 */
function programarRender() {
  clearTimeout(programarRender._t);
  programarRender._t = setTimeout(renderConservando, 30);
}
function firmaFormulario(f) {
  return f ? [f.dataset.form, f.dataset.n, f.dataset.id, f.id].join(':') : '';
}
function renderConservando(omitir) {
  const app = $('#app');
  const hash = location.hash;
  const clave = el => firmaFormulario(el.form) + '|' + (el.name || el.id || '');
  const omitida = omitir ? firmaFormulario(omitir) : null;
  const valores = new Map();
  app.querySelectorAll('input, textarea, select').forEach(el => {
    if (!el.name && !el.id) return;
    if (el.type === 'file' || (omitida && firmaFormulario(el.form) === omitida)) return;
    const v = (el.type === 'checkbox' || el.type === 'radio') ? { c: el.checked, v: el.value } : { v: el.value };
    valores.set(clave(el) + (el.type === 'radio' ? '|' + el.value : ''), v);
  });
  const activo = document.activeElement;
  const claveActiva = activo && app.contains(activo) && (activo.name || activo.id) ? clave(activo) : null;
  const sel = claveActiva && typeof activo.selectionStart === 'number' ? [activo.selectionStart, activo.selectionEnd] : null;
  render();
  if (location.hash !== hash || !valores.size) return;
  app.querySelectorAll('input, textarea, select').forEach(el => {
    const v = valores.get(clave(el) + (el.type === 'radio' ? '|' + el.value : ''));
    if (!v) return;
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = v.c; else el.value = v.v;
  });
  if (claveActiva) {
    const el = [...app.querySelectorAll('input, textarea, select')].find(e => clave(e) === claveActiva);
    if (el) { el.focus({ preventScroll: true }); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch (_) { /* tipos sin selección */ } }
  }
}

/** Ejecuta una operación asíncrona mostrando el error al usuario si falla. */
async function operar(fn, okMensaje) {
  // Formulario que se acaba de enviar: tras guardar se limpia; el resto de lo tecleado se conserva
  // (el usuario puede haber seguido trabajando mientras se confirmaba la escritura).
  const activo = document.activeElement;
  const enviado = activo && activo.form ? activo.form : null;
  try {
    const r = await fn();
    if (okMensaje) toast(okMensaje);
    renderConservando(enviado);
    return r;
  } catch (e) {
    toast(mensajeError(e), 'bad');
    if (!e.usuario) console.error(e);
    return undefined;
  }
}
