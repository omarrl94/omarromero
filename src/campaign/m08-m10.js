// Módulos 8-10: Ingeniería social · Detección en el SOC · Respuesta a incidentes y operación final.
import { read, ran, ev, blocked, noProc, cronClean, gone, all } from './helpers.js';
import { WHOIS, DNS } from '../world/nebula.js';

const ALL = ['red', 'blue', 'purple'];

// ─────────────────────────── MÓDULO 8 · INGENIERÍA SOCIAL ───────────────────────────

const PHISH_EML = `Return-Path: <avisos@nebu1a-logistica.lab>
Received: from mail.hosting-dudoso.lab (198.51.100.66)
Authentication-Results: correo.nebula-logistica.lab;
   spf=fail smtp.mailfrom=nebu1a-logistica.lab;
   dkim=none;
   dmarc=fail
From: "Marta Quintana - Sistemas" <sistemas@nebula-logistica.lab>
To: plantilla@nebula-logistica.lab
Subject: URGENTE: su contraseña caduca hoy
Date: Wed, 4 Nov 2026 08:47:12 +0100

Estimado empleado:

Su contraseña caduca HOY. Para no perder el acceso al correo, valídela
antes de las 12:00 en el siguiente enlace:

   https://portal.nebu1a-logistica.lab/validar

Departamento de Sistemas`;

const m8c = {
  id: 'm8-phishing',
  module: 'm8',
  teams: ALL,
  title: 'Anatomía de un phishing',
  story: {
    red: 'La mayoría de las intrusiones reales empiezan con un correo. Entender cómo engañan te permitirá diseñar simulacros de concienciación (autorizados) que de verdad enseñen.',
    blue: 'El buzón de «reportar phishing» no para de recibir correos. Aprende a distinguir en segundos lo legítimo de lo fraudulento.',
    purple: 'El phishing es el punto donde la técnica se encuentra con las personas. Tu trabajo: que la plantilla sea un sensor más.',
  },
  lesson: [
    { title: 'Ingeniería social', text: 'Manipular a las personas para que hagan algo (pulsar un enlace, dar una contraseña, pagar una factura). Se basa en emociones: urgencia, miedo, autoridad, curiosidad o recompensa.' },
    { title: 'Señales de alarma', text: 'Urgencia exagerada · remitente o dominio parecido pero distinto (nebu1a con un 1) · enlaces que no van a donde dicen · peticiones de contraseñas o pagos · tono genérico («Estimado empleado») · adjuntos inesperados.' },
    { title: 'Qué hacer', text: 'No pulsar, no responder, y reportarlo por el canal oficial. Si ya has pulsado o has escrito la contraseña: avisa enseguida. Avisar rápido no es un fallo, es lo que salva el día.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: '¿Legítimo o phishing?',
      prompt: 'Clasifica estos mensajes recibidos en Nébula.',
      categories: [{ id: 'ok', label: 'Legítimo' }, { id: 'phish', label: 'Phishing' }],
      items: [
        { text: '«Su contraseña caduca HOY, valídela en portal.nebu1a-logistica.lab»', cat: 'phish', explain: 'Urgencia + dominio con un 1 en lugar de una l.' },
        { text: '«Recordatorio: la reunión de equipo es mañana a las 10 en la sala 2» (de tu jefa, dominio correcto, sin enlaces)', cat: 'ok', explain: 'Nada que pedir, nada que pulsar, remitente coherente.' },
        { text: '«Soy el director. Necesito que hagas una transferencia urgente y confidencial. No me llames, estoy en una reunión»', cat: 'phish', explain: 'Fraude del CEO: autoridad + urgencia + evitar la verificación.' },
        { text: '«Ha recibido un paquete. Pague 1,99 € de aduanas aquí» (SMS de un número desconocido)', cat: 'phish', explain: 'Smishing clásico: pequeño pago para robar los datos de la tarjeta.' },
        { text: '«Tu nómina de octubre ya está disponible en el portal del empleado» (sin enlace, del dominio de RR. HH.)', cat: 'ok', explain: 'Informativo y sin enlace: se accede desde el marcador habitual.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Reacción',
      questions: [
        { q: 'Has escrito tu contraseña en una web que resultó ser falsa. ¿Qué haces?', options: ['Nada, me da vergüenza', 'Cambiar la contraseña y avisar inmediatamente al equipo de seguridad', 'Esperar a ver si pasa algo'], correct: 1, explain: 'Cada minuto cuenta: avisar rápido permite cortar el acceso antes de que se use.' },
      ],
    },
  ],
  learned: ['Ingeniería social y sus palancas emocionales', 'Señales de alarma de un phishing', 'Reportar siempre, y rápido'],
  tip: { red: 'Un buen simulacro enseña, no humilla: la meta es que la gente reporte más, no pillar a nadie.', blue: 'Mide el tiempo desde que llega un phishing hasta el primer reporte: es tu mejor indicador.', purple: 'Cada reporte de la plantilla es una alerta gratuita: conéctalo al SOC.' },
};

const m8r = {
  id: 'm8-simulacro',
  module: 'm8',
  teams: ['red'],
  title: 'Simulacro de concienciación autorizado',
  story: 'Nébula contrata un simulacro de phishing para su plantilla. Lo diseñas con todas las garantías éticas y legales.',
  lesson: [
    { title: 'Un simulacro responsable', text: 'Se acuerda con dirección, RR. HH. y protección de datos; se define qué se mide (clics, reportes), NUNCA se recogen contraseñas reales, y se termina con formación inmediata para quien pulse.' },
  ],
  challenges: [
    {
      type: 'order',
      title: 'Fases del simulacro',
      prompt: 'Ordena las fases de un simulacro de phishing autorizado.',
      items: ['Autorización por escrito de dirección, RR. HH. y protección de datos', 'Definición de objetivos y métricas (clics y reportes)', 'Diseño del correo y de una página que NO recoge credenciales', 'Envío controlado en la ventana acordada', 'Formación inmediata a quien pulse', 'Informe con resultados agregados y anónimos'],
      explain: 'Permiso → objetivos → diseño seguro → envío → formación → informe anónimo.',
    },
    {
      type: 'classify',
      title: '¿Se puede hacer en el simulacro?',
      prompt: 'Clasifica cada propuesta.',
      categories: [{ id: 'ok', label: 'Sí' }, { id: 'no', label: 'No' }],
      items: [
        { text: 'Medir cuántas personas reportan el correo', cat: 'ok', explain: 'Es la métrica más valiosa.' },
        { text: 'Guardar las contraseñas que escriban «para el informe»', cat: 'no', explain: 'Nunca: sería tratar credenciales reales sin necesidad.' },
        { text: 'Publicar en la intranet los nombres de quienes pulsaron', cat: 'no', explain: 'Humillar destruye la cultura de reporte. Resultados siempre agregados.' },
        { text: 'Usar un pretexto de «premio de Navidad» pactado con RR. HH.', cat: 'ok', explain: 'Pretexto acordado y que no causa daño.' },
        { text: 'Suplantar a un banco real', cat: 'no', explain: 'Implica a terceros sin permiso y puede tener consecuencias legales.' },
      ],
    },
  ],
  learned: ['Diseñar un simulacro con garantías', 'Métricas útiles', 'Límites éticos y legales'],
  tip: 'El indicador de éxito no es la tasa de clic, sino la tasa de reporte.',
};

const m8b = {
  id: 'm8-cabeceras',
  module: 'm8',
  teams: ['blue'],
  title: 'Analizar las cabeceras',
  story: 'Varias personas han reportado el mismo correo. Analízalo, recoge los indicadores de compromiso (IOC) y bloquea el dominio falso.',
  lesson: [
    { title: 'Las cabeceras no mienten (tanto)', text: 'El «From» que ves se puede falsificar fácilmente; el «Return-Path», los servidores «Received» y los resultados SPF/DKIM/DMARC revelan el origen real.' },
    { title: 'IOC', text: 'Indicadores de compromiso: dominios, IPs, URLs o huellas de ficheros asociados al ataque. Se comparten y se bloquean en el correo, el proxy y el cortafuegos.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Disecciona el correo',
      prompt: 'El correo reportado está en ~/reportes/urgente.eml.',
      scenario: { files: { '/home/analista/reportes/urgente.eml': PHISH_EML }, whois: WHOIS, dns: DNS },
      objectives: [
        { id: 'leer', text: 'Lee el correo reportado', how: 'cat reportes/urgente.eml', check: read('/home/analista/reportes/urgente.eml') },
        { id: 'rp', text: '¿Qué dominio aparece en el Return-Path?', answer: ['nebu1a-logistica.lab'], placeholder: 'dominio' },
        { id: 'spf', text: '¿Qué resultado da la comprobación SPF?', answer: ['fail'], placeholder: 'pass / fail' },
        { id: 'whois', text: 'Consulta el WHOIS del dominio falso', how: 'whois nebu1a-logistica.lab', check: ev('whois', (e) => e.domain === 'nebu1a-logistica.lab') },
        { id: 'fecha', text: '¿Cuándo se registró? (AAAA-MM-DD)', answer: ['2026-10-30'], placeholder: 'AAAA-MM-DD' },
        { id: 'ip', text: 'Bloquea en el cortafuegos la IP del servidor que lo envió', how: 'Está en la línea Received. sudo iptables -A INPUT -s <IP> -j DROP', check: blocked('198.51.100.66') },
      ],
      solution: ['cat reportes/urgente.eml', 'whois nebu1a-logistica.lab', 'sudo iptables -A INPUT -s 198.51.100.66 -j DROP'],
      hints: ['Compara el dominio del From con el del Return-Path letra a letra.', 'Un dominio registrado hace 5 días para imitar a otro es una señal clarísima.'],
    },
  ],
  learned: ['Leer cabeceras: Return-Path, Received, SPF/DKIM/DMARC', 'Dominios parecidos (typosquatting)', 'Extraer y bloquear IOC'],
  tip: 'Publica DMARC con p=reject: este correo ni siquiera habría llegado.',
};

const m8p = {
  id: 'm8-metricas',
  module: 'm8',
  teams: ['purple'],
  title: 'El factor humano como sensor',
  story: 'Tras el simulacro de Rojo y el incidente real que analizó Azul, preparas el plan de mejora conjunto.',
  lesson: [
    { title: 'Cerrar el círculo', text: 'Rojo simula, Azul mide la detección (reportes, filtros de correo) y Morado convierte los resultados en mejoras: reglas de filtrado, formación específica y un botón de reporte fácil.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Métricas útiles',
      prompt: '¿Qué métricas ayudan a mejorar y cuáles no?',
      categories: [{ id: 'util', label: 'Útil' }, { id: 'no', label: 'Poco útil o dañina' }],
      items: [
        { text: 'Tiempo medio hasta el primer reporte', cat: 'util', explain: 'Mide la rapidez de la «alarma humana».' },
        { text: 'Porcentaje de plantilla que reporta', cat: 'util', explain: 'Indica la cultura de seguridad.' },
        { text: 'Lista nominal de quién pulsó', cat: 'no', explain: 'Fomenta el miedo y que la gente oculte errores.' },
        { text: 'Correos falsos bloqueados por el filtro antes de llegar', cat: 'util', explain: 'Mide la capa técnica.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Mejora continua',
      questions: [
        { q: 'El simulacro tuvo muchos clics, pero el filtro no detectó el dominio parecido. ¿Qué propones?', options: ['Formación + una regla que marque dominios muy parecidos al propio + DMARC estricto', 'Prohibir el correo electrónico', 'Repetir el simulacro sin cambiar nada'], correct: 0, explain: 'Una mejora humana y otra técnica, y luego se vuelve a medir.' },
      ],
    },
  ],
  learned: ['Métricas de concienciación', 'Combinar mejoras humanas y técnicas'],
  tip: 'Celebra los reportes en público; corrige los clics en privado.',
};

// ─────────────────────────── MÓDULO 9 · SOC Y LOGS ───────────────────────────

const AUTH_LOG = [
  'Nov  4 03:10:01 srv-web01 sshd[811]: Accepted publickey for analista from 192.0.2.15 port 50122',
  ...Array.from({ length: 14 }, (_, i) => `Nov  4 03:1${Math.floor(i / 6) + 2}:${String((i * 7) % 60).padStart(2, '0')} srv-web01 sshd[9${10 + i}]: Failed password for ${['admin', 'root', 'test', 'mquintana'][i % 4]} from 203.0.113.99 port ${40000 + i}`),
  'Nov  4 03:15:40 srv-web01 sshd[930]: Accepted password for mquintana from 203.0.113.99 port 40099',
  'Nov  4 03:16:02 srv-web01 sudo: mquintana : COMMAND=/usr/bin/crontab -u www-data -e',
  'Nov  4 08:00:12 srv-web01 sshd[1201]: Accepted publickey for analista from 192.0.2.15 port 50410',
  'Nov  4 08:30:44 srv-web01 sshd[1250]: Failed password for marta from 192.0.2.30 port 51000',
  'Nov  4 08:30:51 srv-web01 sshd[1251]: Accepted password for marta from 192.0.2.30 port 51001',
].join('\n');

const HUNT_SCN = {
  host: 'srv-web01',
  files: {
    '/var/log/auth.log': AUTH_LOG,
    '/var/tmp/.cache/kworkerd': { content: '#!/bin/bash\n# binario de laboratorio: simula un minero de criptomonedas', owner: 'www-data', mode: 'rwxr-xr-x' },
  },
  procs: [
    { pid: 1, user: 'root', cmd: '/sbin/init', cpu: 0.0 },
    { pid: 612, user: 'root', cmd: '/usr/sbin/sshd -D', cpu: 0.0 },
    { pid: 880, user: 'www-data', cmd: 'nginx: worker process', cpu: 0.4 },
    { pid: 4242, user: 'www-data', cmd: '/var/tmp/.cache/kworkerd --pool 203.0.113.99:3333', cpu: 98.7, mem: 12.1 },
    { pid: 5001, user: 'analista', cmd: '-bash', cpu: 0.0 },
  ],
  cron: { 'www-data': ['*/5 * * * * /var/tmp/.cache/kworkerd --pool 203.0.113.99:3333 >/dev/null 2>&1'], root: ['0 3 * * * /opt/copias/backup.sh'] },
};

const m9c = {
  id: 'm9-logs',
  module: 'm9',
  teams: ALL,
  title: 'Leer los registros',
  story: {
    red: 'Para hacer auditorías realistas tienes que saber qué huella deja cada acción. Hoy lees los registros como lo haría un analista del SOC.',
    blue: 'Alerta de madrugada en srv-web01: «muchos fallos de autenticación». Abre los registros y averigua qué ha pasado.',
    purple: 'Antes de diseñar detecciones, necesitas leer con soltura lo que los sistemas registran.',
  },
  lesson: [
    { title: 'auth.log', text: 'En Linux, /var/log/auth.log registra los inicios de sesión: «Failed password» (fallo), «Accepted» (éxito), usos de sudo… Es lo primero que se mira ante una sospecha de acceso indebido.' },
    { title: 'Fuerza bruta', text: 'Muchos fallos seguidos desde una misma IP con usuarios distintos = intento de fuerza bruta (ATT&CK T1110). Lo realmente grave es si después aparece un «Accepted» desde esa misma IP.', code: "$ grep 'Failed password' /var/log/auth.log | awk '{print $NF}'" },
  ],
  challenges: [
    {
      type: 'terminal',
      title: '¿Qué pasó de madrugada?',
      prompt: 'Analiza /var/log/auth.log.',
      scenario: HUNT_SCN,
      objectives: [
        { id: 'fail', text: 'Filtra los intentos fallidos', how: "grep 'Failed password' /var/log/auth.log", check: ev('grep', (e) => /failed/i.test(e.pattern)) },
        { id: 'ip', text: '¿Desde qué IP llega la fuerza bruta?', answer: ['203.0.113.99'], placeholder: '0.0.0.0' },
        { id: 'n', text: '¿Cuántos intentos fallidos hizo esa IP?', answer: ['14'], placeholder: 'número' },
        { id: 'acc', text: 'Busca los accesos aceptados', how: 'grep Accepted /var/log/auth.log', check: ev('grep', (e) => /accepted/i.test(e.pattern)) },
        { id: 'user', text: '¿Con qué usuario consiguió entrar el atacante?', answer: ['mquintana'], placeholder: 'usuario' },
      ],
      solution: ["grep 'Failed password' /var/log/auth.log", 'grep -c 203.0.113.99 /var/log/auth.log', 'grep Accepted /var/log/auth.log'],
      hints: ['grep -c cuenta líneas. Combínalo con la IP y «Failed».', 'Busca un «Accepted password» desde la IP de la fuerza bruta.'],
    },
  ],
  learned: ['Leer /var/log/auth.log', 'Reconocer fuerza bruta (T1110)', 'Fallo masivo + éxito = cuenta comprometida'],
  tip: { red: 'Una fuerza bruta es la técnica más ruidosa que existe: en un ejercicio real, se pacta antes y se avisa al SOC.', blue: 'MFA y bloqueo tras varios intentos habrían parado este acceso.', purple: 'Regla clásica de SIEM: N fallos desde una IP seguidos de un éxito desde esa IP → alerta crítica.' },
};

const m9r = {
  id: 'm9-huellas',
  module: 'm9',
  teams: ['red'],
  title: 'Las huellas que se dejan',
  story: 'Antes del ejercicio con el SOC de Nébula, repasas qué registro deja cada acción. Un buen red teamer sabe exactamente dónde le van a ver.',
  lesson: [
    { title: '¿Para qué saber esto?', text: 'En un ejercicio autorizado, Rojo emula a un adversario para comprobar si Azul lo detecta. Conocer las huellas sirve para decir en el informe «esta acción debió verse en este log y no se vio»: eso es lo que mejora la defensa.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: '¿Dónde queda registrado?',
      prompt: 'Asigna cada acción a la fuente que la registra principalmente.',
      categories: [{ id: 'auth', label: 'auth.log / eventos de inicio de sesión' }, { id: 'web', label: 'Log del servidor web' }, { id: 'fw', label: 'Cortafuegos / IDS' }, { id: 'edr', label: 'EDR / procesos del equipo' }],
      items: [
        { text: 'Muchos intentos de contraseña por SSH', cat: 'auth', explain: 'Cada intento genera una línea de autenticación.' },
        { text: 'Peticiones con caracteres extraños a un formulario web', cat: 'web', explain: 'Quedan en el access.log.' },
        { text: 'Conexiones a muchos puertos distintos', cat: 'fw', explain: 'El cortafuegos y el IDS ven los paquetes.' },
        { text: 'Un programa desconocido consumiendo el 99 % de CPU', cat: 'edr', explain: 'El EDR vigila los procesos y su comportamiento.' },
        { text: 'Uso de sudo por un usuario', cat: 'auth', explain: 'sudo deja registro en auth.log.' },
      ],
    },
    {
      type: 'quiz',
      title: 'Informe del ejercicio',
      questions: [
        { q: 'Durante el ejercicio, tu acción se registró en el log pero nadie recibió una alerta. ¿Cómo lo reflejas?', options: ['«Telemetría presente, detección ausente»: recomendar una regla de alerta', 'No lo pongo, no es un fallo', '«El SOC no sirve»'], correct: 0, explain: 'Distinguir entre «no se registra» y «se registra pero no se alerta» orienta la mejora.' },
      ],
    },
  ],
  learned: ['Qué fuente registra cada acción', 'Telemetría frente a detección', 'Informes de ejercicios útiles para Azul'],
  tip: 'Lleva un registro con la hora exacta de cada acción del ejercicio: Azul lo usará para buscarte en sus logs.',
};

const m9b = {
  id: 'm9-caza',
  module: 'm9',
  teams: ['blue'],
  title: 'Cazador del SOC',
  story: 'Has confirmado que el atacante entró como mquintana y usó sudo para editar el crontab de www-data. El servidor va lentísimo. Encuentra lo que dejó y elimínalo.',
  lesson: [
    { title: 'Persistencia', text: 'Tras entrar, un atacante intenta quedarse: tareas programadas (cron), servicios nuevos, claves SSH añadidas… (táctica Persistencia de ATT&CK). Si solo matas el proceso, volverá a arrancar.' },
    { title: 'Orden de la contención', text: '1) Cortar la comunicación con el atacante. 2) Eliminar la persistencia. 3) Detener el proceso malicioso. 4) Cambiar las credenciales comprometidas. Y documentar cada paso.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Erradica la amenaza',
      prompt: 'Encuentra el proceso malicioso y su persistencia, y elimínalos. Tienes sudo.',
      scenario: HUNT_SCN,
      objectives: [
        { id: 'ps', text: 'Lista los procesos', how: 'ps aux', check: ev('ps') },
        { id: 'pid', text: '¿Qué PID tiene el proceso que consume casi toda la CPU?', answer: ['4242'], placeholder: 'PID' },
        { id: 'cron', text: 'Revisa el crontab de www-data', how: 'sudo crontab -u www-data -l', check: ev('cron-list', (e) => e.user === 'www-data') },
        { id: 'block', text: 'Bloquea la IP del atacante', how: 'sudo iptables -A INPUT -s 203.0.113.99 -j DROP', check: blocked('203.0.113.99') },
        { id: 'cronx', text: 'Elimina la tarea programada maliciosa', how: 'sudo crontab -u www-data -r', check: cronClean('www-data', /kworkerd/) },
        { id: 'kill', text: 'Detén el proceso malicioso', how: 'sudo kill 4242', check: noProc(/kworkerd/) },
        { id: 'rm', text: 'Borra el binario malicioso', how: 'sudo rm /var/tmp/.cache/kworkerd', check: gone('/var/tmp/.cache/kworkerd') },
      ],
      solution: ['ps aux', 'sudo crontab -u www-data -l', 'sudo iptables -A INPUT -s 203.0.113.99 -j DROP', 'sudo crontab -u www-data -r', 'sudo kill 4242', 'sudo rm /var/tmp/.cache/kworkerd'],
      hints: ['La columna %CPU de ps aux delata al minero.', 'La tarea de cron apunta al mismo fichero que el proceso.', 'Todo lo de www-data necesita sudo.'],
    },
  ],
  learned: ['Buscar procesos anómalos', 'Persistencia con cron', 'Orden de contención y erradicación'],
  tip: 'Antes de borrar, en un incidente real se conserva una copia y su hash como evidencia (lo verás en el módulo 10).',
};

const m9p = {
  id: 'm9-attack',
  module: 'm9',
  teams: ['purple'],
  title: 'Mapa ATT&CK del incidente',
  story: 'Reconstruyes el incidente de srv-web01 con el lenguaje de ATT&CK para que Rojo pueda emularlo y Azul compruebe sus detecciones.',
  lesson: [
    { title: 'Emulación de adversarios', text: 'Con el incidente mapeado, Rojo puede repetir (de forma controlada y autorizada) cada técnica y Azul comprueba si ahora la detecta. Es el corazón del trabajo morado.' },
  ],
  challenges: [
    {
      type: 'classify',
      title: 'Mapea cada evento',
      prompt: 'Asigna cada evento del incidente a su táctica de ATT&CK.',
      categories: [{ id: 'cred', label: 'Acceso a credenciales' }, { id: 'init', label: 'Acceso inicial' }, { id: 'priv', label: 'Escalada / uso de privilegios' }, { id: 'pers', label: 'Persistencia' }, { id: 'impact', label: 'Impacto' }],
      items: [
        { text: '14 intentos de contraseña desde 203.0.113.99', cat: 'cred', explain: 'Fuerza bruta (T1110).' },
        { text: '«Accepted password for mquintana» desde la misma IP', cat: 'init', explain: 'Uso de cuentas válidas (T1078) para entrar.' },
        { text: 'mquintana usa sudo para editar el crontab de otro usuario', cat: 'priv', explain: 'Abuso de privilegios de sudo.' },
        { text: 'Tarea cron cada 5 minutos que relanza el binario', cat: 'pers', explain: 'Tarea programada (T1053).' },
        { text: 'Minero de criptomonedas al 98 % de CPU', cat: 'impact', explain: 'Secuestro de recursos (T1496).' },
      ],
    },
    {
      type: 'logs',
      title: 'Detección clave',
      prompt: 'Marca las líneas que deberían haber disparado una alerta crítica.',
      lines: AUTH_LOG.split('\n'),
      bad: [15, 16],
      explain: 'El éxito tras la fuerza bruta (línea del Accepted desde 203.0.113.99) y el sudo para tocar el crontab de www-data. Los fallos sueltos son el contexto; el fallo de «marta» desde la red interna seguido de éxito es un despiste humano.',
    },
  ],
  learned: ['Mapear un incidente en ATT&CK', 'Emulación de adversarios', 'Elegir qué merece una alerta crítica'],
  tip: 'Una matriz ATT&CK coloreada con «detectamos / no detectamos» es la mejor hoja de ruta del SOC.',
};

// ─────────────────────────── MÓDULO 10 · RESPUESTA A INCIDENTES ───────────────────────────

const PROXY_LOG = Array.from({ length: 12 }, (_, i) => {
  const mm = String(i * 5).padStart(2, '0');
  const lines = [`Nov  4 14:${mm}:03 proxy01 GET https://actualizaciones-sistema.lab/ping host=PC-CONTA-07 bytes=312`];
  if (i % 3 === 0) lines.push(`Nov  4 14:${mm}:20 proxy01 GET https://www.nebula-logistica.lab/catalogo host=PC-VENTAS-02 bytes=48211`);
  return lines.join('\n');
}).join('\n');

const IR_SCN = {
  host: 'pc-conta-07',
  files: {
    '/home/analista/alerta.txt': 'ALERTA SIEM #8812 · Severidad ALTA\nEquipo: PC-CONTA-07\nRegla: conexiones periódicas (beaconing) a un dominio de reciente creación\nAcción: investigar, contener y conservar evidencias.',
    '/var/log/proxy.log': PROXY_LOG,
    '/home/conta/Descargas/factura_noviembre.pdf.exe': { content: 'MZ (ejecutable de laboratorio disfrazado de PDF)', owner: 'conta' },
    '/home/conta/.config/autostart/actualizador.desktop': { content: '[Desktop Entry]\nExec=/home/conta/.local/bin/actualizador\nName=Actualizador', owner: 'conta' },
    '/home/conta/.local/bin/actualizador': { content: '#!/bin/bash\n# implante de laboratorio', owner: 'conta', mode: 'rwxr-xr-x' },
  },
  dns: { 'actualizaciones-sistema.lab': { A: ['198.51.100.200'] } },
  whois: { 'actualizaciones-sistema.lab': 'Domain Name: ACTUALIZACIONES-SISTEMA.LAB\nCreation Date: 2026-11-01\nRegistrant Organization: REDACTED FOR PRIVACY' },
  procs: [
    { pid: 1, user: 'root', cmd: '/sbin/init' },
    { pid: 2210, user: 'conta', cmd: '/usr/lib/oficina/hoja-calculo' },
    { pid: 3377, user: 'conta', cmd: '/home/conta/.local/bin/actualizador --beacon 300' },
    { pid: 3400, user: 'analista', cmd: '-bash' },
  ],
};

const m10c = {
  id: 'm10-nist',
  module: 'm10',
  teams: ALL,
  title: 'El ciclo de respuesta',
  story: {
    red: 'Tus informes acaban alimentando planes de respuesta. Entender el ciclo te ayuda a escribir recomendaciones que Azul pueda ejecutar.',
    blue: 'Detectar no basta: hay que saber responder con método, incluso a las tres de la mañana.',
    purple: 'Los ejercicios morados ponen a prueba el plan de respuesta. Primero, conócelo.',
  },
  lesson: [
    { title: 'NIST SP 800-61', text: 'El ciclo clásico: Preparación → Detección y análisis → Contención, erradicación y recuperación → Actividad post-incidente (lecciones aprendidas). Y vuelta a empezar, mejor preparados.' },
    { title: 'Evidencias', text: 'Antes de borrar nada, se conservan las evidencias: copia del fichero, su hash (para demostrar que no se ha alterado) y la cadena de custodia (quién lo tocó y cuándo). Pueden ser necesarias para una denuncia.' },
    { title: 'Notificar', text: 'Si hay datos personales afectados, el RGPD obliga a notificar a la autoridad de control (AEPD en España) en un máximo de 72 horas desde que se conoce la brecha.' },
  ],
  challenges: [
    {
      type: 'order',
      title: 'Las fases',
      prompt: 'Ordena las fases de respuesta a incidentes.',
      items: ['Preparación', 'Detección y análisis', 'Contención', 'Erradicación', 'Recuperación', 'Lecciones aprendidas'],
      explain: 'Preparación → Detección → Contención → Erradicación → Recuperación → Lecciones aprendidas.',
    },
    {
      type: 'quiz',
      title: 'Decisiones bajo presión',
      questions: [
        { q: 'Un portátil está infectado. ¿Qué haces primero?', options: ['Apagarlo y formatearlo de inmediato', 'Aislarlo de la red, conservando su estado para el análisis', 'Seguir trabajando y mirarlo mañana'], correct: 1, explain: 'Aislar contiene la amenaza sin destruir evidencias que están en memoria.' },
        { q: 'Hay datos personales de clientes afectados. ¿Plazo para notificar a la AEPD?', options: ['72 horas', '30 días', 'No hace falta'], correct: 0, explain: 'Artículo 33 del RGPD: 72 horas desde que se tiene constancia.' },
      ],
    },
  ],
  learned: ['El ciclo de NIST', 'Conservar evidencias y su hash', 'Las 72 horas del RGPD'],
  tip: { red: 'Recomienda siempre algo para cada fase: prevenir, detectar y responder.', blue: 'Ensaya el plan con simulacros de mesa (tabletop): el día real no es momento de leerlo por primera vez.', purple: 'Las lecciones aprendidas son el punto de partida del siguiente ejercicio morado.' },
};

const m10r = {
  id: 'm10-informe',
  module: 'm10',
  teams: ['red'],
  title: 'El informe final',
  story: 'Termina la auditoría de Nébula. Te queda la parte más importante: el informe. Es lo único que el cliente se queda de tu trabajo.',
  lesson: [
    { title: 'Estructura', text: 'Resumen ejecutivo (para dirección) · Alcance y metodología · Hallazgos con severidad, evidencia y recomendación · Plan de remediación priorizado · Anexos técnicos.' },
    { title: 'Tono', text: 'Profesional, sin sensacionalismo ni culpables. El objetivo es que el cliente mejore, no demostrar lo bueno que eres.' },
  ],
  challenges: [
    {
      type: 'order',
      title: 'Estructura del informe',
      prompt: 'Ordena las secciones del informe de auditoría.',
      items: ['Resumen ejecutivo', 'Alcance, fechas y metodología', 'Hallazgos detallados (severidad, evidencia, recomendación)', 'Plan de remediación priorizado', 'Anexos técnicos'],
      explain: 'De lo general (dirección) a lo concreto (técnicos).',
    },
    {
      type: 'classify',
      title: 'Hallazgo → recomendación',
      prompt: 'Asigna a cada hallazgo de la campaña su recomendación principal.',
      categories: [{ id: 'patch', label: 'Actualizar / retirar' }, { id: 'code', label: 'Corregir el código' }, { id: 'mfa', label: 'MFA y política de claves' }, { id: 'dmarc', label: 'Publicar DMARC' }],
      items: [
        { text: 'MySQL 5.5 sin soporte expuesto a Internet', cat: 'patch', explain: 'Actualizar y sacar de Internet.' },
        { text: 'Inyección SQL en el login del portal', cat: 'code', explain: 'Consultas parametrizadas.' },
        { text: 'Acceso SSH obtenido por fuerza bruta con contraseña débil', cat: 'mfa', explain: 'Claves SSH o MFA, y bloqueo tras intentos.' },
        { text: 'Correos que suplantan al dominio de la empresa', cat: 'dmarc', explain: 'DMARC p=reject con SPF y DKIM.' },
        { text: 'Telnet activo en el servidor web', cat: 'patch', explain: 'Desactivarlo y usar SSH.' },
      ],
    },
  ],
  learned: ['Estructura de un informe profesional', 'Recomendaciones accionables', 'Tono y ética del informe'],
  tip: 'Ofrece una re-auditoría: comprobar que las correcciones funcionan cierra el ciclo.',
};

const m10b = {
  id: 'm10-operacion',
  module: 'm10',
  teams: ['blue'],
  title: 'Operación Otero: incidente en vivo',
  story: 'Examen final del SOC. Salta una alerta en PC-CONTA-07: conexiones periódicas a un dominio desconocido. Estás conectado al equipo. Investiga, contén, conserva evidencias y erradica. El reloj corre.',
  lesson: [
    { title: 'Beaconing', text: 'Un implante suele «llamar a casa» (a su servidor de mando y control, C2) a intervalos regulares. En el proxy se ve como peticiones idénticas cada pocos minutos, con muy pocos bytes, a un dominio recién creado.' },
    { title: 'Tu checklist', text: '1) Lee la alerta. 2) Confirma en el proxy. 3) Identifica el destino y bloquéalo. 4) Encuentra el proceso y su persistencia. 5) Conserva la evidencia (hash) antes de borrar. 6) Erradica.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Incidente #8812',
      prompt: 'Resuelve el incidente de principio a fin. Tienes sudo.',
      scenario: IR_SCN,
      objectives: [
        { id: 'alerta', text: 'Lee la alerta', how: 'cat alerta.txt', check: read('/home/analista/alerta.txt') },
        { id: 'proxy', text: 'Filtra en el proxy las peticiones de PC-CONTA-07', how: 'grep PC-CONTA-07 /var/log/proxy.log', check: ev('grep', (e) => /conta-07/i.test(e.pattern)) },
        { id: 'dom', text: '¿A qué dominio llama?', answer: ['actualizaciones-sistema.lab'], placeholder: 'dominio' },
        { id: 'int', text: '¿Cada cuántos minutos?', answer: ['5', '5 minutos', 'cinco'], placeholder: 'minutos' },
        { id: 'dig', text: 'Resuelve la IP del dominio', how: 'dig actualizaciones-sistema.lab', check: ev('dig', (e) => e.domain === 'actualizaciones-sistema.lab') },
        { id: 'block', text: 'Bloquea esa IP', how: 'sudo iptables -A INPUT -s 198.51.100.200 -j DROP', check: blocked('198.51.100.200') },
        { id: 'ps', text: 'Encuentra el proceso del implante', how: 'ps aux', check: ev('ps') },
        { id: 'persist', text: 'Localiza su persistencia en ~conta/.config/autostart', how: 'ls /home/conta/.config/autostart y cat del .desktop', check: read('/home/conta/.config/autostart/actualizador.desktop') },
        { id: 'hash', text: 'Conserva la evidencia: calcula el SHA-256 del implante antes de borrarlo', how: 'sha256sum /home/conta/.local/bin/actualizador', check: ev('sha256sum', (e) => e.files.includes('/home/conta/.local/bin/actualizador')) },
        { id: 'kill', text: 'Detén el proceso', how: 'sudo kill 3377', check: noProc(/actualizador/) },
        { id: 'erad', text: 'Elimina la persistencia y el implante', how: 'sudo rm de los dos ficheros', check: all(gone('/home/conta/.config/autostart/actualizador.desktop'), gone('/home/conta/.local/bin/actualizador')) },
        { id: 'origen', text: '¿Qué fichero descargado fue probablemente el origen?', answer: ['factura_noviembre.pdf.exe', '/home/conta/Descargas/factura_noviembre.pdf.exe'], placeholder: 'fichero' },
      ],
      solution: ['cat alerta.txt', 'grep PC-CONTA-07 /var/log/proxy.log', 'dig actualizaciones-sistema.lab', 'sudo iptables -A INPUT -s 198.51.100.200 -j DROP', 'ps aux', 'cat /home/conta/.config/autostart/actualizador.desktop', 'sha256sum /home/conta/.local/bin/actualizador', 'sudo kill 3377', 'sudo rm /home/conta/.config/autostart/actualizador.desktop', 'sudo rm /home/conta/.local/bin/actualizador', 'ls /home/conta/Descargas'],
      hints: ['Mira la hora de cada petición de PC-CONTA-07 al mismo dominio.', 'La línea Exec= del .desktop dice qué se arranca al iniciar sesión.', 'Una doble extensión (.pdf.exe) es un truco clásico.'],
    },
  ],
  learned: ['Detectar beaconing en el proxy', 'Contener, conservar evidencias y erradicar', 'Encontrar el vector de entrada'],
  tip: 'Cierra el incidente con lecciones aprendidas: ¿por qué el filtro de correo dejó pasar un .pdf.exe?',
};

const m10p = {
  id: 'm10-ejercicio',
  module: 'm10',
  teams: ['purple'],
  title: 'Ejercicio morado final',
  story: 'Diriges el ejercicio final con Nébula: Rojo emula (con autorización) el incidente de PC-CONTA-07 y tú compruebas, paso a paso, qué detecta Azul y qué hay que mejorar.',
  lesson: [
    { title: 'Matriz de cobertura', text: 'Para cada técnica emulada se apunta: ¿se registró?, ¿saltó una alerta?, ¿se respondió a tiempo? Las casillas vacías son el plan de trabajo del siguiente trimestre.' },
  ],
  challenges: [
    {
      type: 'terminal',
      title: 'Valida la telemetría',
      prompt: 'Comprueba en el equipo de prueba que la telemetría del ejercicio existe.',
      scenario: IR_SCN,
      objectives: [
        { id: 'proxy', text: 'Confirma el beaconing en el proxy', how: 'grep actualizaciones-sistema /var/log/proxy.log', check: ev('grep', (e) => /actualizaciones|conta-07/i.test(e.pattern)) },
        { id: 'n', text: '¿Cuántas peticiones de beaconing hay registradas?', answer: ['12'], placeholder: 'número' },
        { id: 'whois', text: 'Consulta cuándo se creó el dominio de C2', how: 'whois actualizaciones-sistema.lab', check: ev('whois', (e) => e.domain === 'actualizaciones-sistema.lab') },
        { id: 'ps', text: 'Comprueba que el proceso es visible', how: 'ps aux', check: ev('ps') },
      ],
      solution: ['grep -c actualizaciones-sistema /var/log/proxy.log', 'whois actualizaciones-sistema.lab', 'ps aux'],
      hints: ['grep -c cuenta coincidencias.'],
    },
    {
      type: 'classify',
      title: 'Matriz de cobertura',
      prompt: 'Resultado del ejercicio: clasifica cada técnica según cómo le fue a Azul.',
      categories: [{ id: 'det', label: 'Detectada y respondida' }, { id: 'tel', label: 'Registrada, sin alerta' }, { id: 'none', label: 'Ni registrada' }],
      items: [
        { text: 'Beaconing al dominio de C2 (alerta del SIEM en 10 min)', cat: 'det', explain: 'La regla de beaconing funcionó.' },
        { text: 'Descarga del .pdf.exe (está en el log del proxy, nadie lo miró)', cat: 'tel', explain: 'Mejora: alerta por dobles extensiones.' },
        { text: 'Persistencia en autostart (no hay auditoría de ese directorio)', cat: 'none', explain: 'Mejora: monitorizar los directorios de arranque.' },
      ],
    },
    {
      type: 'order',
      title: 'Plan de mejora',
      prompt: 'Ordena las acciones del plan por prioridad, de la primera a la última.',
      items: ['Registrar los cambios en los directorios de arranque (hoy no hay ni datos)', 'Crear la alerta por descargas con doble extensión', 'Bloquear los ejecutables adjuntos en el filtro de correo', 'Repetir el ejercicio para validar las mejoras'],
      explain: 'Sin datos no hay detección; después, alertas y prevención; y por último, se vuelve a medir.',
    },
  ],
  learned: ['Matriz de cobertura', 'Priorizar mejoras de detección', 'Cerrar el ciclo con un nuevo ejercicio'],
  tip: 'Enhorabuena: así funciona un programa de seguridad maduro. Rojo, Azul y Morado, un solo equipo.',
};

export default [m8c, m8r, m8b, m8p, m9c, m9r, m9b, m9p, m10c, m10r, m10b, m10p];
