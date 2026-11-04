// Módulos 1-3: Inducción y ética · Linux y permisos · Reconocimiento pasivo (OSINT).
import { read, ran, ev, modeIs, all } from './helpers.js';
import { WHOIS, DNS } from '../world/nebula.js';

const ALL = ['red', 'blue', 'purple'];

// ─────────────────────────── MÓDULO 1 · INDUCCIÓN ───────────────────────────

const m1c = {
  id: 'm1-terminal',
  module: 'm1',
  teams: ALL,
  title: 'Primer día en JROTERO',
  story: {
    red: 'Bienvenido a JROTERO Ciberseguridad. Te incorporas al equipo de auditoría. Antes de tocar un solo sistema de un cliente necesitas dominar tu herramienta principal: la terminal.',
    blue: 'Bienvenido al SOC de JROTERO Ciberseguridad. Aquí los incidentes se investigan desde la terminal: si no te mueves con soltura por ella, el atacante siempre irá un paso por delante.',
    purple: 'Bienvenido a JROTERO. Vas a trabajar con los dos equipos, y los dos hablan el mismo idioma: la terminal de Linux. Empieza por ahí.',
  },
  lesson: [
    { title: 'La terminal', text: 'Una terminal es una conversación con el sistema: escribes una orden, pulsas Intro y te responde. Los profesionales de ciberseguridad la usan porque es rápida, precisa y se puede automatizar.' },
    { title: 'Dónde estoy y qué hay', text: '«pwd» te dice en qué carpeta estás. «ls» lista lo que hay dentro. Con «ls -a» ves también los ficheros ocultos (los que empiezan por punto): mucha información interesante se esconde así.', code: '$ pwd\n/home/analista\n$ ls -a\n.  ..  .bashrc  documentos/' },
    { title: 'Moverse y leer', text: '«cd carpeta» entra en una carpeta y «cd ..» sube un nivel. «cat fichero» muestra su contenido. Pulsa Tab para autocompletar y ↑ para recuperar órdenes anteriores.', code: '$ cd documentos\n$ cat bienvenida.txt' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Explora tu puesto',
      prompt: 'Tu responsable te ha dejado instrucciones en tu carpeta personal. Encuéntralas y sigue la pista hasta el código de acceso.',
      scenario: {
        files: {
          '/home/analista/LEEME.txt': 'Bienvenida/o a JROTERO.\nTus primeras instrucciones están en la carpeta «documentos».\nPista: no todo lo que hay en una carpeta se ve con un simple ls.',
          '/home/analista/documentos/bienvenida.txt': 'Paso 1 completado.\nEl código de acceso está en un fichero OCULTO dentro de documentos.',
          '/home/analista/documentos/.codigo_acceso': 'Código de acceso: OTERO-2026\nGuárdalo bien: nunca compartas credenciales por chat ni correo.',
          '/home/analista/.bashrc': '# configuración de la shell',
        },
      },
      objectives: [
        { id: 'leeme', text: 'Lee el fichero LEEME.txt de tu carpeta personal', how: 'Escribe: cat LEEME.txt', check: read('/home/analista/LEEME.txt') },
        { id: 'docs', text: 'Entra en la carpeta documentos y lee la bienvenida', how: 'cd documentos y después cat bienvenida.txt', check: read('/home/analista/documentos/bienvenida.txt') },
        { id: 'ocultos', text: 'Lista los ficheros ocultos de documentos', how: 'ls -a muestra los ficheros que empiezan por punto', check: ev('ls', (e) => e.path === '/home/analista/documentos' && e.flags.includes('a')) },
        { id: 'codigo', text: '¿Cuál es el código de acceso?', answer: ['OTERO-2026'], placeholder: 'XXXXX-0000' },
      ],
      solution: ['cat LEEME.txt', 'cd documentos', 'cat bienvenida.txt', 'ls -a', 'cat .codigo_acceso'],
      hints: ['Empieza por «ls» y «cat LEEME.txt».', 'Los ficheros ocultos empiezan por un punto. Prueba «ls -a» dentro de documentos.'],
    },
    {
      type: 'quiz',
      title: 'La tríada CIA',
      questions: [
        { q: 'Un empleado consulta sin permiso las nóminas de sus compañeros. ¿Qué principio se ha roto?', options: ['Confidencialidad', 'Integridad', 'Disponibilidad'], correct: 0, explain: 'Confidencialidad: la información solo debe verla quien está autorizado.' },
        { q: 'Alguien cambia el IBAN de una factura antes de que se pague. ¿Qué principio se ha roto?', options: ['Confidencialidad', 'Integridad', 'Disponibilidad'], correct: 1, explain: 'Integridad: la información no debe modificarse sin autorización ni de forma inadvertida.' },
        { q: 'La web de pedidos se cae durante horas por una avalancha de peticiones. ¿Qué principio se ha roto?', options: ['Confidencialidad', 'Integridad', 'Disponibilidad'], correct: 2, explain: 'Disponibilidad: los sistemas deben estar accesibles cuando se necesitan.' },
      ],
    },
  ],
  learned: ['Moverte por la terminal con pwd, ls, cd y cat', 'Los ficheros ocultos (ls -a)', 'La tríada CIA: Confidencialidad, Integridad y Disponibilidad'],
  tip: { red: 'En una auditoría, todo lo que encuentres se documenta con precisión: ruta, hora y contenido.', blue: 'En un incidente, la terminal es tu lupa: aprenderás a leer cientos de líneas en segundos.', purple: 'Rojo y Azul usan las mismas herramientas con objetivos distintos: conocerlas te permite traducir entre ambos.' },
};

const m1r = {
  id: 'm1-roe',
  module: 'm1',
  teams: ['red'],
  title: 'Las reglas del juego',
  story: 'Nébula Logística ha contratado a JROTERO para una auditoría. Antes de empezar, el jefe de equipo te entrega el contrato y las reglas de enfrentamiento. Un auditor sin permiso por escrito no es un auditor: es un delincuente.',
  lesson: [
    { title: 'Hacking ético = permiso', text: 'La diferencia entre un auditor y un atacante no está en las técnicas, sino en la AUTORIZACIÓN. En España, acceder sin permiso a un sistema es delito (art. 197 bis del Código Penal), aunque «no rompas nada».' },
    { title: 'Reglas de enfrentamiento (RoE)', text: 'Documento que fija el alcance (qué sistemas sí y cuáles no), las fechas y horas, las técnicas permitidas, los contactos de emergencia y qué hacer si encuentras datos personales. Todo lo que esté fuera del alcance, NO se toca.' },
    { title: 'Datos personales', text: 'Si durante una prueba ves datos personales, se aplica el RGPD: no los copies, no los difundas, documenta el hallazgo de forma mínima y avisa al contacto del cliente.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: '¿Permitido o prohibido?',
      prompt: 'El alcance firmado incluye solo www.nebula-logistica.lab y la VPN, del 4 al 8 de noviembre, de 9:00 a 18:00. Clasifica cada acción.',
      categories: [{ id: 'ok', label: 'Permitido' }, { id: 'no', label: 'Prohibido' }],
      items: [
        { text: 'Revisar la web www.nebula-logistica.lab el 5 de noviembre a las 11:00', cat: 'ok', explain: 'Está en el alcance y dentro de la ventana horaria.' },
        { text: 'Analizar la web de un proveedor de Nébula «porque está conectada»', cat: 'no', explain: 'Un tercero NO está en el alcance aunque esté relacionado. Haría falta su propio permiso.' },
        { text: 'Seguir probando la VPN el sábado 9 porque quedan cosas', cat: 'no', explain: 'Fuera de la ventana temporal firmada.' },
        { text: 'Avisar al contacto de emergencia al encontrar un fallo crítico', cat: 'ok', explain: 'Correcto: los hallazgos críticos se comunican de inmediato.' },
        { text: 'Descargar la base de datos de clientes «como prueba»', cat: 'no', explain: 'Nunca se extraen datos reales: basta con demostrar el acceso de forma mínima.' },
        { text: 'Documentar cada prueba con fecha, hora y objetivo', cat: 'ok', explain: 'La trazabilidad protege al cliente y al auditor.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Ética y ley',
      questions: [
        { q: 'Encuentras por casualidad un fallo en la web de tu ayuntamiento. ¿Qué haces?', options: ['Lo exploto un poco para confirmar que es real', 'Lo comunico por el canal oficial (divulgación responsable) sin acceder a nada', 'Lo publico en redes para presionar'], correct: 1, explain: 'Divulgación responsable: informar sin explotar. Muchos organismos tienen un canal o una política para ello (por ejemplo, security.txt).' },
        { q: '¿Qué documento define qué sistemas puedes auditar?', options: ['El alcance (scope) dentro de las reglas de enfrentamiento', 'Un correo del becario de sistemas', 'Lo que aparece en Google'], correct: 0, explain: 'El alcance, firmado por alguien con autoridad para darlo.' },
      ],
    },
  ],
  learned: ['Sin autorización por escrito no hay auditoría', 'Alcance, ventana temporal y contactos de emergencia', 'Divulgación responsable'],
  tip: 'Lleva siempre contigo (en digital) la carta de autorización durante una auditoría.',
};

const m1b = {
  id: 'm1-guardian',
  module: 'm1',
  teams: ['blue'],
  title: 'El guardián',
  story: 'Tu primer turno en el SOC. La pantalla de alertas no para. Antes de actuar hay que saber qué se está protegiendo y qué tipo de daño causa cada incidente.',
  lesson: [
    { title: 'Defensa en profundidad', text: 'Ninguna medida es perfecta, así que se apilan capas: formación, cortafuegos, actualizaciones, contraseñas robustas con MFA, copias de seguridad y monitorización. Si una capa falla, la siguiente frena al atacante.' },
    { title: 'Prevenir, detectar, responder', text: 'Un buen equipo azul no solo pone barreras: también detecta cuando alguien las salta y sabe responder rápido para limitar el daño.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: '¿Qué se ha roto?',
      prompt: 'Clasifica cada incidente según el principio de la tríada CIA que afecta principalmente.',
      categories: [{ id: 'c', label: 'Confidencialidad' }, { id: 'i', label: 'Integridad' }, { id: 'a', label: 'Disponibilidad' }],
      items: [
        { text: 'Un portátil sin cifrar con datos de clientes se pierde en el tren', cat: 'c', explain: 'Cualquiera podría leer los datos.' },
        { text: 'Un ransomware cifra el servidor de ficheros', cat: 'a', explain: 'Los ficheros dejan de estar accesibles (y a menudo también hay robo de datos).' },
        { text: 'Alguien modifica el precio de los productos en la tienda online', cat: 'i', explain: 'Los datos han sido alterados sin autorización.' },
        { text: 'El cable de fibra de la oficina se corta durante una obra', cat: 'a', explain: 'La disponibilidad también se rompe sin atacantes.' },
        { text: 'Una contraseña se envía por correo sin cifrar y alguien la intercepta', cat: 'c', explain: 'Se ha expuesto información secreta.' },
      ],
    },
    {
      type: 'classify',
      title: 'Capas de defensa',
      prompt: '¿Cada control sirve sobre todo para prevenir, para detectar o para responder/recuperar?',
      categories: [{ id: 'p', label: 'Prevenir' }, { id: 'd', label: 'Detectar' }, { id: 'r', label: 'Responder / recuperar' }],
      items: [
        { text: 'Autenticación multifactor (MFA)', cat: 'p', explain: 'Impide el acceso aunque roben la contraseña.' },
        { text: 'Alertas del SIEM por inicios de sesión anómalos', cat: 'd', explain: 'Avisan cuando algo raro ocurre.' },
        { text: 'Copias de seguridad desconectadas y probadas', cat: 'r', explain: 'Permiten recuperarse de un ransomware.' },
        { text: 'Aplicar parches de seguridad', cat: 'p', explain: 'Cierra la puerta antes de que la usen.' },
        { text: 'Plan de respuesta a incidentes', cat: 'r', explain: 'Define quién hace qué cuando ocurre algo.' },
        { text: 'Revisión diaria de registros (logs)', cat: 'd', explain: 'Permite descubrir actividad sospechosa.' },
      ],
    },
  ],
  learned: ['Clasificar incidentes según la tríada CIA', 'Defensa en profundidad', 'Prevenir · Detectar · Responder'],
  tip: 'Las copias de seguridad que nunca se han restaurado no son copias: son esperanzas.',
};

const m1p = {
  id: 'm1-moneda',
  module: 'm1',
  teams: ['purple'],
  title: 'Las dos caras de la moneda',
  story: 'El director te presenta a los dos equipos: Rojo quiere demostrar que puede entrar; Azul, que puede impedirlo. Tu trabajo es que colaboren para que la empresa mejore. Empiezas aprendiendo el idioma común: MITRE ATT&CK.',
  lesson: [
    { title: 'El equipo morado', text: 'No siempre es un equipo aparte: es una forma de trabajar. Rojo ejecuta (con permiso) una técnica concreta, Azul comprueba si la detecta y entre todos corrigen lo que falle. Se repite hasta cubrir las técnicas más probables.' },
    { title: 'MITRE ATT&CK', text: 'Catálogo público de tácticas (el «para qué»: acceso inicial, persistencia, escalada de privilegios, exfiltración…) y técnicas (el «cómo») observadas en ataques reales. Permite decir «detectamos la técnica T1110 (fuerza bruta)» y que todo el mundo lo entienda.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Ataque ↔ defensa',
      prompt: 'Empareja cada técnica del adversario con el control defensivo que mejor la frena.',
      categories: [{ id: 'mfa', label: 'MFA' }, { id: 'patch', label: 'Parches al día' }, { id: 'aware', label: 'Concienciación' }, { id: 'backup', label: 'Copias de seguridad' }],
      items: [
        { text: 'Robo de contraseñas mediante una web falsa', cat: 'mfa', explain: 'Con MFA, la contraseña robada no basta.' },
        { text: 'Aprovechar una vulnerabilidad conocida de un servidor', cat: 'patch', explain: 'Si está parcheado, la vulnerabilidad ya no existe.' },
        { text: 'Correo que suplanta al director pidiendo una transferencia urgente', cat: 'aware', explain: 'La formación enseña a verificar por otro canal.' },
        { text: 'Cifrado de los datos de la empresa para pedir un rescate', cat: 'backup', explain: 'Con copias desconectadas se recupera sin pagar.' },
      ],
    },
    {
      type: 'classify',
      title: 'Tácticas de ATT&CK',
      prompt: '¿A qué táctica (el «para qué») corresponde cada acción del adversario?',
      categories: [{ id: 'init', label: 'Acceso inicial' }, { id: 'pers', label: 'Persistencia' }, { id: 'priv', label: 'Escalada de privilegios' }, { id: 'exfil', label: 'Exfiltración' }],
      items: [
        { text: 'Entrar con un correo de phishing con un adjunto malicioso', cat: 'init', explain: 'Es la forma de entrar por primera vez.' },
        { text: 'Crear una tarea programada que se ejecuta en cada arranque', cat: 'pers', explain: 'Garantiza que el acceso sobreviva a un reinicio.' },
        { text: 'Pasar de un usuario normal a administrador', cat: 'priv', explain: 'Ganar más permisos de los que se tenían.' },
        { text: 'Enviar ficheros robados a un servidor externo', cat: 'exfil', explain: 'Sacar información de la organización.' },
      ],
    },
  ],
  learned: ['Qué es un ejercicio morado', 'Tácticas y técnicas de MITRE ATT&CK', 'Relacionar cada técnica con su control'],
  tip: 'El éxito de un ejercicio morado se mide en detecciones nuevas, no en «cuántas veces entró Rojo».',
};

// ─────────────────────────── MÓDULO 2 · LINUX Y PERMISOS ───────────────────────────

const PERM_FILES = {
  '/home/analista/.ssh/id_ed25519': { content: '-----BEGIN OPENSSH PRIVATE KEY-----\n(clave de laboratorio, no válida)\n-----END OPENSSH PRIVATE KEY-----', mode: 'rw-rw-rw-', owner: 'analista' },
  '/home/analista/.ssh/id_ed25519.pub': { content: 'ssh-ed25519 AAAAC3Nza-LAB analista@soc-lab', mode: 'rw-r--r--', owner: 'analista' },
  '/home/analista/notas.txt': { content: 'Revisar permisos de la clave SSH y del script de copias.', mode: 'rw-r--r--', owner: 'analista' },
  '/opt/copias/backup.sh': { content: '#!/bin/bash\n# Lo ejecuta root cada noche desde cron\ntar czf /srv/copias/web.tgz /var/www', mode: 'rwxrwxrwx', owner: 'root' },
  '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nanalista:x:1000:1000:Analista:/home/analista:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
};

const m2c = {
  id: 'm2-permisos',
  module: 'm2',
  teams: ALL,
  title: 'Usuarios y permisos',
  story: {
    red: 'En una auditoría, los permisos mal puestos son de los hallazgos más frecuentes. Para reconocerlos primero hay que entenderlos.',
    blue: 'La mitad del bastionado de un servidor consiste en que cada usuario tenga solo los permisos que necesita. Hoy aprendes a leerlos y a corregirlos.',
    purple: 'Los permisos son el terreno donde Rojo busca atajos y Azul pone vallas. Apréndelos bien: aparecerán en todos los ejercicios.',
  },
  lesson: [
    { title: 'Leer permisos', text: '«ls -l» muestra algo como -rw-r--r--. Después del tipo (- fichero, d carpeta) vienen tres grupos de tres letras: dueño, grupo y otros. r = leer, w = escribir, x = ejecutar.', code: '-rw-r--r--  analista  notas.txt\n │└┬┘└┬┘└┬┘\n │ │  │  └ otros: solo leer\n │ │  └ grupo: solo leer\n │ └ dueño: leer y escribir\n └ fichero' },
    { title: 'Números', text: 'Cada permiso vale un número: r=4, w=2, x=1. Se suman por grupo: rw- = 6, r-- = 4, rwx = 7. Así, 600 = solo el dueño lee y escribe; 755 = el dueño todo, los demás leer y ejecutar.', code: '$ chmod 600 secreto.txt   # -rw-------' },
    { title: 'Mínimo privilegio', text: 'Cada usuario y cada programa debe tener únicamente los permisos imprescindibles. Una clave privada legible por todos o un script de root que cualquiera puede modificar son puertas abiertas.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Revisión de permisos',
      prompt: 'Revisa los permisos de tu clave SSH privada y corrígelos: solo tú debes poder leerla y escribirla.',
      scenario: { files: PERM_FILES },
      objectives: [
        { id: 'ls', text: 'Lista con detalle la carpeta ~/.ssh', how: 'ls -l ~/.ssh', check: ev('ls', (e) => e.path === '/home/analista/.ssh' && e.flags.includes('l')) },
        { id: 'perm', text: '¿Qué permisos (en números) tiene ahora la clave privada id_ed25519?', answer: ['666'], placeholder: 'NNN' },
        { id: 'fix', text: 'Déjala con permisos 600', how: 'chmod 600 ~/.ssh/id_ed25519', check: modeIs('/home/analista/.ssh/id_ed25519', '600') },
      ],
      solution: ['ls -l ~/.ssh', 'chmod 600 ~/.ssh/id_ed25519'],
      hints: ['rw- vale 4+2 = 6. Mira los tres grupos de la clave privada.', 'Usa chmod con tres cifras: dueño, grupo y otros.'],
    },
    {
      type: 'quiz',
      title: 'Comprueba lo aprendido',
      questions: [
        { q: '¿Qué significa -rwxr-x--- ?', options: ['Dueño todo; grupo leer y ejecutar; otros nada', 'Todos pueden ejecutar', 'Solo root puede leerlo'], correct: 0, explain: 'rwx (7) para el dueño, r-x (5) para el grupo y --- (0) para el resto: 750.' },
        { q: 'Un script lo ejecuta root cada noche y tiene permisos 777. ¿Por qué es grave?', options: ['No es grave, solo ocupa espacio', 'Cualquier usuario podría modificarlo y su contenido se ejecutaría como root', 'Porque se ejecuta muy despacio'], correct: 1, explain: 'Si cualquiera puede escribirlo, cualquiera puede decidir qué hará root esta noche.' },
      ],
    },
  ],
  learned: ['Leer permisos con ls -l', 'Notación octal: r=4, w=2, x=1', 'chmod y el principio de mínimo privilegio'],
  tip: { red: 'Un fichero 777 ejecutado por root es un hallazgo de severidad alta en cualquier informe.', blue: 'Revisa periódicamente los ficheros que cualquiera puede escribir: find / -perm -o+w -type f', purple: 'Convierte cada permiso peligroso en una comprobación automática que se ejecute cada día.' },
};

const m2r = {
  id: 'm2-config',
  module: 'm2',
  teams: ['red'],
  title: 'Configuraciones que delatan',
  story: 'El cliente te pasa (dentro del alcance) varios fragmentos de configuración de sus servidores para una revisión. Tu trabajo es detectar qué decisiones abren la puerta a un atacante que ya hubiera entrado con un usuario sin privilegios.',
  lesson: [
    { title: 'Revisión de configuración', text: 'Una parte importante de una auditoría no consiste en «atacar», sino en leer configuraciones con mirada crítica: ¿qué pasaría si un usuario cualquiera hiciera esto? Cada respuesta inquietante es un hallazgo.' },
    { title: 'sudo', text: 'El fichero sudoers decide quién puede ejecutar qué como administrador. Conceder demasiado (o sin contraseña) convierte cualquier cuenta robada en una cuenta de administrador.' },
  ],
  challenges: [
    {
      type: 'code',
      title: 'Revisión de /etc/sudoers',
      prompt: 'Selecciona la línea que supone el mayor riesgo.',
      lang: 'sudoers',
      code: ['Defaults   env_reset', 'Defaults   secure_path="/usr/sbin:/usr/bin:/sbin:/bin"', 'root       ALL=(ALL:ALL) ALL', '%admin     ALL=(ALL) ALL', 'becario    ALL=(ALL) NOPASSWD: ALL', 'backup     ALL=(root) /usr/bin/rsync'],
      bad: [4],
      question: '¿Por qué es peligrosa?',
      options: [
        { text: 'Cualquiera que consiga la sesión del becario es administrador al instante, sin necesidad de contraseña', correct: true, explain: 'Exacto: robar una cuenta poco vigilada da control total del sistema.' },
        { text: 'Porque el becario no puede usar sudo', correct: false, explain: 'Al contrario: puede hacerlo todo y sin contraseña.' },
        { text: 'Porque ralentiza el servidor', correct: false, explain: 'No es un problema de rendimiento, sino de privilegios.' },
      ],
    },
    {
      type: 'classify',
      title: 'Clasifica los hallazgos',
      prompt: 'Asigna a cada configuración la severidad que le darías en el informe.',
      categories: [{ id: 'alta', label: 'Alta' }, { id: 'media', label: 'Media' }, { id: 'baja', label: 'Baja' }],
      items: [
        { text: 'Script que ejecuta root cada noche con permisos 777', cat: 'alta', explain: 'Cualquier usuario puede hacer que root ejecute lo que quiera.' },
        { text: 'Clave SSH privada con permisos 644 en el /home de un administrador', cat: 'alta', explain: 'Cualquier usuario local puede copiarla y suplantar al administrador.' },
        { text: 'El banner de SSH muestra la versión exacta del software', cat: 'baja', explain: 'Facilita el reconocimiento, pero por sí solo no da acceso.' },
        { text: 'Un usuario normal pertenece al grupo sudo sin necesitarlo para su trabajo', cat: 'media', explain: 'Rompe el mínimo privilegio: si roban esa cuenta, el atacante podrá actuar como administrador (aunque necesite la contraseña).' },
      ],
    },
  ],
  learned: ['Leer configuraciones con mentalidad de atacante', 'Riesgos de sudo mal configurado', 'Asignar severidad a un hallazgo'],
  tip: 'Cada hallazgo de tu informe debe incluir la evidencia, el impacto y una recomendación concreta.',
};

const m2b = {
  id: 'm2-bastionado',
  module: 'm2',
  teams: ['blue'],
  title: 'Bastionado básico',
  story: 'Una auditoría externa ha avisado de que el script de copias nocturnas tiene permisos peligrosos. Te toca corregirlo antes de que alguien lo aproveche.',
  lesson: [
    { title: 'Buscar ficheros peligrosos', text: 'find permite buscar por permisos. Con -perm 777 encuentras ficheros que cualquiera puede leer, escribir y ejecutar.', code: '$ find /opt -perm 777' },
    { title: 'Corregir', text: 'Un script que ejecuta root debe pertenecer a root y no ser escribible por nadie más: 700 o 755 según si otros necesitan leerlo.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Cierra la puerta',
      prompt: 'Localiza el script con permisos 777 dentro de /opt y déjalo con permisos 700. Tu usuario tiene sudo.',
      scenario: { files: PERM_FILES },
      objectives: [
        { id: 'find', text: 'Busca en /opt los ficheros con permisos 777', how: 'find /opt -perm 777', check: ev('find', (e) => e.base === '/opt' && /-perm\s+-?777/.test(e.args)) },
        { id: 'cual', text: '¿Qué fichero has encontrado? (ruta completa)', answer: ['/opt/copias/backup.sh'], placeholder: '/ruta/al/fichero' },
        { id: 'fix', text: 'Déjalo con permisos 700', how: 'El dueño es root: sudo chmod 700 /opt/copias/backup.sh', check: modeIs('/opt/copias/backup.sh', '700') },
      ],
      solution: ['find /opt -perm 777', 'sudo chmod 700 /opt/copias/backup.sh'],
      hints: ['find /opt -perm 777', 'El fichero es de root: sin sudo, chmod dará «Operación no permitida».'],
    },
  ],
  learned: ['Buscar permisos peligrosos con find', 'Corregir con chmod y sudo', 'Por qué los scripts de root no deben ser escribibles'],
  tip: 'Automatiza esta revisión: un cron que busque ficheros escribibles por todos y avise al SOC.',
};

const m2p = {
  id: 'm2-control',
  module: 'm2',
  teams: ['purple'],
  title: 'Del hallazgo al control',
  story: 'Rojo informa: «un script de root es escribible por todos». Azul pregunta: «¿y cómo nos habríamos enterado?». Tu trabajo: corregirlo y proponer cómo detectarlo la próxima vez.',
  lesson: [
    { title: 'El ciclo morado', text: '1) Rojo demuestra el hallazgo. 2) Azul comprueba si lo habría detectado. 3) Se corrige. 4) Se crea una detección para que, si vuelve a aparecer, salte una alerta.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Corrige y comprueba',
      prompt: 'Confirma el hallazgo de Rojo, corrígelo (permisos 700) y protege también tu clave SSH (600).',
      scenario: { files: PERM_FILES },
      objectives: [
        { id: 'find', text: 'Confirma el hallazgo con find en /opt', how: 'find /opt -perm 777', check: ev('find', (e) => e.base === '/opt') },
        { id: 'fix', text: 'backup.sh con permisos 700', how: 'sudo chmod 700 /opt/copias/backup.sh', check: modeIs('/opt/copias/backup.sh', '700') },
        { id: 'key', text: 'Tu clave privada con permisos 600', how: 'chmod 600 ~/.ssh/id_ed25519', check: modeIs('/home/analista/.ssh/id_ed25519', '600') },
      ],
      solution: ['find /opt -perm 777', 'sudo chmod 700 /opt/copias/backup.sh', 'chmod 600 ~/.ssh/id_ed25519'],
      hints: ['Recuerda: rw------- es 600 y rwx------ es 700.'],
    },
    {
      type: 'quiz',
      title: '¿Cómo lo detectamos?',
      questions: [
        { q: '¿Qué detección encaja mejor con este hallazgo?', options: ['Alerta si un fichero ejecutado por root cambia de contenido o de permisos (monitorización de integridad, FIM)', 'Bloquear todo el tráfico de Internet', 'Cambiar el fondo de pantalla del servidor'], correct: 0, explain: 'La monitorización de integridad de ficheros (FIM) avisa cuando algo crítico cambia.' },
        { q: '¿Qué táctica de ATT&CK aprovecharía un adversario con este fallo?', options: ['Escalada de privilegios', 'Reconocimiento', 'Exfiltración'], correct: 0, explain: 'Pasar de un usuario normal a ejecutar código como root.' },
      ],
    },
  ],
  learned: ['El ciclo morado: demostrar, detectar, corregir, vigilar', 'Monitorización de integridad (FIM)', 'Relacionar un fallo con su táctica'],
  tip: 'Toda corrección debería ir acompañada de una detección: así sabrás si alguien la deshace.',
};

// ─────────────────────────── MÓDULO 3 · RECONOCIMIENTO PASIVO ───────────────────────────

const OSINT_FILES = {
  '/home/analista/osint/LEEME.txt': 'Material público recopilado de la web de Nébula (dentro del alcance).\nFicheros: catalogo_2026.pdf, empleo.txt',
  '/home/analista/osint/catalogo_2026.pdf': '%PDF-1.7 (documento de laboratorio)\n%%META\nFile Name     : catalogo_2026.pdf\nAuthor        : mquintana\nCreator Tool  : Microsoft Word 2013\nProducer      : PDF Exporter 1.2\nCreate Date   : 2026:01:14 09:12:33\nLast Modified : marta.quintana@nebula-logistica.lab\n%%',
  '/home/analista/osint/empleo.txt': 'Oferta de empleo publicada por Nébula:\n«Buscamos técnico/a de sistemas con experiencia en Windows Server 2012, VPN FortiLab 6.0 y copias con BackupMaster 9.»',
};

const osintScenario = { files: OSINT_FILES, whois: WHOIS, dns: DNS };

const m3c = {
  id: 'm3-osint',
  module: 'm3',
  teams: ALL,
  title: 'Lo que Internet sabe de ti',
  story: {
    red: 'Fase 1 de la auditoría: reconocimiento pasivo. Sin tocar los sistemas del cliente, solo con fuentes públicas, ¿cuánto puedes saber de Nébula?',
    blue: 'Los atacantes empiezan siempre por lo público. Si sabes qué información expone tu empresa, sabrás qué van a usar contra ti.',
    purple: 'Rojo va a recopilar información pública de Nébula y Azul quiere saber qué se puede reducir. Haz tú el inventario.',
  },
  lesson: [
    { title: 'Pasivo frente a activo', text: 'El reconocimiento PASIVO usa fuentes públicas sin interactuar con los sistemas del objetivo: registros de dominios, DNS públicos, webs, ofertas de empleo, redes sociales, metadatos. El ACTIVO sí envía tráfico a sus sistemas y deja huella.' },
    { title: 'WHOIS y DNS', text: 'whois muestra quién registró un dominio. dig consulta los registros DNS: A (dirección IP), MX (servidor de correo), NS (servidores DNS) y TXT (texto, por ejemplo SPF o DMARC, que protegen contra la suplantación de correo).', code: '$ whois nebula-logistica.lab\n$ dig nebula-logistica.lab MX' },
    { title: 'Metadatos', text: 'Los documentos guardan información oculta: autor, programa usado, fechas… exiftool la muestra. Un PDF publicado puede revelar nombres de usuario internos y versiones de software antiguas.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Inventario público',
      prompt: 'Recopila información pública de nebula-logistica.lab y del material de la carpeta ~/osint.',
      scenario: osintScenario,
      objectives: [
        { id: 'whois', text: 'Consulta el WHOIS del dominio', how: 'whois nebula-logistica.lab', check: ev('whois', (e) => e.domain === 'nebula-logistica.lab') },
        { id: 'correo', text: '¿Qué correo de contacto aparece en el registro?', answer: ['sistemas@nebula-logistica.lab'], placeholder: 'correo@dominio' },
        { id: 'mx', text: 'Consulta el registro MX (servidor de correo)', how: 'dig nebula-logistica.lab MX', check: ev('dig', (e) => e.domain === 'nebula-logistica.lab' && e.rtype === 'MX') },
        { id: 'exif', text: 'Extrae los metadatos del catálogo PDF', how: 'exiftool ~/osint/catalogo_2026.pdf', check: ev('exif', (e) => e.path === '/home/analista/osint/catalogo_2026.pdf') },
        { id: 'usuario', text: '¿Qué nombre de usuario interno revela el campo Author?', answer: ['mquintana'], placeholder: 'usuario' },
      ],
      solution: ['whois nebula-logistica.lab', 'dig nebula-logistica.lab MX', 'cd osint', 'exiftool catalogo_2026.pdf'],
      hints: ['Empieza con «whois nebula-logistica.lab».', 'Para los metadatos: exiftool seguido de la ruta del PDF.'],
    },
  ],
  learned: ['Diferencia entre reconocimiento pasivo y activo', 'whois y registros DNS (A, MX, NS, TXT)', 'Metadatos de documentos con exiftool'],
  tip: { red: 'Un formato de usuario (inicial + apellido) y una versión de software antigua son oro para planificar el resto de la auditoría.', blue: 'Limpia los metadatos antes de publicar documentos: muchas herramientas lo hacen automáticamente.', purple: 'Cada dato público encontrado debería tener un responsable que decida si se elimina o se acepta.' },
};

const m3r = {
  id: 'm3-superficie',
  module: 'm3',
  teams: ['red'],
  title: 'Mapa de la superficie',
  story: 'Con el material recopilado, el jefe de equipo te pide que priorices: ¿qué información pública es realmente útil para un atacante y qué es ruido?',
  lesson: [
    { title: 'Superficie de ataque', text: 'Es todo lo que un atacante puede tocar o aprovechar: servicios expuestos, personas (para ingeniería social), software con versiones conocidas, subdominios olvidados… Un buen auditor la dibuja antes de hacer nada.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Subdominios y versiones',
      prompt: 'Revisa los datos públicos que quedan y completa el mapa.',
      scenario: osintScenario,
      objectives: [
        { id: 'empleo', text: 'Lee la oferta de empleo publicada', how: 'cat ~/osint/empleo.txt', check: read('/home/analista/osint/empleo.txt') },
        { id: 'version', text: '¿Qué versión de la VPN usa Nébula según la oferta?', answer: ['FortiLab 6.0', '6.0'], placeholder: 'Producto versión' },
        { id: 'sub', text: 'Consulta la IP del subdominio intranet-pruebas.nebula-logistica.lab', how: 'dig intranet-pruebas.nebula-logistica.lab', check: ev('dig', (e) => e.domain === 'intranet-pruebas.nebula-logistica.lab') },
        { id: 'ip', text: '¿Qué IP tiene?', answer: ['203.0.113.44'], placeholder: '0.0.0.0' },
      ],
      solution: ['cat ~/osint/empleo.txt', 'dig intranet-pruebas.nebula-logistica.lab'],
      hints: ['Las ofertas de empleo describen la tecnología interna.', 'dig sin tipo consulta el registro A (la IP).'],
    },
    {
      type: 'classify',
      title: '¿Útil para un atacante?',
      prompt: 'Clasifica cada dato según su valor para planificar un ataque.',
      categories: [{ id: 'alto', label: 'Muy útil' }, { id: 'bajo', label: 'Poco útil' }],
      items: [
        { text: 'Formato de usuario interno (mquintana)', cat: 'alto', explain: 'Permite deducir los usuarios del resto de la plantilla.' },
        { text: 'Versión exacta de la VPN (FortiLab 6.0)', cat: 'alto', explain: 'Se puede buscar si esa versión tiene vulnerabilidades públicas.' },
        { text: 'Subdominio «intranet-pruebas» accesible desde Internet', cat: 'alto', explain: 'Los entornos de pruebas suelen estar peor protegidos.' },
        { text: 'El logotipo de la empresa', cat: 'bajo', explain: 'Útil como mucho para un correo falso, pero no da acceso.' },
        { text: 'La fecha de creación del dominio', cat: 'bajo', explain: 'Dato de contexto con poco valor práctico.' },
      ],
    },
  ],
  learned: ['Qué es la superficie de ataque', 'Las ofertas de empleo revelan tecnología', 'Priorizar la información recopilada'],
  tip: 'En el informe, el reconocimiento pasivo ya genera hallazgos: «Exposición de información en metadatos».',
};

const m3b = {
  id: 'm3-huella',
  module: 'm3',
  teams: ['blue'],
  title: 'Reducir la huella',
  story: 'Te llega el inventario de lo que Nébula expone en Internet. Tu misión: comprobar la protección del correo contra la suplantación y decidir qué hay que reducir.',
  lesson: [
    { title: 'SPF, DKIM y DMARC', text: 'Son registros DNS que protegen el correo. SPF dice qué servidores pueden enviar en nombre del dominio; DKIM firma los mensajes; DMARC indica qué hacer con los que fallan (p=reject los rechaza). Sin DMARC, suplantar tu dominio es mucho más fácil.', code: '$ dig nebula-logistica.lab TXT\n$ dig _dmarc.nebula-logistica.lab TXT' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: '¿Nos pueden suplantar?',
      prompt: 'Comprueba los registros SPF y DMARC del dominio.',
      scenario: osintScenario,
      objectives: [
        { id: 'spf', text: 'Consulta los registros TXT del dominio', how: 'dig nebula-logistica.lab TXT', check: ev('dig', (e) => e.domain === 'nebula-logistica.lab' && e.rtype === 'TXT') },
        { id: 'spfip', text: '¿Qué IP autoriza el SPF para enviar correo?', answer: ['203.0.113.20'], placeholder: '0.0.0.0' },
        { id: 'dmarc', text: 'Consulta el registro DMARC (_dmarc.nebula-logistica.lab TXT)', how: 'dig _dmarc.nebula-logistica.lab TXT', check: ev('dig', (e) => e.domain === '_dmarc.nebula-logistica.lab' && e.rtype === 'TXT') },
        { id: 'tiene', text: '¿Tiene el dominio política DMARC? (sí/no)', answer: ['no'], placeholder: 'sí / no' },
      ],
      solution: ['dig nebula-logistica.lab TXT', 'dig _dmarc.nebula-logistica.lab TXT'],
      hints: ['El SPF empieza por v=spf1.', 'Si dig no devuelve registros, es que no existen.'],
    },
    {
      type: 'classify',
      title: 'Plan de reducción',
      prompt: '¿Qué medida corresponde a cada exposición?',
      categories: [{ id: 'meta', label: 'Limpiar metadatos' }, { id: 'dmarc', label: 'Publicar DMARC' }, { id: 'retirar', label: 'Retirar de Internet' }, { id: 'redactar', label: 'Redactar con menos detalle' }],
      items: [
        { text: 'PDF con usuario interno y versión de Word', cat: 'meta', explain: 'Se eliminan los metadatos antes de publicar.' },
        { text: 'Cualquiera puede enviar correos «de» nebula-logistica.lab', cat: 'dmarc', explain: 'DMARC con p=reject hace que se rechacen.' },
        { text: 'Subdominio de pruebas accesible desde Internet', cat: 'retirar', explain: 'Los entornos de pruebas deben estar en la red interna o tras la VPN.' },
        { text: 'Oferta de empleo con versiones exactas de software', cat: 'redactar', explain: 'Basta con «experiencia en VPN y copias de seguridad».' },
      ],
    },
  ],
  learned: ['SPF, DKIM y DMARC', 'Cómo reducir la información expuesta', 'El reconocimiento pasivo del atacante es tu auditoría gratuita'],
  tip: 'Repite este inventario cada trimestre: la huella pública crece sola.',
};

const m3p = {
  id: 'm3-osint-defensa',
  module: 'm3',
  teams: ['purple'],
  title: 'OSINT ↔ defensa',
  story: 'Rojo te entrega sus hallazgos de reconocimiento pasivo. Antes de pasarlos a Azul, los conviertes en acciones defensivas concretas.',
  lesson: [
    { title: 'Reconocimiento en ATT&CK', text: 'ATT&CK tiene una táctica llamada Reconocimiento (TA0043): reunir información de la víctima, de su identidad, de su red… Casi no se puede detectar (ocurre fuera de tu red), así que la defensa es reducir lo que se expone.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Valida los hallazgos de Rojo',
      prompt: 'Rojo afirma que el PDF revela un usuario interno y que no hay DMARC. Compruébalo.',
      scenario: osintScenario,
      objectives: [
        { id: 'exif', text: 'Extrae los metadatos del catálogo', how: 'exiftool ~/osint/catalogo_2026.pdf', check: ev('exif') },
        { id: 'tool', text: '¿Con qué programa se creó? (Creator Tool)', answer: ['Microsoft Word 2013', 'Word 2013'], placeholder: 'Programa versión' },
        { id: 'dmarc', text: 'Comprueba el DMARC', how: 'dig _dmarc.nebula-logistica.lab TXT', check: ev('dig', (e) => e.domain === '_dmarc.nebula-logistica.lab') },
      ],
      solution: ['exiftool ~/osint/catalogo_2026.pdf', 'dig _dmarc.nebula-logistica.lab TXT'],
      hints: ['exiftool + la ruta del PDF.'],
    },
    {
      type: 'order',
      title: 'De hallazgo a mejora',
      prompt: 'Ordena el flujo de trabajo morado para el hallazgo «PDF con metadatos».',
      items: ['Rojo documenta el hallazgo con su evidencia', 'Morado valida que es reproducible', 'Azul elimina los metadatos de los documentos publicados', 'Se automatiza la limpieza en el proceso de publicación', 'Rojo vuelve a comprobar que ya no aparecen'],
      explain: 'Demostrar → validar → corregir → automatizar → volver a comprobar.',
    },
  ],
  learned: ['La táctica Reconocimiento de ATT&CK', 'Por qué la defensa ante el OSINT es reducir la exposición', 'Flujo de hallazgo a mejora'],
  tip: 'Lo que no se puede detectar, se previene; lo que no se puede prevenir, se detecta.',
};

// ── Pasos añadidos a las lecciones comunes: todo lo que luego se pide en retos y exámenes ──
m1c.lesson.push(
  { title: 'Capas de defensa', text: 'Ninguna medida protege sola, así que se combinan varias capas (defensa en profundidad). La MFA hace que una contraseña robada no baste. Los parches cierran fallos conocidos. La formación enseña a desconfiar de los engaños. Las copias de seguridad desconectadas permiten recuperarse de un ransomware. Y la monitorización detecta lo que se cuela.' },
  { title: 'Ética y ley', text: 'Atacar un sistema sin permiso es delito aunque «no rompas nada». En España lo castiga el artículo 197 bis del Código Penal. Un profesional solo prueba sistemas con autorización POR ESCRITO, dentro de un alcance y unas fechas acordadas. Si descubre un fallo por su cuenta, hace divulgación responsable: avisa al responsable sin explotarlo ni publicarlo hasta que se corrija.' },
  { title: 'El idioma común: MITRE ATT&CK', text: 'MITRE ATT&CK es un catálogo público de cómo atacan los adversarios reales. Se organiza en tácticas (el «para qué»: acceso inicial, persistencia, escalada de privilegios, exfiltración…) y técnicas (el «cómo»). Rojo, Azul y Morado lo usan para hablar de lo mismo con las mismas palabras.' },
);
m2c.lesson.push(
  { title: 'Buscar ficheros con find', text: 'find recorre carpetas buscando ficheros que cumplan una condición. Con -name buscas por nombre y con -perm por permisos: find /opt -perm 777 encuentra lo que cualquiera puede leer, escribir y ejecutar, y find / -perm -o+w -type f encuentra los ficheros que cualquiera puede modificar.', code: '$ find /home -name "*.txt"\n$ find /opt -perm 777' },
  { title: 'sudo: actuar como administrador', text: 'sudo ejecuta UNA orden con permisos de administrador (root). Si un fichero es de root, chmod te dirá «Operación no permitida» y tendrás que usar sudo. Quién puede usar sudo se decide en el fichero sudoers: una línea como «usuario ALL=(ALL) NOPASSWD: ALL» convierte esa cuenta en administradora total y sin contraseña, un hallazgo grave.', code: '$ sudo chmod 700 /opt/copias/backup.sh' },
);
m3c.lesson.push(
  { title: 'Qué hacer con lo encontrado', text: 'Lo más valioso del OSINT suele ser: formatos de usuario, versiones de software y subdominios olvidados (pruebas, dev, staging), que suelen estar peor protegidos. La defensa es reducir la huella: limpiar metadatos, redactar ofertas de empleo sin versiones, sacar de Internet lo que no debe estar y publicar DMARC con p=reject para que se rechacen los correos que suplantan al dominio.' },
);

// ── Herramientas profesionales (Arsenal) ──
m2c.lesson.push({ title: 'Herramienta profesional: Lynis', text: 'Lynis audita la configuración de un sistema Linux y propone cómo endurecerlo. Muestra avisos (warnings) que hay que corregir, sugerencias de mejora y un índice de bastionado de 0 a 100. Se ejecuta con sudo en tus propios servidores y se repite tras cada corrección para ver cómo sube el índice.', code: '$ sudo lynis audit system' });

export default [m1c, m1r, m1b, m1p, m2c, m2r, m2b, m2p, m3c, m3r, m3b, m3p];
