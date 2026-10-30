/* =====================================================================
 *  Render principal, acciones y formularios
 *  Toda escritura pasa por `Almacen` (Firebase o local) mediante `operar`.
 * ===================================================================== */

function render() {
  const app = $('#app');
  const r = ruta();
  if (r[0] === 'verificar') { app.innerHTML = vistaVerificar(r[1]); return; }   // pública, sin sesión
  if (Almacen.modo === 'firebase') {
    if (Almacen.estado === 'verificar-direccion') { app.innerHTML = vistaVerificarDireccion(); return; }
    if (Almacen.estado === 'sin-perfil') { app.innerHTML = vistaSinPerfil(); return; }
    if (Almacen.usuario && !usuarioActual()) { app.innerHTML = vistaCargando('Cargando tu expediente…'); return; }
  }
  const u = usuarioActual();
  if (!u) {
    if (ui.authVista === 'setup' && Almacen.modo === 'local' && db.users[ADMIN_EMAIL].hash) ui.authVista = 'login';
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

  const scrollLateral = $('.sidebar') ? $('.sidebar').scrollTop : 0;
  app.innerHTML = cabecera(u) + '<div class="layout">' + barraLateral(u, actual) + '<main id="main" class="min-w-0">' + contenido +
    '<footer class="max-w-5xl mx-auto px-4 sm:px-8 pb-10 pt-4 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 no-print"><span>© ' + new Date().getFullYear() + ' ' + CENTRO + '</span>' +
    '<span>' + MENCION_LEGAL + '</span><button class="underline" data-act="segunda-capa">Protección de datos</button><a class="underline" href="#/verificar">Verificar un diploma</a><span>Contacto: ' + ADMIN_EMAIL + '</span>' +
    (Almacen.modo === 'local' ? '<span class="font-semibold">Modo demostración (datos en este navegador)</span>' : '') + '</footer></main></div>';
  if ($('.sidebar')) $('.sidebar').scrollTop = scrollLateral;
  resaltar();
}

const acciones = {
  'auth-vista': el => { ui.authVista = el.dataset.v; render(); },
  'segunda-capa': () => modalSegundaCapa(),
  'cerrar-modal': () => cerrarModal(),
  'cerrar-modal-fondo': (el, e) => { if (e.target === el) cerrarModal(); },
  'recuperar-clave': () => { const f = $('form[data-form=login]'); if (f) onRecuperar(f); },
  'reenviar-verificacion': () => operar(() => Almacen.reenviarVerificacion(), 'Correo de verificación enviado.'),
  'comprobar-verificacion': async () => {
    const ok = await operar(() => Almacen.comprobarVerificacion());
    toast(ok ? 'Correo verificado. ¡Gracias!' : 'Todavía no consta como verificado. Abre el enlace del correo y vuelve a intentarlo.', ok ? 'ok' : 'bad');
  },
  'logout': async () => {
    const u = usuarioActual();
    if (u) await Almacen.auditar('Cierre de sesión', u.email).catch(() => {});
    await operar(() => Almacen.salir());
    ui.authVista = 'login'; location.hash = ''; render();
  },
  'toggle-side': () => { ui.sideAbierta = !ui.sideAbierta; const s = $('.sidebar'); if (s) s.classList.toggle('open', ui.sideAbierta); },
  'toggle-mod': el => {
    const id = el.dataset.m;
    if (ui.modsCerrados.has(id)) ui.modsCerrados.delete(id); else ui.modsCerrados.add(id);
    render();
  },
  'copiar': el => copiarTexto(codigoPorId[el.dataset.id], el),
  'copiar-texto': el => copiarTexto(el.dataset.texto, el),
  'toggle-hecho': el => {
    const u = usuarioActual(); const n = Number(el.dataset.n);
    const progreso = Object.assign({}, u.progreso);
    if (progreso[n]) delete progreso[n]; else progreso[n] = new Date().toISOString();
    u.progreso = progreso;                                  // respuesta inmediata en pantalla
    render();
    operar(() => Almacen.guardarPerfil(u.email, { progreso }), progreso[n] ? 'Sesión ' + n + ' completada.' : null);
  },
  'exportar-expediente': async () => {
    const u = usuarioActual();
    await Almacen.auditar('Derecho de acceso/portabilidad: exportación JSON', u.email).catch(() => {});
    descargar('expediente-master-ia-' + u.email.replace(/[^a-z0-9]/gi, '_') + '.json', JSON.stringify(expedienteDe(u.email), null, 2));
    toast('Expediente exportado en formato JSON.');
  },
  'suprimir': () => modalSupresion(usuarioActual()),
  'toggle-derecho': el => {
    const u = usuarioActual(); const d = el.dataset.d;
    const valor = u[d] ? null : new Date().toISOString();
    operar(async () => {
      await Almacen.guardarPerfil(u.email, { [d]: valor });
      await Almacen.auditar((d === 'oposicion' ? 'Derecho de oposición ' : 'Limitación del tratamiento ') + (valor ? 'ejercido' : 'retirado'), u.email);
    });
  },
  'admitir': el => cambiarEstado(el.dataset.email, 'admitido'),
  'rechazar': el => cambiarEstado(el.dataset.email, 'rechazado'),
  'revocar-codigo': el => operar(async () => {
    await Almacen.revocarCodigo(el.dataset.codigo);
    await Almacen.auditar('Revocación del código ' + el.dataset.codigo, ADMIN_EMAIL);
  }, 'Código revocado.'),
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
  'exportar-db': async () => {
    await Almacen.auditar('Exportación de la base de datos', ADMIN_EMAIL).catch(() => {});
    descargar('master-ia-jro-copia-' + hoyIso() + '.json', JSON.stringify(Almacen.exportar(), null, 2));
  },
  'reset-db': () => abrirModal('<h2 class="text-xl font-extrabold">Restablecer datos</h2><p class="text-sm mt-2">Se eliminará el alumnado, las entregas, los códigos y los registros de títulos y certificados de este navegador.</p><div class="flex justify-end gap-2 mt-5"><button class="btn btn-ghost" data-act="cerrar-modal">Cancelar</button><button class="btn btn-danger" data-act="confirmar-reset">Restablecer</button></div>'),
  'confirmar-reset': () => {
    if (Almacen.modo !== 'local') return;
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
  operar(async () => {
    await Almacen.guardarPerfil(email, { estado, fechaResolucion: new Date().toISOString() });
    await Almacen.auditar('Matrícula: ' + estado, email);
  }, a.nombre + ': ' + (estado === 'admitido' ? 'matriculado/a' : 'solicitud rechazada'));
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
    const campos = {};
    if (!u.titulo) {
      const nombre = f.nombre.value.trim();
      if (nombre.length < 5) { toast('El nombre es demasiado corto.', 'bad'); return; }
      campos.nombre = nombre;
    }
    if (f.promocion) campos.promocion = f.promocion.value;
    operar(async () => {
      await Almacen.guardarPerfil(u.email, campos);
      await Almacen.auditar('Derecho de rectificación', u.email);
    }, 'Datos rectificados.');
  },
  suprimir: async f => {
    const u = usuarioActual();
    if (f.email.value.trim().toLowerCase() !== u.email) { $('#sup-err').textContent = 'El correo no coincide.'; return; }
    try {
      await Almacen.auditar('Derecho de supresión ejercido', u.email).catch(() => {});
      await Almacen.suprimir(u.email, f.password ? f.password.value : null);
    } catch (e) { $('#sup-err').textContent = mensajeError(e); return; }
    cerrarModal(); location.hash = ''; ui.authVista = 'login';
    toast('Tu cuenta y tus datos se han suprimido.'); render();
  },
  codigo: f => {
    const parte = () => uid().slice(0, 4).toUpperCase();
    let codigo;
    do { codigo = 'MIA-' + parte() + '-' + parte(); } while (db.codigos.some(x => x.codigo === codigo));
    operar(async () => {
      await Almacen.crearCodigo({ codigo, creado: new Date().toISOString(), nota: f.nota.value.trim(), usadoPor: null, revocado: null });
      await Almacen.auditar('Emisión del código de admisión ' + codigo, ADMIN_EMAIL);
    }, 'Código ' + codigo + ' generado.');
  },
  calificar: f => {
    const e = db.entregas.find(x => x.id === f.dataset.id);
    const campos = { feedback: f.feedback.value.trim(), estado: 'evaluada', fechaEvaluacion: new Date().toISOString() };
    if (e.tipo !== 'pfm') {
      const n = notaCampo(f.nota.value);
      if (!n.ok || n.v == null) { toast('La nota debe estar entre 0 y 10.', 'bad'); return; }
      campos.nota = n.v;
    }
    operar(async () => {
      await Almacen.actualizarEntrega(e.id, campos);
      await Almacen.auditar('Corrección de la entrega de la sesión ' + e.sesion + (campos.nota != null ? ' (' + fmtNota(campos.nota) + ')' : ''), e.email);
    }, 'Entrega corregida.');
  },
  acta: f => {
    const a = db.users[f.dataset.email];
    const modulos = {};
    for (const m of MODULOS_EVALUABLES) {
      const ex = notaCampo(f['examen_' + m.id].value);
      const rec = notaCampo(f['recuperacion_' + m.id].value);
      if (!ex.ok || !rec.ok) { toast('Las notas deben estar entre 0 y 10 (' + m.cod + ').', 'bad'); return; }
      modulos[m.id] = { examen: ex.v, recuperacion: rec.v };
    }
    operar(async () => {
      await Almacen.guardarEvaluacion(a.email, { modulos });
      await Almacen.auditar('Acta de módulos actualizada', a.email);
    }, 'Acta guardada.');
  },
  asistencia: f => {
    const a = db.users[f.dataset.email];
    const campo = name => document.querySelector('[form="' + f.id + '"][name="' + name + '"]');
    const jornadas = {};
    JORNADAS.forEach(j => { jornadas[j.id] = campo('j' + j.id).checked; });
    const seminarios = {};
    SEMINARIOS.forEach(s => { seminarios[s.id] = campo('s' + s.id).value || null; });
    operar(async () => {
      await Almacen.guardarEvaluacion(a.email, { jornadas, seminarios });
      await Almacen.auditar('Asistencia a jornadas y seminarios actualizada', a.email);
    }, 'Asistencia guardada.');
  },
  tribunal: f => {
    const a = db.users[f.dataset.email];
    const t = {};
    for (const [clave] of EVALUACION.tribunalPFM) {
      const n = notaCampo(f[clave].value);
      if (!n.ok) { toast('Las notas del tribunal deben estar entre 0 y 10.', 'bad'); return; }
      t[clave] = n.v;
    }
    t.miembros = [0, 1, 2].map(i => f['miembro' + i].value.trim());
    t.observaciones = f.observaciones.value.trim();
    t.acta = f.acta.value;
    const nota = notaPFM({ evaluacion: { tribunal: t } });
    if (t.acta === 'apto' && (nota == null || nota < 5)) { toast('Un acta APTO requiere las cinco notas y una calificación ≥ 5.', 'bad'); return; }
    if (t.acta === 'apto' && t.miembros.some(m => !m)) { toast('Indica los tres miembros del tribunal.', 'bad'); return; }
    operar(async () => {
      await Almacen.guardarEvaluacion(a.email, { tribunal: t });
      await Almacen.auditar('Acta del tribunal del Proyecto Final: ' + t.acta.toUpperCase(), a.email);
    }, 'Acta del tribunal guardada.');
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
  if (Almacen.modo === 'local' && el.dataset && el.dataset.actChange === 'importar-db' && el.files && el.files[0]) {
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
window.addEventListener('storage', e => { if (Almacen.modo === 'local' && e.key === DB_KEY) { db = cargarDB(); render(); } });

(function arrancar() {
  Almacen.iniciar();
  window.addEventListener('load', resaltar);       // highlight.js llega con defer desde el CDN
  const img = new Image();
  img.onload = () => { LOGO_PNG = true; render(); };
  img.src = 'logo-jrotero.png';
})();
