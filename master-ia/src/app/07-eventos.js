/* =====================================================================
 *  Render principal, acciones y formularios
 * ===================================================================== */

function render() {
  const u = usuarioActual();
  const app = $('#app');
  const r = ruta();
  if (r[0] === 'verificar') { app.innerHTML = vistaVerificar(r[1]); return; }   // pública, sin sesión
  if (!u) {
    if (ui.authVista === 'setup' && db.users[ADMIN_EMAIL].hash) ui.authVista = 'login';
    app.innerHTML = vistaAuth();
    return;
  }
  let actual = r[0] || 'inicio';
  let contenido = '';
  if (actual === 'sesion') {
    const num = parseInt(r[1], 10);
    const n = Math.min(ULTIMA_SESION, Math.max(0, isNaN(num) ? 0 : num));
    contenido = vistaSesion(u, n, r[2] || 'teoria');
    actual = 's' + n;
  } else if (actual === 'perfil') contenido = vistaPerfil(u);
  else if (actual === 'programa') contenido = vistaPrograma();
  else if (actual === 'direccion') contenido = vistaDireccion(u, r[1]);
  else if (actual === 'diploma') contenido = vistaDiploma(u, r[1]);
  else if (actual === 'certificado') contenido = vistaCertificado(u, r[1]);
  else { actual = 'inicio'; contenido = vistaInicio(u); }

  app.innerHTML = cabecera(u) + '<div class="layout">' + barraLateral(u, actual) + '<main id="main" class="min-w-0">' + contenido +
    '<footer class="max-w-5xl mx-auto px-4 sm:px-8 pb-10 pt-4 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 no-print"><span>© ' + new Date().getFullYear() + ' ' + CENTRO + '</span>' +
    '<span>' + MENCION_LEGAL + '</span><button class="underline" data-act="segunda-capa">Protección de datos</button><a class="underline" href="#/verificar">Verificar un diploma</a><span>Contacto: ' + ADMIN_EMAIL + '</span></footer></main></div>';
  resaltar();
}

const acciones = {
  'auth-vista': el => { ui.authVista = el.dataset.v; render(); },
  'segunda-capa': () => modalSegundaCapa(),
  'cerrar-modal': () => cerrarModal(),
  'cerrar-modal-fondo': (el, e) => { if (e.target === el) cerrarModal(); },
  'logout': () => {
    const u = usuarioActual();
    if (u) { registrarAuditoria('Cierre de sesión', u.email); guardar(); }
    setSesionEmail(null); ui.authVista = 'login'; location.hash = ''; render();
  },
  'toggle-side': () => { ui.sideAbierta = !ui.sideAbierta; const s = $('.sidebar'); if (s) s.classList.toggle('open', ui.sideAbierta); },
  'toggle-mod': el => {
    const id = el.dataset.m;
    if (ui.modsCerrados.has(id)) ui.modsCerrados.delete(id); else ui.modsCerrados.add(id);
    const scroll = $('.sidebar') ? $('.sidebar').scrollTop : 0;
    render();
    if ($('.sidebar')) $('.sidebar').scrollTop = scroll;
  },
  'copiar': el => copiarTexto(codigoPorId[el.dataset.id], el),
  'copiar-texto': el => copiarTexto(el.dataset.texto, el),
  'toggle-hecho': el => {
    const u = usuarioActual(); const n = Number(el.dataset.n);
    u.progreso = u.progreso || {};
    if (u.progreso[n]) delete u.progreso[n]; else u.progreso[n] = new Date().toISOString();
    guardar(); render();
    if (u.progreso[n]) toast('Sesión ' + n + ' completada. ' + progresoDe(u) + '/' + TOTAL_SESIONES);
  },
  'exportar-expediente': () => {
    const u = usuarioActual();
    registrarAuditoria('Derecho de acceso/portabilidad: exportación JSON', u.email); guardar();
    descargar('expediente-master-ia-' + u.email.replace(/[^a-z0-9]/gi, '_') + '.json', JSON.stringify(expedienteDe(u.email), null, 2));
    toast('Expediente exportado en formato JSON.');
  },
  'suprimir': () => modalSupresion(usuarioActual()),
  'toggle-derecho': el => {
    const u = usuarioActual(); const d = el.dataset.d;
    u[d] = u[d] ? null : new Date().toISOString();
    registrarAuditoria((d === 'oposicion' ? 'Derecho de oposición ' : 'Limitación del tratamiento ') + (u[d] ? 'ejercido' : 'retirado'), u.email);
    guardar(); render();
  },
  'admitir': el => cambiarEstado(el.dataset.email, 'admitido'),
  'rechazar': el => cambiarEstado(el.dataset.email, 'rechazado'),
  'revocar-codigo': el => {
    const x = db.codigos.find(k => k.codigo === el.dataset.codigo);
    if (x) { x.revocado = new Date().toISOString(); registrarAuditoria('Revocación del código ' + x.codigo, ADMIN_EMAIL); guardar(); render(); }
  },
  'filtro-entregas': el => { ui.filtroEntregas = el.dataset.f; render(); },
  'emitir-titulo': el => {
    const a = db.users[el.dataset.email];
    const sit = situacionAcademica(a);
    abrirModal('<h2 class="text-xl font-extrabold">Expedir diploma</h2><p class="text-sm mt-2">Se expedirá el diploma del ' + TITULO_MASTER + ' a <strong>' + esc(a.nombre) + '</strong> (DNI/NIE ' + esc(a.dni) + ') con nota final <strong>' + fmtNota(sit.notaFinal) + '</strong>' + (sit.distincion ? ' <strong>con distinción</strong>' : '') + '. Quedará anotado en el libro de registro de títulos propios y se cerrará el acta del Proyecto Final.</p>' +
      '<p class="text-sm mt-2">Comprueba que nombre y DNI/NIE son correctos: aparecerán en el diploma.</p>' +
      '<div class="flex justify-end gap-2 mt-5"><button class="btn btn-ghost" data-act="cerrar-modal">Cancelar</button><button class="btn btn-primary" data-act="confirmar-titulo" data-email="' + esc(a.email) + '">★ Expedir diploma</button></div>');
  },
  'confirmar-titulo': el => { cerrarModal(); emitirTitulo(el.dataset.email); },
  'emitir-certificado': el => emitirCertificado(el.dataset.email),
  'imprimir': () => window.print(),
  'exportar-db': () => {
    registrarAuditoria('Exportación de la base de datos', ADMIN_EMAIL); guardar();
    descargar('master-ia-jro-copia-' + hoyIso() + '.json', JSON.stringify(db, null, 2));
  },
  'reset-db': () => abrirModal('<h2 class="text-xl font-extrabold">Restablecer datos</h2><p class="text-sm mt-2">Se eliminará el alumnado, las entregas, los códigos y los registros de títulos y certificados de este navegador.</p><div class="flex justify-end gap-2 mt-5"><button class="btn btn-ghost" data-act="cerrar-modal">Cancelar</button><button class="btn btn-danger" data-act="confirmar-reset">Restablecer</button></div>'),
  'confirmar-reset': () => {
    const admin = db.users[ADMIN_EMAIL];
    db = normalizarDB({ users: { [ADMIN_EMAIL]: admin } });
    registrarAuditoria('Restablecimiento de datos', ADMIN_EMAIL);
    guardar(); cerrarModal(); toast('Datos restablecidos.'); render();
  }
};

function cambiarEstado(email, estado) {
  const a = db.users[email];
  if (!a) return;
  if (estado === 'admitido' && alumnos().filter(x => x.estado === 'admitido').length >= EDICION.plazas) {
    toast('Se ha alcanzado el máximo de ' + EDICION.plazas + ' plazas del grupo.', 'bad'); return;
  }
  a.estado = estado;
  a.fechaResolucion = new Date().toISOString();
  registrarAuditoria('Matrícula: ' + estado, email);
  guardar(); render();
  toast(a.nombre + ': ' + (estado === 'admitido' ? 'matriculado/a' : 'solicitud rechazada'));
}

function copiarTexto(texto, el) {
  const ok = () => { const prev = el.textContent; el.textContent = '¡Copiado!'; setTimeout(() => { el.textContent = prev; }, 1400); };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(ok, () => copiarFallback(texto) && ok());
  } else if (copiarFallback(texto)) ok();
}
function copiarFallback(texto) {
  const ta = document.createElement('textarea');
  ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  if (!ok) toast('No se pudo copiar automáticamente.', 'bad');
  return ok;
}

function notaCampo(valor) {
  if (valor === '' || valor == null) return { ok: true, v: null };
  const v = Number(valor);
  return isNaN(v) || v < 0 || v > 10 ? { ok: false } : { ok: true, v };
}

const formularios = {
  login: f => onLogin(f),
  setup: f => onSetup(f),
  registro: f => onRegistro(f),
  entrega: f => onEntrega(f),
  pfm: f => onPFM(f),
  verificar: f => ir('verificar/' + encodeURIComponent(f.codigo.value.trim().toUpperCase())),
  rectificar: f => {
    const u = usuarioActual();
    if (!u.titulo) {
      const nombre = f.nombre.value.trim();
      if (nombre.length < 5) { toast('El nombre es demasiado corto.', 'bad'); return; }
      u.nombre = nombre;
    }
    if (f.promocion) u.promocion = f.promocion.value;
    registrarAuditoria('Derecho de rectificación', u.email);
    guardar(); toast('Datos rectificados.'); render();
  },
  suprimir: f => {
    const u = usuarioActual();
    if (f.email.value.trim().toLowerCase() !== u.email) { $('#sup-err').textContent = 'El correo no coincide.'; return; }
    db.titulos.forEach(t => { if (t.email === u.email) { t.suprimido = new Date().toISOString(); t.email = null; } });
    db.certificados.forEach(t => { if (t.email === u.email) { t.suprimido = new Date().toISOString(); t.email = null; } });
    db.entregas = db.entregas.filter(e => e.email !== u.email);
    db.audit.forEach(a => { if (a.email === u.email) a.email = '[suprimido]'; });
    db.codigos.forEach(x => { if (x.usadoPor === u.email) x.usadoPor = '[suprimido]'; });
    delete db.users[u.email];
    registrarAuditoria('Derecho de supresión ejercido por un alumno', null);
    guardar(); cerrarModal(); setSesionEmail(null); location.hash = '';
    toast('Tu cuenta y tus datos se han suprimido.'); render();
  },
  codigo: f => {
    const parte = () => uid().slice(0, 4).toUpperCase();
    let codigo;
    do { codigo = 'MIA-' + parte() + '-' + parte(); } while (db.codigos.some(x => x.codigo === codigo));
    db.codigos.push({ codigo, creado: new Date().toISOString(), nota: f.nota.value.trim(), usadoPor: null, revocado: null });
    registrarAuditoria('Emisión del código de admisión ' + codigo, ADMIN_EMAIL);
    guardar(); render(); toast('Código ' + codigo + ' generado.');
  },
  calificar: f => {
    const e = db.entregas.find(x => x.id === f.dataset.id);
    if (e.tipo !== 'pfm') {
      const n = notaCampo(f.nota.value);
      if (!n.ok || n.v == null) { toast('La nota debe estar entre 0 y 10.', 'bad'); return; }
      e.nota = n.v;
    }
    e.feedback = f.feedback.value.trim(); e.estado = 'evaluada'; e.fechaEvaluacion = new Date().toISOString();
    registrarAuditoria('Corrección de la entrega de la sesión ' + e.sesion + (e.nota != null ? ' (' + fmtNota(e.nota) + ')' : ''), e.email);
    guardar(); render(); toast('Entrega corregida.');
  },
  acta: f => {
    const a = db.users[f.dataset.email];
    const mods = a.evaluacion.modulos = a.evaluacion.modulos || {};
    for (const m of MODULOS_EVALUABLES) {
      const ex = notaCampo(f['examen_' + m.id].value);
      const rec = notaCampo(f['recuperacion_' + m.id].value);
      if (!ex.ok || !rec.ok) { toast('Las notas deben estar entre 0 y 10 (' + m.cod + ').', 'bad'); return; }
      mods[m.id] = { examen: ex.v, recuperacion: rec.v };
    }
    registrarAuditoria('Acta de módulos actualizada', a.email);
    guardar(); render(); toast('Acta guardada.');
  },
  asistencia: f => {
    const a = db.users[f.dataset.email];
    const campo = name => document.querySelector('[form="' + f.id + '"][name="' + name + '"]');
    a.evaluacion.jornadas = {};
    JORNADAS.forEach(j => { a.evaluacion.jornadas[j.id] = campo('j' + j.id).checked; });
    a.evaluacion.seminarios = {};
    SEMINARIOS.forEach(s => { a.evaluacion.seminarios[s.id] = campo('s' + s.id).value || null; });
    registrarAuditoria('Asistencia a jornadas y seminarios actualizada', a.email);
    guardar(); render(); toast('Asistencia guardada.');
  },
  tribunal: f => {
    const a = db.users[f.dataset.email];
    const t = a.evaluacion.tribunal || {};
    for (const [clave] of EVALUACION.tribunalPFM) {
      const n = notaCampo(f[clave].value);
      if (!n.ok) { toast('Las notas del tribunal deben estar entre 0 y 10.', 'bad'); return; }
      t[clave] = n.v;
    }
    t.miembros = [0, 1, 2].map(i => f['miembro' + i].value.trim());
    t.observaciones = f.observaciones.value.trim();
    t.acta = f.acta.value;
    a.evaluacion.tribunal = t;
    const nota = notaPFM(a);
    if (t.acta === 'apto' && (nota == null || nota < 5)) { toast('Un acta APTO requiere las cinco notas y una calificación ≥ 5.', 'bad'); return; }
    if (t.acta === 'apto' && t.miembros.some(m => !m)) { toast('Indica los tres miembros del tribunal.', 'bad'); return; }
    registrarAuditoria('Acta del tribunal del Proyecto Final: ' + t.acta.toUpperCase(), a.email);
    guardar(); render(); toast('Acta del tribunal guardada.');
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = acciones[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('submit', e => {
  const f = e.target;
  const fn = formularios[f.dataset.form];
  if (!fn) return;
  e.preventDefault();
  fn(f, e.submitter);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.actChange === 'importar-db' && el.files && el.files[0]) {
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const datos = JSON.parse(lector.result);
        if (!datos || typeof datos !== 'object' || !datos.users) throw new Error('formato');
        const adminActual = db.users[ADMIN_EMAIL];
        db = normalizarDB(datos);
        if (!db.users[ADMIN_EMAIL].hash && adminActual.hash) db.users[ADMIN_EMAIL] = adminActual;
        registrarAuditoria('Importación de copia de seguridad', ADMIN_EMAIL);
        guardar(); toast('Copia importada.'); render();
      } catch (err) { toast('El archivo no es una copia válida de la plataforma.', 'bad'); }
    };
    lector.readAsText(el.files[0]);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal-root').innerHTML) cerrarModal(); });
window.addEventListener('hashchange', () => {
  ui.sideAbierta = false;
  const r = ruta();
  if (r[0] === 'sesion') {
    const num = parseInt(r[1], 10);
    const m = moduloDe(isNaN(num) ? 0 : num);
    if (m) ui.modsCerrados.delete(m.id);
  }
  render();
  window.scrollTo({ top: 0 });
});
window.addEventListener('storage', e => { if (e.key === DB_KEY) { db = cargarDB(); render(); } });

(function arrancar() {
  render();
  window.addEventListener('load', resaltar);       // highlight.js llega con defer desde el CDN
  const img = new Image();
  img.onload = () => { LOGO_PNG = true; render(); };
  img.src = 'logo-jrotero.png';
})();
