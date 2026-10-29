/* =====================================================================
 *  Vistas del alumnado: cabecera, menú, panel, programa, sesiones y expediente
 * ===================================================================== */

function cabecera(u) {
  return '<header class="sticky top-0 z-40 bg-white border-b no-print" style="border-color:var(--line);height:64px">' +
    '<div class="h-full px-4 flex items-center gap-3">' +
    '<button class="btn btn-ghost btn-sm lg:hidden" data-act="toggle-side" aria-label="Abrir menú de módulos">☰</button>' +
    '<a href="#/inicio" class="flex items-center gap-3 no-underline min-w-0" aria-label="Inicio">' + logoCompleto(34) + '</a>' +
    '<span class="hidden md:block w-px h-8 bg-gray-200 mx-1"></span>' +
    '<div class="hidden md:flex flex-col min-w-0"><span class="text-xs font-bold truncate">' + TITULO_CORTO + '</span>' +
    '<span class="text-[.68rem] text-gray-500 truncate">' + MENCION_LEGAL + ' · ' + EDICION.nombre + ' (' + EDICION.periodo + ')</span></div>' +
    '<div class="ml-auto flex items-center gap-2">' +
    (esDirector(u) ? '<a class="btn btn-dark btn-sm hidden sm:inline-flex" href="#/direccion/admisiones">Panel de Dirección</a>' : '') +
    '<a class="btn btn-ghost btn-sm" href="#/perfil" title="Mi expediente">' +
    '<span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style="background:#efcd2f;color:#111">' + esc(u.nombre.charAt(0).toUpperCase()) + '</span>' +
    '<span class="hidden sm:inline max-w-[140px] truncate">' + esc(u.nombre.split(' ')[0]) + '</span></a>' +
    '<button class="btn btn-ghost btn-sm" data-act="logout">Salir</button>' +
    '</div></div></header>';
}

function barraLateral(u, actual) {
  let html = '<nav class="sidebar p-3 no-print' + (ui.sideAbierta ? ' open' : '') + '" aria-label="Módulos y sesiones">';
  html += '<a class="side-link' + (actual === 'inicio' ? ' active' : '') + '" href="#/inicio"><span class="snum">⌂</span>Mi panel</a>';
  html += '<a class="side-link' + (actual === 'programa' ? ' active' : '') + '" href="#/programa"><span class="snum">▦</span>Programa y calendario</a>';
  html += '<div class="mt-3 mb-1 px-2 text-[.68rem] font-bold uppercase tracking-widest text-gray-500">300 h · 7 módulos · Proyecto Final</div>';
  MODULOS.forEach(m => {
    const cerrado = ui.modsCerrados.has(m.id);
    html += '<div class="mb-1"><button class="mod-btn" data-act="toggle-mod" data-m="' + m.id + '" aria-expanded="' + !cerrado + '">' +
      '<span class="mod-dot" style="background:' + colorMod(m) + '"></span><span class="flex-1">' + esc(etiquetaMod(m)) + '</span>' +
      (m.horas ? '<span class="text-[.65rem] text-gray-400 normal-case font-semibold">' + m.horas + ' h</span>' : '') +
      '<span class="text-gray-400 ml-1">' + (cerrado ? '+' : '–') + '</span></button>';
    if (!cerrado) {
      html += '<div class="pl-2 border-l-2 ml-3" style="border-color:' + colorMod(m) + '">';
      sesionesDe(m).forEach(s => {
        const ok = puedeAcceder(u, s.n);
        const hecho = u.progreso && u.progreso[s.n];
        html += '<a class="side-link' + (actual === 's' + s.n ? ' active' : '') + (ok ? '' : ' locked') + '" href="#/sesion/' + s.n + '/teoria" title="' + esc(s.titulo) + '">' +
          '<span class="snum">' + (hecho ? '✓' : s.n) + '</span><span class="truncate">' + esc(s.corto) + '</span>' + (ok ? '' : '<span class="ml-auto text-xs">🔒</span>') + '</a>';
      });
      html += '</div>';
    }
    html += '</div>';
  });
  html += '<div class="mt-4 pt-3 border-t" style="border-color:var(--line)">' +
    '<a class="side-link' + (actual === 'perfil' ? ' active' : '') + '" href="#/perfil"><span class="snum">◉</span>Mi expediente y derechos</a>' +
    (esDirector(u) ? '<a class="side-link' + (actual === 'direccion' ? ' active' : '') + '" href="#/direccion/admisiones"><span class="snum" style="background:#efcd2f">★</span>Panel de Dirección</a>' : '') +
    '</div></nav>';
  return html;
}

/* ---------- Calendario: semana actual y próximos hitos ---------- */
function eventosEdicion() {
  const ev = [];
  SEMINARIOS.forEach(s => ev.push({ fecha: s.fecha, tipo: 'Seminario online', texto: s.titulo + ' · jueves 18:00–20:00' }));
  JORNADAS.forEach(j => ev.push({ fecha: j.fecha, tipo: 'Jornada presencial ' + j.id, texto: j.contenido + ' · sábado 9:30–14:30' }));
  ev.push({ fecha: '2029-12-03', tipo: 'Proyecto Final', texto: 'Propuesta y asignación de tutor' });
  ev.push({ fecha: '2029-12-17', tipo: 'Proyecto Final', texto: 'Anteproyecto aprobado' });
  ev.push({ fecha: '2030-01-14', tipo: 'Proyecto Final', texto: 'Revisión intermedia (demo con el tutor)' });
  ev.push({ fecha: '2030-01-23', tipo: 'Proyecto Final', texto: 'Entrega de memoria y producto' });
  return ev.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
function semanaActual() {
  const hoy = hoyIso();
  if (hoy < EDICION.inicio) return { estado: 'antes' };
  if (hoy > EDICION.fin) return { estado: 'despues' };
  let actual = CALENDARIO[0];
  CALENDARIO.forEach(w => { if (w.del <= hoy) actual = w; });
  return { estado: 'durante', semana: actual };
}

function vistaInicio(u) {
  const hechas = progresoDe(u);
  const pct = Math.round(hechas / TOTAL_SESIONES * 100);
  let siguiente = 0;
  for (const s of SESIONES) { if (!(u.progreso && u.progreso[s.n])) { siguiente = s.n; break; } }
  const sig = sesion(siguiente);
  let aviso = '';
  if (!esDirector(u) && u.estado === 'pendiente') {
    aviso = '<div class="card p-4 mb-5" style="border-left:5px solid #efcd2f"><strong>Matrícula pendiente de validación.</strong> Secretaría está comprobando tus requisitos' + (u.via && u.via !== 'DAM' ? ' y la coordinación te citará para la entrevista' : '') + '. Mientras tanto tienes acceso a la acogida y a M1.</div>';
  }
  if (u.titulo) {
    aviso += '<div class="card p-4 mb-5 flex flex-wrap items-center gap-3" style="border-left:5px solid #efcd2f"><span class="badge-master">Diploma expedido</span><span>Tu diploma nº <strong>' + esc(u.titulo.numero) + '</strong> está disponible.</span><a class="btn btn-primary btn-sm ml-auto" href="#/diploma/' + encodeURIComponent(u.email) + '">Ver diploma</a></div>';
  }
  const sa = semanaActual();
  const hoy = hoyIso();
  const proximos = eventosEdicion().filter(e => e.fecha >= (sa.estado === 'antes' ? EDICION.inicio : hoy)).slice(0, 4);
  const estadoEdicion = sa.estado === 'antes'
    ? 'La ' + EDICION.nombre + ' empieza el <strong>' + fmtFecha(EDICION.inicio) + '</strong>. Ya puedes preparar el entorno con la acogida.'
    : sa.estado === 'despues' ? 'La ' + EDICION.nombre + ' terminó el ' + fmtFecha(EDICION.fin) + '.'
    : 'Semana <strong>' + esc(sa.semana.sem) + '</strong>: ' + esc(sa.semana.actividad) + (sa.semana.hito ? ' · <em>' + esc(sa.semana.hito) + '</em>' : '');

  const cards = MODULOS.map(m => {
    const ses = sesionesDe(m);
    const h = ses.filter(s => u.progreso && u.progreso[s.n]).length;
    return '<a href="#/sesion/' + m.sesiones[0] + '/teoria" class="card p-5 block no-underline hover:shadow-md transition-shadow" style="border-top:6px solid ' + colorMod(m) + '">' +
      '<div class="flex items-center justify-between gap-2"><span class="chip ' + chipMod(m) + '">' + esc(m.cod) + '</span><span class="text-xs text-gray-500">' + (m.horas ? m.horas + ' h · ' : '') + 'sem. ' + esc(m.semanas) + '</span></div>' +
      '<h3 class="font-bold mt-3 leading-snug">' + esc(m.nombre) + '</h3>' +
      (m.proyecto ? '<p class="text-xs text-gray-600 mt-2"><strong>Proyecto:</strong> ' + esc(m.proyecto) + '</p>' : '') +
      '<div class="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden"><div class="h-full" style="width:' + Math.round(h / ses.length * 100) + '%;background:' + colorMod(m) + '"></div></div>' +
      '<div class="text-xs text-gray-500 mt-1">' + h + '/' + ses.length + ' sesiones completadas · ' + esc(m.fechas) + '</div></a>';
  }).join('');

  let resumen = '';
  if (!esDirector(u)) {
    const sit = situacionAcademica(u);
    resumen = '<div class="card p-5 mt-6"><div class="flex flex-wrap items-center justify-between gap-2"><h2 class="font-extrabold text-lg">Mi situación académica</h2><a class="btn btn-ghost btn-sm" href="#/perfil">Ver expediente</a></div>' +
      '<div class="grid sm:grid-cols-5 gap-3 mt-3">' +
      sit.requisitos.map(r => '<div class="rounded-lg p-3" style="background:' + (r.ok ? '#e3efe9' : '#FAF9F5') + '"><div class="text-xs text-gray-600">' + esc(r.texto) + '</div><div class="font-extrabold mt-1">' + (r.ok ? '✓ ' : '') + esc(r.detalle) + '</div></div>').join('') +
      '</div></div>';
  }

  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' + aviso +
    '<div class="card p-6 sm:p-8 relative overflow-hidden" style="background:#111;color:#fff;border-color:#111">' +
    '<div style="position:absolute;right:-50px;top:-50px;opacity:.07">' + isotipo(260, '#FFFFFF', '#111111') + '</div>' +
    '<span class="badge-master">' + MENCION_LEGAL + '</span>' +
    '<h1 class="text-2xl sm:text-3xl font-extrabold mt-3">Hola, ' + esc(u.nombre.split(' ')[0]) + '</h1>' +
    '<p class="text-white/70 mt-1 max-w-3xl">' + TITULO_MASTER + '</p>' +
    '<p class="text-sm mt-3 text-white/85">' + estadoEdicion + '</p>' +
    '<div class="mt-6 grid sm:grid-cols-[1fr_auto] gap-4 items-end">' +
    '<div><div class="flex justify-between text-sm mb-1"><span>Progreso en la plataforma</span><span class="font-bold">' + hechas + '/' + TOTAL_SESIONES + ' · ' + pct + ' %</span></div>' +
    '<div class="h-3 rounded-full bg-white/15 overflow-hidden"><div class="h-full" style="width:' + pct + '%;background:#efcd2f"></div></div></div>' +
    '<a class="btn btn-primary" href="#/sesion/' + siguiente + '/teoria">Continuar · Sesión ' + siguiente + '</a></div>' +
    (sig ? '<p class="text-sm text-white/60 mt-3">Siguiente: ' + esc(sig.titulo) + '</p>' : '') +
    '</div>' +
    resumen +
    '<div class="grid lg:grid-cols-[2fr_1fr] gap-6 mt-8">' +
    '<div><h2 class="text-lg font-extrabold mb-3">Itinerario: 15 semanas, de los fundamentos a la app en producción</h2>' +
    '<div class="grid sm:grid-cols-2 gap-4">' + cards + '</div></div>' +
    '<div><h2 class="text-lg font-extrabold mb-3">Próximos hitos</h2><div class="card divide-y" style="--tw-divide-opacity:1">' +
    proximos.map(e => '<div class="p-4"><div class="text-xs font-bold uppercase tracking-wide" style="color:#8a7408">' + esc(e.tipo) + '</div><div class="font-semibold mt-0.5">' + fmtFechaCorta(e.fecha) + '</div><div class="text-sm text-gray-600">' + esc(e.texto) + '</div></div>').join('') +
    '</div>' +
    '<div class="card p-4 mt-4 text-sm"><div class="font-bold mb-1">Cómo se cursa</div><ul class="space-y-1 text-gray-700"><li>· Unas 20 h semanales en la plataforma.</li><li>· Tutor asignado: foro en menos de 48 h.</li><li>· Tutoría grupal online semanal (1 h, grabada).</li><li>· Dirección: <a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a></li></ul></div>' +
    '</div></div></div>';
}

/* ---------- Programa y calendario (ficha del programa) ---------- */
function vistaPrograma() {
  const ficha = [
    ['Denominación', TITULO_MASTER],
    ['Tipo de título', 'Título propio del ' + CENTRO + '. Formación no reglada, <strong>sin carácter oficial</strong>. No es un Máster Universitario ni un Máster de Formación Profesional.'],
    ['Destinatarios', 'Titulados en Desarrollo de Aplicaciones Multiplataforma (DAM). Otras vías (DAW, ASIR, titulados universitarios en Informática o afines), en plazas libres, previa entrevista y superación del módulo de nivelación.'],
    ['Duración', '300 horas en 15 semanas: 240 de módulos y seminarios + 60 del Proyecto Final de Máster'],
    ['Calendario', EDICION.nombre + ': del ' + fmtFecha(EDICION.inicio) + ' al ' + fmtFecha(EDICION.fin) + ' · 15 semanas lectivas y vacaciones de Navidad'],
    ['Modalidad', 'Semipresencial intensiva: trabajo autónomo guiado en la plataforma (unas 20 h semanales), tutor asignado y tutoría grupal online semanal. Presencial: tres sábados (9:30–14:30)'],
    ['Plazas', 'Hasta ' + EDICION.plazas + ' por grupo'],
    ['Precio', 'Gratuito para el alumnado que se matricule en DAM en el centro y titule según las bases de la promoción. Alumnado externo: ' + EDICION.precio.general.toLocaleString('es-ES') + ' € de tarifa general; ' + EDICION.precio.prontoPago.toLocaleString('es-ES') + ' € con pronto pago o ' + EDICION.precio.cuotas],
    ['Idioma', 'Castellano; documentación técnica y herramientas en inglés'],
    ['Certificación incluida', 'Un examen de certificación de IA de un proveedor cloud (Microsoft, AWS o Google), elegido cada edición. El centro cubre el primer intento.']
  ];
  const estructura = MODULOS.filter(m => m.id !== 'ACO').map(m => [
    '<strong>' + esc(m.cod) + '</strong>', '<a class="underline-offset-2 hover:underline font-semibold" href="#/sesion/' + m.sesiones[0] + '/teoria">' + esc(m.nombre) + '</a>', String(m.horas), esc(m.semanas), esc(m.fechas)]);
  estructura.splice(7, 0, ['<strong>SEM</strong>', 'Seminarios online con empresa (5 × 2 h)', '10', '2, 4, 6, 9, 11', 'Jueves, 18:00 – 20:00']);
  estructura.push(['', '<strong>Total</strong>', '<strong>300</strong>', '<strong>15</strong>', '']);

  const sec = (titulo, html) => '<section class="mt-8"><h2 class="text-xl font-extrabold mb-3">' + titulo + '</h2>' + html + '</section>';
  const sesionesTabla = SESIONES.map(s => {
    const m = moduloDe(s.n);
    return '<tr><td><span class="snum" style="background:' + colorMod(m) + '">' + s.n + '</span></td><td><span class="chip ' + chipMod(m) + '">' + esc(m.cod) + '</span></td><td class="whitespace-nowrap">' + esc(s.semana) + '</td>' +
      '<td><a class="font-semibold hover:underline" href="#/sesion/' + s.n + '/teoria">' + esc(s.titulo) + '</a></td>' +
      '<td>' + s.stack.map(t => '<span class="chip mr-1 mb-1">' + esc(t) + '</span>').join('') + '</td></tr>';
  }).join('');

  return '<div class="max-w-6xl mx-auto p-4 sm:p-8"><span class="badge-master">' + MENCION_LEGAL + '</span>' +
    '<h1 class="text-2xl font-extrabold mt-2">' + TITULO_MASTER + '</h1>' +
    '<p class="text-gray-600 mt-1">' + EDICION.nombre + ' · ' + EDICION.periodo + ' · ' + EDICION.modalidad + '</p>' +
    sec('Ficha del programa', '<div class="tbl-wrap"><table class="tbl"><tbody>' + ficha.map(f => '<tr><th style="width:24%">' + f[0] + '</th><td>' + f[1] + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="card p-4 mt-3 text-sm" style="border-left:5px solid #a9cabb"><strong>Por qué es un título propio y no oficial.</strong> El centro diseña, imparte y certifica el programa con libertad para actualizarlo cada año al ritmo de la IA. A cambio, el diploma no tiene validez académica oficial: su valor está en los proyectos del portfolio, la certificación de la industria incluida y la participación de empresas.</div>') +
    sec('Estructura y carga lectiva', tablaHTML({ head: ['Cód.', 'Módulo', 'Horas', 'Semanas', 'Fechas'], rows: estructura })) +
    sec('Sesiones de la plataforma', '<p class="text-sm text-gray-600 mb-3">Cada sesión tiene las mismas cinco pestañas: Teoría · Taller paso a paso · Biblioteca de Prompts · Actividad práctica · Preguntas frecuentes.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nº</th><th>Módulo</th><th>Semana</th><th>Sesión</th><th>Stack</th></tr></thead><tbody>' + sesionesTabla + '</tbody></table></div>') +
    sec('Calendario semana a semana', tablaHTML({ head: ['Sem.', 'Semana del', 'Módulo o actividad', 'Hito'], rows: CALENDARIO.map(w => [esc(w.sem), fmtFecha(w.del), w.sem === '—' ? '<em>' + esc(w.actividad) + '</em>' : esc(w.actividad), w.hito.indexOf('jornada presencial') >= 0 ? '<strong>' + esc(w.hito) + '</strong>' : esc(w.hito)]) })) +
    sec('Jornadas presenciales (asistencia obligatoria)', tablaHTML({ head: ['Jornada', 'Fecha', 'Contenido'], rows: JORNADAS.map(j => [String(j.id), 'Sábado ' + fmtFecha(j.fecha) + ', 9:30 – 14:30', esc(j.contenido)]) }) +
      '<p class="text-xs text-gray-500 mt-2">Quien no pueda asistir por causa justificada hace el examen en la jornada siguiente o en la final del 26 de enero. Las sesiones online en directo se graban.</p>') +
    sec('Seminarios online con empresa', tablaHTML({ head: ['Semana', 'Fecha', 'Seminario'], rows: SEMINARIOS.map(s => [String(s.semana), 'Jueves ' + fmtFecha(s.fecha) + ', 18:00 – 20:00', esc(s.titulo)]) })) +
    sec('Evaluación y requisitos para obtener el título', tablaHTML({ cap: 'Evaluación de cada módulo (0 a 10, se supera con 5)', head: ['Instrumento', 'Peso', 'Qué se valora'], rows: [
      ['Proyecto del módulo', '50 %', 'Funcionamiento, calidad técnica, documentación y vídeo de defensa (5 min)'],
      ['Examen presencial', '40 %', 'Prueba práctica individual en la jornada presencial del trimestre, sin ayuda externa salvo la permitida. Mínimo de 4 para hacer media'],
      ['Entregas semanales', '10 %', 'Ejercicios de la plataforma y participación en el foro y las tutorías']] }) +
      '<div class="card p-4 mt-4 prose-jro text-sm"><p>Quien no supere un módulo puede recuperarlo una vez: nueva versión del proyecto en la semana 14 y examen de recuperación presencial el 26 de enero.</p><p><strong>Requisitos del título:</strong></p><ul><li>Asistir a las tres jornadas presenciales y aprobar sus exámenes.</li><li>Entregar al menos el 80 % de las actividades semanales y superar todos los módulos (M1–M7).</li><li>Asistir al menos a 4 de los 5 seminarios online (en directo o viendo la grabación con su cuestionario).</li><li>Obtener la calificación de apto en el Proyecto Final de Máster.</li></ul><p><strong>Nota final</strong> = 70 % media de los módulos ponderada por horas + 30 % nota del Proyecto Final. Con una nota final igual o superior a 9 se concede la mención «con distinción». Quien no complete el programa recibe un <strong>certificado de aprovechamiento</strong> de los módulos superados, con sus horas y contenidos.</p></div>') +
    sec('Proyecto Final de Máster (60 h)', tablaHTML({ head: ['Criterio del tribunal', 'Peso'], rows: EVALUACION.tribunalPFM.map(t => [t[1], Math.round(t[2] * 100) + ' %']) }) +
      '<p class="text-sm text-gray-600 mt-2">Tribunal: coordinación académica, un docente del programa y un profesional de una empresa colaboradora. Individual o en parejas. Detalle de hitos en las <a class="underline" href="#/sesion/15/teoria">Sesiones 15 a 17</a>.</p>') +
    '</div>';
}

/* ---------- Sesión con la barra de 5 pestañas ---------- */
function vistaSesion(u, n, tab) {
  const s = sesion(n);
  if (!s) return '<div class="p-8">Sesión no encontrada.</div>';
  const m = moduloDe(n);
  if (!puedeAcceder(u, n)) {
    return '<div class="max-w-3xl mx-auto p-8"><div class="card p-8 text-center"><div class="text-4xl">🔒</div><h1 class="text-xl font-extrabold mt-3">Sesión ' + n + ' bloqueada</h1><p class="text-gray-600 mt-2">Tu matrícula está pendiente de validación. Mientras tanto puedes cursar la acogida y M1.</p><a class="btn btn-primary mt-5" href="#/sesion/0/teoria">Ir a la acogida</a></div></div>';
  }
  if (!TABS.some(t => t[0] === tab)) tab = 'teoria';
  const hecho = u.progreso && u.progreso[n];
  const prev = n > 0 ? '<a class="btn btn-ghost btn-sm" href="#/sesion/' + (n - 1) + '/' + tab + '">← Sesión ' + (n - 1) + '</a>' : '';
  const next = n < ULTIMA_SESION ? '<a class="btn btn-ghost btn-sm" href="#/sesion/' + (n + 1) + '/' + tab + '">Sesión ' + (n + 1) + ' →</a>' : '';

  let cuerpo = '';
  if (tab === 'teoria') cuerpo = tabTeoria(s);
  else if (tab === 'taller') cuerpo = tabTaller(s);
  else if (tab === 'prompts') cuerpo = tabPrompts(s);
  else if (tab === 'actividad') cuerpo = tabActividad(u, s);
  else cuerpo = tabFaq(s);

  const tipoAct = { semanal: 'Entrega semanal', proyecto: 'Proyecto del módulo', pfm: 'Hito del Proyecto Final' }[s.actividad.tipo];
  return '<div class="max-w-5xl mx-auto p-4 sm:p-8">' +
    '<div class="card overflow-hidden"><div style="height:8px;background:' + colorMod(m) + '"></div><div class="p-5 sm:p-7">' +
    '<div class="flex flex-wrap items-center gap-2"><span class="chip ' + chipMod(m) + '">' + esc(etiquetaMod(m)) + '</span><span class="chip chip-gold">Sesión ' + n + '</span>' +
    '<span class="chip">Semana ' + esc(s.semana) + ' · ' + esc(s.fechas) + '</span><span class="chip">' + esc(tipoAct) + '</span></div>' +
    '<h1 class="text-2xl sm:text-[1.7rem] font-extrabold leading-tight mt-3">' + esc(s.titulo) + '</h1>' +
    '<p class="text-gray-600 mt-2">' + s.resumen + '</p>' +
    '<div class="flex flex-wrap gap-1.5 mt-4">' + s.stack.map(t => '<span class="chip">' + esc(t) + '</span>').join('') + '</div>' +
    '<div class="flex flex-wrap items-center gap-2 mt-5">' +
    '<button class="btn ' + (hecho ? 'btn-ghost' : 'btn-primary') + ' btn-sm" data-act="toggle-hecho" data-n="' + n + '">' + (hecho ? '✓ Sesión completada (desmarcar)' : 'Marcar sesión como completada') + '</button>' +
    '<span class="ml-auto flex gap-2">' + prev + next + '</span></div>' +
    '</div>' +
    '<div class="px-3 sm:px-5"><div class="tabs" role="tablist" aria-label="Secciones de la sesión">' +
    TABS.map(t => '<a class="tab no-underline" role="tab" aria-selected="' + (t[0] === tab) + '" href="#/sesion/' + n + '/' + t[0] + '">' + t[1] + '</a>').join('') +
    '</div></div></div>' +
    '<section class="mt-5" role="tabpanel">' + cuerpo + '</section></div>';
}

function tabTeoria(s) {
  const t = s.teoria;
  return '<div class="card p-5 sm:p-7 prose-jro">' +
    '<p class="text-[1.02rem]">' + t.intro + '</p>' +
    t.bloques.map(b => '<h3 class="font-extrabold text-lg mt-6 mb-1">' + b[0] + '</h3><div>' + b[1] + '</div>').join('') +
    (t.formula ? '<div class="mt-5 p-4 rounded-xl font-mono text-sm" style="background:#FAF9F5;border:1px dashed #c9c4b4">' + t.formula + '</div>' : '') +
    flujoHTML(t.flujo, t.flujoTitulo) +
    tablaHTML(t.tabla) +
    (t.claves ? '<div class="mt-6 p-4 rounded-xl" style="background:#fdf6d3"><div class="font-bold text-sm mb-1">Ideas clave</div><ul>' + t.claves.map(k => '<li>' + k + '</li>').join('') + '</ul></div>' : '') +
    '</div>';
}

function tabTaller(s) {
  const t = s.taller;
  return '<div class="card p-5 sm:p-7"><div class="flex flex-wrap gap-2 mb-4"><span class="chip chip-gold">Entorno</span><span class="text-sm">' + t.entorno + '</span></div>' +
    t.pasos.map((p, i) => '<div class="mt-6"><div class="flex items-start gap-3"><span class="snum" style="background:#111;color:#efcd2f">' + (i + 1) + '</span><div class="min-w-0 flex-1"><h3 class="font-extrabold">' + p.t + '</h3>' +
      (p.d ? '<p class="text-sm text-gray-700 mt-1 prose-jro">' + p.d + '</p>' : '') +
      (p.code ? bloqueCodigo(p.code, p.lang, p.file || p.lang) : '') + '</div></div></div>').join('') +
    '</div>';
}

function tabPrompts(s) {
  return '<div class="grid gap-4">' + s.prompts.map(p =>
    '<div class="card p-5"><div class="flex flex-wrap items-center gap-2"><span class="chip chip-gold">' + esc(p.tipo) + '</span><h3 class="font-extrabold">' + p.t + '</h3></div>' +
    (p.d ? '<p class="text-sm text-gray-600 mt-1">' + p.d + '</p>' : '') + bloqueCodigo(p.code, p.lang || 'markdown', p.file || p.tipo) + '</div>').join('') + '</div>';
}

const HITOS_PFM = { propuesta: 'Propuesta (semana 10)', anteproyecto: 'Anteproyecto (semana 12)', intermedia: 'Revisión intermedia (semana 14)', final: 'Entrega final (23 de enero)' };
function hitosDeSesion(n) {
  return { 15: ['propuesta', 'anteproyecto'], 16: ['intermedia'], 17: ['final'] }[n] || [];
}

function tabActividad(u, s) {
  const a = s.actividad;
  const mias = db.entregas.filter(e => e.email === u.email && e.sesion === s.n).sort((x, y) => y.fecha.localeCompare(x.fecha));
  const etiqueta = { semanal: 'Entrega semanal · 10 % del módulo', proyecto: 'Proyecto del módulo · 50 % del módulo', pfm: 'Proyecto Final de Máster' }[a.tipo];
  let entregaHTML = '';
  if (esDirector(u)) {
    const n = db.entregas.filter(e => e.sesion === s.n).length;
    entregaHTML = '<div class="card p-5 mt-4"><strong>Vista de Dirección.</strong> Esta actividad tiene ' + n + ' entrega(s). <a class="underline" href="#/direccion/calificaciones">Ir a calificaciones</a>.</div>';
  } else {
    const hitos = hitosDeSesion(s.n);
    entregaHTML = '<div class="card p-5 sm:p-6 mt-4"><h3 class="font-extrabold text-lg">' + (a.tipo === 'pfm' ? 'Registrar hito del Proyecto Final' : 'Entregar repositorio') + '</h3>' +
      '<p class="text-sm text-gray-600">Tu tutor corregirá la entrega y la validará la Dirección del Máster. Una nueva entrega sustituye a la anterior (recuperación: nueva versión en la semana 14).</p>' +
      '<form data-form="entrega" data-n="' + s.n + '" data-tipo="' + a.tipo + '" class="grid sm:grid-cols-2 gap-4 mt-4" novalidate>' +
      (hitos.length ? '<div class="field sm:col-span-2"><label for="e-hito">Hito</label><select id="e-hito" name="hito">' + hitos.map(h => '<option value="' + h + '">' + HITOS_PFM[h] + '</option>').join('') + '</select></div>' : '') +
      '<div class="field sm:col-span-2"><label for="e-repo">URL del repositorio (https)</label><input id="e-repo" name="repo" type="url" required placeholder="https://github.com/usuario/proyecto"></div>' +
      (a.tipo !== 'semanal' ? '<div class="field"><label for="e-video">' + (a.tipo === 'proyecto' ? 'Vídeo de defensa (5 min)' : 'Producto desplegado o demo') + '</label><input id="e-video" name="video" type="url" placeholder="https://…"></div>' : '') +
      '<div class="field"><label for="e-commit">Rama o commit a evaluar</label><input id="e-commit" name="commit" placeholder="main · a1b2c3d" maxlength="80"></div>' +
      '<div class="field sm:col-span-2"><label for="e-notas">Notas para el tutor</label><textarea id="e-notas" name="notas" rows="3" maxlength="2000" placeholder="Cómo ejecutarlo, decisiones, limitaciones y uso de asistentes de IA…"></textarea></div>' +
      '<label class="check sm:col-span-2"><input type="checkbox" name="limpio"> <span>Declaro que la entrega es mía (o de mi pareja de proyecto), que documenta el uso de asistentes de IA, que <strong>no contiene secretos</strong> ni <strong>datos personales sin anonimizar</strong> y que respeta las licencias de modelos, datos y código.</span></label>' +
      '<div class="sm:col-span-2 text-sm" style="color:#9b2c13" id="entrega-err"></div>' +
      '<div class="sm:col-span-2"><button class="btn btn-primary" type="submit">Registrar entrega</button></div></form>' +
      (mias.length ? '<h4 class="font-bold mt-6 mb-2">Mis entregas</h4>' + mias.map(e =>
        '<div class="rounded-lg border p-3 mb-2 text-sm" style="border-color:var(--line)"><div class="flex flex-wrap gap-2 items-center">' + (e.hito ? '<span class="chip">' + esc(HITOS_PFM[e.hito] || e.hito) + '</span>' : '') + '<a class="underline font-semibold break-all" href="' + esc(e.repo) + '" target="_blank" rel="noopener noreferrer">' + esc(e.repo) + '</a><span class="text-gray-500">' + fmtFecha(e.fecha, true) + '</span>' +
        (e.estado === 'evaluada' ? '<span class="chip chip-gold ml-auto">' + (e.tipo === 'pfm' ? 'Revisada' : 'Nota ' + fmtNota(e.nota)) + '</span>' : '<span class="chip ml-auto">Pendiente de corrección</span>') + '</div>' +
        (e.feedback ? '<div class="mt-2 p-2 rounded" style="background:#FAF9F5"><strong>Feedback:</strong> ' + esc(e.feedback) + '</div>' : '') + '</div>').join('') : '') +
      '</div>';
  }
  return '<div class="card p-5 sm:p-7 prose-jro"><span class="chip chip-gold">' + etiqueta + '</span>' +
    '<h2 class="text-xl font-extrabold mt-2">' + a.titulo + '</h2><p>' + a.contexto + '</p>' +
    '<div class="grid md:grid-cols-2 gap-5 mt-4"><div><h3 class="font-bold">Requisitos</h3><ul>' + a.requisitos.map(r => '<li>' + r + '</li>').join('') + '</ul></div>' +
    '<div><h3 class="font-bold">Entregables</h3><ul>' + a.entregables.map(r => '<li>' + r + '</li>').join('') + '</ul></div></div>' +
    tablaHTML({ cap: a.tipo === 'pfm' && s.n === 17 ? 'Criterios del tribunal' : 'Rúbrica', head: ['Criterio', 'Peso'], rows: a.rubrica.map(r => [r[0], r[1] + ' %']) }) +
    '</div>' + entregaHTML;
}

function tabFaq(s) {
  return '<div class="grid gap-3">' + s.faq.map((f, i) =>
    '<details class="card p-0 overflow-hidden"' + (i === 0 ? ' open' : '') + '><summary class="cursor-pointer p-4 font-bold flex gap-3"><span class="text-jro-gold-deep">P' + (i + 1) + '</span><span>' + f[0] + '</span></summary>' +
    '<div class="px-4 pb-4 prose-jro text-sm">' + f[1] + '</div></details>').join('') + '</div>';
}

function onEntrega(f) {
  const u = usuarioActual();
  const err = $('#entrega-err');
  const repo = f.repo.value.trim();
  const video = f.video ? f.video.value.trim() : '';
  if (!isHttpsUrl(repo)) { err.textContent = 'Introduce una URL https:// válida al repositorio.'; return; }
  if (video && !isHttpsUrl(video)) { err.textContent = 'El enlace del vídeo o del producto debe ser https://.'; return; }
  if (f.dataset.tipo === 'proyecto' && !video) { err.textContent = 'El proyecto del módulo incluye un vídeo de defensa de 5 minutos.'; return; }
  if (!f.limpio.checked) { err.textContent = 'Debes confirmar la declaración de autoría, uso de IA, secretos y datos personales.'; return; }
  const n = Number(f.dataset.n);
  db.entregas.push({
    id: uid(), email: u.email, sesion: n, tipo: f.dataset.tipo, hito: f.hito ? f.hito.value : null,
    repo, video: video || null, commit: f.commit.value.trim(), notas: f.notas.value.trim(),
    fecha: new Date().toISOString(), estado: 'pendiente', nota: null, feedback: ''
  });
  registrarAuditoria('Entrega de la sesión ' + n + (f.hito ? ' (' + f.hito.value + ')' : ''), u.email);
  guardar();
  toast('Entrega registrada. Tu tutor la corregirá.');
  render();
}

/* ---------- Mi expediente ---------- */
function tablaSituacion(u, sit) {
  return '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Módulo</th><th>Horas</th><th>Proyecto (50 %)</th><th>Examen (40 %)</th><th>Entregas (10 %)</th><th>Nota</th><th>Estado</th></tr></thead><tbody>' +
    sit.modulos.map(r => '<tr><td><strong>' + esc(r.modulo.cod) + '</strong> · ' + esc(r.modulo.corto) + '</td><td>' + r.modulo.horas + '</td><td>' + fmtNota(r.proyecto) + '</td><td>' + fmtNota(r.examen) + (r.recuperacion ? ' <span class="chip">rec.</span>' : '') + '</td><td>' + fmtNota(r.entregas) + '</td><td><strong>' + fmtNota(r.nota) + '</strong></td>' +
      '<td><span class="chip ' + (r.estado === 'aprobado' ? 'chip-sage' : r.estado === 'suspenso' ? 'chip-terra' : '') + '">' + esc(r.estado) + '</span>' + (r.motivo ? '<div class="text-xs text-gray-500">' + esc(r.motivo) + '</div>' : '') + '</td></tr>').join('') +
    '<tr><td colspan="5"><strong>Media de módulos ponderada por horas</strong></td><td colspan="2"><strong>' + fmtNota(sit.media) + '</strong></td></tr>' +
    '<tr><td colspan="5"><strong>Proyecto Final de Máster</strong></td><td colspan="2"><strong>' + fmtNota(sit.pfm) + '</strong> · acta ' + esc(sit.acta) + '</td></tr>' +
    '<tr><td colspan="5"><strong>Nota final (70 % módulos + 30 % PFM)</strong></td><td colspan="2"><strong>' + fmtNota(sit.notaFinal) + '</strong>' + (sit.distincion ? ' · con distinción' : '') + '</td></tr>' +
    '</tbody></table></div>';
}

function vistaPerfil(u) {
  const año = new Date().getFullYear();
  let promos = '';
  for (let y = año + 4; y >= 2000; y--) promos += '<option value="' + y + '"' + (String(u.promocion) === String(y) ? ' selected' : '') + '>' + y + '</option>';
  const estadoTxt = { pendiente: 'Matrícula pendiente', admitido: 'Matriculado/a', rechazado: 'No admitido/a' }[u.estado] || u.estado;
  const pfm = u.pfm || {};

  let academico = '';
  if (!esDirector(u)) {
    const sit = situacionAcademica(u);
    academico = '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg mb-3">Situación académica</h2>' + tablaSituacion(u, sit) +
      '<h3 class="font-bold mt-5 mb-2">Requisitos del título</h3><ul class="text-sm space-y-1">' +
      sit.requisitos.map(r => '<li>' + (r.ok ? '✅' : '⬜') + ' ' + esc(r.texto) + ' <span class="text-gray-500">(' + esc(r.detalle) + ')</span></li>').join('') + '</ul>' +
      (u.titulo ? '<a class="btn btn-primary mt-4" href="#/diploma/' + encodeURIComponent(u.email) + '">Ver mi diploma y suplemento</a>' : '') +
      (u.certificado ? '<a class="btn btn-ghost mt-4 ml-2" href="#/certificado/' + encodeURIComponent(u.email) + '">Ver certificado de aprovechamiento</a>' : '') +
      '</div>' +
      '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Mi Proyecto Final de Máster</h2>' +
      (u.estado !== 'admitido' ? '<p class="text-sm text-gray-600 mt-1">Disponible cuando se valide tu matrícula.</p>' :
        '<p class="text-sm text-gray-600">Los hitos (propuesta, anteproyecto, revisión intermedia y entrega final) se registran en las Sesiones 15 a 17. Aquí mantienes los datos generales del proyecto.</p>' +
        '<form data-form="pfm" class="grid sm:grid-cols-2 gap-4 mt-3" novalidate>' +
        '<div class="field sm:col-span-2"><label for="t-titulo">Título del proyecto</label><input id="t-titulo" name="titulo" maxlength="160" value="' + esc(pfm.titulo || '') + '"></div>' +
        '<div class="field"><label for="t-empresa">Empresa colaboradora (si la hay)</label><input id="t-empresa" name="empresa" maxlength="90" value="' + esc(pfm.empresa || '') + '"></div>' +
        '<div class="field"><label for="t-pareja">Compañero/a (si es en pareja, su correo)</label><input id="t-pareja" name="pareja" type="email" maxlength="90" value="' + esc(pfm.pareja || '') + '"></div>' +
        '<div class="field sm:col-span-2"><label for="t-repo">Repositorio (https)</label><input id="t-repo" name="repo" type="url" value="' + esc(pfm.repo || '') + '"></div>' +
        '<div class="field sm:col-span-2"><label for="t-resumen">Resumen (problema, solución, módulos que integra)</label><textarea id="t-resumen" name="resumen" rows="3" maxlength="2000">' + esc(pfm.resumen || '') + '</textarea></div>' +
        '<div class="text-sm sm:col-span-2" style="color:#9b2c13" id="pfm-err"></div>' +
        '<div><button class="btn btn-ghost" type="submit">Guardar datos del proyecto</button></div></form>') +
      ((u.evaluacion.tribunal || {}).acta && u.evaluacion.tribunal.acta !== 'pendiente' ? '<div class="mt-4 p-3 rounded-lg" style="background:#FAF9F5"><strong>Acta del tribunal:</strong> ' + (u.evaluacion.tribunal.acta === 'apto' ? 'APTO' : 'NO APTO') + ' · ' + fmtNota(notaPFM(u)) + '</div>' : '') +
      '</div>';
  }

  const consent = u.consentimientos ? '<ul class="text-sm mt-2 space-y-1">' +
    '<li>Datos académicos (RGPD 6.1.a/b): aceptado el ' + fmtFecha(u.consentimientos.datos.fecha, true) + '</li>' +
    '<li>Compromiso ético de uso responsable de la IA: aceptado el ' + fmtFecha(u.consentimientos.etica.fecha, true) + '</li></ul>' : '';

  return '<div class="max-w-5xl mx-auto p-4 sm:p-8 grid gap-5">' +
    '<div><span class="badge-master">Mi expediente</span><h1 class="text-2xl font-extrabold mt-2">' + esc(u.nombre) + '</h1>' +
    '<p class="text-gray-600 text-sm">' + esc(u.email) + (esDirector(u) ? ' · Dirección del Máster' : ' · DNI/NIE ' + esc(enmascararDni(u.dni)) + ' · ' + esc(VIAS[u.via] || u.via) + ' (' + esc(u.promocion) + ') · ' + (u.plaza === 'externo' ? 'plaza externa' : 'alumnado del centro') + ' · ' + estadoTxt) + '</p></div>' +
    academico +
    '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Derecho de rectificación</h2>' +
    '<form data-form="rectificar" class="grid sm:grid-cols-2 gap-4 mt-3" novalidate>' +
    '<div class="field"><label for="p-nombre">Nombre y apellidos</label><input id="p-nombre" name="nombre" value="' + esc(u.nombre) + '" maxlength="90"' + (u.titulo ? ' disabled' : '') + '></div>' +
    (esDirector(u) ? '' : '<div class="field"><label for="p-promo">Año de titulación</label><select id="p-promo" name="promocion">' + promos + '</select></div>') +
    (u.titulo ? '<p class="text-xs text-gray-500 sm:col-span-2">Tu diploma ya está expedido: para corregir nombre o DNI/NIE escribe a ' + ADMIN_EMAIL + ' (hay que reexpedirlo).</p>' : '') +
    '<div class="sm:col-span-2"><button class="btn btn-ghost" type="submit">Guardar cambios</button></div></form></div>' +
    '<div class="card p-5 sm:p-6"><h2 class="font-extrabold text-lg">Derechos ARSOPOL</h2>' +
    '<p class="text-sm text-gray-600">Acceso · Rectificación · Supresión · Oposición · Portabilidad · Limitación. Responsable: ' + CENTRO + ' (' + ADMIN_EMAIL + ').</p>' +
    '<div class="grid sm:grid-cols-2 gap-3 mt-4">' +
    '<button class="btn btn-primary" data-act="exportar-expediente">⬇ Acceso y portabilidad: exportar expediente JSON</button>' +
    (esDirector(u) ? '<button class="btn btn-danger" disabled>Derecho de supresión (no disponible para Dirección)</button>' :
      '<button class="btn btn-danger" data-act="suprimir">Derecho de supresión: eliminar mi cuenta</button>') +
    '<button class="btn btn-ghost" data-act="toggle-derecho" data-d="oposicion">' + (u.oposicion ? '✓ Oposición ejercida el ' + fmtFecha(u.oposicion) + ' (retirar)' : 'Derecho de oposición a tratamientos no esenciales') + '</button>' +
    '<button class="btn btn-ghost" data-act="toggle-derecho" data-d="limitacion">' + (u.limitacion ? '✓ Limitación solicitada el ' + fmtFecha(u.limitacion) + ' (retirar)' : 'Solicitar limitación del tratamiento') + '</button>' +
    '</div>' +
    '<p class="text-xs text-gray-500 mt-3">También por correo a <a class="underline" href="mailto:' + ADMIN_EMAIL + '?subject=' + encodeURIComponent('Ejercicio de derechos ARSOPOL - Máster IA') + '">' + ADMIN_EMAIL + '</a> o reclamación ante la AEPD.</p>' +
    consent + '</div></div>';
}

function expedienteDe(email) {
  const u = db.users[email];
  const copia = Object.assign({}, u);
  delete copia.hash; delete copia.salt;
  return {
    responsable: CENTRO, contacto: ADMIN_EMAIL, exportado: new Date().toISOString(),
    formato: 'JSON (art. 20 RGPD - portabilidad)', programa: TITULO_MASTER + ' · ' + MENCION_LEGAL,
    alumno: copia,
    situacion: u.rol === 'director' ? null : situacionAcademica(u),
    entregas: db.entregas.filter(e => e.email === email),
    titulo: db.titulos.filter(t => t.email === email),
    auditoria: db.audit.filter(a => a.email === email)
  };
}

function onPFM(f) {
  const u = usuarioActual();
  const err = $('#pfm-err');
  const repo = f.repo.value.trim();
  if (f.titulo.value.trim().length < 8) { err.textContent = 'El título es demasiado corto.'; return; }
  if (repo && !isHttpsUrl(repo)) { err.textContent = 'El repositorio debe ser una URL https://.'; return; }
  const pareja = f.pareja.value.trim().toLowerCase();
  if (pareja && pareja === u.email) { err.textContent = 'El correo de tu pareja no puede ser el tuyo.'; return; }
  u.pfm = { titulo: f.titulo.value.trim(), empresa: f.empresa.value.trim(), pareja, repo, resumen: f.resumen.value.trim(), actualizado: new Date().toISOString() };
  registrarAuditoria('Datos del Proyecto Final actualizados', u.email);
  guardar(); toast('Datos del Proyecto Final guardados.'); render();
}

function modalSupresion(u) {
  abrirModal('<h2 class="text-xl font-extrabold">Derecho de supresión (art. 17 RGPD)</h2>' +
    '<p class="text-sm mt-2">Se eliminarán tu cuenta, tu progreso, tus entregas y tu Proyecto Final de la plataforma. Esta acción no se puede deshacer.</p>' +
    (u.titulo ? '<p class="text-sm mt-2 p-3 rounded" style="background:#fdf6d3">Ya tienes un diploma expedido: el <strong>libro de registro de títulos propios</strong> conservará los datos mínimos para poder verificarlo (nombre, DNI/NIE, número, fecha y nota).</p>' : '') +
    '<p class="text-sm mt-3">Te recomendamos <button class="underline font-semibold" data-act="exportar-expediente">exportar tu expediente</button> antes de continuar.</p>' +
    '<form data-form="suprimir" class="mt-4 grid gap-3"><div class="field"><label for="sup-email">Escribe tu correo para confirmar</label><input id="sup-email" name="email" autocomplete="off"></div>' +
    '<div class="text-sm" style="color:#9b2c13" id="sup-err"></div>' +
    '<div class="flex gap-2 justify-end"><button class="btn btn-ghost" type="button" data-act="cerrar-modal">Cancelar</button><button class="btn btn-danger" type="submit">Suprimir definitivamente</button></div></form>');
}
