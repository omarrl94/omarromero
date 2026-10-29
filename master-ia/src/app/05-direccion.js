/* =====================================================================
 *  Panel de Dirección
 * ===================================================================== */

const SUBDIR = [
  ['admisiones', 'Admisiones'], ['seguimiento', 'Seguimiento'], ['calificaciones', 'Calificar entregas'],
  ['actas', 'Actas de módulos'], ['asistencia', 'Jornadas y seminarios'], ['pfm', 'Proyecto Final'],
  ['titulos', 'Títulos y certificados'], ['datos', 'Datos y auditoría']
];

function vistaDireccion(u, sub) {
  if (!esDirector(u)) return '<div class="p-8">Acceso restringido a la Dirección del Máster.</div>';
  if (!SUBDIR.some(s => s[0] === sub)) sub = 'admisiones';
  const pendientesAdm = alumnos().filter(a => a.estado === 'pendiente').length;
  const pendientesEnt = db.entregas.filter(e => e.estado === 'pendiente').length;
  const contador = { admisiones: pendientesAdm, calificaciones: pendientesEnt };
  const vistas = { admisiones: dirAdmisiones, seguimiento: dirSeguimiento, calificaciones: dirCalificaciones, actas: dirActas, asistencia: dirAsistencia, pfm: dirPFM, titulos: dirTitulos, datos: dirDatos };
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' +
    '<div class="card p-5 sm:p-6" style="background:#111;color:#fff;border-color:#111"><div class="flex flex-wrap items-center gap-3">' +
    '<span class="badge-master">★ Panel de Dirección</span><span class="text-white/60 text-sm">' + ADMIN_NAME + ' · Dirección del Máster · ' + ADMIN_EMAIL + '</span></div>' +
    '<h1 class="text-2xl font-extrabold mt-2">' + TITULO_MASTER + '</h1><p class="text-white/60 text-sm">' + EDICION.nombre + ' · ' + EDICION.periodo + ' · ' + MENCION_LEGAL + '</p>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">' +
    statDark('Matriculados', alumnos().filter(a => a.estado === 'admitido').length + '/' + EDICION.plazas) + statDark('Solicitudes pendientes', pendientesAdm) +
    statDark('Entregas por corregir', pendientesEnt) + statDark('Diplomas expedidos', db.titulos.length) +
    '</div></div>' +
    '<div class="tabs mt-4 bg-white rounded-t-xl px-2 border" style="border-color:var(--line)">' +
    SUBDIR.map(s => '<a class="tab no-underline" aria-selected="' + (s[0] === sub) + '" href="#/direccion/' + s[0] + '">' + s[1] + (contador[s[0]] ? ' <span class="chip chip-gold" style="padding:.05rem .4rem">' + contador[s[0]] + '</span>' : '') + '</a>').join('') +
    '</div><div class="mt-4">' + vistas[sub]() + '</div></div>';
}
function statDark(etq, v) {
  return '<div class="rounded-xl p-3" style="background:rgba(255,255,255,.07)"><div class="text-[.7rem] uppercase tracking-wide text-white/55 font-bold">' + etq + '</div><div class="text-2xl font-extrabold" style="color:#efcd2f">' + v + '</div></div>';
}
function celdaAlumno(a) {
  return '<strong>' + esc(a.nombre) + '</strong><div class="text-xs text-gray-500">' + esc(a.email) + '</div>';
}
function sinAlumnos(texto) { return '<div class="card p-5 text-sm text-gray-500">' + (texto || 'No hay alumnado matriculado todavía.') + '</div>'; }
function matriculados() { return alumnos().filter(a => a.estado === 'admitido'); }

function dirAdmisiones() {
  const lista = alumnos().sort((a, b) => (a.estado === 'pendiente' ? -1 : 1) - (b.estado === 'pendiente' ? -1 : 1) || b.creado.localeCompare(a.creado));
  const filas = lista.map(a => '<tr><td>' + celdaAlumno(a) + '<div class="text-xs text-gray-500">DNI/NIE ' + esc(enmascararDni(a.dni)) + '</div></td>' +
    '<td>' + esc(a.via) + ' · ' + esc(a.promocion) + (a.via !== 'DAM' ? '<div class="text-xs" style="color:#9a4f2e">Entrevista y nivelación</div>' : '') + (a.centro ? '<div class="text-xs text-gray-500">' + esc(a.centro) + '</div>' : '') + '</td>' +
    '<td>' + (a.plaza === 'externo' ? 'Externa' : 'Centro (promoción)') + '<div class="text-xs text-gray-500">' + (a.admision && a.admision.indexOf('codigo:') === 0 ? 'Código ' + esc(a.admision.slice(7)) : '@jrotero.es') + ' · ' + fmtFecha(a.creado) + '</div></td>' +
    '<td><span class="chip ' + (a.estado === 'admitido' ? 'chip-sage' : a.estado === 'pendiente' ? 'chip-gold' : 'chip-terra') + '">' + esc(a.estado) + '</span></td>' +
    '<td class="whitespace-nowrap">' + (a.estado !== 'admitido' ? '<button class="btn btn-primary btn-sm" data-act="admitir" data-email="' + esc(a.email) + '">Matricular</button> ' : '') +
    (a.estado !== 'rechazado' ? '<button class="btn btn-danger btn-sm" data-act="rechazar" data-email="' + esc(a.email) + '">Rechazar</button>' : '') + '</td></tr>').join('');
  const codigos = db.codigos.slice().reverse().map(x => '<tr><td class="font-mono font-bold">' + esc(x.codigo) + '</td><td>' + fmtFecha(x.creado) + '</td><td>' + (x.nota ? esc(x.nota) : '—') + '</td>' +
    '<td>' + (x.usadoPor ? 'Usado por ' + esc(x.usadoPor) : x.revocado ? 'Revocado' : '<span class="chip chip-sage">Disponible</span>') + '</td>' +
    '<td>' + (!x.usadoPor && !x.revocado ? '<button class="btn btn-ghost btn-sm" data-act="copiar-texto" data-texto="' + esc(x.codigo) + '">Copiar</button> <button class="btn btn-danger btn-sm" data-act="revocar-codigo" data-codigo="' + esc(x.codigo) + '">Revocar</button>' : '') + '</td></tr>').join('');
  return '<div class="grid gap-5"><div class="card p-5"><h2 class="font-extrabold text-lg mb-1">Solicitudes de matrícula</h2><p class="text-sm text-gray-600 mb-3">Plazo de la ' + EDICION.nombre + ': solicitud del 1 jun al 15 jul 2029; comprobación hasta el 20 jul; venta de plazas libres desde el 21 jul; entrevistas (otras vías) del 1 al 20 sep; matrícula hasta el 25 sep.</p>' +
    (filas ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Solicitante</th><th>Titulación de acceso</th><th>Plaza</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + filas + '</tbody></table></div>' : '<p class="text-sm text-gray-500">Todavía no hay solicitudes.</p>') + '</div>' +
    '<div class="card p-5"><h2 class="font-extrabold text-lg">Códigos de admisión</h2><p class="text-sm text-gray-600">Para plazas externas (tras la reserva o el pago) y para correos que no son @jrotero.es. Un código con vía DAM matricula directamente; las otras vías quedan pendientes de entrevista. Cada código se usa una vez.</p>' +
    '<form data-form="codigo" class="flex flex-wrap gap-2 mt-3"><div class="field flex-1 min-w-[200px]"><input name="nota" placeholder="Referencia: p. ej. Plaza externa · pronto pago · pedido 0042" maxlength="80"></div><button class="btn btn-primary" type="submit">Generar código</button></form>' +
    (codigos ? '<div class="tbl-wrap mt-4"><table class="tbl"><thead><tr><th>Código</th><th>Emitido</th><th>Referencia</th><th>Estado</th><th></th></tr></thead><tbody>' + codigos + '</tbody></table></div>' : '') + '</div></div>';
}

function dirSeguimiento() {
  const lista = alumnos();
  if (!lista.length) return sinAlumnos();
  const filas = lista.map(a => {
    const sit = situacionAcademica(a);
    let celdas = '';
    SESIONES.forEach(s => {
      const ok = a.progreso && a.progreso[s.n];
      const entregada = db.entregas.some(e => e.email === a.email && e.sesion === s.n);
      celdas += '<span title="Sesión ' + s.n + (entregada ? ' · entregada' : '') + '" style="display:inline-block;width:9px;height:14px;margin-right:1px;border-radius:2px;background:' + (ok ? colorMod(moduloDe(s.n)) : '#ece9df') + ';' + (entregada ? 'box-shadow:inset 0 -3px 0 #111' : '') + '"></span>';
    });
    return '<tr><td>' + celdaAlumno(a) + '</td><td><span class="chip">' + esc(a.estado) + '</span></td>' +
      '<td class="whitespace-nowrap">' + celdas + '<div class="text-xs text-gray-500 mt-1">' + progresoDe(a) + '/' + TOTAL_SESIONES + ' sesiones · entregas ' + sit.ent.entregadas + '/' + sit.ent.total + '</div></td>' +
      '<td>' + sit.modulos.filter(r => r.estado === 'aprobado').length + '/7</td><td>' + sit.jor + '/3 · ' + sit.sem + '/5</td><td><strong>' + fmtNota(sit.notaFinal) + '</strong></td></tr>';
  }).join('');
  return '<div class="card p-5"><h2 class="font-extrabold text-lg mb-1">Seguimiento del grupo</h2><p class="text-sm text-gray-600 mb-3">Barra: sesiones completadas (color) y entregadas (línea inferior). Detecta a tiempo a quien se retrasa.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Alumno/a</th><th>Estado</th><th>Sesiones 0 → ' + ULTIMA_SESION + '</th><th>Módulos</th><th>Jornadas · Seminarios</th><th>Nota final</th></tr></thead><tbody>' + filas + '</tbody></table></div></div>';
}

function dirCalificaciones() {
  const f = ui.filtroEntregas;
  const lista = db.entregas.filter(e => f === 'todas' || e.estado === 'pendiente').slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
  const items = lista.map(e => {
    const a = db.users[e.email];
    const s = sesion(e.sesion);
    const esPFM = e.tipo === 'pfm';
    return '<form data-form="calificar" data-id="' + e.id + '" class="card p-4 grid md:grid-cols-[1fr_260px] gap-4">' +
      '<div class="min-w-0"><div class="flex flex-wrap gap-2 items-center"><span class="chip chip-gold">Sesión ' + e.sesion + '</span><span class="chip">' + esc({ semanal: 'Entrega semanal', proyecto: 'Proyecto de ' + moduloDe(e.sesion).cod, pfm: 'PFM · ' + (HITOS_PFM[e.hito] || '') }[e.tipo]) + '</span><strong>' + esc(a ? a.nombre : e.email) + '</strong><span class="text-xs text-gray-500">' + fmtFecha(e.fecha, true) + '</span></div>' +
      '<div class="mt-1 text-sm truncate">' + esc(s ? s.actividad.titulo.replace(/<[^>]+>/g, '') : '') + '</div>' +
      '<a class="underline text-sm break-all font-semibold" href="' + esc(e.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(e.repo) + '</a>' +
      (e.video ? '<div class="text-sm"><a class="underline break-all" href="' + esc(e.video) + '" target="_blank" rel="noopener noreferrer">' + esc(e.video) + '</a></div>' : '') +
      (e.commit ? '<div class="text-xs text-gray-500">Rama/commit: ' + esc(e.commit) + '</div>' : '') +
      (e.notas ? '<div class="mt-2 text-sm p-2 rounded" style="background:#FAF9F5">' + esc(e.notas) + '</div>' : '') + '</div>' +
      '<div class="grid gap-2">' + (esPFM ? '<input type="hidden" name="nota" value="">' : '<div class="field"><label>Nota (0–10)</label><input name="nota" type="number" min="0" max="10" step="0.25" value="' + (e.nota != null ? e.nota : '') + '" required></div>') +
      '<div class="field"><label>Feedback</label><textarea name="feedback" rows="2" maxlength="1500">' + esc(e.feedback || '') + '</textarea></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">' + (esPFM ? 'Marcar como revisado' : e.estado === 'evaluada' ? 'Actualizar nota' : 'Calificar') + '</button></div></form>';
  }).join('');
  return '<div class="flex gap-2 mb-3"><button class="btn btn-sm ' + (f === 'pendientes' ? 'btn-dark' : 'btn-ghost') + '" data-act="filtro-entregas" data-f="pendientes">Pendientes</button><button class="btn btn-sm ' + (f === 'todas' ? 'btn-dark' : 'btn-ghost') + '" data-act="filtro-entregas" data-f="todas">Todas</button></div>' +
    (items ? '<div class="grid gap-3">' + items + '</div>' : '<div class="card p-5 text-sm text-gray-500">No hay entregas ' + (f === 'pendientes' ? 'pendientes de corrección' : 'registradas') + '.</div>');
}

function dirActas() {
  const lista = matriculados();
  if (!lista.length) return sinAlumnos();
  return '<div class="card p-5 mb-4 text-sm"><strong>Actas de módulos.</strong> Introduce la nota del examen presencial (jornada 1: M1–M3; jornada 2: M4–M6; jornada 3: M7) y, si procede, la del examen de recuperación del 26 de enero. Proyecto y entregas se toman de las entregas calificadas. Nota = 50 % proyecto + 40 % examen (mínimo 4) + 10 % entregas.</div>' +
    lista.map(a => {
      const ev = a.evaluacion.modulos || {};
      return '<form data-form="acta" data-email="' + esc(a.email) + '" class="card p-5 mb-4"><div class="flex flex-wrap items-center gap-2 mb-3">' + celdaAlumno(a) + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Módulo</th><th>Proyecto</th><th>Entregas</th><th>Examen</th><th>Recuperación</th><th>Nota</th><th>Estado</th></tr></thead><tbody>' +
        MODULOS_EVALUABLES.map(m => {
          const r = notaModulo(a, m);
          const e = ev[m.id] || {};
          return '<tr><td><strong>' + esc(m.cod) + '</strong> <span class="text-xs text-gray-500">J' + m.examen + '</span></td><td>' + fmtNota(r.proyecto) + '</td><td>' + fmtNota(r.entregas) + '</td>' +
            '<td><input class="w-20 border rounded px-2 py-1" name="examen_' + m.id + '" type="number" min="0" max="10" step="0.25" value="' + (e.examen != null ? esc(e.examen) : '') + '"></td>' +
            '<td><input class="w-20 border rounded px-2 py-1" name="recuperacion_' + m.id + '" type="number" min="0" max="10" step="0.25" value="' + (e.recuperacion != null ? esc(e.recuperacion) : '') + '"></td>' +
            '<td><strong>' + fmtNota(r.nota) + '</strong></td><td><span class="chip ' + (r.estado === 'aprobado' ? 'chip-sage' : r.estado === 'suspenso' ? 'chip-terra' : '') + '">' + esc(r.estado) + '</span>' + (r.motivo ? '<div class="text-xs text-gray-500">' + esc(r.motivo) + '</div>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div><button class="btn btn-primary btn-sm mt-3" type="submit">Guardar acta</button></form>';
    }).join('');
}

function dirAsistencia() {
  const lista = matriculados();
  if (!lista.length) return sinAlumnos();
  const cab = '<tr><th>Alumno/a</th>' + JORNADAS.map(j => '<th title="' + esc(j.contenido) + '">J' + j.id + '<div class="text-[.65rem] font-normal">' + fmtFechaCorta(j.fecha) + '</div></th>').join('') +
    SEMINARIOS.map(s => '<th title="' + esc(s.titulo) + '">S' + s.id + '<div class="text-[.65rem] font-normal">' + fmtFechaCorta(s.fecha) + '</div></th>').join('') + '<th></th></tr>';
  const filas = lista.map(a => {
    const j = a.evaluacion.jornadas || {};
    const s = a.evaluacion.seminarios || {};
    return '<tr><td>' + celdaAlumno(a) + '</td>' +
      JORNADAS.map(x => '<td><input type="checkbox" form="as-' + esc(a.email) + '" name="j' + x.id + '"' + (j[x.id] ? ' checked' : '') + ' aria-label="Jornada ' + x.id + '"></td>').join('') +
      SEMINARIOS.map(x => '<td><select form="as-' + esc(a.email) + '" name="s' + x.id + '" class="border rounded text-xs px-1 py-0.5"><option value="">—</option><option value="directo"' + (s[x.id] === 'directo' ? ' selected' : '') + '>Directo</option><option value="grabacion"' + (s[x.id] === 'grabacion' ? ' selected' : '') + '>Grabación + cuestionario</option></select></td>').join('') +
      '<td><form id="as-' + esc(a.email) + '" data-form="asistencia" data-email="' + esc(a.email) + '"><button class="btn btn-primary btn-sm" type="submit">Guardar</button></form></td></tr>';
  }).join('');
  return '<div class="card p-5"><h2 class="font-extrabold text-lg mb-1">Jornadas presenciales y seminarios</h2><p class="text-sm text-gray-600 mb-3">Requisitos: asistir a las 3 jornadas presenciales y a 4 de los 5 seminarios (en directo o viendo la grabación con su cuestionario).</p>' +
    '<div class="tbl-wrap"><table class="tbl"><thead>' + cab + '</thead><tbody>' + filas + '</tbody></table></div></div>';
}

function dirPFM() {
  const lista = matriculados();
  if (!lista.length) return sinAlumnos();
  return lista.map(a => {
    const t = a.evaluacion.tribunal || {};
    const pfm = a.pfm || {};
    const hitos = ['propuesta', 'anteproyecto', 'intermedia', 'final'].map(h => {
      const e = db.entregas.filter(x => x.email === a.email && x.hito === h).sort((x, y) => y.fecha.localeCompare(x.fecha))[0];
      return '<span class="chip ' + (e ? (e.estado === 'evaluada' ? 'chip-sage' : 'chip-gold') : '') + '">' + HITOS_PFM[h].split(' (')[0] + (e ? (e.estado === 'evaluada' ? ' ✓' : ' · entregado') : ' · pendiente') + '</span>';
    }).join(' ');
    const nota = notaPFM(a);
    const cerrado = !!a.titulo;
    return '<form data-form="tribunal" data-email="' + esc(a.email) + '" class="card p-5 mb-4">' +
      '<div class="flex flex-wrap items-center gap-2">' + celdaAlumno(a) + '<span class="ml-auto">' + hitos + '</span></div>' +
      (pfm.titulo ? '<div class="mt-3 p-3 rounded-lg text-sm" style="background:#FAF9F5"><div class="font-bold">' + esc(pfm.titulo) + '</div>' + (pfm.empresa ? '<div>Empresa: ' + esc(pfm.empresa) + '</div>' : '') + (pfm.pareja ? '<div>En pareja con: ' + esc(pfm.pareja) + '</div>' : '') + (pfm.repo ? '<a class="underline break-all" href="' + esc(pfm.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(pfm.repo) + '</a>' : '') + (pfm.resumen ? '<p class="mt-1 text-gray-700">' + esc(pfm.resumen) + '</p>' : '') + '</div>' : '<p class="text-sm text-gray-500 mt-2">Sin datos del proyecto todavía.</p>') +
      '<div class="grid sm:grid-cols-3 gap-3 mt-4">' +
      ['Coordinación académica', 'Docente del programa', 'Profesional de empresa'].map((r, i) => '<div class="field"><label>' + r + '</label><input name="miembro' + i + '" maxlength="80" value="' + esc((t.miembros || [])[i] || '') + '"' + (cerrado ? ' disabled' : '') + '></div>').join('') + '</div>' +
      '<div class="grid sm:grid-cols-5 gap-3 mt-3">' +
      EVALUACION.tribunalPFM.map(c => '<div class="field"><label>' + c[1] + ' (' + Math.round(c[2] * 100) + ' %)</label><input name="' + c[0] + '" type="number" min="0" max="10" step="0.25" value="' + (t[c[0]] != null ? esc(t[c[0]]) : '') + '"' + (cerrado ? ' disabled' : '') + '></div>').join('') + '</div>' +
      '<div class="grid sm:grid-cols-[2fr_1fr_1fr] gap-3 mt-3 items-end">' +
      '<div class="field"><label>Observaciones</label><textarea name="observaciones" rows="2" maxlength="2000"' + (cerrado ? ' disabled' : '') + '>' + esc(t.observaciones || '') + '</textarea></div>' +
      '<div class="field"><label>Acta</label><select name="acta"' + (cerrado ? ' disabled' : '') + '>' + ['pendiente', 'apto', 'no apto'].map(o => '<option value="' + o + '"' + ((t.acta || 'pendiente') === o ? ' selected' : '') + '>' + o.toUpperCase() + '</option>').join('') + '</select></div>' +
      '<div><div class="text-xs text-gray-500">Nota del Proyecto Final</div><div class="text-2xl font-extrabold">' + fmtNota(nota) + '</div></div></div>' +
      (cerrado ? '<p class="text-xs text-gray-500 mt-2">Acta cerrada: diploma expedido.</p>' : '<button class="btn btn-primary btn-sm mt-3" type="submit">Guardar acta del tribunal</button>') +
      '</form>';
  }).join('');
}

function dirTitulos() {
  const lista = matriculados();
  const tarjetas = lista.map(a => {
    const sit = situacionAcademica(a);
    const aprobados = sit.modulos.filter(r => r.estado === 'aprobado');
    return '<div class="card p-5 mb-4"><div class="flex flex-wrap items-center gap-2">' + celdaAlumno(a) +
      (a.titulo ? '<span class="badge-master ml-auto">Diploma nº ' + esc(a.titulo.numero) + '</span>' : '<span class="chip ml-auto">' + (sit.completo ? 'Cumple todos los requisitos' : 'Requisitos pendientes') + '</span>') + '</div>' +
      '<ul class="text-sm mt-3 grid sm:grid-cols-2 gap-1">' + sit.requisitos.map(r => '<li>' + (r.ok ? '✅' : '⬜') + ' ' + esc(r.texto) + ' <span class="text-gray-500">(' + esc(r.detalle) + ')</span></li>').join('') + '</ul>' +
      '<div class="mt-3 text-sm">Media de módulos <strong>' + fmtNota(sit.media) + '</strong> · Proyecto Final <strong>' + fmtNota(sit.pfm) + '</strong> · Nota final <strong>' + fmtNota(sit.notaFinal) + '</strong>' + (sit.distincion ? ' · <strong>con distinción</strong>' : '') + '</div>' +
      '<div class="flex flex-wrap gap-2 mt-3">' +
      (a.titulo ? '<a class="btn btn-primary btn-sm" href="#/diploma/' + encodeURIComponent(a.email) + '">Ver diploma y suplemento</a>' :
        '<button class="btn btn-primary btn-sm" data-act="emitir-titulo" data-email="' + esc(a.email) + '"' + (sit.completo ? '' : ' disabled title="Debe cumplir todos los requisitos del título"') + '>★ Expedir diploma</button>') +
      (!a.titulo ? '<button class="btn btn-ghost btn-sm" data-act="emitir-certificado" data-email="' + esc(a.email) + '"' + (aprobados.length ? '' : ' disabled title="No tiene módulos superados"') + '>Certificado de aprovechamiento (' + aprobados.length + ' módulos)</button>' : '') +
      (a.certificado ? '<a class="btn btn-ghost btn-sm" href="#/certificado/' + encodeURIComponent(a.email) + '">Ver certificado</a>' : '') +
      '</div></div>';
  }).join('');
  const registro = db.titulos.length ? '<div class="card p-5"><h2 class="font-extrabold text-lg mb-3">Libro de registro de títulos propios</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Titular</th><th>DNI/NIE</th><th>Fecha</th><th>Nota final</th><th>Código de verificación</th><th></th></tr></thead><tbody>' +
    db.titulos.slice().reverse().map(t => '<tr><td class="font-mono font-bold">' + esc(t.numero) + '</td><td>' + esc(t.nombre) + (t.suprimido ? ' <span class="chip">bloqueado</span>' : '') + '</td><td>' + esc(enmascararDni(t.dni)) + '</td><td>' + fmtFecha(t.fecha) + '</td><td>' + fmtNota(t.nota) + (t.distincion ? ' · con distinción' : '') + '</td><td class="font-mono text-xs">' + esc(t.verificacion) + '</td>' +
      '<td>' + (t.email && db.users[t.email] ? '<a class="btn btn-ghost btn-sm" href="#/diploma/' + encodeURIComponent(t.email) + '">Ver</a>' : '') + '</td></tr>').join('') +
    '</tbody></table></div></div>' : '';
  return (tarjetas || sinAlumnos()) + registro;
}

function dirDatos() {
  return '<div class="grid gap-4 md:grid-cols-2"><div class="card p-5"><h2 class="font-extrabold">Copia de seguridad</h2><p class="text-sm text-gray-600 mt-1">Esta versión guarda los datos en este navegador. Exporta la base de datos para archivarla o trasladarla (incluye hashes PBKDF2, nunca contraseñas en claro).</p>' +
    '<div class="flex flex-wrap gap-2 mt-3"><button class="btn btn-primary" data-act="exportar-db">Exportar base de datos</button>' +
    '<label class="btn btn-ghost cursor-pointer">Importar copia<input type="file" accept="application/json" data-act-change="importar-db" class="hidden"></label></div></div>' +
    '<div class="card p-5"><h2 class="font-extrabold">Restablecer</h2><p class="text-sm text-gray-600 mt-1">Borra alumnado, entregas, códigos, títulos y certificados de este navegador. Mantiene la cuenta de Dirección.</p><button class="btn btn-danger mt-3" data-act="reset-db">Restablecer datos</button></div>' +
    '<div class="card p-5 md:col-span-2"><h2 class="font-extrabold mb-2">Registro de auditoría (últimos 60 eventos)</h2>' +
    (db.audit.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Acción</th><th>Usuario</th></tr></thead><tbody>' + db.audit.slice(0, 60).map(a => '<tr><td class="whitespace-nowrap">' + fmtFecha(a.fecha, true) + '</td><td>' + esc(a.accion) + '</td><td>' + esc(a.email || '—') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="text-sm text-gray-500">Sin eventos.</p>') +
    '</div></div>';
}

async function codigoVerificacion(partes) {
  return (await sha256Hex(partes.join('|'))).slice(0, 16).toUpperCase().match(/.{4}/g).join('-');
}

async function emitirTitulo(email) {
  const a = db.users[email];
  const sit = a && situacionAcademica(a);
  if (!a || a.titulo || !sit.completo || sit.notaFinal == null) { toast('No se cumplen los requisitos para expedir el diploma.', 'bad'); return; }
  const año = new Date().getFullYear();
  const secuencia = db.titulos.filter(x => x.numero.indexOf('MIA-JRO-' + año) === 0).length + 1;
  const numero = 'MIA-JRO-' + año + '-' + String(secuencia).padStart(4, '0');
  const fecha = new Date().toISOString();
  const verificacion = await codigoVerificacion([numero, a.dni, sit.notaFinal, fecha]);
  const modulosSup = sit.modulos.map(r => ({ cod: r.modulo.cod, nombre: r.modulo.nombre, horas: r.modulo.horas, nota: r.nota }));
  a.titulo = { numero, fecha, nota: sit.notaFinal, distincion: sit.distincion, verificacion, media: sit.media, pfm: sit.pfm, modulos: modulosSup, pfmTitulo: (a.pfm || {}).titulo || '' };
  db.titulos.push({ numero, email, nombre: a.nombre, dni: a.dni, fecha, nota: sit.notaFinal, distincion: sit.distincion, verificacion, edicion: EDICION.periodo });
  registrarAuditoria('Expedición del diploma ' + numero, email);
  guardar();
  toast('Diploma ' + numero + ' expedido e inscrito en el libro de registro.');
  ir('diploma/' + encodeURIComponent(email));
}

async function emitirCertificado(email) {
  const a = db.users[email];
  if (!a || a.titulo) return;
  const sit = situacionAcademica(a);
  const aprobados = sit.modulos.filter(r => r.estado === 'aprobado');
  if (!aprobados.length) { toast('No hay módulos superados.', 'bad'); return; }
  const fecha = new Date().toISOString();
  const numero = 'CAP-JRO-' + new Date().getFullYear() + '-' + String(db.certificados.length + 1).padStart(4, '0');
  a.certificado = { numero, fecha, verificacion: await codigoVerificacion([numero, a.dni, fecha]),
    modulos: aprobados.map(r => ({ cod: r.modulo.cod, nombre: r.modulo.nombre, horas: r.modulo.horas, nota: r.nota, contenidos: r.modulo.contenidos })) };
  db.certificados.push({ numero, email, nombre: a.nombre, dni: a.dni, fecha, verificacion: a.certificado.verificacion, horas: aprobados.reduce((s, r) => s + r.modulo.horas, 0) });
  registrarAuditoria('Certificado de aprovechamiento ' + numero, email);
  guardar();
  ir('certificado/' + encodeURIComponent(email));
}
