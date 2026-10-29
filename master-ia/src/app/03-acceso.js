/* =====================================================================
 *  Acceso, registro y protección de datos (RGPD / LOPDGDD / Reglamento de IA)
 * ===================================================================== */

const VIAS = {
  DAM: 'Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (vía principal)',
  DAW: 'Técnico Superior en Desarrollo de Aplicaciones Web',
  ASIR: 'Técnico Superior en Administración de Sistemas Informáticos en Red',
  UNIV: 'Titulación universitaria en Informática o afín'
};

function tablaPrimeraCapa() {
  const filas = [
    ['Responsable', CENTRO],
    ['Contacto', '<a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a> (Dirección del Máster)'],
    ['Finalidad', 'Gestión académica del máster (admisión, seguimiento, evaluación, Proyecto Final) y expedición y registro del diploma.'],
    ['Legitimación', 'Art. 6.1.a RGPD (consentimiento) y art. 6.1.b RGPD (ejecución del contrato de matrícula).'],
    ['Destinatarios', 'La empresa que dirige el máster y presta la plataforma, como encargada del tratamiento (art. 28 RGPD). No se ceden datos a terceros salvo obligación legal.'],
    ['Derechos', 'Acceso, Rectificación, Supresión, Oposición, Portabilidad y Limitación (ARSOPOL) desde tu expediente o por correo. Reclamación ante la AEPD (aepd.es).'],
    ['Información adicional', '<button type="button" class="underline font-semibold" data-act="segunda-capa">Ver segunda capa informativa</button>']
  ];
  return '<div class="tbl-wrap"><table class="tbl"><caption class="text-left text-xs font-bold uppercase tracking-wide px-3 pt-3 pb-1">Información básica sobre protección de datos (1.ª capa)</caption><tbody>' +
    filas.map(f => '<tr><th style="width:30%">' + f[0] + '</th><td>' + f[1] + '</td></tr>').join('') + '</tbody></table></div>';
}

function modalSegundaCapa() {
  abrirModal('<h2 class="text-xl font-extrabold mb-3">Información adicional sobre protección de datos</h2>' +
    '<div class="prose-jro text-sm">' +
    '<p><strong>Responsable:</strong> ' + CENTRO + '. Canal de ejercicio de derechos: <a class="underline" href="mailto:' + ADMIN_EMAIL + '">' + ADMIN_EMAIL + '</a>, o el delegado de protección de datos del centro.</p>' +
    '<p><strong>Encargado del tratamiento:</strong> la empresa que dirige el máster y aporta la plataforma online, con contrato conforme al art. 28 RGPD. Los proveedores de nube y de APIs de modelos de IA que se usen en el curso actúan también como encargados o subencargados y figuran en el registro de actividades de tratamiento.</p>' +
    '<p><strong>Datos tratados:</strong> identificativos (nombre, DNI/NIE, correo), académicos (titulación de acceso, progreso, entregas, calificaciones, asistencia, Proyecto Final) y fecha de nacimiento (solo para verificar la mayoría de edad). El DNI/NIE se usa únicamente para identificarte en el diploma y en el registro de títulos propios.</p>' +
    '<p><strong>Finalidades:</strong> (1) admisión y matrícula; (2) docencia, tutoría y evaluación de los módulos; (3) Proyecto Final y tribunal; (4) expedición del diploma, su suplemento o el certificado de aprovechamiento, y su verificación.</p>' +
    '<p><strong>Base jurídica:</strong> consentimiento (art. 6.1.a) y ejecución del contrato de matrícula (art. 6.1.b). La conservación del registro de títulos propios se basa en el interés legítimo y las obligaciones del centro (art. 6.1.c y 6.1.f).</p>' +
    '<p><strong>Conservación:</strong> durante la matrícula y, después, bloqueados durante los plazos de prescripción (art. 32 LOPDGDD). El registro de títulos conserva solo los datos mínimos para verificar el diploma.</p>' +
    '<p><strong>Derechos ARSOPOL:</strong> desde «Mi expediente» (exportación JSON, rectificación, supresión, oposición y limitación) o por correo electrónico. Puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</p>' +
    '<p><strong>Sin decisiones automatizadas:</strong> ninguna calificación, admisión ni emisión de título la decide un sistema de IA. Las notas las ponen personas (tutor, coordinación y tribunal); la plataforma solo calcula las medias según el programa (art. 22 RGPD; Reglamento (UE) 2024/1689, Anexo III, punto 3).</p>' +
    '<p><strong>Compromiso ético de IA:</strong> no entrenar ni inferir con datos personales sin anonimizar, respetar las licencias de modelos, datos y código, documentar el uso de asistentes de IA en tus entregas y aplicar medidas de prevención de sesgos y transparencia.</p>' +
    '<p class="text-xs text-gray-500"><strong>Nota técnica:</strong> esta versión de la plataforma guarda la información en el navegador en el que se usa. Para la operación real con alumnado debe desplegarse con un servidor (ver DESPLIEGUE.md).</p>' +
    '</div><div class="mt-4 text-right"><button class="btn btn-primary" data-act="cerrar-modal">Entendido</button></div>');
}

function vistaAuth() {
  const v = ui.authVista;
  const pestañas = v === 'setup' ? '' :
    '<div class="tabs mb-5" role="tablist">' +
    '<button class="tab" role="tab" aria-selected="' + (v === 'login') + '" data-act="auth-vista" data-v="login">Acceso</button>' +
    '<button class="tab" role="tab" aria-selected="' + (v === 'registro') + '" data-act="auth-vista" data-v="registro">Matrícula</button></div>';

  let form = '';
  if (v === 'login') {
    form = '<form data-form="login" class="space-y-4" novalidate>' +
      '<div class="field"><label for="l-email">Correo electrónico</label><input id="l-email" name="email" type="email" autocomplete="username" required placeholder="nombre.apellido@jrotero.es"></div>' +
      '<div class="field"><label for="l-pw">Contraseña</label><input id="l-pw" name="password" type="password" autocomplete="current-password"><div class="hint">Primer acceso de la Dirección (' + ADMIN_EMAIL + '): deja la contraseña vacía para configurarla.</div></div>' +
      '<div class="text-sm" style="color:#9b2c13" id="login-err"></div>' +
      '<button class="btn btn-primary w-full" type="submit">Entrar en el Máster</button>' +
      '<p class="text-xs text-gray-500 text-center">¿Quieres comprobar un diploma? <a class="underline" href="#/verificar">Verificar un título</a></p></form>';
  } else if (v === 'registro') {
    const año = new Date().getFullYear();
    let promos = '';
    for (let y = año + 4; y >= 2000; y--) promos += '<option value="' + y + '">' + y + '</option>';
    form = '<form data-form="registro" class="space-y-4" novalidate>' +
      '<div class="grid sm:grid-cols-2 gap-4">' +
      '<div class="field sm:col-span-2"><label for="r-nombre">Nombre y apellidos (como figurarán en el diploma)</label><input id="r-nombre" name="nombre" required maxlength="90" autocomplete="name"></div>' +
      '<div class="field"><label for="r-dni">DNI o NIE</label><input id="r-dni" name="dni" required maxlength="12" autocomplete="off" style="text-transform:uppercase"><div class="hint">Solo para el diploma y el registro de títulos.</div></div>' +
      '<div class="field"><label for="r-nac">Fecha de nacimiento</label><input id="r-nac" name="nacimiento" type="date" required></div>' +
      '<div class="field sm:col-span-2"><label>Tipo de plaza</label><div class="grid sm:grid-cols-2 gap-2 mt-1">' +
      '<label class="check card p-3"><input type="radio" name="plaza" value="centro" checked> <span><strong>Alumnado del centro</strong><br><span class="text-xs text-gray-600">Gratuito al titular en DAM en el centro, según las bases de la promoción. Correo @jrotero.es.</span></span></label>' +
      '<label class="check card p-3"><input type="radio" name="plaza" value="externo"> <span><strong>Plaza externa</strong><br><span class="text-xs text-gray-600">' + EDICION.precio.general.toLocaleString('es-ES') + ' € · ' + EDICION.precio.prontoPago.toLocaleString('es-ES') + ' € con pronto pago o ' + EDICION.precio.cuotas + '. Requiere código de admisión.</span></span></label>' +
      '</div></div>' +
      '<div class="field"><label for="r-email">Correo electrónico</label><input id="r-email" name="email" type="email" required autocomplete="email"></div>' +
      '<div class="field"><label for="r-codigo">Código de admisión</label><input id="r-codigo" name="codigo" placeholder="MIA-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase"><div class="hint">Lo facilita Secretaría tras la admisión (obligatorio en plazas externas o correos no @jrotero.es).</div></div>' +
      '<div class="field sm:col-span-2"><label for="r-via">Titulación de acceso</label><select id="r-via" name="via">' + Object.entries(VIAS).map(([k, t]) => '<option value="' + k + '">' + t + '</option>').join('') + '</select><div class="hint">Las vías distintas de DAM requieren entrevista y superar el módulo de nivelación.</div></div>' +
      '<div class="field"><label for="r-promo">Año de titulación</label><select id="r-promo" name="promocion" required><option value="">Selecciona año…</option>' + promos + '</select></div>' +
      '<div class="field"><label for="r-centro">Centro donde titulaste</label><input id="r-centro" name="centro" maxlength="90" placeholder="CFP José Ramón Otero"></div>' +
      '<div class="field"><label for="r-pw">Contraseña</label><input id="r-pw" name="password" type="password" autocomplete="new-password" required><div class="hint">Mín. 10 caracteres, con mayúscula, minúscula y número.</div></div>' +
      '<div class="field"><label for="r-pw2">Repite la contraseña</label><input id="r-pw2" name="password2" type="password" autocomplete="new-password" required></div>' +
      '</div>' +
      tablaPrimeraCapa() +
      '<div class="space-y-3 pt-1">' +
      '<label class="check"><input type="checkbox" name="mayor"> <span>Declaro ser <strong>mayor de 18 años</strong> y estar en posesión de la titulación de acceso indicada (o en condiciones de acreditarla).</span></label>' +
      '<label class="check"><input type="checkbox" name="oficial"> <span>Entiendo que es un <strong>título propio del centro, sin carácter oficial</strong> (no es un Máster Universitario ni un Máster de Formación Profesional), de 300 horas.</span></label>' +
      '<label class="check"><input type="checkbox" name="consentDatos"> <span>He leído la información de protección de datos y <strong>consiento el tratamiento de mis datos académicos</strong> para la gestión del máster y la expedición del diploma (art. 6.1.a y 6.1.b RGPD).</span></label>' +
      '<label class="check"><input type="checkbox" name="consentEtica"> <span>Acepto el <strong>compromiso ético de uso responsable de la IA</strong>: no entrenaré ni inferiré con datos personales sin anonimizar, respetaré las licencias de modelos, datos y código, y documentaré el uso de asistentes de IA en mis entregas.</span></label>' +
      '</div>' +
      '<div class="text-sm" style="color:#9b2c13" id="reg-err" role="alert"></div>' +
      '<button class="btn btn-primary w-full" type="submit">Enviar solicitud de matrícula</button></form>';
  } else {
    form = '<form data-form="setup" class="space-y-4" novalidate>' +
      '<div class="rounded-lg p-3 text-sm" style="background:#fdf6d3">Primer acceso de <strong>' + ADMIN_NAME + '</strong> (' + ADMIN_EMAIL + '), Dirección del Máster. Define la contraseña del Panel de Dirección.</div>' +
      '<div class="field"><label for="s-pw">Nueva contraseña</label><input id="s-pw" name="password" type="password" autocomplete="new-password"><div class="hint">Mín. 10 caracteres, con mayúscula, minúscula y número.</div></div>' +
      '<div class="field"><label for="s-pw2">Repite la contraseña</label><input id="s-pw2" name="password2" type="password" autocomplete="new-password"></div>' +
      '<div class="text-sm" style="color:#9b2c13" id="setup-err"></div>' +
      '<div class="flex gap-2"><button class="btn btn-ghost" type="button" data-act="auth-vista" data-v="login">Volver</button><button class="btn btn-primary flex-1" type="submit">Guardar y entrar</button></div></form>';
  }

  return '<div class="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">' +
    '<aside class="min-w-0 relative overflow-hidden text-white p-8 lg:p-12 flex flex-col justify-between" style="background:#111111">' +
    '<div>' + logoCompleto(46, true) + '</div>' +
    '<div class="my-10 relative z-10">' +
    '<span class="badge-master">' + MENCION_LEGAL + '</span>' +
    '<h1 class="text-[1.65rem] sm:text-3xl lg:text-4xl font-extrabold leading-tight mt-4 break-words">' + TITULO_MASTER + '</h1>' +
    '<p class="mt-4 text-white/75 max-w-xl">Edición intensiva de un trimestre para titulados en DAM: ' + EDICION.periodo + '. Online con tutor, tres jornadas presenciales con examen, cinco seminarios con empresas y un Proyecto Final defendido ante tribunal. Cada módulo termina con un proyecto para tu portfolio.</p>' +
    '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 text-center">' +
    [['300 h', 'carga lectiva'], ['15', 'semanas'], ['7', 'módulos + PFM'], ['3', 'jornadas presenciales']].map(d => '<div class="rounded-lg p-2" style="background:rgba(255,255,255,.07)"><div class="text-xl font-extrabold" style="color:#efcd2f">' + d[0] + '</div><div class="text-[.7rem] text-white/60">' + d[1] + '</div></div>').join('') +
    '</div>' +
    '<div class="flex flex-wrap gap-2 mt-6">' +
    '<span class="chip" style="background:#a9cabb;color:#111">Python · ML · Deep learning</span>' +
    '<span class="chip" style="background:#a9cabb;color:#111">LLMs · RAG · Agentes</span>' +
    '<span class="chip" style="background:#e39f7d;color:#111">Android · Flutter · Web · Escritorio</span>' +
    '<span class="chip" style="background:#e39f7d;color:#111">LLMOps · Reglamento de IA</span></div></div>' +
    '<div class="text-xs text-white/55 relative z-10">Dirección del Máster: ' + ADMIN_NAME + ' · ' + ADMIN_EMAIL + '</div>' +
    '<div style="position:absolute;right:-90px;bottom:-90px;opacity:.08">' + isotipo(380, '#FFFFFF', '#111111') + '</div>' +
    '</aside>' +
    '<main class="min-w-0 p-4 sm:p-10 flex items-start lg:items-center justify-center"><div class="w-full max-w-2xl">' +
    '<div class="card p-6 sm:p-8">' + pestañas + form + '</div>' +
    '<p class="text-xs text-gray-500 mt-4 text-center">Plataforma del máster · ' + CENTRO + '</p>' +
    '</div></main></div>';
}

async function onLogin(f) {
  const email = f.email.value.trim().toLowerCase();
  const pw = f.password.value;
  const err = $('#login-err');
  err.textContent = '';
  const u = db.users[email];
  if (!u) { err.textContent = 'No existe ninguna cuenta con ese correo. Si quieres matricularte, usa la pestaña Matrícula.'; return; }
  if (esDirector(u) && !u.hash) { ui.authVista = 'setup'; render(); return; }
  if (!pw) { err.textContent = 'Introduce tu contraseña.'; return; }
  try {
    const { hash } = await derivarHash(pw, u.salt);
    if (hash !== u.hash) { err.textContent = 'Contraseña incorrecta.'; return; }
  } catch (e) { err.textContent = e.message; return; }
  if (u.estado === 'rechazado') { err.textContent = 'Tu solicitud no ha sido aceptada. Contacta con ' + ADMIN_EMAIL + '.'; return; }
  setSesionEmail(email);
  registrarAuditoria('Inicio de sesión', email);
  guardar();
  if (!location.hash || location.hash === '#/' || location.hash.indexOf('#/verificar') === 0) ir('inicio'); else render();
}

async function onSetup(f) {
  const err = $('#setup-err');
  const pw = f.password.value, pw2 = f.password2.value;
  if (!passwordValida(pw)) { err.textContent = 'La contraseña no cumple la política de seguridad.'; return; }
  if (pw !== pw2) { err.textContent = 'Las contraseñas no coinciden.'; return; }
  const admin = db.users[ADMIN_EMAIL];
  if (admin.hash) { err.textContent = 'La contraseña de la Dirección ya está configurada.'; return; }
  try { Object.assign(admin, await derivarHash(pw)); } catch (e) { err.textContent = e.message; return; }
  registrarAuditoria('Configuración inicial de la cuenta de Dirección', ADMIN_EMAIL);
  setSesionEmail(ADMIN_EMAIL);
  guardar();
  ui.authVista = 'login';
  toast('Bienvenido, ' + ADMIN_NAME + '. Panel de Dirección activado.');
  ir('direccion/admisiones');
}

async function onRegistro(f) {
  const err = $('#reg-err');
  const fallo = m => { err.textContent = m; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
  const nombre = f.nombre.value.trim();
  const dni = normalizarDni(f.dni.value);
  const email = f.email.value.trim().toLowerCase();
  const codigo = f.codigo.value.trim().toUpperCase();
  const plaza = f.plaza.value;
  const via = f.via.value;
  const promocion = f.promocion.value;
  const nacimiento = f.nacimiento.value;
  const pw = f.password.value;

  if (nombre.length < 5 || nombre.split(/\s+/).length < 2) return fallo('Indica nombre y al menos un apellido.');
  if (!dni) return fallo('El DNI o NIE no es válido (revisa la letra).');
  if (Object.values(db.users).some(u => u.dni === dni)) return fallo('Ya existe una matrícula con ese DNI/NIE.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fallo('El correo electrónico no es válido.');
  if (db.users[email]) return fallo('Ya existe una cuenta con ese correo.');
  if (plaza === 'centro' && !email.endsWith('@jrotero.es')) return fallo('Las plazas del alumnado del centro se solicitan con el correo @jrotero.es.');
  let codigoObj = null;
  if (plaza === 'externo' || !email.endsWith('@jrotero.es')) {
    if (!codigo) return fallo('Las plazas externas necesitan el código de admisión que facilita Secretaría.');
    codigoObj = db.codigos.find(x => x.codigo === codigo && !x.usadoPor && !x.revocado);
    if (!codigoObj) return fallo('El código de admisión no es válido, ya se ha usado o ha sido revocado.');
  }
  if (!promocion) return fallo('Selecciona el año de titulación.');
  if (!nacimiento) return fallo('Indica tu fecha de nacimiento.');
  if (edad(nacimiento) < 18) return fallo('Debes ser mayor de edad para matricularte.');
  if (!f.mayor.checked) return fallo('Debes declarar tu mayoría de edad y tu titulación de acceso.');
  if (!f.oficial.checked) return fallo('Debes confirmar que conoces el carácter de título propio, sin carácter oficial.');
  if (!passwordValida(pw)) return fallo('La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número.');
  if (pw !== f.password2.value) return fallo('Las contraseñas no coinciden.');
  if (!f.consentDatos.checked) return fallo('Necesitamos tu consentimiento para tratar tus datos académicos.');
  if (!f.consentEtica.checked) return fallo('Debes aceptar el compromiso ético de uso responsable de la IA.');

  let cred;
  try { cred = await derivarHash(pw); } catch (e) { return fallo(e.message); }
  const ahora = new Date().toISOString();
  const admitidoDirecto = !!codigoObj && via === 'DAM';
  db.users[email] = {
    email, nombre, dni, rol: 'alumno', plaza, via, promocion, centro: f.centro.value.trim(), nacimiento,
    salt: cred.salt, hash: cred.hash, creado: ahora,
    estado: admitidoDirecto ? 'admitido' : 'pendiente',
    admision: codigoObj ? 'codigo:' + codigoObj.codigo : 'dominio',
    consentimientos: {
      datos: { aceptado: true, fecha: ahora, version: 'RGPD-2.0' },
      etica: { aceptado: true, fecha: ahora, version: 'IA-ETICA-2.0' },
      tituloPropio: { aceptado: true, fecha: ahora }
    },
    oposicion: null, limitacion: null, progreso: {}, evaluacion: {}, pfm: null, titulo: null
  };
  if (codigoObj) { codigoObj.usadoPor = email; codigoObj.fechaUso = ahora; }
  registrarAuditoria('Solicitud de matrícula (' + (plaza === 'centro' ? 'alumnado del centro' : 'plaza externa') + ', vía ' + via + ')', email);
  setSesionEmail(email);
  guardar();
  toast(admitidoDirecto ? 'Matrícula confirmada. ¡Bienvenido/a al Máster!' :
    'Solicitud registrada. Mientras se valida, tienes acceso a la acogida y a M1.' + (via !== 'DAM' ? ' Te contactaremos para la entrevista.' : ''));
  ir('inicio');
}
