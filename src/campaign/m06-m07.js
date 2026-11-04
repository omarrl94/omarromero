// Módulos 6-7: Seguridad web (OWASP) · Criptografía y contraseñas.
import { read, ev } from './helpers.js';
import { sha256, b64encode, rot13 } from '../core/crypto.js';

const ALL = ['red', 'blue', 'purple'];

// ─────────────────────────── MÓDULO 6 · SEGURIDAD WEB ───────────────────────────

const SQL_CODE = [
  "app.post('/login', async (req, res) => {",
  '  const { usuario, clave } = req.body;',
  "  const sql = \"SELECT * FROM usuarios WHERE nombre = '\" + usuario + \"' AND clave_hash = '\" + hash(clave) + \"'\";",
  '  const fila = await db.query(sql);',
  "  if (fila) return res.redirect('/panel');",
  "  res.status(401).send('Acceso denegado');",
  '});',
];

const XSS_CODE = [
  "app.get('/buscar', (req, res) => {",
  '  const termino = req.query.q;',
  '  const resultados = catalogo.buscar(termino);',
  '  res.send(`<h1>Resultados para: ${termino}</h1>` + pintar(resultados));',
  '});',
];

const IDOR_CODE = [
  "app.get('/facturas/:id', requiereSesion, async (req, res) => {",
  '  const factura = await db.facturas.porId(req.params.id);',
  "  if (!factura) return res.status(404).send('No existe');",
  '  res.json(factura);',
  '});',
];

const WEB_LOG = [
  '192.0.2.15 - - [04/Nov/2026:11:02:01] "GET /catalogo HTTP/1.1" 200',
  '192.0.2.15 - - [04/Nov/2026:11:02:07] "GET /buscar?q=palets HTTP/1.1" 200',
  "198.51.100.23 - - [04/Nov/2026:11:03:10] \"POST /login usuario=admin'-- HTTP/1.1\" 302",
  '192.0.2.40 - - [04/Nov/2026:11:03:15] "GET /facturas/1042 HTTP/1.1" 200',
  '198.51.100.23 - - [04/Nov/2026:11:03:22] "GET /buscar?q=%3Cscript%3E HTTP/1.1" 200',
  '198.51.100.23 - - [04/Nov/2026:11:03:30] "GET /facturas/1001 HTTP/1.1" 200',
  '198.51.100.23 - - [04/Nov/2026:11:03:31] "GET /facturas/1002 HTTP/1.1" 200',
  '198.51.100.23 - - [04/Nov/2026:11:03:32] "GET /facturas/1003 HTTP/1.1" 200',
  '192.0.2.15 - - [04/Nov/2026:11:04:00] "GET /contacto HTTP/1.1" 200',
];

const m6c = {
  id: 'm6-owasp',
  module: 'm6',
  teams: ALL,
  title: 'El Top 10 de OWASP',
  story: {
    red: 'La web de Nébula es la puerta principal. Antes de revisar su código, necesitas el mapa de los fallos web más comunes.',
    blue: 'La mayoría de las intrusiones empiezan por una aplicación web. Conoce sus fallos típicos para saber qué vigilar y qué exigir a los desarrolladores.',
    purple: 'La web es donde Rojo y Azul más chocan. OWASP te da el vocabulario para que ambos se entiendan con los desarrolladores.',
  },
  lesson: [
    { title: 'OWASP', text: 'OWASP es una comunidad abierta que publica el Top 10: los riesgos más críticos de las aplicaciones web. Entre ellos: control de acceso roto, fallos criptográficos, inyección, diseño inseguro y mala configuración.' },
    { title: 'Inyección', text: 'Ocurre cuando lo que escribe el usuario se mezcla con código (SQL, HTML, comandos) y el sistema lo interpreta como órdenes. Regla de oro: los datos del usuario nunca se concatenan dentro del código.' },
    { title: 'Control de acceso', text: 'Comprobar que el usuario ha iniciado sesión no basta: hay que comprobar que tiene derecho a ESE recurso concreto. Si cambiando un número de la URL ves datos de otra persona, el control de acceso está roto (IDOR).' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Clasifica los fallos',
      prompt: '¿A qué categoría de OWASP pertenece cada caso?',
      categories: [{ id: 'ac', label: 'Control de acceso roto' }, { id: 'inj', label: 'Inyección' }, { id: 'crypto', label: 'Fallos criptográficos' }, { id: 'conf', label: 'Mala configuración' }],
      items: [
        { text: 'Cambiando /facturas/1042 por /facturas/1041 ves la factura de otro cliente', cat: 'ac', explain: 'No se comprueba que la factura sea tuya (IDOR).' },
        { text: 'La búsqueda pinta tal cual lo que escribes, y el navegador lo ejecuta como código', cat: 'inj', explain: 'XSS: inyección de código en la página.' },
        { text: 'Las contraseñas se guardan con MD5 sin sal', cat: 'crypto', explain: 'MD5 es rapidísimo de romper para contraseñas.' },
        { text: 'El servidor muestra errores detallados con rutas internas al visitante', cat: 'conf', explain: 'Los errores detallados deben ir a los logs, no al usuario.' },
        { text: 'El texto del formulario de acceso se concatena dentro de la consulta SQL', cat: 'inj', explain: 'Inyección SQL.' },
        { text: 'El panel de administración está accesible sin contraseña desde Internet', cat: 'ac', explain: 'Falta de control de acceso.' },
      ],
    },
  ],
  learned: ['El Top 10 de OWASP', 'Inyección: datos mezclados con código', 'Control de acceso e IDOR'],
  tip: { red: 'Revisar código (caja blanca) suele encontrar más fallos y en menos tiempo que probar a ciegas.', blue: 'Exige revisiones de código y análisis automático (SAST) antes de cada despliegue.', purple: 'Cada categoría de OWASP debería tener al menos una detección en los logs web.' },
};

const m6r = {
  id: 'm6-revision',
  module: 'm6',
  teams: ['red'],
  title: 'Revisión de código: ¿dónde está el fallo?',
  story: 'Nébula te da acceso al código fuente de su portal de clientes (auditoría de caja blanca). Revisa tres funciones y localiza los fallos.',
  lesson: [
    { title: 'Caja blanca', text: 'En una auditoría de caja blanca tienes el código. Se busca dónde entran los datos del usuario (req.body, req.query, req.params) y se sigue su camino: ¿llegan a una consulta, a la página o a un recurso sin controles?' },
  ],
  challenges: [
    {
      type: 'code',
      title: 'Función de login',
      prompt: 'Selecciona la línea vulnerable.',
      lang: 'javascript',
      code: SQL_CODE,
      bad: [2],
      question: '¿Qué tipo de fallo es y por qué?',
      options: [
        { text: 'Inyección SQL (CWE-89): el usuario se concatena en la consulta y puede alterar su lógica', correct: true, explain: 'Lo que escribe el usuario pasa a formar parte del código SQL.' },
        { text: 'XSS: se pinta el usuario en la página', correct: false, explain: 'Aquí el dato va a la base de datos, no a la página.' },
        { text: 'No hay fallo porque la contraseña se hashea', correct: false, explain: 'El hash protege la contraseña, pero el campo usuario sigue concatenado.' },
      ],
    },
    {
      type: 'code',
      title: 'Buscador',
      prompt: 'Selecciona la línea vulnerable.',
      lang: 'javascript',
      code: XSS_CODE,
      bad: [3],
      question: '¿Cuál es el impacto?',
      options: [
        { text: 'XSS reflejado (CWE-79): un enlace manipulado podría ejecutar código en el navegador de la víctima, por ejemplo para robar su sesión', correct: true, explain: 'El término de búsqueda se inserta en el HTML sin escapar.' },
        { text: 'Se puede borrar la base de datos', correct: false, explain: 'Este código no toca la base de datos con el término.' },
        { text: 'Ninguno, es solo texto', correct: false, explain: 'Si contiene etiquetas HTML, el navegador las interpreta.' },
      ],
    },
    {
      type: 'code',
      title: 'Descarga de facturas',
      prompt: 'Selecciona la línea donde FALTA un control.',
      lang: 'javascript',
      code: IDOR_CODE,
      bad: [1, 2, 3],
      question: '¿Qué falta?',
      options: [
        { text: 'Comprobar que la factura pertenece al usuario que tiene la sesión (IDOR, CWE-639)', correct: true, explain: 'requiereSesion solo comprueba que hay sesión, no de quién es la factura.' },
        { text: 'Cifrar el número de factura', correct: false, explain: 'Ocultar el número no es un control de acceso.' },
        { text: 'Nada, ya hay requiereSesion', correct: false, explain: 'Autenticación (quién eres) ≠ autorización (a qué tienes derecho).' },
      ],
    },
  ],
  learned: ['Seguir el dato del usuario por el código', 'Reconocer inyección SQL, XSS e IDOR', 'Autenticación frente a autorización'],
  tip: 'En el informe, enlaza cada hallazgo con su CWE y su categoría OWASP: los desarrolladores encontrarán la guía de corrección.',
};

const m6b = {
  id: 'm6-parche-web',
  module: 'm6',
  teams: ['blue'],
  title: 'Parchear la aplicación',
  story: 'La auditoría de Rojo ha dejado tres fallos en el portal de clientes. Eliges las correcciones con los desarrolladores y revisas los logs por si alguien los usó antes.',
  lesson: [
    { title: 'Consultas parametrizadas', text: 'La defensa contra la inyección SQL es separar código y datos: la consulta lleva marcadores (?) y los valores se pasan aparte. La base de datos nunca los interpreta como SQL.', code: "db.query('SELECT * FROM usuarios WHERE nombre = ?', [usuario])" },
    { title: 'Escapar la salida', text: 'Contra el XSS: todo lo que venga del usuario se escapa al pintarlo (< se convierte en &lt;). Los motores de plantillas modernos lo hacen solos.' },
    { title: 'Autorización por objeto', text: 'Contra el IDOR: en cada petición, comprobar que el recurso pertenece al usuario o que tiene permiso explícito.' },
  ],
  challenges: [
    {
      type: 'code',
      title: 'Corrige el login',
      prompt: 'Selecciona la línea que hay que cambiar.',
      lang: 'javascript',
      code: SQL_CODE,
      bad: [2],
      question: '¿Qué corrección aplicas?',
      options: [
        { text: "Consulta parametrizada: db.query('SELECT * FROM usuarios WHERE nombre = ? AND clave_hash = ?', [usuario, hash(clave)])", correct: true, explain: 'Datos y código separados: la causa raíz desaparece.' },
        { text: 'Quitar las comillas simples del usuario con replace', correct: false, explain: 'Las listas negras siempre se quedan cortas: no ataca la causa.' },
        { text: 'Limitar el usuario a 20 caracteres', correct: false, explain: 'Ayuda poco: el fallo sigue existiendo.' },
      ],
    },
    {
      type: 'code',
      title: 'Corrige las facturas',
      prompt: 'Selecciona la línea tras la que añadirías el control.',
      lang: 'javascript',
      code: IDOR_CODE,
      bad: [1, 2],
      question: '¿Qué añades?',
      options: [
        { text: "if (factura.clienteId !== req.usuario.id) return res.status(403).send('Prohibido');", correct: true, explain: 'Autorización por objeto: solo el dueño la ve.' },
        { text: 'Ocultar el botón de otras facturas en la interfaz', correct: false, explain: 'La interfaz no es un control: la URL se puede escribir a mano.' },
        { text: 'Usar números de factura más largos', correct: false, explain: 'Dificulta adivinarlos, pero no impide el acceso.' },
      ],
    },
    {
      type: 'logs',
      title: '¿Lo usó alguien antes?',
      prompt: 'Marca las peticiones del log web que son intentos de abuso.',
      lines: WEB_LOG,
      bad: [2, 4, 5, 6, 7],
      explain: 'La IP 198.51.100.23 intentó una inyección en el login, una prueba de XSS en el buscador y recorrió facturas consecutivas (enumeración de IDOR). La 192.0.2.40 consultó su propia factura: tráfico normal.',
    },
  ],
  learned: ['Consultas parametrizadas', 'Escapar la salida', 'Autorización por objeto', 'Revisar logs web tras un hallazgo'],
  tip: 'Corregir el código es la solución; un WAF es un parche temporal útil mientras tanto.',
};

const m6p = {
  id: 'm6-capas',
  module: 'm6',
  teams: ['purple'],
  title: 'Código seguro y detección',
  story: 'Los desarrolladores han corregido los fallos. Ahora te aseguras de que, si alguien vuelve a intentarlo, Azul se entere.',
  lesson: [
    { title: 'Defensa en capas para la web', text: 'Código seguro (causa raíz) + WAF (filtra patrones conocidos) + logs y alertas (detecta intentos) + pruebas automáticas (evita que el fallo vuelva). Ninguna capa sustituye a la primera.' },
  ],
  challenges: [
    {
      type: 'logs',
      title: 'Patrones para la alerta',
      prompt: 'Marca las líneas que tu nueva regla de detección debería alertar.',
      lines: WEB_LOG,
      bad: [2, 4, 5, 6, 7],
      explain: 'Patrones: caracteres de SQL en el login, etiquetas HTML codificadas en parámetros, y una misma IP recorriendo identificadores consecutivos.',
    },
    {
      type: 'classify',
      title: '¿Qué capa es?',
      prompt: 'Clasifica cada medida.',
      categories: [{ id: 'code', label: 'Código seguro' }, { id: 'waf', label: 'WAF' }, { id: 'det', label: 'Detección' }, { id: 'test', label: 'Pruebas automáticas' }],
      items: [
        { text: 'Consultas parametrizadas en todo el proyecto', cat: 'code', explain: 'Elimina la causa raíz.' },
        { text: 'Regla que bloquea peticiones con patrones de inyección conocidos', cat: 'waf', explain: 'Filtro delante de la aplicación.' },
        { text: 'Alerta si una IP pide más de 20 facturas distintas en un minuto', cat: 'det', explain: 'Detecta enumeración.' },
        { text: 'Test que comprueba que otro usuario recibe un 403 al pedir tu factura', cat: 'test', explain: 'Evita que el fallo regrese en el futuro.' },
      ],
    },
  ],
  learned: ['Capas de defensa web', 'Convertir hallazgos en reglas de detección', 'Pruebas de regresión de seguridad'],
  tip: 'Cada hallazgo corregido debería dejar un test automático: así nunca vuelve.',
};

// ─────────────────────────── MÓDULO 7 · CRIPTOGRAFÍA ───────────────────────────

const NOTA_B64 = b64encode('La clave del wifi de invitados NO se guarda en notas. Úsala solo en el gestor de contraseñas.\n');
const NOTA_ROT = rot13('Base64 y ROT13 no son cifrado: cualquiera los revierte sin clave.');

const RELEASE = {
  'agente-1.4.tar': 'contenido original del agente 1.4',
  'agente-1.5.tar': 'contenido MODIFICADO del agente 1.5 (manipulado)',
  'agente-1.6.tar': 'contenido original del agente 1.6',
};
const SUMS = `${sha256(RELEASE['agente-1.4.tar'])}  agente-1.4.tar\n${sha256('contenido original del agente 1.5')}  agente-1.5.tar\n${sha256(RELEASE['agente-1.6.tar'])}  agente-1.6.tar`;
const INTEGRITY_FILES = {
  '/home/analista/descargas/agente-1.4.tar': RELEASE['agente-1.4.tar'],
  '/home/analista/descargas/agente-1.5.tar': RELEASE['agente-1.5.tar'],
  '/home/analista/descargas/agente-1.6.tar': RELEASE['agente-1.6.tar'],
  '/home/analista/descargas/SHA256SUMS': SUMS,
};

const PASS_CODE = [
  "import hashlib",
  '',
  'def registrar(usuario, clave):',
  '    h = hashlib.md5(clave.encode()).hexdigest()',
  '    db.guardar(usuario, h)',
];

const m7c = {
  id: 'm7-cifrar',
  module: 'm7',
  teams: ALL,
  title: 'Codificar no es cifrar',
  story: {
    red: 'En auditorías aparecen a menudo «contraseñas cifradas» que en realidad solo están codificadas. Aprende a distinguirlo al instante.',
    blue: 'Un compañero dice que sus notas están «cifradas». Compruébalo y verifica, de paso, la integridad de unos ficheros.',
    purple: 'Codificación, cifrado y hash se confunden constantemente en los informes. Aclarar esto evita discusiones entre equipos.',
  },
  lesson: [
    { title: 'Tres cosas distintas', text: 'CODIFICAR (Base64, hexadecimal) cambia el formato y es reversible sin clave. CIFRAR (AES, RSA) solo es reversible con la clave. HASH (SHA-256) es una huella de un solo sentido: no se «descifra».', visual: 'crypto' },
    { title: 'Hash para la integridad', text: 'Si cambia un solo bit del fichero, su SHA-256 cambia por completo. Por eso los proyectos publican las huellas de sus descargas: si la tuya no coincide, el fichero se ha alterado.', code: '$ sha256sum fichero.tar' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Las «notas cifradas»',
      prompt: 'Revisa las notas de ~/notas y demuestra que no estaban cifradas.',
      scenario: { files: { '/home/analista/notas/nota1.txt': NOTA_B64, '/home/analista/notas/nota2.txt': NOTA_ROT } },
      objectives: [
        { id: 'b64', text: 'Decodifica nota1.txt (está en Base64)', how: 'base64 -d notas/nota1.txt', check: ev('b64decode', (e) => /wifi/.test(e.out)) },
        { id: 'donde', text: 'Según la nota, ¿dónde deben guardarse las claves?', answer: ['en el gestor de contraseñas', 'gestor de contraseñas', 'el gestor de contraseñas'], placeholder: 'en el…' },
        { id: 'rot', text: 'Revierte nota2.txt con ROT13', how: 'cat notas/nota2.txt | rot13', check: ev('rot13', (e) => /cifrado/.test(e.out)) },
      ],
      solution: ['base64 -d notas/nota1.txt', 'cat notas/nota2.txt | rot13'],
      hints: ['base64 -d fichero decodifica.', 'Con una tubería: cat fichero | rot13'],
    },
    {
      type: 'quiz',
      title: '¿Codificar, cifrar o hash?',
      questions: [
        { q: 'aGVsbG8= es…', options: ['Texto en Base64: cualquiera lo decodifica', 'Un cifrado AES', 'Un hash SHA-256'], correct: 0, explain: 'El = final y el alfabeto son típicos de Base64.' },
        { q: '¿Se puede «descifrar» un SHA-256?', options: ['Sí, con la clave', 'No: es una función de un solo sentido. Solo se puede probar candidatos y comparar', 'Sí, con base64 -d'], correct: 1, explain: 'Por eso para contraseñas se usan hashes lentos y con sal: probar candidatos sale carísimo.' },
      ],
    },
  ],
  learned: ['Codificar ≠ cifrar ≠ hash', 'Base64 y ROT13 no protegen nada', 'Hash para verificar integridad'],
  tip: { red: '«Contraseñas en Base64» es un hallazgo de severidad alta: equivale a guardarlas en claro.', blue: 'Los secretos van en un gestor de secretos o de contraseñas, nunca en notas ni en el código.', purple: 'Cuando alguien diga «está cifrado», pregunta siempre: ¿con qué algoritmo y dónde está la clave?' },
};

const m7r = {
  id: 'm7-auditoria-claves',
  module: 'm7',
  teams: ['red'],
  title: 'Auditoría de contraseñas',
  story: 'Nébula quiere saber si su política de contraseñas es suficiente. Analizas la política y el sistema de almacenamiento (sin usar contraseñas reales de nadie).',
  lesson: [
    { title: 'Por qué caen las contraseñas', text: 'La mayoría de las contraseñas comprometidas no se «adivinan»: aparecen en filtraciones anteriores, se reutilizan entre servicios o siguen patrones (Nombre + año + !). La longitud pesa más que la complejidad.' },
    { title: 'Almacenamiento', text: 'Un hash rápido (MD5, SHA-1) permite probar miles de millones de candidatos por segundo. Los algoritmos para contraseñas (bcrypt, scrypt, Argon2) son lentos a propósito y usan sal (un valor aleatorio por usuario), de modo que dos contraseñas iguales dan hashes distintos.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Robustez de contraseñas de ejemplo',
      prompt: 'Clasifica estas contraseñas de ejemplo (inventadas) según su resistencia.',
      categories: [{ id: 'debil', label: 'Débil' }, { id: 'media', label: 'Mejorable' }, { id: 'fuerte', label: 'Robusta' }],
      items: [
        { text: 'Nebula2026!', cat: 'debil', explain: 'Nombre de la empresa + año + símbolo: patrón de los primeros que se prueban.' },
        { text: '123456789', cat: 'debil', explain: 'De las más filtradas del mundo.' },
        { text: 'Tr0mp3ta', cat: 'media', explain: 'Sustituir letras por números es predecible y es corta.' },
        { text: 'caballo-grapa-nube-violeta-27', cat: 'fuerte', explain: 'Frase de paso larga y aleatoria: fácil de recordar y muy difícil de romper.' },
        { text: 'x7#Lq!9vR2@mZ (de un gestor)', cat: 'fuerte', explain: 'Aleatoria y única, guardada en un gestor.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Hallazgos de almacenamiento',
      questions: [
        { q: 'Dos usuarios tienen el mismo hash en la base de datos. ¿Qué indica?', options: ['Que tienen la misma contraseña y NO se usa sal', 'Que son la misma persona', 'Nada relevante'], correct: 0, explain: 'Con sal, contraseñas iguales producen hashes distintos.' },
        { q: '¿Qué recomendarías en el informe?', options: ['Pasar a Argon2id o bcrypt con sal, y MFA', 'Usar MD5 dos veces', 'Cifrar con Base64'], correct: 0, explain: 'Algoritmo lento con sal + MFA es la recomendación estándar.' },
      ],
    },
  ],
  learned: ['Por qué caen las contraseñas', 'Hashes rápidos frente a lentos', 'La sal'],
  tip: 'En una auditoría real, nunca reutilices ni muestres contraseñas: cuenta cuántas son débiles, no cuáles son.',
};

const m7b = {
  id: 'm7-guardar',
  module: 'm7',
  teams: ['blue'],
  title: 'Guardar contraseñas bien',
  story: 'Revisas el módulo de registro de la aplicación interna antes de que salga a producción.',
  lesson: [
    { title: 'Argon2id y bcrypt', text: 'Son algoritmos diseñados para contraseñas: lentos, con sal automática y con un coste configurable que se aumenta con los años.', code: 'from argon2 import PasswordHasher\nph = PasswordHasher()\nh = ph.hash(clave)        # incluye la sal\nph.verify(h, intento)' },
    { title: 'MFA', text: 'La autenticación multifactor combina algo que sabes (contraseña) con algo que tienes (app, llave física). Bloquea la gran mayoría de los accesos con contraseñas robadas.' },
  ],
  challenges: [
    {
      type: 'code',
      title: 'Registro de usuarios',
      prompt: 'Selecciona la línea problemática.',
      lang: 'python',
      code: PASS_CODE,
      bad: [3],
      question: '¿Cómo la corriges?',
      options: [
        { text: 'h = PasswordHasher().hash(clave)  # Argon2id con sal', correct: true, explain: 'Algoritmo lento y con sal, pensado para contraseñas.' },
        { text: 'h = hashlib.sha256(clave.encode()).hexdigest()', correct: false, explain: 'SHA-256 también es rápido y sin sal: mejor que MD5, pero no adecuado.' },
        { text: 'h = base64.b64encode(clave.encode())', correct: false, explain: 'Eso es codificar: equivale a guardarla en claro.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Política de contraseñas',
      questions: [
        { q: '¿Qué política es mejor hoy?', options: ['Mínimo 12-14 caracteres, comprobar contra listas de filtradas, MFA y cambio solo si hay sospecha', 'Cambiar la contraseña cada 30 días', '8 caracteres con mayúscula, número y símbolo obligatorios'], correct: 0, explain: 'Es lo que recomiendan las guías actuales (por ejemplo, NIST SP 800-63B).' },
      ],
    },
  ],
  learned: ['Argon2id / bcrypt', 'Por qué MD5 o SHA-256 no valen para contraseñas', 'MFA y políticas modernas'],
  tip: 'Activa MFA primero en las cuentas de administración y en el correo: son las que más se atacan.',
};

const m7p = {
  id: 'm7-integridad',
  module: 'm7',
  teams: ['purple'],
  title: 'Integridad de la cadena de suministro',
  story: 'Rojo plantea un escenario: «¿y si alguien manipula el agente de monitorización que descargamos?». Azul tiene las huellas oficiales. Comprueba qué fichero se ha alterado.',
  lesson: [
    { title: 'Cadena de suministro', text: 'Los atacantes a veces no atacan a la empresa, sino a su software o proveedores. Verificar hashes y firmas de lo que se instala es una defensa básica.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Verifica las descargas',
      prompt: 'Compara el SHA-256 de cada fichero de ~/descargas con el publicado en SHA256SUMS.',
      scenario: { files: INTEGRITY_FILES },
      objectives: [
        { id: 'sums', text: 'Lee las huellas oficiales', how: 'cat descargas/SHA256SUMS', check: read('/home/analista/descargas/SHA256SUMS') },
        { id: 'calc', text: 'Calcula el SHA-256 de los tres ficheros .tar', how: 'cd descargas y sha256sum agente-1.4.tar agente-1.5.tar agente-1.6.tar', check: (st) => ['4', '5', '6'].every((v) => st.log.some((e) => e.type === 'sha256sum' && e.files.includes(`/home/analista/descargas/agente-1.${v}.tar`))) },
        { id: 'cual', text: '¿Qué fichero ha sido manipulado?', answer: ['agente-1.5.tar'], placeholder: 'fichero' },
      ],
      solution: ['cd descargas', 'cat SHA256SUMS', 'sha256sum agente-1.4.tar agente-1.5.tar agente-1.6.tar'],
      hints: ['sha256sum admite varios ficheros a la vez.', 'Compara los primeros caracteres de cada huella.'],
    },
    {
      type: 'quiz',
      title: 'Más allá del hash',
      questions: [
        { q: 'Si el atacante controla la web de descarga, puede cambiar también SHA256SUMS. ¿Qué lo evita?', options: ['Una firma digital con la clave del proveedor (GPG, Sigstore…)', 'Descargar dos veces', 'Usar MD5'], correct: 0, explain: 'La firma demuestra quién publicó el fichero; el hash solo que no ha cambiado respecto a la huella que tienes.' },
      ],
    },
  ],
  learned: ['Verificar integridad con sha256sum', 'Ataques a la cadena de suministro', 'Hash frente a firma digital'],
  tip: 'Automatiza la verificación de firmas en tu pipeline de despliegue.',
};

// ── Pasos añadidos a las lecciones comunes ──
m6c.lesson.push(
  { title: 'Cómo se corrige', text: 'Cada fallo tiene su corrección de raíz. Inyección SQL: consultas parametrizadas, con los datos aparte de la consulta. XSS: escapar la salida (htmlspecialchars en PHP, o una plantilla que escape sola). IDOR: comprobar en cada petición que el recurso pertenece al usuario. Secretos: nunca escritos en el código (CWE-798), sino en el servidor. Un WAF filtra patrones conocidos, pero no sustituye al código seguro.', code: "db.query('SELECT * FROM usuarios WHERE nombre = ?', [usuario])" },
);
m7c.lesson.push(
  { title: 'Practicar en la terminal', text: 'base64 -d decodifica Base64. rot13 aplica ROT13, un cifrado César de 13 posiciones que se revierte aplicándolo otra vez. sha256sum calcula la huella de un fichero. Para reconocer un hash por su longitud: MD5 = 32 caracteres hexadecimales, SHA-1 = 40 y SHA-256 = 64.', code: '$ base64 -d nota.txt\n$ cat nota.txt | rot13\n$ sha256sum descarga.tar' },
  { title: 'Contraseñas y firmas', text: 'Las contraseñas se guardan con algoritmos lentos y con sal, como Argon2id o bcrypt. La sal es un valor aleatorio por usuario que hace que dos contraseñas iguales den hashes distintos. MD5 o SHA-256 a secas son demasiado rápidos. Y para saber QUIÉN publicó un fichero no basta un hash: hace falta una firma digital.' },
);

export default [m6c, m6r, m6b, m6p, m7c, m7r, m7b, m7p];
