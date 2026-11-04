// Retos generados: cada tema tiene un Entrenamiento (datos aleatorios, distintos en cada partida)
// y un Examen (preguntas al azar de un banco). Todo es ficticio: dominios .lab e IPs de documentación.
import { read, ev, blocked, modeIs, noProc, cronClean, gone, all } from './helpers.js';
import { docIp, shuffleQuestion } from './random.js';
import { sha256, b64encode, md5, sha1 } from '../core/crypto.js';
import { octalToMode } from '../core/vfs.js';

const classifyFrom = (r, { title, prompt, categories, pool, n = 5 }) => ({ type: 'classify', title, prompt, categories, items: r.pickN(pool, Math.min(n, pool.length)) });
const quizFrom = (r, title, pool, n) => ({ type: 'quiz', title, questions: r.pickN(pool, Math.min(n, pool.length)).map((q) => shuffleQuestion(r, q)) });
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

// ───────────────────────────── Tema 1 · Inducción ─────────────────────────────
const CIA_POOL = [
  ['Un empleado reenvía a su correo personal la lista de clientes', 'c', 'Datos que salen de donde deben estar.'],
  ['Un virus borra la base de datos de pedidos', 'a', 'Los datos dejan de estar disponibles.'],
  ['Alguien cambia las notas de un examen en la intranet', 'i', 'Datos alterados sin autorización.'],
  ['El servidor de correo se cae por un corte eléctrico', 'a', 'El servicio no está accesible.'],
  ['Se publica por error un listado con DNI de alumnos', 'c', 'Información personal expuesta.'],
  ['Un atacante modifica el número de cuenta de una factura', 'i', 'Integridad: el dato ya no es fiable.'],
  ['Una avalancha de peticiones tumba la web de matrícula', 'a', 'Disponibilidad: nadie puede usarla.'],
  ['Alguien lee por encima del hombro una contraseña', 'c', 'Confidencialidad: la contraseña deja de ser secreta.'],
  ['Un script defectuoso duplica y altera registros de stock', 'i', 'También se rompe la integridad sin mala fe.'],
  ['Un ransomware cifra los portátiles de contabilidad', 'a', 'Los ficheros quedan inaccesibles.'],
  ['Se intercepta en una wifi abierta un formulario sin HTTPS', 'c', 'Datos leídos por un tercero.'],
  ['Un becario cambia sin querer los precios de la tienda', 'i', 'Datos modificados indebidamente.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

const ROE_POOL = [
  ['Analizar un sistema incluido en el alcance, dentro del horario pactado', 'ok', 'Alcance y ventana respetados.'],
  ['Probar el router de la cafetería de enfrente «porque estaba abierto»', 'no', 'Sin permiso es delito, aunque esté abierto.'],
  ['Avisar al contacto de emergencia ante un hallazgo crítico', 'ok', 'Es exactamente lo que dicen las reglas de enfrentamiento.'],
  ['Guardar una copia de los datos personales encontrados', 'no', 'Nunca se extraen datos reales.'],
  ['Pedir por escrito que se amplíe el alcance antes de tocar otro servidor', 'ok', 'La ampliación también tiene que estar autorizada.'],
  ['Seguir las pruebas tras la fecha de fin del contrato', 'no', 'Fuera de la ventana temporal no hay autorización.'],
  ['Documentar fecha, hora y objetivo de cada prueba', 'ok', 'Trazabilidad para el cliente y para ti.'],
  ['Contar los hallazgos del cliente en redes sociales', 'no', 'La información de la auditoría es confidencial.'],
  ['Usar solo las técnicas que el contrato permite', 'ok', 'Las RoE fijan también las técnicas.'],
  ['Probar la web de un proveedor del cliente sin su permiso', 'no', 'Un tercero necesita su propia autorización.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

function hiddenHunt(r) {
  const dir = r.pick(['proyectos', 'archivo', 'expedientes', 'informes', 'material']);
  const sub = r.pick(['2025', 'antiguo', 'clientes', 'privado', 'borradores']);
  const name = r.pick(['clave', 'token', 'pin', 'codigo', 'secreto']);
  const code = `${r.pick(['ALFA', 'DELTA', 'ORION', 'NOVA', 'TITAN', 'VEGA'])}-${r.int(1000, 9999)}`;
  const home = '/home/analista';
  return {
    type: 'terminal',
    title: 'Búsqueda del código oculto',
    prompt: `Hay un código de acceso escondido en un fichero oculto dentro de ~/${dir}. Encuéntralo moviéndote por las carpetas.`,
    scenario: {
      files: {
        [`${home}/${dir}/LEEME.txt`]: `Aquí no está. Busca en la carpeta «${sub}».`,
        [`${home}/${dir}/${sub}/notas.txt`]: 'Lo que buscas empieza por un punto.',
        [`${home}/${dir}/${sub}/.${name}`]: `Código: ${code}`,
        [`${home}/${dir}/otros/basura.txt`]: 'Nada interesante.',
      },
    },
    objectives: [
      { id: 'leeme', text: `Lee ~/${dir}/LEEME.txt`, how: `cat ${dir}/LEEME.txt`, check: read(`${home}/${dir}/LEEME.txt`) },
      { id: 'ls', text: `Lista los ocultos de ~/${dir}/${sub}`, how: `ls -a ${dir}/${sub}`, check: ev('ls', (e) => e.path === `${home}/${dir}/${sub}` && e.flags.includes('a')) },
      { id: 'code', text: '¿Cuál es el código?', answer: [code], placeholder: 'XXXX-0000' },
    ],
    solution: [`cat ${dir}/LEEME.txt`, `cd ${dir}/${sub}`, 'ls -a', `cat .${name}`],
    hints: ['ls -a muestra lo que empieza por punto.'],
  };
}

// ───────────────────────────── Tema 2 · Linux y permisos ─────────────────────────────
const MODES = ['600', '640', '644', '700', '750', '755', '777', '400', '660', '711'];
function octalQuiz(r) {
  const picks = r.pickN(MODES, 4);
  return {
    type: 'quiz',
    title: 'Traduce los permisos',
    questions: picks.map((oct) => {
      const wrong = r.pickN(MODES.filter((m) => m !== oct), 2);
      return shuffleQuestion(r, { q: `¿Qué número corresponde a -${octalToMode(oct)}?`, options: [oct, ...wrong], correct: 0, explain: `${octalToMode(oct).match(/.../g).join(' · ')} → ${oct.split('').join(' · ')} (r=4, w=2, x=1).` });
    }),
  };
}

function permFix(r) {
  const file = r.pick(['nominas.csv', 'clave_api.txt', 'contratos.pdf', 'id_rsa', 'backup_db.sql']);
  const bad = r.pick(['666', '777', '664', '644']);
  const want = r.pick(['600', '640']);
  const path = `/home/analista/datos/${file}`;
  const wantText = want === '600' ? 'solo tú (dueño) puedas leerlo y escribirlo' : 'tú puedas leer y escribir, tu grupo solo leer y el resto nada';
  return {
    type: 'terminal',
    title: 'Corrige un fichero sensible',
    prompt: `El fichero ~/datos/${file} tiene permisos demasiado abiertos. Déjalo de forma que ${wantText}.`,
    scenario: { files: { [path]: { content: 'contenido confidencial de laboratorio', mode: octalToMode(bad), owner: 'analista' }, '/home/analista/datos/publico.txt': { content: 'hola', owner: 'analista' } } },
    objectives: [
      { id: 'ls', text: 'Mira los permisos con ls -l', how: 'ls -l datos', check: ev('ls', (e) => e.path === '/home/analista/datos' && e.flags.includes('l')) },
      { id: 'now', text: `¿Qué permisos (en número) tiene ahora ${file}?`, answer: [bad], placeholder: 'NNN' },
      { id: 'fix', text: `Déjalo en ${want}`, how: `chmod ${want} datos/${file}`, check: modeIs(path, want) },
    ],
    solution: ['ls -l datos', `chmod ${want} datos/${file}`],
    hints: ['r=4, w=2, x=1: suma cada grupo.'],
  };
}

function worldWritable(r) {
  const names = r.shuffle(['limpieza.sh', 'rotar_logs.sh', 'sync.sh', 'informe.sh', 'monitor.sh']);
  const badName = names[0];
  const base = r.pick(['/opt/scripts', '/srv/tareas', '/usr/local/admin']);
  const files = {};
  names.forEach((n, i) => { files[`${base}/${n}`] = { content: '#!/bin/bash\necho tarea', mode: i === 0 ? 'rwxrwxrwx' : 'rwxr-xr-x', owner: 'root' }; });
  return {
    type: 'terminal',
    title: 'Caza el script peligroso',
    prompt: `Uno de los scripts de ${base} lo puede modificar cualquiera (777). Encuéntralo y déjalo en 755. Tienes sudo.`,
    scenario: { files },
    objectives: [
      { id: 'find', text: `Busca en ${base} los ficheros con permisos 777`, how: `find ${base} -perm 777`, check: ev('find', (e) => e.base === base && /-perm\s+-?777/.test(e.args)) },
      { id: 'which', text: '¿Cómo se llama el script?', answer: [badName, `${base}/${badName}`], placeholder: 'nombre.sh' },
      { id: 'fix', text: 'Déjalo en 755', how: `sudo chmod 755 ${base}/${badName}`, check: modeIs(`${base}/${badName}`, '755') },
    ],
    solution: [`find ${base} -perm 777`, `sudo chmod 755 ${base}/${badName}`],
    hints: ['El script es de root: necesitarás sudo para chmod.'],
  };
}

// ───────────────────────────── Tema 3 · Reconocimiento pasivo ─────────────────────────────
function osintDomain(r) {
  const name = r.pick(['orbita', 'cometa', 'galena', 'trebol', 'faro', 'brisa', 'quasar']);
  const domain = `${name}-${r.pick(['transportes', 'seguros', 'clinica', 'academia', 'logistica'])}.lab`;
  const year = r.int(2005, 2022);
  const mailIp = docIp(r);
  const webIp = docIp(r);
  const sub = r.pick(['dev', 'pruebas', 'staging', 'antiguo', 'beta']);
  const subIp = docIp(r);
  const author = `${r.pick(['j', 'l', 'm', 'a', 'p'])}${r.pick(['garcia', 'lopez', 'martin', 'ruiz', 'sanz'])}`;
  return {
    type: 'terminal',
    title: `Ficha OSINT de ${domain}`,
    prompt: `Nuevo cliente autorizado: ${domain}. Reúne su ficha pública solo con fuentes pasivas.`,
    scenario: {
      whois: { [domain]: `Domain Name: ${domain.toUpperCase()}\nCreation Date: ${year}-0${r.int(1, 9)}-1${r.int(0, 9)}\nRegistrant Organization: ${name[0].toUpperCase() + name.slice(1)} S.L.\nName Server: ns1.${domain}` },
      dns: {
        [domain]: { A: [webIp], MX: [`10 correo.${domain}.`], TXT: [`"v=spf1 ip4:${mailIp} -all"`] },
        [`${sub}.${domain}`]: { A: [subIp] },
      },
      files: { '/home/analista/osint/memoria.pdf': `%PDF-1.7\n%%META\nAuthor        : ${author}\nCreator Tool  : Writer 6.1\n%%`, '/home/analista/osint/subdominios.txt': `Encontrado en un certificado público: ${sub}.${domain}` },
    },
    objectives: [
      { id: 'whois', text: 'Consulta el WHOIS', how: `whois ${domain}`, check: ev('whois', (e) => e.domain === domain) },
      { id: 'year', text: '¿En qué año se registró el dominio?', answer: [String(year)], placeholder: 'AAAA' },
      { id: 'spf', text: '¿Qué IP autoriza su SPF?', answer: [mailIp], placeholder: '0.0.0.0' },
      { id: 'sub', text: 'Lee ~/osint/subdominios.txt y resuelve ese subdominio', how: `dig ${sub}.${domain}`, check: ev('dig', (e) => e.domain === `${sub}.${domain}`) },
      { id: 'subip', text: `¿Qué IP tiene ${sub}.${domain}?`, answer: [subIp], placeholder: '0.0.0.0' },
      { id: 'author', text: 'Usuario interno en los metadatos de memoria.pdf', answer: [author], placeholder: 'usuario' },
    ],
    solution: [`whois ${domain}`, `dig ${domain} TXT`, 'cat osint/subdominios.txt', `dig ${sub}.${domain}`, 'exiftool osint/memoria.pdf'],
    hints: ['El SPF está en los registros TXT.', 'exiftool muestra el campo Author.'],
  };
}

const PASSIVE_POOL = [
  ['Consultar el WHOIS de un dominio', 'p', 'Base de datos pública: no toca al objetivo.'],
  ['Leer las ofertas de empleo de la empresa', 'p', 'Información publicada por ellos mismos.'],
  ['Buscar subdominios en certificados públicos', 'p', 'Registros públicos de certificados.'],
  ['Analizar los metadatos de un PDF descargado de su web', 'p', 'El documento ya es público.'],
  ['Enviar paquetes a sus servidores para ver qué puertos responden', 'a', 'Interactúa con sus sistemas: es activo.'],
  ['Probar contraseñas en su portal de acceso', 'a', 'Activo e intrusivo: solo con autorización expresa.'],
  ['Revisar perfiles profesionales públicos de la plantilla', 'p', 'Fuente abierta, con respeto a la privacidad.'],
  ['Conectarse a su servidor de correo para ver su versión', 'a', 'Se envía tráfico a su sistema.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

// ───────────────────────────── Tema 4 · Redes y servicios ─────────────────────────────
const PORTS = [[21, 'FTP'], [22, 'SSH'], [23, 'Telnet'], [25, 'SMTP'], [53, 'DNS'], [80, 'HTTP'], [110, 'POP3'], [143, 'IMAP'], [443, 'HTTPS'], [445, 'SMB'], [3306, 'MySQL'], [3389, 'Escritorio remoto (RDP)'], [5432, 'PostgreSQL']];
function portQuiz(r) {
  return {
    type: 'quiz',
    title: '¿Qué servicio es?',
    questions: r.pickN(PORTS, 4).map(([port, svc]) => shuffleQuestion(r, {
      q: `Puerto ${port}/tcp abierto. ¿Qué servicio suele ser?`,
      options: [svc, ...r.pickN(PORTS.filter(([, s]) => s !== svc), 2).map(([, s]) => s)],
      correct: 0,
      explain: `${port} es el puerto habitual de ${svc}.`,
    })),
  };
}

function scanHunt(r) {
  const scanner = docIp(r);
  const n = r.int(9, 16);
  const ports = r.pickN([21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 3306, 3389, 5432, 5900, 8080, 8443], n);
  const lines = [];
  ports.forEach((p, i) => lines.push(`Nov  4 11:0${Math.floor(i / 10)}:${String((i * 3) % 60).padStart(2, '0')} fw01 kernel: [UFW BLOCK] SRC=${scanner} DST=203.0.113.10 PROTO=TCP DPT=${p} SYN`));
  for (let k = 0; k < 5; k++) lines.splice(r.int(0, lines.length), 0, `Nov  4 11:00:${String(r.int(10, 59))} fw01 kernel: [UFW ALLOW] SRC=${docIp(r)} DST=203.0.113.10 PROTO=TCP DPT=443`);
  return {
    type: 'terminal',
    title: 'Escaneo en el cortafuegos',
    prompt: 'Revisa /var/log/fw.log: identifica quién escanea, cuántos puertos ha probado y bloquéalo (tienes sudo).',
    scenario: { files: { '/var/log/fw.log': lines.join('\n') } },
    objectives: [
      { id: 'grep', text: 'Filtra las líneas BLOCK', how: 'grep BLOCK /var/log/fw.log', check: ev('grep', (e) => /block/i.test(e.pattern)) },
      { id: 'ip', text: '¿IP del escáner?', answer: [scanner], placeholder: '0.0.0.0' },
      { id: 'n', text: '¿Cuántos puertos ha probado?', answer: [String(n)], placeholder: 'número' },
      { id: 'block', text: 'Bloquéala', how: `sudo iptables -A INPUT -s ${scanner} -j DROP`, check: blocked(scanner) },
    ],
    solution: ['grep BLOCK /var/log/fw.log', 'grep -c BLOCK /var/log/fw.log', `sudo iptables -A INPUT -s ${scanner} -j DROP`],
    hints: ['grep -c cuenta las líneas.'],
  };
}

const PORTSTATE_POOL = [
  ['El servidor responde SYN-ACK', 'open', 'Hay un servicio escuchando.'],
  ['El servidor responde RST', 'closed', 'La máquina existe, pero no hay servicio.'],
  ['No llega ninguna respuesta (un cortafuegos descarta el paquete)', 'filtered', 'No se puede saber: está filtrado.'],
  ['Se recibe un mensaje ICMP de «destino inalcanzable administrativamente»', 'filtered', 'Un dispositivo intermedio lo bloquea.'],
  ['Se completa el saludo y aparece el banner del servicio', 'open', 'Abierto y además identificable.'],
  ['La conexión se rechaza de inmediato con RST', 'closed', 'Cerrado: nadie escucha en ese puerto.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

// ───────────────────────────── Tema 5 · Vulnerabilidades ─────────────────────────────
const sev = (s) => (s >= 9 ? 'crit' : s >= 7 ? 'alta' : s >= 4 ? 'media' : 'baja');
const SEV_CATS = [{ id: 'crit', label: 'Crítica' }, { id: 'alta', label: 'Alta' }, { id: 'media', label: 'Media' }, { id: 'baja', label: 'Baja' }];
const VULN_NAMES = ['Ejecución remota en el gestor de contenidos', 'Lectura de ficheros en el panel de copias', 'Denegación de servicio en el proxy', 'Fuga de información en los mensajes de error', 'Escalada local en el agente de monitorización', 'Salto de autenticación en la API interna', 'Desbordamiento en la librería de imágenes', 'Falsificación de peticiones en la intranet'];

function cvssBands(r) {
  const scores = [r.int(90, 100), r.int(70, 89), r.int(40, 69), r.int(1, 39), r.int(1, 100)].map((x) => x / 10);
  return {
    type: 'classify',
    title: 'Bandas de CVSS',
    prompt: 'Asigna la severidad que corresponde a cada puntuación CVSS.',
    categories: SEV_CATS,
    items: r.shuffle(scores).map((s, i) => ({ text: `${VULN_NAMES[i]} · CVSS ${s.toFixed(1).replace('.', ',')}`, cat: sev(s), explain: '0,1-3,9 baja · 4-6,9 media · 7-8,9 alta · 9-10 crítica.' })),
  };
}

function cvssOrder(r) {
  const used = new Set();
  const items = r.pickN(VULN_NAMES, 4).map((name) => {
    let s;
    do { s = r.int(10, 100) / 10; } while (used.has(s));
    used.add(s);
    return { name, s };
  }).sort((a, b) => b.s - a.s);
  return { type: 'order', title: 'Prioriza por gravedad', prompt: 'Ordena de la más grave a la menos grave según su CVSS.', items: items.map((x) => `${x.name} (CVSS ${x.s.toFixed(1).replace('.', ',')})`), explain: 'Primero lo crítico; después, por puntuación descendente.' };
}

function patchTriage(r) {
  const pkgs = r.shuffle(['portal-web', 'motor-pdf', 'agente-backup', 'servidor-ftp', 'cliente-vpn']).slice(0, 4);
  const exposedIdx = r.int(0, 3);
  const top = r.int(90, 98) / 10;
  const rows = pkgs.map((p, i) => ({ p, v: `${r.int(1, 4)}.${r.int(0, 9)}`, exp: i === exposedIdx, s: i === exposedIdx ? top : r.int(20, 88) / 10 }));
  const first = rows[exposedIdx].p;
  return {
    type: 'terminal',
    title: 'Triaje de parches',
    prompt: 'Cruza ~/parches/inventario.txt con ~/parches/boletin.txt y decide qué se parchea primero.',
    scenario: {
      files: {
        '/home/analista/parches/inventario.txt': `PAQUETE         VERSIÓN  EXPUESTO\n${rows.map((x) => `${x.p.padEnd(16)}${x.v.padEnd(9)}${x.exp ? 'sí' : 'no'}`).join('\n')}`,
        '/home/analista/parches/boletin.txt': `PAQUETE         CVSS  DESCRIPCIÓN\n${rows.map((x) => `${x.p.padEnd(16)}${x.s.toFixed(1).padEnd(6)}${x.exp ? 'Ejecución remota sin autenticación' : 'Fallo con impacto limitado'}`).join('\n')}`,
      },
    },
    objectives: [
      { id: 'inv', text: 'Lee el inventario', how: 'cat parches/inventario.txt', check: read('/home/analista/parches/inventario.txt') },
      { id: 'bol', text: 'Lee el boletín', how: 'cat parches/boletin.txt', check: read('/home/analista/parches/boletin.txt') },
      { id: 'first', text: '¿Qué paquete va primero?', answer: [first], placeholder: 'paquete' },
    ],
    solution: ['cat parches/inventario.txt', 'cat parches/boletin.txt'],
    hints: ['Máxima gravedad + expuesto a Internet = primero.'],
  };
}

// ───────────────────────────── Tema 6 · Seguridad web ─────────────────────────────
const OWASP_CATS = [{ id: 'ac', label: 'Control de acceso' }, { id: 'inj', label: 'Inyección' }, { id: 'crypto', label: 'Criptografía' }, { id: 'conf', label: 'Configuración' }];
const OWASP_POOL = [
  ['Cambiando el número de pedido en la URL ves pedidos ajenos', 'ac', 'Falta comprobar a quién pertenece el pedido (IDOR).'],
  ['Un usuario normal entra en /admin escribiendo la URL', 'ac', 'Control de acceso ausente.'],
  ['El comentario de un usuario se ejecuta como código en la página', 'inj', 'XSS: inyección en el HTML.'],
  ['El buscador concatena el texto en la consulta SQL', 'inj', 'Inyección SQL.'],
  ['El formulario de contacto pasa el texto a un comando del sistema', 'inj', 'Inyección de comandos.'],
  ['La web de pago funciona sin HTTPS', 'crypto', 'Datos sensibles sin cifrar en tránsito.'],
  ['Las contraseñas se guardan en SHA-1 sin sal', 'crypto', 'Algoritmo inadecuado para contraseñas.'],
  ['Los errores muestran la traza completa al visitante', 'conf', 'Información interna expuesta.'],
  ['El panel de administración conserva la contraseña por defecto', 'conf', 'Configuración por defecto insegura.'],
  ['El listado de directorios del servidor está activado', 'conf', 'Expone ficheros que no deberían verse.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

const SNIPPETS = [
  { lang: 'python', code: ['def buscar(nombre):', '    cur = db.cursor()', '    cur.execute(f"SELECT * FROM alumnos WHERE nombre = \'{nombre}\'")', '    return cur.fetchall()'], bad: [2], ok: 'Inyección SQL: el dato se mete en la consulta con un f-string', fix: 'cur.execute("SELECT * FROM alumnos WHERE nombre = %s", (nombre,))', wrong: ['Falta cerrar el cursor', 'XSS en la consulta'] },
  { lang: 'php', code: ['<?php', '$q = $_GET["q"];', 'echo "<p>Has buscado: " . $q . "</p>";'], bad: [2], ok: 'XSS reflejado: se pinta el parámetro sin escapar', fix: 'echo "<p>Has buscado: " . htmlspecialchars($q, ENT_QUOTES) . "</p>";', wrong: ['Inyección SQL', 'Falta un punto y coma'] },
  { lang: 'javascript', code: ["app.get('/api/notas/:alumno', auth, async (req, res) => {", '  const notas = await Notas.de(req.params.alumno);', '  res.json(notas);', '});'], bad: [1, 2], ok: 'IDOR: no se comprueba que el alumno sea el de la sesión', fix: "if (req.params.alumno !== req.user.id && !req.user.esProfesor) return res.sendStatus(403);", wrong: ['Falta paginación', 'Debería usar POST'] },
  { lang: 'javascript', code: ["const API_KEY = 'sk_live_laboratorio_123';", "fetch('https://pagos.lab/cobro', {", '  headers: { Authorization: API_KEY },', '});'], bad: [0], ok: 'Credencial escrita en el código (CWE-798): acaba en el repositorio y en el navegador', fix: 'Guardar la clave en el servidor (gestor de secretos o variable de entorno) y llamar a la API desde allí', wrong: ['Falta await', 'La URL es demasiado larga'] },
  { lang: 'python', code: ['@app.route("/descargar")', 'def descargar():', '    nombre = request.args["f"]', '    return send_file("/srv/docs/" + nombre)'], bad: [3], ok: 'Recorrido de rutas (path traversal): el nombre puede salir de /srv/docs', fix: 'Usar send_from_directory("/srv/docs", nombre), que rechaza rutas fuera de la carpeta, o una lista blanca de ficheros', wrong: ['Falta un try/except', 'El nombre de la función no es descriptivo'] },
];

function codeReview(r) {
  const s = r.pick(SNIPPETS);
  const askFix = r.next() < 0.5;
  return {
    type: 'code',
    title: askFix ? 'Elige la corrección' : 'Encuentra el fallo',
    prompt: 'Selecciona la línea problemática.',
    lang: s.lang,
    code: s.code,
    bad: s.bad,
    question: askFix ? '¿Qué corrección aplicarías?' : '¿Qué fallo es?',
    options: r.shuffle([
      { text: askFix ? s.fix : s.ok, correct: true, explain: askFix ? 'Ataca la causa raíz.' : 'Exacto.' },
      ...s.wrong.map((w) => ({ text: w, correct: false, explain: 'No es el problema de seguridad de este código.' })),
    ]),
  };
}

function webLogs(r) {
  const attacker = docIp(r);
  const normal = [docIp(r), docIp(r)];
  const pages = ['/catalogo', '/contacto', '/ayuda', '/blog/novedades', '/carrito'];
  const bad = [
    `"GET /buscar?q=%3Cscript%3E HTTP/1.1" 200`,
    `"POST /login usuario=admin'-- HTTP/1.1" 302`,
    `"GET /descargar?f=..%2F..%2Fetc%2Fpasswd HTTP/1.1" 400`,
    `"GET /pedidos/${r.int(1000, 1100)} HTTP/1.1" 200`,
  ];
  const rows = [];
  const nBad = r.int(2, 4);
  r.pickN(bad, nBad).forEach((b) => rows.push({ t: `${attacker} - - [04/Nov/2026:12:0${r.int(0, 9)}:${r.int(10, 59)}] ${b}`, bad: true }));
  for (let k = 0; k < 5; k++) rows.push({ t: `${r.pick(normal)} - - [04/Nov/2026:12:0${r.int(0, 9)}:${r.int(10, 59)}] "GET ${r.pick(pages)} HTTP/1.1" 200`, bad: false });
  const mixed = r.shuffle(rows);
  return { type: 'logs', title: 'Intentos de abuso en el log web', prompt: 'Marca las peticiones que son intentos de abuso.', lines: mixed.map((x) => x.t), bad: mixed.map((x, i) => (x.bad ? i : -1)).filter((i) => i >= 0), explain: `Todas las sospechosas vienen de ${attacker}: caracteres de inyección, etiquetas codificadas, rutas con ../ o recorridos de identificadores.` };
}

// ───────────────────────────── Tema 7 · Criptografía ─────────────────────────────
function b64Note(r) {
  const word = r.pick(['girasol', 'tormenta', 'pinguino', 'satelite', 'mandarina', 'acantilado']);
  const n = r.int(10, 99);
  const secret = `${word}${n}`;
  return {
    type: 'terminal',
    title: 'El «cifrado» del compañero',
    prompt: 'Un compañero guarda en ~/nota.txt una clave «cifrada». Demuestra que solo está codificada.',
    scenario: { files: { '/home/analista/nota.txt': b64encode(`La clave del laboratorio es ${secret}\n`) } },
    objectives: [
      { id: 'cat', text: 'Mira el contenido', how: 'cat nota.txt', check: read('/home/analista/nota.txt') },
      { id: 'dec', text: 'Decodifícalo con base64 -d', how: 'base64 -d nota.txt', check: ev('b64decode', (e) => e.out.includes(secret)) },
      { id: 'secret', text: '¿Cuál es la clave?', answer: [secret], placeholder: 'clave' },
    ],
    solution: ['cat nota.txt', 'base64 -d nota.txt'],
    hints: ['El = del final delata Base64.'],
  };
}

function tamperHunt(r) {
  const n = r.int(3, 5);
  const badIdx = r.int(0, n - 1);
  const files = {};
  const sums = [];
  for (let i = 0; i < n; i++) {
    const name = `modulo-${i + 1}.bin`;
    const original = `contenido legítimo del módulo ${i + 1}`;
    files[`/home/analista/release/${name}`] = i === badIdx ? `${original} + código añadido` : original;
    sums.push(`${sha256(original)}  ${name}`);
  }
  files['/home/analista/release/SHA256SUMS'] = sums.join('\n');
  const names = Array.from({ length: n }, (_, i) => `modulo-${i + 1}.bin`);
  return {
    type: 'terminal',
    title: '¿Cuál han manipulado?',
    prompt: 'Compara los SHA-256 de ~/release con las huellas oficiales de SHA256SUMS.',
    scenario: { files },
    objectives: [
      { id: 'sums', text: 'Lee SHA256SUMS', how: 'cat release/SHA256SUMS', check: read('/home/analista/release/SHA256SUMS') },
      { id: 'calc', text: 'Calcula el SHA-256 de todos los .bin', how: `sha256sum ${names.map((x) => `release/${x}`).join(' ')}`, check: (st) => names.every((x) => st.log.some((e) => e.type === 'sha256sum' && e.files.includes(`/home/analista/release/${x}`))) },
      { id: 'bad', text: '¿Qué fichero no coincide?', answer: [names[badIdx]], placeholder: 'modulo-N.bin' },
    ],
    solution: ['cd release', 'cat SHA256SUMS', `sha256sum ${names.join(' ')}`],
    hints: ['Compara los primeros 8 caracteres de cada huella.'],
  };
}

function hashKind(r) {
  const algs = [['MD5', md5, 32], ['SHA-1', sha1, 40], ['SHA-256', sha256, 64]];
  return {
    type: 'quiz',
    title: 'Identifica el hash',
    questions: r.pickN([...algs, ...algs], 3).map(([name, fn, len]) => shuffleQuestion(r, {
      q: `¿Qué algoritmo produce un hash como ${fn(`muestra-${r.int(1, 999)}`)}?`,
      options: ['MD5', 'SHA-1', 'SHA-256'],
      correct: ['MD5', 'SHA-1', 'SHA-256'].indexOf(name),
      explain: `Tiene ${len} caracteres hexadecimales: MD5 = 32, SHA-1 = 40, SHA-256 = 64.`,
    })),
  };
}

const PASS_POOL = [
  ['Verano2024!', 'debil', 'Estación + año + símbolo: patrón clásico.'],
  ['qwerty123', 'debil', 'Secuencia de teclado.'],
  ['Admin1234', 'debil', 'De las primeras que se prueban.'],
  ['P@ssw0rd', 'debil', 'Sustituciones predecibles de «password».'],
  ['m4riposa', 'media', 'Palabra con una sustitución: corta y predecible.'],
  ['Barcelona_1992', 'media', 'Más larga, pero con datos fáciles de adivinar.'],
  ['tren-nube-cactus-azul-48', 'fuerte', 'Frase de paso larga y aleatoria.'],
  ['k#9vQ!2mLx@7zR (gestor)', 'fuerte', 'Aleatoria, larga y única.'],
  ['lampara.oceano.viernes.tiza', 'fuerte', 'Cuatro palabras aleatorias: mucha entropía.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

// ───────────────────────────── Tema 8 · Ingeniería social ─────────────────────────────
const PHISH_POOL = [
  ['«Tu buzón está lleno. Pulsa aquí antes de 1 hora o perderás tus correos»', 'phish', 'Urgencia y amenaza.'],
  ['«Factura pendiente adjunta: factura.pdf.exe»', 'phish', 'Doble extensión: es un ejecutable.'],
  ['«Hola, soy el director. Compra 5 tarjetas regalo y mándame los códigos»', 'phish', 'Fraude del CEO.'],
  ['«Su paquete está retenido, pague 2,99 €» (SMS de un número desconocido)', 'phish', 'Smishing.'],
  ['«Restablece tu contraseña en micr0soft-soporte.lab»', 'phish', 'Dominio que imita a otro (un 0 en lugar de una o).'],
  ['Convocatoria de claustro del jefe de estudios, sin enlaces ni adjuntos', 'ok', 'Remitente esperado y nada que pulsar.'],
  ['Aviso de RR. HH.: «las nóminas están en el portal de siempre», sin enlace', 'ok', 'Informativo: se accede desde el marcador habitual.'],
  ['Respuesta de un compañero a un hilo que tú empezaste, con el documento que pediste', 'ok', 'Contexto coherente y esperado (ante la duda, verifica).'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

function lookalike(r) {
  const base = r.pick(['nebula-logistica', 'jrotero-seguridad', 'banco-ficticio', 'correos-lab']);
  const variants = [base.replace('l', '1'), base.replace('i', 'l'), base.replace('o', '0'), `${base}-soporte`, base.replace('-', '')].filter((v) => v !== base);
  const fake = `${r.pick(variants)}.lab`;
  const ip = docIp(r);
  const eml = `Return-Path: <avisos@${fake}>\nReceived: from mx.${fake} (${ip})\nAuthentication-Results: correo.${base}.lab;\n   spf=fail smtp.mailfrom=${fake};\n   dmarc=fail\nFrom: "Soporte" <soporte@${base}.lab>\nSubject: Verifique su cuenta hoy\n\nPulse en https://acceso.${fake}/verificar`;
  return {
    type: 'terminal',
    title: 'Cabeceras de un correo reportado',
    prompt: 'Analiza ~/reporte.eml y bloquea el servidor de origen (tienes sudo).',
    scenario: { files: { '/home/analista/reporte.eml': eml } },
    objectives: [
      { id: 'read', text: 'Lee el correo', how: 'cat reporte.eml', check: read('/home/analista/reporte.eml') },
      { id: 'dom', text: '¿Dominio real del remitente (Return-Path)?', answer: [fake], placeholder: 'dominio' },
      { id: 'spf', text: '¿Resultado SPF?', answer: ['fail'], placeholder: 'pass / fail' },
      { id: 'block', text: 'Bloquea la IP del servidor que lo envió', how: `sudo iptables -A INPUT -s ${ip} -j DROP`, check: blocked(ip) },
    ],
    solution: ['cat reporte.eml', `sudo iptables -A INPUT -s ${ip} -j DROP`],
    hints: ['La IP está en la línea Received.'],
  };
}

// ───────────────────────────── Tema 9 · Detección (SOC) ─────────────────────────────
function bruteForce(r) {
  const attacker = docIp(r);
  const n = r.int(6, 15);
  const victim = r.pick(['jperez', 'lmartin', 'soporte', 'aruiz', 'backup']);
  const users = ['admin', 'root', 'test', victim, 'oracle'];
  const lines = [`Nov  4 02:00:01 srv01 sshd[100]: Accepted publickey for analista from 192.0.2.15 port 50000`];
  for (let i = 0; i < n; i++) lines.push(`Nov  4 02:1${Math.floor(i / 10)}:${String(i * 4).padStart(2, '0')} srv01 sshd[${200 + i}]: Failed password for ${users[i % users.length]} from ${attacker} port ${41000 + i}`);
  const ok = r.next() < 0.7;
  if (ok) lines.push(`Nov  4 02:19:59 srv01 sshd[299]: Accepted password for ${victim} from ${attacker} port 41999`);
  lines.push(`Nov  4 09:00:00 srv01 sshd[300]: Accepted publickey for analista from 192.0.2.15 port 50001`);
  return {
    type: 'terminal',
    title: 'Fuerza bruta nocturna',
    prompt: 'Investiga /var/log/auth.log y bloquea al atacante (tienes sudo).',
    scenario: { files: { '/var/log/auth.log': lines.join('\n') } },
    objectives: [
      { id: 'fail', text: 'Filtra los fallos', how: "grep 'Failed password' /var/log/auth.log", check: ev('grep', (e) => /failed/i.test(e.pattern)) },
      { id: 'ip', text: '¿IP atacante?', answer: [attacker], placeholder: '0.0.0.0' },
      { id: 'n', text: '¿Cuántos intentos fallidos?', answer: [String(n)], placeholder: 'número' },
      { id: 'ok', text: '¿Consiguió entrar? Escribe el usuario, o «no»', answer: [ok ? victim : 'no'], placeholder: 'usuario / no' },
      { id: 'block', text: 'Bloquea la IP', how: `sudo iptables -A INPUT -s ${attacker} -j DROP`, check: blocked(attacker) },
    ],
    solution: ["grep 'Failed password' /var/log/auth.log", "grep -c 'Failed password' /var/log/auth.log", 'grep Accepted /var/log/auth.log', `sudo iptables -A INPUT -s ${attacker} -j DROP`],
    hints: ['grep -c cuenta coincidencias.', 'Busca un «Accepted» desde la IP atacante.'],
  };
}

function persistenceHunt(r) {
  const bin = r.pick(['systemd-helper', 'dbus-cache', 'kupdate', 'pulse-sync']);
  const user = r.pick(['www-data', 'ftp', 'nobody']);
  const pid = r.int(2000, 9000);
  const c2 = docIp(r);
  const path = `/var/tmp/.${r.pick(['x', 'cache', 'tmp', 'sys'])}/${bin}`;
  return {
    type: 'terminal',
    title: 'Proceso y persistencia',
    prompt: 'Un servidor va lento. Encuentra el proceso malicioso, su tarea cron y erradícalos (tienes sudo).',
    scenario: {
      files: { [path]: { content: '#!/bin/bash\n# simulación', owner: user, mode: 'rwxr-xr-x' } },
      procs: [{ pid: 1, user: 'root', cmd: '/sbin/init' }, { pid: 400, user: 'root', cmd: '/usr/sbin/sshd -D' }, { pid, user, cmd: `${path} --connect ${c2}:4444`, cpu: 97.5 }, { pid: pid + 7, user: 'analista', cmd: '-bash' }],
      cron: { [user]: [`*/10 * * * * ${path} --connect ${c2}:4444`] },
    },
    objectives: [
      { id: 'ps', text: 'Lista los procesos', how: 'ps aux', check: ev('ps') },
      { id: 'pid', text: '¿PID del proceso malicioso?', answer: [String(pid)], placeholder: 'PID' },
      { id: 'cron', text: `Revisa el crontab de ${user}`, how: `sudo crontab -u ${user} -l`, check: ev('cron-list', (e) => e.user === user) },
      { id: 'c2', text: '¿A qué IP se conecta?', answer: [c2], placeholder: '0.0.0.0' },
      { id: 'clean', text: 'Elimina la tarea, mata el proceso y borra el binario', how: `sudo crontab -u ${user} -r · sudo kill ${pid} · sudo rm ${path}`, check: all(cronClean(user, new RegExp(bin)), noProc(new RegExp(bin)), gone(path)) },
    ],
    solution: ['ps aux', `sudo crontab -u ${user} -l`, `sudo crontab -u ${user} -r`, `sudo kill ${pid}`, `sudo rm ${path}`],
    hints: ['Mira la columna %CPU.', 'Elimina primero la persistencia o volverá a arrancar.'],
  };
}

const TACTIC_POOL = [
  ['Correo con un adjunto malicioso', 'init', 'Acceso inicial.'],
  ['Entrar con una cuenta válida robada', 'init', 'Acceso inicial con cuentas válidas.'],
  ['Tarea cron que relanza un binario', 'pers', 'Persistencia.'],
  ['Clave SSH añadida a authorized_keys', 'pers', 'Persistencia.'],
  ['Usar sudo mal configurado para ser root', 'priv', 'Escalada de privilegios.'],
  ['Probar miles de contraseñas', 'cred', 'Acceso a credenciales (fuerza bruta).'],
  ['Copiar la base de clientes a un servidor externo', 'exfil', 'Exfiltración.'],
  ['Subir ficheros por HTTPS a un almacenamiento en la nube ajeno', 'exfil', 'Exfiltración.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

// ───────────────────────────── Tema 10 · Respuesta a incidentes ─────────────────────────────
function irLive(r) {
  const host = `PC-${r.pick(['RRHH', 'VENTAS', 'CONTA', 'DIR', 'ALMACEN'])}-${r.int(10, 99)}`;
  const dom = `${r.pick(['update', 'cdn', 'sync', 'telemetria'])}-${r.pick(['servicio', 'sistema', 'nube'])}.lab`;
  const ip = docIp(r);
  const every = r.pick([2, 3, 5, 10]);
  const n = r.int(6, 10);
  const pid = r.int(3000, 8000);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const m = i * every;
    lines.push(`Nov  4 1${5 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:07 proxy01 GET https://${dom}/beacon host=${host} bytes=280`);
    if (i % 2 === 0) lines.push(`Nov  4 1${5 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:40 proxy01 GET https://www.nebula-logistica.lab/ host=PC-VENTAS-02 bytes=51000`);
  }
  const implant = `/home/usuario/.local/bin/${r.pick(['actualizador', 'servicio', 'helper'])}`;
  return {
    type: 'terminal',
    title: `Incidente en ${host}`,
    prompt: `Alerta de beaconing desde ${host}. Investiga en /var/log/proxy.log, contén, conserva la evidencia y erradica (tienes sudo).`,
    scenario: {
      files: { '/var/log/proxy.log': lines.join('\n'), [implant]: { content: '#!/bin/bash\n# implante simulado', owner: 'usuario', mode: 'rwxr-xr-x' } },
      dns: { [dom]: { A: [ip] } },
      procs: [{ pid: 1, user: 'root', cmd: '/sbin/init' }, { pid, user: 'usuario', cmd: `${implant} --beacon ${every * 60}` }],
    },
    objectives: [
      { id: 'grep', text: `Filtra las peticiones de ${host}`, how: `grep ${host} /var/log/proxy.log`, check: ev('grep', (e) => e.pattern.toUpperCase().includes(host)) },
      { id: 'dom', text: '¿Dominio de mando y control?', answer: [dom], placeholder: 'dominio' },
      { id: 'every', text: '¿Cada cuántos minutos llama?', answer: [String(every)], placeholder: 'minutos' },
      { id: 'block', text: 'Resuelve el dominio y bloquea su IP', how: `dig ${dom} · sudo iptables -A INPUT -s ${ip} -j DROP`, check: blocked(ip) },
      { id: 'hash', text: 'Calcula el SHA-256 del implante (evidencia)', how: `sha256sum ${implant}`, check: ev('sha256sum', (e) => e.files.includes(implant)) },
      { id: 'erad', text: 'Detén el proceso y borra el implante', how: `sudo kill ${pid} · sudo rm ${implant}`, check: all(noProc(/beacon/), gone(implant)) },
    ],
    solution: [`grep ${host} /var/log/proxy.log`, `dig ${dom}`, `sudo iptables -A INPUT -s ${ip} -j DROP`, 'ps aux', `sha256sum ${implant}`, `sudo kill ${pid}`, `sudo rm ${implant}`],
    hints: ['Resta las horas de dos peticiones seguidas al mismo dominio.', 'Evidencia antes de borrar.'],
  };
}

const IR_PHASE_POOL = [
  ['Redactar el plan de respuesta y hacer simulacros', 'prep', 'Preparación.'],
  ['Una alerta del SIEM indica conexiones anómalas', 'det', 'Detección y análisis.'],
  ['Aislar de la red el equipo afectado', 'cont', 'Contención.'],
  ['Eliminar el malware y la persistencia', 'erad', 'Erradicación.'],
  ['Restaurar desde copias limpias y vigilar', 'rec', 'Recuperación.'],
  ['Reunión de lecciones aprendidas', 'post', 'Post-incidente.'],
  ['Bloquear la IP del servidor de mando y control', 'cont', 'Contención.'],
  ['Revisar los logs para saber el alcance', 'det', 'Detección y análisis.'],
].map(([text, cat, explain]) => ({ text, cat, explain }));

// ───────────────────────────── Bancos de examen (además de los test de las misiones) ─────────────────────────────
const Q = (q, options, explain) => ({ q, options, correct: 0, explain });
export const EXAM_EXTRA = {
  m1: [
    Q('¿Qué tres principios forman la tríada CIA?', ['Confidencialidad, Integridad y Disponibilidad', 'Cifrado, Identidad y Acceso', 'Control, Inspección y Auditoría'], 'Son los tres pilares de la seguridad de la información.'),
    Q('¿Qué artículo del Código Penal castiga el acceso no autorizado a sistemas?', ['197 bis', '23', '510'], 'El 197 bis castiga acceder o facilitar el acceso sin autorización.'),
    Q('¿Qué es la divulgación responsable?', ['Avisar del fallo al responsable sin explotarlo ni publicarlo antes de que se corrija', 'Publicar el fallo en redes', 'Vender el fallo'], 'Proteger primero a los usuarios.'),
    Q('¿Qué ordena ls -a?', ['Mostrar también los ficheros ocultos', 'Borrar todo', 'Mostrar solo carpetas'], '-a = all.'),
    Q('En ATT&CK, una «táctica» es…', ['El objetivo del adversario (el «para qué»)', 'Un programa malicioso concreto', 'Una IP'], 'Las técnicas son el «cómo».'),
  ],
  m2: [
    Q('¿Para qué sirve sudo?', ['Para ejecutar una orden con permisos de administrador', 'Para borrar usuarios', 'Para ver la hora'], 'Por eso chmod sobre un fichero de root necesita sudo.'),
    Q('Quieres que solo tú puedas leer y escribir un fichero. ¿Qué permisos le pones?', ['600', '777', '644'], '6 = rw- para el dueño y 0 para el resto.'),
    Q('¿Qué permisos da 755?', ['Dueño todo; grupo y otros leer y ejecutar', 'Todos escribir', 'Solo el dueño lee'], '7 = rwx, 5 = r-x.'),
    Q('¿Qué significa el principio de mínimo privilegio?', ['Cada usuario o programa tiene solo los permisos imprescindibles', 'Todos son administradores', 'Nadie tiene contraseña'], 'Limita el daño si una cuenta cae.'),
    Q('¿Qué comando cambia los permisos?', ['chmod', 'chown', 'cat'], 'chown cambia el dueño.'),
    Q('Una línea «usuario ALL=(ALL) NOPASSWD: ALL» en sudoers…', ['Da control total sin contraseña a ese usuario', 'Bloquea al usuario', 'No hace nada'], 'Es un hallazgo de severidad alta.'),
    Q('¿Qué hace find / -perm -o+w -type f?', ['Busca ficheros que cualquiera puede escribir', 'Borra ficheros', 'Cambia permisos'], 'Útil en auditorías de bastionado.'),
  ],
  m3: [
    Q('¿Qué revela con frecuencia una oferta de empleo técnica?', ['Las tecnologías y versiones que usa la empresa', 'Las contraseñas', 'Nada útil'], 'Por eso conviene redactarlas con menos detalle.'),
    Q('¿Qué registro DNS indica los servidores de nombres del dominio?', ['NS', 'MX', 'A'], 'NS = Name Server.'),
    Q('Un subdominio «pruebas» accesible desde Internet suele ser…', ['Un objetivo interesante porque suele estar peor protegido', 'Siempre seguro', 'Invisible'], 'Los entornos de pruebas deben ir tras la VPN.'),
    Q('¿Qué registro DNS indica el servidor de correo?', ['MX', 'A', 'NS'], 'MX = Mail eXchanger.'),
    Q('¿Qué registro DNS da la IP de un nombre?', ['A', 'TXT', 'MX'], 'A = Address.'),
    Q('¿Cuál es reconocimiento pasivo?', ['Leer los metadatos de un PDF público', 'Probar contraseñas', 'Enviar paquetes a sus servidores'], 'No toca los sistemas del objetivo.'),
    Q('DMARC con p=reject sirve para…', ['Que se rechacen los correos que suplantan al dominio', 'Cifrar la web', 'Acelerar el DNS'], 'Protege frente al spoofing.'),
    Q('¿Por qué limpiar los metadatos antes de publicar?', ['Pueden revelar usuarios internos y versiones de software', 'Ocupan mucho', 'Por estética'], 'Información útil para un atacante.'),
  ],
  m4: [
    Q('El saludo TCP en orden es…', ['SYN → SYN-ACK → ACK', 'ACK → SYN → FIN', 'SYN → RST → ACK'], 'Three-way handshake.'),
    Q('Un puerto «filtrado» significa que…', ['Un cortafuegos impide saber si hay servicio', 'Hay un servicio seguro', 'La máquina está apagada seguro'], 'No llega respuesta.'),
    Q('¿Qué puerto usa el escritorio remoto de Windows (RDP)?', ['3389', '22', '25'], 'Nunca debería estar expuesto a Internet sin protección.'),
    Q('¿Qué responde un puerto cerrado a un SYN?', ['RST', 'SYN-ACK', 'Nada'], 'Nada = filtrado.'),
    Q('¿Qué puerto usa HTTPS?', ['443', '80', '22'], '80 es HTTP sin cifrar.'),
    Q('¿Por qué Telnet es peligroso?', ['Todo viaja sin cifrar, incluidas las contraseñas', 'Es lento', 'No existe'], 'Se sustituye por SSH.'),
    Q('¿Qué muestra ss -tulpn?', ['Los puertos a la escucha y su proceso', 'Los usuarios', 'El espacio en disco'], 'Vista interna de la máquina.'),
    Q('¿Cómo se reconoce un escaneo en el cortafuegos?', ['Una IP prueba muchos puertos distintos en poco tiempo', 'Un usuario entra con su contraseña', 'Una web carga lento'], 'Patrón típico.'),
  ],
  m5: [
    Q('¿Qué identifica un CVE?', ['Una vulnerabilidad concreta de un producto concreto', 'Un tipo genérico de fallo', 'Una empresa'], 'El tipo es el CWE.'),
    Q('CVSS 7,5 es…', ['Alta', 'Media', 'Crítica'], '7-8,9 = alta.'),
    Q('En CVSS, AV:N significa…', ['Vector de ataque por red', 'Sin vulnerabilidad', 'Ataque físico'], 'Lo más peligroso: alcanzable remotamente.'),
    Q('Si no puedes parchear todavía…', ['Mitiga: restringe el acceso o desactiva la función afectada', 'No haces nada', 'Apagas Internet'], 'Mitigación temporal.'),
    Q('¿Qué pesa más al priorizar?', ['Que se esté explotando activamente y esté expuesto', 'El nombre del CVE', 'La fecha de compra del servidor'], 'Contexto > décimas de CVSS.'),
  ],
  m6: [
    Q('IDOR significa que…', ['Se accede a objetos de otros usuarios cambiando un identificador', 'El servidor va lento', 'La web no tiene HTTPS'], 'Falta autorización por objeto.'),
    Q('¿Qué hace htmlspecialchars en PHP?', ['Escapa caracteres especiales para que el navegador los muestre como texto', 'Cifra la contraseña', 'Conecta con la base de datos'], 'Defensa contra XSS.'),
    Q('Una clave de API escrita en el código del navegador…', ['La puede ver cualquiera que abra la web', 'Está protegida por HTTPS', 'Caduca sola'], 'Los secretos van en el servidor.'),
    Q('La defensa principal frente a la inyección SQL es…', ['Consultas parametrizadas', 'Ocultar la URL', 'Un captcha'], 'Separar datos y código.'),
    Q('La defensa principal frente al XSS es…', ['Escapar la salida', 'Usar POST', 'Cambiar de puerto'], 'Que el navegador lo trate como texto.'),
    Q('Autenticación y autorización son…', ['Quién eres y a qué tienes derecho', 'Lo mismo', 'Dos tipos de cifrado'], 'El IDOR es fallo de autorización.'),
    Q('¿Qué es OWASP?', ['Una comunidad abierta que publica guías y el Top 10 de riesgos web', 'Un antivirus', 'Una ley'], 'Referencia mundial.'),
    Q('Un WAF…', ['Filtra patrones de ataque delante de la web, pero no sustituye al código seguro', 'Arregla el código solo', 'Cifra la base de datos'], 'Es una capa más.'),
  ],
  m7: [
    Q('Base64 es…', ['Codificación reversible sin clave', 'Cifrado fuerte', 'Un hash'], 'No protege nada.'),
    Q('Un SHA-256 tiene…', ['64 caracteres hexadecimales', '32', '40'], 'MD5 = 32, SHA-1 = 40.'),
    Q('La «sal» en contraseñas sirve para…', ['Que contraseñas iguales den hashes distintos', 'Que sea más corta', 'Cifrar el disco'], 'Frena los ataques con tablas precalculadas.'),
    Q('¿Qué algoritmo es adecuado para guardar contraseñas?', ['Argon2id', 'MD5', 'Base64'], 'Lento y con sal.'),
    Q('Para saber QUIÉN publicó un fichero hace falta…', ['Una firma digital', 'Un MD5', 'Comprimirlo'], 'El hash solo prueba que no cambió.'),
  ],
  m8: [
    Q('«nebu1a-logistica.lab» frente a «nebula-logistica.lab» es un ejemplo de…', ['Typosquatting (dominio parecido)', 'Cifrado', 'DNSSEC'], 'Un 1 en lugar de una l.'),
    Q('La métrica más valiosa de un simulacro es…', ['La tasa de reporte', 'La lista de quién pulsó', 'El número de correos enviados'], 'Mide la cultura de seguridad.'),
    Q('El fraude del CEO se combate sobre todo con…', ['Verificar por otro canal antes de pagar', 'Un antivirus', 'Cambiar de navegador'], 'Llamar a un número conocido.'),
    Q('¿Qué emoción explota más el phishing?', ['La urgencia', 'El aburrimiento', 'La calma'], 'También el miedo y la autoridad.'),
    Q('El campo From de un correo…', ['Se puede falsificar fácilmente', 'Nunca miente', 'Es siempre el Return-Path'], 'Mira Return-Path, Received y SPF/DKIM/DMARC.'),
    Q('Si has pulsado en un phishing…', ['Avisas en seguida al equipo de seguridad', 'Lo ocultas', 'Esperas'], 'Rapidez = menos daño.'),
    Q('En un simulacro ético, ¿se guardan las contraseñas escritas?', ['Nunca', 'Sí, para el informe', 'Solo las de dirección'], 'La página no debe recoger credenciales.'),
    Q('Un IOC es…', ['Un indicador de compromiso: IP, dominio, hash…', 'Un tipo de firewall', 'Una ley europea'], 'Se comparten y se bloquean.'),
  ],
  m9: [
    Q('¿Qué columna de ps aux delata a un minero?', ['%CPU', 'USER', 'PID'], 'Consume casi toda la CPU.'),
    Q('¿Dónde se registran los usos de sudo?', ['En auth.log', 'En el log del servidor web', 'En ningún sitio'], 'Cada sudo deja rastro.'),
    Q('Tras una intrusión confirmada en una cuenta, además de echar al atacante hay que…', ['Cambiar las credenciales comprometidas', 'Reiniciar el router', 'Nada más'], 'Si no, puede volver a entrar.'),
    Q('En auth.log, «Failed password» indica…', ['Un intento de acceso fallido', 'Un acceso correcto', 'Un apagado'], '«Accepted» es el éxito.'),
    Q('Muchos fallos y luego un éxito desde la misma IP…', ['Probable cuenta comprometida: alerta crítica', 'Normal', 'Un error del log'], 'Regla clásica de SIEM.'),
    Q('Si solo matas el proceso malicioso…', ['La persistencia puede volver a arrancarlo', 'Se arregla todo', 'Se borra el log'], 'Elimina antes la persistencia.'),
    Q('¿Qué táctica de ATT&CK es una tarea cron maliciosa?', ['Persistencia', 'Reconocimiento', 'Exfiltración'], 'T1053.'),
    Q('Telemetría sin alerta significa…', ['Se registró pero nadie fue avisado', 'Detección perfecta', 'No hay logs'], 'Hay que crear la regla.'),
  ],
  m10: [
    Q('¿Qué es una cadena de custodia?', ['El registro de quién manipuló la evidencia y cuándo', 'Un tipo de cifrado', 'Una copia de seguridad'], 'Da validez legal a la evidencia.'),
    Q('Ante un equipo infectado, ¿por qué no apagarlo de inmediato?', ['Se perdería la evidencia en memoria: mejor aislarlo de la red', 'Porque gasta luz', 'Porque es ilegal'], 'Aislar conserva el estado.'),
    Q('¿Qué fase cierra el ciclo de respuesta a incidentes?', ['Lecciones aprendidas', 'Contención', 'Detección'], 'Para mejorar la preparación.'),
    Q('¿Qué va antes, contener o erradicar?', ['Contener', 'Erradicar', 'Da igual'], 'Primero se limita el daño.'),
    Q('¿Por qué calcular el hash de la evidencia?', ['Para demostrar que no se ha alterado', 'Para borrarla', 'Para comprimirla'], 'Cadena de custodia.'),
    Q('El RGPD exige notificar una brecha con datos personales en…', ['72 horas', '1 semana', '1 mes'], 'Art. 33.'),
    Q('Beaconing es…', ['Conexiones periódicas de un implante a su servidor de control', 'Un tipo de cable', 'Una copia de seguridad'], 'Se ve en el proxy.'),
    Q('¿Qué sección del informe es para dirección?', ['El resumen ejecutivo', 'Los anexos técnicos', 'Los logs'], 'Riesgo de negocio sin jerga.'),
  ],
};

// ───────────────────────────── Entrenamientos por tema ─────────────────────────────
export const TRAINING = {
  m1: (r) => [hiddenHunt(r), classifyFrom(r, { title: 'Tríada CIA', prompt: '¿Qué principio se rompe en cada caso?', categories: [{ id: 'c', label: 'Confidencialidad' }, { id: 'i', label: 'Integridad' }, { id: 'a', label: 'Disponibilidad' }], pool: CIA_POOL }), classifyFrom(r, { title: 'Reglas de enfrentamiento', prompt: '¿Está permitido?', categories: [{ id: 'ok', label: 'Permitido' }, { id: 'no', label: 'Prohibido' }], pool: ROE_POOL })],
  m2: (r) => [octalQuiz(r), permFix(r), worldWritable(r)],
  m3: (r) => [osintDomain(r), classifyFrom(r, { title: '¿Pasivo o activo?', prompt: 'Clasifica cada técnica de reconocimiento.', categories: [{ id: 'p', label: 'Pasivo' }, { id: 'a', label: 'Activo' }], pool: PASSIVE_POOL, n: 6 })],
  m4: (r) => [portQuiz(r), scanHunt(r), classifyFrom(r, { title: 'Estados de un puerto', prompt: '¿Qué estado indica cada respuesta?', categories: [{ id: 'open', label: 'Abierto' }, { id: 'closed', label: 'Cerrado' }, { id: 'filtered', label: 'Filtrado' }], pool: PORTSTATE_POOL, n: 4 })],
  m5: (r) => [cvssBands(r), cvssOrder(r), patchTriage(r)],
  m6: (r) => [classifyFrom(r, { title: 'Categorías OWASP', prompt: 'Clasifica cada fallo.', categories: OWASP_CATS, pool: OWASP_POOL }), codeReview(r), codeReview(r), webLogs(r)],
  m7: (r) => [b64Note(r), hashKind(r), tamperHunt(r), classifyFrom(r, { title: 'Robustez de contraseñas', prompt: 'Clasifica estas contraseñas de ejemplo.', categories: [{ id: 'debil', label: 'Débil' }, { id: 'media', label: 'Mejorable' }, { id: 'fuerte', label: 'Robusta' }], pool: PASS_POOL })],
  m8: (r) => [classifyFrom(r, { title: '¿Phishing o legítimo?', prompt: 'Clasifica los mensajes.', categories: [{ id: 'ok', label: 'Legítimo' }, { id: 'phish', label: 'Phishing' }], pool: PHISH_POOL }), lookalike(r)],
  m9: (r) => [bruteForce(r), persistenceHunt(r), classifyFrom(r, { title: 'Tácticas ATT&CK', prompt: 'Asigna la táctica.', categories: [{ id: 'init', label: 'Acceso inicial' }, { id: 'cred', label: 'Credenciales' }, { id: 'priv', label: 'Escalada' }, { id: 'pers', label: 'Persistencia' }, { id: 'exfil', label: 'Exfiltración' }], pool: TACTIC_POOL })],
  m10: (r) => [irLive(r), classifyFrom(r, { title: 'Fases del incidente', prompt: '¿En qué fase de NIST está cada acción?', categories: [{ id: 'prep', label: 'Preparación' }, { id: 'det', label: 'Detección' }, { id: 'cont', label: 'Contención' }, { id: 'erad', label: 'Erradicación' }, { id: 'rec', label: 'Recuperación' }, { id: 'post', label: 'Lecciones' }], pool: IR_PHASE_POOL, n: 6 })],
};

/**
 * Banco de examen de un tema PARA UN EQUIPO: preguntas propias del tema (cubiertas por la lección común)
 * + los test de las misiones que ese equipo ha jugado. Así nunca se pregunta algo que no se ha estudiado.
 */
export function examBank(moduleId, staticMissions, team) {
  const bank = [...EXAM_EXTRA[moduleId]];
  for (const m of staticMissions) {
    if (team && !m.teams.includes(team)) continue;
    for (const c of m.challenges) if (c.type === 'quiz') bank.push(...c.questions);
  }
  return bank;
}

/** Examen del tema: 8 preguntas al azar del banco del equipo y un reto práctico. */
export function examFor(moduleId, staticMissions) {
  return (r, team) => {
    const bank = examBank(moduleId, staticMissions, team);
    const practice = TRAINING[moduleId](r).filter((c) => c.type !== 'terminal');
    return [quizFrom(r, 'Preguntas del examen', bank, 8), ...(practice.length ? [r.pick(practice)] : [])];
  };
}
export { plural };
