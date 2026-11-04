// Módulos 4-5: Redes, puertos y servicios · Vulnerabilidades y CVSS.
import { read, ev, blocked, serviceOff, all } from './helpers.js';

const ALL = ['red', 'blue', 'purple'];

const LISTENING = [
  { port: 22, process: 'sshd', service: 'ssh' },
  { port: 80, process: 'nginx', service: 'nginx' },
  { port: 443, process: 'nginx', service: 'nginx' },
  { port: 23, process: 'in.telnetd', service: 'telnet' },
  { port: 3306, process: 'mysqld', service: 'mysql', addr: '0.0.0.0' },
];
const SERVICES = [
  { name: 'ssh', desc: 'OpenSSH server', active: true, enabled: true },
  { name: 'nginx', desc: 'Servidor web', active: true, enabled: true },
  { name: 'telnet', desc: 'Telnet (heredado, sin cifrado)', active: true, enabled: true },
  { name: 'mysql', desc: 'Base de datos', active: true, enabled: true },
];

const SCAN_REPORT = `INFORME DE INVENTARIO EXTERNO · Nébula Logística
Realizado por: JROTERO Ciberseguridad (autorización NL-2026-11, alcance 203.0.113.0/24)
Fecha: 04/11/2026

HOST 203.0.113.10 (www.nebula-logistica.lab)
PUERTO   ESTADO    SERVICIO   VERSIÓN DETECTADA
22/tcp   abierto   ssh        OpenSSH 9.6
80/tcp   abierto   http       nginx 1.24 (redirige a HTTPS)
443/tcp  abierto   https      nginx 1.24
23/tcp   abierto   telnet     in.telnetd (sin cifrado)
3306/tcp abierto   mysql      MySQL 5.5.62 (fin de soporte desde 2018)

HOST 203.0.113.30 (vpn.nebula-logistica.lab)
443/tcp  abierto   https      FortiLab VPN 6.0.4

HOST 203.0.113.44 (intranet-pruebas.nebula-logistica.lab)
8080/tcp abierto   http       Panel de administración (sin HTTPS)
`;

const FW_LOG = (() => {
  const lines = [];
  const ports = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 993, 1433, 3306, 3389, 5432, 5900, 8080];
  let t = 0;
  const stamp = () => { t += 1; return `10:02:${String(t % 60).padStart(2, '0')}`; };
  lines.push(`Nov  4 10:01:55 fw01 kernel: [UFW ALLOW] SRC=192.0.2.15 DST=203.0.113.10 PROTO=TCP DPT=443`);
  ports.forEach((p) => lines.push(`Nov  4 ${stamp()} fw01 kernel: [UFW BLOCK] SRC=198.51.100.77 DST=203.0.113.10 PROTO=TCP DPT=${p} SYN`));
  lines.splice(6, 0, 'Nov  4 10:02:05 fw01 kernel: [UFW ALLOW] SRC=192.0.2.200 DST=203.0.113.10 PROTO=TCP DPT=443');
  lines.splice(12, 0, 'Nov  4 10:02:09 fw01 kernel: [UFW ALLOW] SRC=192.0.2.15 DST=203.0.113.10 PROTO=TCP DPT=80');
  return lines.join('\n');
})();

// ─────────────────────────── MÓDULO 4 · REDES Y SERVICIOS ───────────────────────────

const m4c = {
  id: 'm4-puertos',
  module: 'm4',
  teams: ALL,
  title: 'Puertos y servicios',
  story: {
    red: 'Para saber por dónde podría entrar alguien hay que entender qué escucha una máquina. Empieza por un servidor del laboratorio al que tienes acceso legítimo.',
    blue: 'No puedes proteger lo que no sabes que existe. Hoy haces inventario de lo que escucha en tu propio servidor web.',
    purple: 'Rojo verá los puertos desde fuera; Azul, desde dentro. Tú aprendes a mirar desde los dos lados.',
  },
  lesson: [
    { title: 'IP y puertos', text: 'La IP identifica la máquina; el puerto, el servicio dentro de ella. Algunos habituales: 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 80 HTTP, 443 HTTPS, 3306 MySQL, 3389 Escritorio remoto.' },
    { title: 'El saludo TCP', text: 'Una conexión TCP empieza con tres pasos: SYN (quiero hablar) → SYN-ACK (vale, te escucho) → ACK (empezamos). Si un puerto está cerrado, responde RST; si un cortafuegos lo filtra, no responde nada.', visual: 'handshake' },
    { title: 'Mirar desde dentro', text: 'En tu propio servidor, «ss -tulpn» lista los puertos a la escucha y el programa que los abre. Lo que escucha en 0.0.0.0 acepta conexiones desde cualquier red.', code: '$ ss -tulpn' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Inventario del servidor',
      prompt: 'Estás en srv-web01, un servidor de Nébula. Averigua qué servicios escuchan.',
      scenario: { host: 'srv-web01', listening: LISTENING, services: SERVICES },
      objectives: [
        { id: 'ss', text: 'Lista los puertos a la escucha', how: 'ss -tulpn', check: ev('ss') },
        { id: 'db', text: '¿En qué puerto escucha la base de datos?', answer: ['3306'], placeholder: 'puerto' },
        { id: 'tel', text: '¿Qué servicio transmite todo sin cifrar (incluidas las contraseñas)?', answer: ['telnet', 'in.telnetd'], placeholder: 'servicio' },
      ],
      solution: ['ss -tulpn'],
      hints: ['ss -tulpn muestra puerto y proceso.', 'Telnet (puerto 23) es el abuelo de SSH, pero sin cifrado.'],
    },
    {
      type: 'order',
      title: 'El saludo de tres pasos',
      prompt: 'Ordena los paquetes de una conexión TCP.',
      items: ['El cliente envía SYN', 'El servidor responde SYN-ACK', 'El cliente envía ACK', 'Empieza el intercambio de datos'],
      explain: 'SYN → SYN-ACK → ACK: el «three-way handshake».',
    },
  ],
  learned: ['IP, puerto y servicio', 'El saludo TCP en tres pasos', 'Ver los puertos a la escucha con ss'],
  tip: { red: 'Cada puerto abierto es una puerta: tu informe debe explicar cuáles sobran.', blue: 'Regla de oro: lo que no se usa, se apaga. Lo que se usa, solo para quien lo necesita.', purple: 'Compara siempre la vista interna (ss) con la externa (inventario): las diferencias son las sorpresas.' },
};

const m4r = {
  id: 'm4-informe',
  module: 'm4',
  teams: ['red'],
  title: 'Leer un inventario externo',
  story: 'El equipo ha realizado, dentro del alcance autorizado, el inventario externo de Nébula. Tu tarea es interpretarlo: ¿qué servicios suponen mayor riesgo y por qué?',
  lesson: [
    { title: 'Abierto, cerrado, filtrado', text: 'Abierto: hay un servicio respondiendo. Cerrado: la máquina responde, pero no hay servicio. Filtrado: un cortafuegos impide saberlo. Lo que interesa en un informe es lo abierto y, sobre todo, lo que no debería estarlo.' },
    { title: 'Versiones', text: 'Una versión antigua o sin soporte no recibe parches: cualquier vulnerabilidad publicada seguirá ahí para siempre. Es uno de los hallazgos más comunes.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Analiza el inventario',
      prompt: 'Lee el informe ~/inventario_externo.txt y responde.',
      scenario: { files: { '/home/analista/inventario_externo.txt': SCAN_REPORT } },
      objectives: [
        { id: 'leer', text: 'Lee el inventario', how: 'cat inventario_externo.txt', check: read('/home/analista/inventario_externo.txt') },
        { id: 'eol', text: '¿Qué software está sin soporte desde 2018?', answer: ['MySQL 5.5.62', 'MySQL 5.5', 'mysql'], placeholder: 'Producto versión' },
        { id: 'grep', text: 'Filtra las líneas que contienen «sin» (sin cifrado, sin HTTPS…)', how: 'grep sin inventario_externo.txt', check: ev('grep', (e) => /sin/i.test(e.pattern)) },
        { id: 'panel', text: '¿En qué puerto está el panel de administración sin HTTPS?', answer: ['8080', '8080/tcp'], placeholder: 'puerto' },
      ],
      solution: ['cat inventario_externo.txt', 'grep sin inventario_externo.txt'],
      hints: ['grep muestra solo las líneas que contienen el texto que le pidas.'],
    },
    {
      type: 'classify',
      title: 'Prioriza la exposición',
      prompt: '¿Qué prioridad le darías a cada servicio expuesto a Internet?',
      categories: [{ id: 'alta', label: 'Alta' }, { id: 'media', label: 'Media' }, { id: 'ok', label: 'Aceptable' }],
      items: [
        { text: 'MySQL 5.5 accesible desde Internet', cat: 'alta', explain: 'Una base de datos nunca debería estar expuesta, y menos sin soporte.' },
        { text: 'Telnet abierto en el servidor web', cat: 'alta', explain: 'Credenciales en claro y servicio innecesario.' },
        { text: 'Panel de administración en 8080 sin HTTPS', cat: 'alta', explain: 'Credenciales de administrador viajando sin cifrar.' },
        { text: 'HTTPS (443) con nginx actualizado', cat: 'ok', explain: 'Es el servicio que debe ofrecer la web.' },
        { text: 'SSH (22) actualizado expuesto a Internet', cat: 'media', explain: 'Aceptable con claves y MFA, mejor restringido por IP o tras la VPN.' },
      ],
    },
  ],
  learned: ['Estados de un puerto', 'Por qué el software sin soporte es un riesgo', 'Priorizar servicios expuestos'],
  tip: 'Un buen hallazgo dice qué, dónde, por qué importa y qué hacer: «Desactivar Telnet y usar SSH».',
};

const m4b = {
  id: 'm4-escaneo',
  module: 'm4',
  teams: ['blue'],
  title: 'Cazar un escaneo',
  story: 'El cortafuegos ha registrado un patrón extraño esta mañana: alguien está llamando a muchas puertas del servidor web, una tras otra. Investiga, bloquea al responsable y apaga el servicio que no debería estar.',
  lesson: [
    { title: 'La firma de un escaneo', text: 'Un escaneo de puertos se reconoce en los logs porque una misma IP de origen prueba muchos puertos de destino distintos en pocos segundos.' },
    { title: 'Contar con tuberías', text: 'Encadenando órdenes con | puedes contar: grep filtra, awk/cut extrae columnas, sort ordena y uniq -c cuenta repeticiones.', code: "$ grep BLOCK fw.log | awk '{print $8}' | sort | uniq -c" },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Investiga y contén',
      prompt: 'Analiza /var/log/fw.log, bloquea la IP que está escaneando y desactiva Telnet en srv-web01. Tienes sudo.',
      scenario: { host: 'srv-web01', files: { '/var/log/fw.log': FW_LOG }, listening: LISTENING, services: SERVICES },
      objectives: [
        { id: 'grep', text: 'Filtra las conexiones bloqueadas (BLOCK)', how: 'grep BLOCK /var/log/fw.log', check: ev('grep', (e) => /block/i.test(e.pattern) && e.files.includes('/var/log/fw.log')) },
        { id: 'ip', text: '¿Qué IP está escaneando?', answer: ['198.51.100.77'], placeholder: '0.0.0.0' },
        { id: 'n', text: '¿Cuántos puertos distintos ha probado?', answer: ['18'], placeholder: 'número' },
        { id: 'block', text: 'Bloquea esa IP en el cortafuegos', how: 'sudo iptables -A INPUT -s 198.51.100.77 -j DROP', check: blocked('198.51.100.77') },
        { id: 'telnet', text: 'Para y deshabilita el servicio telnet', how: 'sudo systemctl stop telnet y sudo systemctl disable telnet', check: serviceOff('telnet') },
      ],
      solution: ['grep BLOCK /var/log/fw.log', 'grep -c BLOCK /var/log/fw.log', 'sudo iptables -A INPUT -s 198.51.100.77 -j DROP', 'sudo systemctl stop telnet', 'sudo systemctl disable telnet'],
      hints: ['grep -c cuenta las líneas que coinciden.', 'Fíjate en el campo SRC= de las líneas BLOCK.', 'iptables necesita root: antepón sudo.'],
    },
  ],
  learned: ['Reconocer un escaneo en los logs', 'Contar con grep -c, sort y uniq -c', 'Bloquear con iptables y desactivar servicios con systemctl'],
  tip: 'Un escaneo aislado es ruido de Internet; un escaneo seguido de intentos de acceso es un incidente.',
};

const m4p = {
  id: 'm4-ruido',
  module: 'm4',
  teams: ['purple'],
  title: 'Ruido y señal',
  story: 'Rojo hizo ayer un inventario externo autorizado. Azul asegura que no vio nada. Revisa los logs y averigua qué se detectó y qué no.',
  lesson: [
    { title: 'Telemetría', text: 'Para detectar algo hace falta que alguien lo registre (cortafuegos, IDS, servidor) y que alguien lo mire (SIEM, alertas). Muchos ejercicios morados descubren que el log existía… pero nadie lo miraba.' },
  ],
  challenges: [
    {
      type: 'logs',
      title: 'Marca las líneas del escaneo',
      prompt: 'Selecciona todas las líneas que forman parte del escaneo de puertos.',
      lines: FW_LOG.split('\n').slice(0, 10),
      bad: FW_LOG.split('\n').slice(0, 10).map((l, i) => (l.includes('198.51.100.77') ? i : -1)).filter((i) => i >= 0),
      explain: 'Todas vienen de 198.51.100.77, con destino a puertos distintos, en segundos consecutivos y con paquetes SYN bloqueados.',
    },
    {
      type: 'classify',
      title: '¿Qué lo habría detectado?',
      prompt: 'Clasifica cada fuente de datos según si ve el escaneo externo.',
      categories: [{ id: 'si', label: 'Lo ve' }, { id: 'no', label: 'No lo ve' }],
      items: [
        { text: 'Log del cortafuegos perimetral', cat: 'si', explain: 'Registra cada intento bloqueado.' },
        { text: 'IDS en la red de la DMZ', cat: 'si', explain: 'Tiene firmas específicas de escaneo.' },
        { text: 'Antivirus de los portátiles', cat: 'no', explain: 'El tráfico nunca llegó a los portátiles.' },
        { text: 'Log de acceso de la web (solo registra peticiones HTTP completas)', cat: 'no', explain: 'Un SYN a otros puertos no genera una petición web.' },
      ],
    },
  ],
  learned: ['Telemetría: registrar y mirar', 'Qué fuente ve cada actividad', 'Validar detecciones con ejercicios'],
  tip: 'Acaba cada ejercicio con una tabla: técnica · ¿registrada? · ¿alertada? · ¿respondida?',
};

// ─────────────────────────── MÓDULO 5 · VULNERABILIDADES ───────────────────────────

const PACKAGES = `PAQUETE          VERSIÓN INSTALADA   EXPUESTO A INTERNET
nginx            1.24.0              sí
openssh-server   9.6                 sí
mysql-server     5.5.62              sí
libimagen        2.1.0               no
editor-texto     8.2                 no`;

const ADVISORIES = `BOLETÍN DE SEGURIDAD (ficticio, de laboratorio)
ID          PAQUETE        AFECTA A    CVSS  DESCRIPCIÓN
LAB-2026-01 mysql-server   <=5.5.62    9.8   Ejecución remota sin autenticación
LAB-2026-02 libimagen      <=2.1.0     7.8   Fallo al procesar imágenes manipuladas (requiere abrir el fichero)
LAB-2026-03 editor-texto   <=8.2       3.3   Fuga de información local menor
LAB-2026-04 nginx          <=1.20      7.5   Denegación de servicio`;

const m5c = {
  id: 'm5-cvss',
  module: 'm5',
  teams: ALL,
  title: 'CVE, CWE y CVSS',
  story: {
    red: 'Encontrar un fallo es la mitad del trabajo; la otra mitad es explicar cuánto importa. Para eso existe un idioma común.',
    blue: 'Cada semana se publican cientos de vulnerabilidades. No puedes parchearlo todo a la vez: necesitas saber qué va primero.',
    purple: 'Rojo y Azul discuten sobre la gravedad de un hallazgo. Les enseñas a medirla con la misma regla.',
  },
  lesson: [
    { title: 'CVE', text: 'Un CVE (por ejemplo CVE-2021-44228) es el identificador único de una vulnerabilidad concreta en un producto concreto. Permite hablar de ella sin ambigüedad.' },
    { title: 'CWE', text: 'Un CWE es el TIPO de fallo: CWE-89 inyección SQL, CWE-79 XSS, CWE-798 credenciales en el código… Muchos CVE distintos comparten el mismo CWE.' },
    { title: 'CVSS', text: 'Puntuación de 0 a 10 de la gravedad técnica: 0,1-3,9 baja · 4-6,9 media · 7-8,9 alta · 9-10 crítica. Tiene en cuenta si se ataca por red, si requiere usuario o interacción, y el impacto en confidencialidad, integridad y disponibilidad.', code: 'AV:N  → vector de ataque: red (lo peor)\nPR:N  → no requiere privilegios\nUI:N  → no requiere interacción del usuario\nC:H/I:H/A:H → impacto alto en CIA' },
  ],
  challenges: [
    {
      type: 'quiz',
      title: 'El idioma común',
      questions: [
        { q: '«CWE-89» describe…', options: ['Un tipo de fallo: inyección SQL', 'Una vulnerabilidad concreta de MySQL', 'Una puntuación de gravedad'], correct: 0, explain: 'CWE = categoría del fallo. CVE = caso concreto. CVSS = gravedad.' },
        { q: 'Un CVSS de 9,8 es…', options: ['Medio', 'Alto', 'Crítico'], correct: 2, explain: '9,0-10 es crítico.' },
        { q: 'Si una vulnerabilidad requiere que la víctima abra un fichero, en CVSS…', options: ['UI:R (requiere interacción): baja algo la puntuación', 'No cambia nada', 'Sube a 10 automáticamente'], correct: 0, explain: 'Requerir interacción hace la explotación menos probable.' },
      ],
    },
    {
      type: 'order',
      title: 'De más a menos grave',
      prompt: 'Ordena por puntuación CVSS, de la más grave a la menos grave.',
      items: ['Ejecución remota sin autenticación (9,8)', 'Fallo con un fichero manipulado que hay que abrir (7,8)', 'Denegación de servicio (7,5)', 'Fuga de información local menor (3,3)'],
      explain: 'Remoto + sin autenticación + impacto total es lo peor posible.',
    },
  ],
  learned: ['CVE, CWE y CVSS', 'Rangos de severidad', 'Qué factores suben o bajan la puntuación'],
  tip: { red: 'Pon siempre el vector CVSS completo en tu informe: así cualquiera puede revisar tu puntuación.', blue: 'El CVSS mide la gravedad técnica; tu prioridad real también depende de si el sistema está expuesto y de lo importante que sea.', purple: 'Comprueba si existen catálogos de vulnerabilidades explotadas activamente (como el KEV de CISA): esas van primero.' },
};

const m5r = {
  id: 'm5-hallazgos',
  module: 'm5',
  teams: ['red'],
  title: 'Priorizar hallazgos',
  story: 'Tu informe para Nébula tiene ya diez hallazgos. El cliente pide un resumen ejecutivo: los tres más graves, justificados.',
  lesson: [
    { title: 'Riesgo = probabilidad × impacto', text: 'Un fallo crítico en un servidor interno apagado importa menos que uno alto en la web principal. El contexto cambia la prioridad real.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Severidad de los hallazgos',
      prompt: 'Asigna a cada hallazgo de la auditoría de Nébula su severidad.',
      categories: [{ id: 'crit', label: 'Crítica' }, { id: 'alta', label: 'Alta' }, { id: 'media', label: 'Media' }, { id: 'baja', label: 'Baja' }],
      items: [
        { text: 'Base de datos sin soporte, expuesta a Internet y con un fallo remoto sin autenticación', cat: 'crit', explain: 'Remoto, sin autenticación y con acceso a los datos.' },
        { text: 'Panel de administración sin HTTPS accesible desde Internet', cat: 'alta', explain: 'Credenciales interceptables por alguien en la red.' },
        { text: 'Cabeceras de seguridad HTTP ausentes en la web', cat: 'media', explain: 'Facilitan otros ataques, pero no dan acceso por sí solas.' },
        { text: 'La web muestra la versión del servidor en un pie de página', cat: 'baja', explain: 'Información útil para el reconocimiento, impacto directo bajo.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Resumen ejecutivo',
      questions: [
        { q: '¿Para quién se escribe el resumen ejecutivo?', options: ['Para la dirección: riesgo para el negocio, sin jerga', 'Para el equipo técnico con todos los detalles', 'Para publicarlo en redes'], correct: 0, explain: 'La dirección decide presupuesto y prioridades: necesita entender el riesgo, no los comandos.' },
        { q: '¿Qué NO debe aparecer en un informe entregado al cliente?', options: ['Recomendaciones de corrección', 'Contraseñas reales o datos personales encontrados', 'Evidencias de cada hallazgo'], correct: 1, explain: 'Las evidencias se anonimizan: nunca se reproducen credenciales ni datos personales.' },
      ],
    },
  ],
  learned: ['Riesgo = probabilidad × impacto', 'Clasificar hallazgos por severidad', 'El resumen ejecutivo'],
  tip: 'Un hallazgo sin recomendación es solo una mala noticia.',
};

const m5b = {
  id: 'm5-parches',
  module: 'm5',
  teams: ['blue'],
  title: 'Gestión de parches',
  story: 'Ha llegado el boletín de seguridad mensual. Cruza los paquetes instalados con el boletín y decide qué se parchea esta noche.',
  lesson: [
    { title: 'Inventario + boletines', text: 'La gestión de vulnerabilidades es un ciclo: inventario de lo que tienes, cruce con los boletines, priorización (gravedad + exposición), parcheo y verificación.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Cruza los datos',
      prompt: 'En ~/vuln tienes el inventario de paquetes y el boletín. Decide.',
      scenario: { files: { '/home/analista/vuln/paquetes.txt': PACKAGES, '/home/analista/vuln/boletin.txt': ADVISORIES } },
      objectives: [
        { id: 'p', text: 'Lee el inventario de paquetes', how: 'cat vuln/paquetes.txt', check: read('/home/analista/vuln/paquetes.txt') },
        { id: 'b', text: 'Lee el boletín', how: 'cat vuln/boletin.txt', check: read('/home/analista/vuln/boletin.txt') },
        { id: 'primero', text: '¿Qué paquete parcheas primero?', answer: ['mysql-server', 'mysql'], placeholder: 'paquete' },
        { id: 'nginx', text: '¿Está afectado tu nginx 1.24.0 por LAB-2026-04? (sí/no)', answer: ['no'], placeholder: 'sí / no' },
      ],
      solution: ['cat vuln/paquetes.txt', 'cat vuln/boletin.txt'],
      hints: ['Busca el CVSS más alto que además afecte a algo expuesto a Internet.', 'LAB-2026-04 afecta a versiones <=1.20.'],
    },
    {
      type: 'order',
      title: 'El ciclo de parcheo',
      prompt: 'Ordena el ciclo de gestión de vulnerabilidades.',
      items: ['Inventario de activos y versiones', 'Cruce con boletines de seguridad', 'Priorización por gravedad y exposición', 'Prueba del parche en preproducción', 'Despliegue en producción', 'Verificación de que la vulnerabilidad ya no existe'],
      explain: 'Sin inventario no hay gestión; sin verificación no hay garantía.',
    },
  ],
  learned: ['Cruzar inventario con boletines', 'Priorizar por gravedad y exposición', 'El ciclo de parcheo'],
  tip: 'Si no puedes parchear todavía, mitiga: restringe el acceso, desactiva la función afectada o pon un WAF delante.',
};

const m5p = {
  id: 'm5-cve-regla',
  module: 'm5',
  teams: ['purple'],
  title: 'Del CVE a la defensa',
  story: 'Se publica una vulnerabilidad grave en un producto que usa Nébula. Mientras llega el parche, coordinas qué hace cada equipo.',
  lesson: [
    { title: 'Ventana de exposición', text: 'Entre que se publica una vulnerabilidad y se instala el parche, la organización está expuesta. El trabajo morado reduce esa ventana: Rojo confirma si afecta, Azul crea detecciones y mitigaciones temporales.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: '¿Quién hace qué?',
      prompt: 'Asigna cada tarea al equipo que la lidera.',
      categories: [{ id: 'red', label: 'Rojo' }, { id: 'blue', label: 'Azul' }, { id: 'purple', label: 'Morado (coordinación)' }],
      items: [
        { text: 'Confirmar, con permiso y de forma controlada, si el sistema es vulnerable', cat: 'red', explain: 'Validación ofensiva controlada.' },
        { text: 'Desplegar una mitigación temporal y una alerta', cat: 'blue', explain: 'Proteger y vigilar mientras llega el parche.' },
        { text: 'Comprobar que la alerta salta cuando Rojo repite la prueba', cat: 'purple', explain: 'Validar la detección con la prueba real.' },
        { text: 'Aplicar el parche definitivo', cat: 'blue', explain: 'Corrección en producción.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Prioridad real',
      questions: [
        { q: 'Dos vulnerabilidades: A (CVSS 9,1, servidor interno sin datos) y B (CVSS 8,1, explotada activamente, en la web pública). ¿Cuál va primero?', options: ['A, porque tiene más CVSS', 'B, porque se está explotando y está expuesta', 'Ninguna'], correct: 1, explain: 'La explotación activa y la exposición pesan más que unas décimas de CVSS.' },
      ],
    },
  ],
  learned: ['La ventana de exposición', 'Reparto de tareas entre equipos', 'Priorizar con contexto'],
  tip: 'Lleva un registro de «días desde la publicación hasta el parche»: es una métrica excelente.',
};

export default [m4c, m4r, m4b, m4p, m5c, m5r, m5b, m5p];
