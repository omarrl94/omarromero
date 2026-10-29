/* =====================================================================
 *  Evaluación (apartado 10 del programa)
 *  - Módulo (0-10): proyecto 50 % + examen presencial 40 % (mínimo 4 para
 *    hacer media) + entregas semanales 10 %. Se supera con 5.
 *  - Recuperación: una vez (nueva versión del proyecto en la semana 14 y
 *    examen de recuperación el 26 de enero).
 *  - Nota final = 70 % media de módulos ponderada por horas + 30 % PFM.
 *    Con 9 o más: «con distinción».
 *  Las calificaciones las pone siempre una persona: la plataforma solo
 *  calcula las medias (art. 22 RGPD y Reglamento de IA, Anexo III.3).
 * ===================================================================== */

/** Última entrega calificada de un alumno en una sesión (las nuevas versiones sustituyen a las anteriores). */
function ultimaEntrega(email, n, tipo) {
  const lista = db.entregas.filter(e => e.email === email && e.sesion === n && (!tipo || e.tipo === tipo));
  return lista.sort((a, b) => b.fecha.localeCompare(a.fecha))[0] || null;
}
function ultimaCalificada(email, n, tipo) {
  return db.entregas.filter(e => e.email === email && e.sesion === n && (!tipo || e.tipo === tipo) && e.estado === 'evaluada')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] || null;
}

/** Sesiones cuya entrega semanal cuenta en el 10 % de un módulo (la acogida cuenta en M1). */
function sesionesSemanalesDe(m) {
  return SESIONES.filter(s => s.actividad.tipo === 'semanal' && (moduloDe(s.n) === m || (m.id === 'M1' && moduloDe(s.n).id === 'ACO')));
}
function sesionProyectoDe(m) { return sesionesDe(m).find(s => s.actividad.tipo === 'proyecto'); }

/**
 * Calcula la nota de un módulo. Devuelve { estado, nota, proyecto, examen, entregas, motivo }.
 * estado: 'pendiente' | 'aprobado' | 'suspenso'
 */
function notaModulo(u, m) {
  const ev = (u.evaluacion.modulos || {})[m.id] || {};
  const sp = sesionProyectoDe(m);
  const proy = sp ? ultimaCalificada(u.email, sp.n, 'proyecto') : null;
  const proyPendiente = sp && ultimaEntrega(u.email, sp.n, 'proyecto') && !proy;

  const semanales = sesionesSemanalesDe(m);
  let sinCalificar = false;
  const notasSemanales = semanales.map(s => {
    const cal = ultimaCalificada(u.email, s.n, 'semanal');
    if (!cal && ultimaEntrega(u.email, s.n, 'semanal')) sinCalificar = true;
    return cal ? cal.nota : 0;                         // no entregada = 0
  });
  const entregas = semanales.length ? notasSemanales.reduce((a, b) => a + b, 0) / semanales.length : null;

  const examenes = [ev.examen, ev.recuperacion].filter(v => v != null && v !== '');
  const examen = examenes.length ? Math.max(...examenes.map(Number)) : null;

  const r = { proyecto: proy ? proy.nota : null, examen, entregas, recuperacion: ev.recuperacion != null && ev.recuperacion !== '' };
  if (r.proyecto == null || examen == null || sinCalificar || proyPendiente) {
    return Object.assign(r, { estado: 'pendiente', nota: null, motivo: proyPendiente || sinCalificar ? 'Entregas por calificar' : (r.proyecto == null ? 'Falta el proyecto' : 'Falta el examen') });
  }
  const P = EVALUACION.modulo;
  const nota = Math.round((r.proyecto * P.proyecto + examen * P.examen + entregas * P.entregas) * 100) / 100;
  if (examen < P.minimoExamen) return Object.assign(r, { estado: 'suspenso', nota, motivo: 'Examen inferior a ' + P.minimoExamen });
  return Object.assign(r, { estado: nota >= P.aprobado ? 'aprobado' : 'suspenso', nota, motivo: nota >= P.aprobado ? '' : 'Nota inferior a 5' });
}

/** Media de los módulos ponderada por horas (solo si todos tienen nota). */
function mediaModulos(u) {
  let suma = 0, horas = 0;
  for (const m of MODULOS_EVALUABLES) {
    const r = notaModulo(u, m);
    if (r.nota == null) return null;
    suma += r.nota * m.horas; horas += m.horas;
  }
  return Math.round(suma / horas * 100) / 100;
}

function notaPFM(u) {
  const t = u.evaluacion.tribunal || {};
  let total = 0;
  for (const [clave, , peso] of EVALUACION.tribunalPFM) {
    const v = t[clave];
    if (v == null || v === '' || isNaN(Number(v))) return null;
    total += Number(v) * peso;
  }
  return Math.round(total * 100) / 100;
}

function porcentajeEntregas(u) {
  const entregadas = ACTIVIDADES_SEMANALES.filter(n => db.entregas.some(e => e.email === u.email && e.sesion === n)).length;
  return { entregadas, total: ACTIVIDADES_SEMANALES.length, pct: entregadas / ACTIVIDADES_SEMANALES.length };
}
function seminariosAsistidos(u) {
  return Object.values(u.evaluacion.seminarios || {}).filter(Boolean).length;
}
function jornadasAsistidas(u) {
  return Object.values(u.evaluacion.jornadas || {}).filter(Boolean).length;
}

/** Situación completa frente a los requisitos del título (apartado 10). */
function situacionAcademica(u) {
  const R = EVALUACION.requisitos;
  const modulos = MODULOS_EVALUABLES.map(m => Object.assign({ modulo: m }, notaModulo(u, m)));
  const ent = porcentajeEntregas(u);
  const sem = seminariosAsistidos(u);
  const jor = jornadasAsistidas(u);
  const pfm = notaPFM(u);
  const acta = (u.evaluacion.tribunal || {}).acta || 'pendiente';
  const media = mediaModulos(u);
  const requisitos = [
    { texto: 'Asistir a las tres jornadas presenciales', ok: jor >= R.jornadas, detalle: jor + '/' + R.jornadas },
    { texto: 'Entregar al menos el 80 % de las actividades semanales', ok: ent.pct >= R.entregasPct, detalle: ent.entregadas + '/' + ent.total },
    { texto: 'Superar todos los módulos (M1–M7) y sus exámenes presenciales', ok: modulos.every(r => r.estado === 'aprobado'), detalle: modulos.filter(r => r.estado === 'aprobado').length + '/' + modulos.length },
    { texto: 'Asistir al menos a 4 de los 5 seminarios online', ok: sem >= R.seminarios, detalle: sem + '/' + SEMINARIOS.length },
    { texto: 'Obtener la calificación de apto en el Proyecto Final', ok: acta === 'apto' && pfm != null && pfm >= 5, detalle: acta === 'pendiente' ? 'pendiente' : acta.toUpperCase() + ' · ' + fmtNota(pfm) }
  ];
  const F = EVALUACION.final;
  const notaFinal = media != null && pfm != null ? Math.round((media * F.modulos + pfm * F.pfm) * 100) / 100 : null;
  return {
    modulos, ent, sem, jor, pfm, acta, media, notaFinal, requisitos,
    completo: requisitos.every(r => r.ok),
    distincion: notaFinal != null && notaFinal >= F.distincion
  };
}
