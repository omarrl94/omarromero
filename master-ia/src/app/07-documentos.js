/* =====================================================================
 *  Diploma, suplemento, certificado de aprovechamiento y verificación
 *  Texto mínimo del diploma según el apartado 13 del programa. Nunca usa
 *  «Máster Universitario», «Máster de Formación Profesional» u «oficial»,
 *  ni escudos de administraciones públicas.
 * ===================================================================== */

function selloCentro() {
  return '<svg viewBox="0 0 120 120" width="112" height="112" aria-hidden="true">' +
    '<defs><path id="sello-c" d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0"/></defs>' +
    '<g fill="#efcd2f">' + Array.from({ length: 24 }, (_, i) => '<rect x="56" y="2" width="8" height="14" rx="2" transform="rotate(' + (i * 15) + ' 60 60)"/>').join('') + '</g>' +
    '<circle cx="60" cy="60" r="52" fill="#efcd2f" stroke="#8a7408" stroke-width="2"/>' +
    '<circle cx="60" cy="60" r="34" fill="none" stroke="#111" stroke-width="1.2"/>' +
    '<text font-family="Inter, sans-serif" font-size="8" font-weight="800" letter-spacing="1.4" fill="#111"><textPath href="#sello-c">CFP JOSÉ RAMÓN OTERO · TÍTULO PROPIO ·</textPath></text>' +
    '<g transform="translate(44 44) scale(.32)"><rect width="100" height="100" rx="18" fill="#111"/><path d="M14 14C32 28 50 38 71 44A21 21 0 1 1 44 71C37 50 28 32 14 14Z" fill="#efcd2f"/></g></svg>';
}
function urlVerificacion(codigo) {
  return location.origin + location.pathname + '#/verificar/' + encodeURIComponent(codigo);
}
function barraImpresion(volver) {
  return '<div class="flex flex-wrap gap-2 mb-4 no-print"><button class="btn btn-primary" data-act="imprimir">🖨 Imprimir / Guardar como PDF</button>' +
    '<a class="btn btn-ghost" href="' + volver + '">Volver</a><span class="text-xs text-gray-500 self-center">A4 apaisado · el suplemento sale en una segunda página</span></div>';
}
function firmas() {
  return '<div class="text-center text-[12px]"><div class="h-9"></div><div class="border-t border-black pt-1 w-[230px]">La Dirección del Centro<br><span class="text-gray-600">' + CENTRO + '</span></div></div>';
}

function vistaDiploma(u, email) {
  const a = db.users[email];
  if (!a || (!esDirector(u) && u.email !== email)) return '<div class="p-8">No tienes acceso a este diploma.</div>';
  if (!a.titulo) return '<div class="max-w-3xl mx-auto p-8"><div class="card p-6">Este alumno/a todavía no tiene el diploma expedido.</div></div>';
  const t = a.titulo;
  const notaTxt = fmtNota(t.nota) + (t.distincion ? ' · con distinción' : '');
  const hoja1 = '<div class="diploma hoja">' +
    '<div class="watermark">' + isotipo(600, '#111', '#fffdf6') + '</div>' +
    '<div class="flex items-start justify-between relative">' + logoCompleto(50) +
    '<div class="text-right text-[11px] leading-tight text-gray-600">Libro de registro de títulos propios<br><strong class="font-mono text-[13px] text-black">' + esc(t.numero) + '</strong></div></div>' +
    '<div class="text-center relative">' +
    '<div class="text-[14px] tracking-[.22em] font-extrabold">' + CENTRO_MAYUS + '</div>' +
    '<div class="text-[13px] mt-3 text-gray-700">certifica que</div>' +
    '<h1 class="text-[38px] leading-tight mt-1" style="font-weight:700">' + esc(a.nombre) + '</h1>' +
    '<div class="text-[13px] text-gray-700 mt-1">con DNI/NIE ' + esc(a.dni) + ', ha superado el</div>' +
    '<h2 class="text-[25px] leading-snug mt-3 max-w-[780px] mx-auto" style="font-family:\'Playfair Display\',Georgia,serif;font-weight:700">' + TITULO_MASTER + '</h2>' +
    '<div class="mt-3 inline-block px-4 py-1 text-[12px] font-bold" style="background:#efcd2f;color:#111">Título propio del centro, sin carácter oficial · 300 horas · edición ' + EDICION.periodo + ' · nota final ' + notaTxt + '</div>' +
    '</div>' +
    '<div class="flex items-end justify-between relative">' +
    '<div class="text-[11px] text-gray-700 leading-snug max-w-[300px]"><div>Código de verificación: <span class="font-mono font-bold">' + esc(t.verificacion) + '</span></div><div class="break-all text-gray-500">' + esc(urlVerificacion(t.verificacion)) + '</div><div class="mt-1">' + EDICION.lugar + ', ' + fmtFecha(t.fecha) + '</div><div class="text-gray-500 mt-1">Se acompaña de suplemento con módulos, horas, contenidos y calificaciones.</div></div>' +
    '<div class="flex flex-col items-center">' + selloCentro() + '</div>' +
    firmas() +
    '</div></div>';

  const filas = (t.modulos || []).map(mo => {
    const m = modulo(mo.cod);
    return '<tr><td class="font-bold">' + esc(mo.cod) + '</td><td><div class="font-semibold">' + esc(mo.nombre) + '</div><div class="text-[10px] text-gray-600">' + esc((m && m.contenidos || []).join(' · ')) + '</div></td><td class="text-center">' + mo.horas + '</td><td class="text-center font-bold">' + fmtNota(mo.nota) + '</td></tr>';
  }).join('');
  const hoja2 = '<div class="diploma hoja suplemento">' +
    '<div class="flex items-start justify-between">' + logoCompleto(36) + '<div class="text-right text-[11px] text-gray-600">Suplemento al diploma nº <strong class="font-mono text-black">' + esc(t.numero) + '</strong></div></div>' +
    '<div><h2 class="text-[18px] font-extrabold">' + TITULO_MASTER + '</h2><div class="text-[11px] text-gray-700">' + MENCION_LEGAL + ' · ' + EDICION.nombre + ' (' + EDICION.periodo + ') · Titular: <strong>' + esc(a.nombre) + '</strong> (DNI/NIE ' + esc(a.dni) + ')</div>' +
    '<table class="sup-tabla mt-2"><thead><tr><th>Cód.</th><th>Módulo y contenidos</th><th>Horas</th><th>Nota</th></tr></thead><tbody>' + filas +
    '<tr><td class="font-bold">SEM</td><td><div class="font-semibold">Seminarios online con empresa</div><div class="text-[10px] text-gray-600">5 sesiones de 2 h con profesionales del sector</div></td><td class="text-center">10</td><td class="text-center">Apto</td></tr>' +
    '<tr><td class="font-bold">PFM</td><td><div class="font-semibold">Proyecto Final de Máster' + (t.pfmTitulo ? ': «' + esc(t.pfmTitulo) + '»' : '') + '</div><div class="text-[10px] text-gray-600">Defendido ante tribunal (coordinación académica, docente del programa y profesional de empresa colaboradora)</div></td><td class="text-center">60</td><td class="text-center font-bold">' + fmtNota(t.pfm) + '</td></tr>' +
    '<tr><td></td><td class="font-bold">Total</td><td class="text-center font-bold">300</td><td></td></tr></tbody></table>' +
    '<div class="text-[11px] mt-2">Media de los módulos ponderada por horas: <strong>' + fmtNota(t.media) + '</strong> · Nota final (70 % módulos + 30 % Proyecto Final): <strong>' + notaTxt + '</strong></div></div>' +
    '<div class="flex items-end justify-between text-[10px] text-gray-600"><div>Calificaciones de 0 a 10 (se supera con 5). Mención «con distinción» con nota final igual o superior a 9.<br>Verificación: ' + esc(t.verificacion) + '</div>' + firmas() + '</div></div>';

  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' + barraImpresion(esDirector(u) ? '#/direccion/titulos' : '#/perfil') +
    '<div class="overflow-x-auto"><div class="grid gap-6" style="min-width:780px">' + hoja1 + hoja2 + '</div></div></div>';
}

function vistaCertificado(u, email) {
  const a = db.users[email];
  if (!a || (!esDirector(u) && u.email !== email)) return '<div class="p-8">No tienes acceso a este certificado.</div>';
  const c = a.certificado;
  if (!c) return '<div class="max-w-3xl mx-auto p-8"><div class="card p-6">No hay certificado de aprovechamiento expedido.</div></div>';
  const horas = c.modulos.reduce((s, m) => s + m.horas, 0);
  return '<div class="max-w-6xl mx-auto p-4 sm:p-8">' + barraImpresion(esDirector(u) ? '#/direccion/titulos' : '#/perfil') +
    '<div class="overflow-x-auto"><div class="diploma hoja suplemento" style="min-width:780px">' +
    '<div class="flex items-start justify-between">' + logoCompleto(40) + '<div class="text-right text-[11px] text-gray-600">Certificado nº <strong class="font-mono text-black">' + esc(c.numero) + '</strong></div></div>' +
    '<div class="text-center"><div class="text-[13px] tracking-[.2em] font-extrabold">' + CENTRO_MAYUS + '</div><div class="text-[12px] mt-2">certifica que <strong>' + esc(a.nombre) + '</strong>, con DNI/NIE ' + esc(a.dni) + ', ha cursado con aprovechamiento los siguientes módulos del ' + TITULO_MASTER + ' (' + MENCION_LEGAL + ', edición ' + EDICION.periodo + '), con un total de <strong>' + horas + ' horas</strong>:</div></div>' +
    '<table class="sup-tabla"><thead><tr><th>Cód.</th><th>Módulo y contenidos</th><th>Horas</th><th>Nota</th></tr></thead><tbody>' +
    c.modulos.map(m => '<tr><td class="font-bold">' + esc(m.cod) + '</td><td><div class="font-semibold">' + esc(m.nombre) + '</div><div class="text-[10px] text-gray-600">' + esc((m.contenidos || []).join(' · ')) + '</div></td><td class="text-center">' + m.horas + '</td><td class="text-center font-bold">' + fmtNota(m.nota) + '</td></tr>').join('') +
    '</tbody></table>' +
    '<div class="flex items-end justify-between text-[11px] text-gray-600"><div>Este certificado no acredita la obtención del título del máster.<br>Código de verificación: <span class="font-mono font-bold text-black">' + esc(c.verificacion) + '</span><br>' + EDICION.lugar + ', ' + fmtFecha(c.fecha) + '</div>' + firmas() + '</div>' +
    '</div></div></div>';
}

function vistaVerificar(codigo) {
  const cod = (codigo || '').trim().toUpperCase();
  if (cod && (!ui.verif || ui.verif.codigo !== cod)) {
    ui.verif = { codigo: cod, estado: 'cargando', datos: null };
    Almacen.verificar(cod)
      .then(d => { ui.verif = { codigo: cod, estado: d ? 'ok' : 'no', datos: d }; })
      .catch(() => { ui.verif = { codigo: cod, estado: 'error', datos: null }; })
      .then(() => { if (ruta()[0] === 'verificar') render(); });
  }
  let resultado = '';
  if (cod) {
    const v = ui.verif;
    if (v.estado === 'cargando') {
      resultado = '<p class="text-sm text-gray-600 mt-5">Consultando el libro de registro…</p>';
    } else if (v.estado === 'ok' && v.datos.tipo === 'diploma') {
      const t = v.datos;
      resultado = '<div class="card p-5 mt-5" style="border-left:5px solid #a9cabb"><div class="font-extrabold text-lg">✓ Diploma válido</div><p class="text-sm mt-1">Nº <strong class="font-mono">' + esc(t.numero) + '</strong> · ' + esc(t.nombre) + ' · DNI/NIE ' + esc(t.dni) + '<br>' + TITULO_MASTER + ' (' + MENCION_LEGAL + ') · edición ' + esc(t.edicion || EDICION.periodo) + '<br>Expedido el ' + fmtFecha(t.fecha) + ' · nota final ' + fmtNota(t.nota) + (t.distincion ? ' · con distinción' : '') + '</p></div>';
    } else if (v.estado === 'ok') {
      const c = v.datos;
      resultado = '<div class="card p-5 mt-5" style="border-left:5px solid #a9cabb"><div class="font-extrabold text-lg">✓ Certificado de aprovechamiento válido</div><p class="text-sm mt-1">Nº <strong class="font-mono">' + esc(c.numero) + '</strong> · ' + esc(c.nombre) + ' · DNI/NIE ' + esc(c.dni) + ' · ' + esc(c.horas) + ' horas · ' + fmtFecha(c.fecha) + '</p></div>';
    } else if (v.estado === 'error') {
      resultado = '<div class="card p-5 mt-5" style="border-left:5px solid #e39f7d"><div class="font-extrabold text-lg">No se pudo consultar el registro</div><p class="text-sm mt-1">Inténtalo de nuevo en unos minutos.</p></div>';
    } else {
      resultado = '<div class="card p-5 mt-5" style="border-left:5px solid #e39f7d"><div class="font-extrabold text-lg">No se encuentra ningún documento con ese código</div><p class="text-sm mt-1">Comprueba el código o escribe a <a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a>.</p></div>';
    }
  }
  return '<div class="min-h-screen p-4 sm:p-10"><div class="max-w-xl mx-auto"><a href="#/" class="inline-block mb-6">' + logoCompleto(40) + '</a>' +
    '<div class="card p-6"><h1 class="text-xl font-extrabold">Verificación de diplomas y certificados</h1><p class="text-sm text-gray-600 mt-1">' + TITULO_MASTER + ' · ' + MENCION_LEGAL + '</p>' +
    '<form data-form="verificar" class="flex gap-2 mt-4"><div class="field flex-1"><input name="codigo" value="' + esc(cod) + '" placeholder="XXXX-XXXX-XXXX-XXXX" style="text-transform:uppercase" aria-label="Código de verificación"></div><button class="btn btn-primary" type="submit">Verificar</button></form>' +
    resultado + '</div>' +
    (Almacen.modo === 'local' ? '<p class="text-xs text-gray-500 mt-4">Modo demostración: la verificación consulta el registro guardado en este navegador.</p>' : '') +
    '</div></div>';
}
