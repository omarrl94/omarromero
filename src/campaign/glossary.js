// Objetivos de aprendizaje y glosario de cada tema.
// Los objetivos dicen qué sabrá HACER el alumno al terminar; el glosario fija el vocabulario.
// Todo lo que aparece aquí se trabaja en la lección común del tema (la ven los tres equipos).

export const OBJECTIVES = {
  m1: ['Moverte por una terminal de Linux con pwd, ls, cd y cat, incluidos los ficheros ocultos', 'Clasificar un incidente según la tríada CIA', 'Explicar por qué sin autorización por escrito no hay auditoría (art. 197 bis CP) y qué es la divulgación responsable', 'Situar una acción del adversario en una táctica de MITRE ATT&CK'],
  m2: ['Leer permisos rwx y traducirlos a notación octal', 'Corregir permisos con chmod aplicando el mínimo privilegio', 'Encontrar ficheros peligrosos con find -perm', 'Saber cuándo hace falta sudo y por qué un sudoers permisivo es grave'],
  m3: ['Distinguir el reconocimiento pasivo del activo', 'Obtener información pública con whois y dig (A, MX, NS, TXT)', 'Extraer metadatos de un documento con exiftool', 'Proponer cómo reducir la huella pública: metadatos, ofertas de empleo, subdominios y DMARC'],
  m4: ['Relacionar los puertos habituales con su servicio', 'Explicar el saludo TCP y los estados abierto, cerrado y filtrado', 'Detectar un escaneo en un log con grep y contarlo', 'Contener con iptables y apagar servicios innecesarios con systemctl'],
  m5: ['Diferenciar CVE, CWE y CVSS', 'Asignar severidad a partir de una puntuación CVSS', 'Priorizar parches según la gravedad, la exposición y la explotación activa', 'Proponer una mitigación cuando no se puede parchear'],
  m6: ['Reconocer inyección SQL, XSS, IDOR y credenciales en el código', 'Elegir la corrección de raíz de cada fallo', 'Encontrar intentos de abuso en un log web', 'Explicar qué aporta un WAF y por qué no sustituye al código seguro'],
  m7: ['Distinguir codificar, cifrar y calcular un hash', 'Decodificar Base64 y ROT13 y verificar la integridad con sha256sum', 'Reconocer un hash por su longitud', 'Recomendar cómo guardar contraseñas (Argon2id o bcrypt con sal) y por qué usar MFA'],
  m8: ['Reconocer las señales de un phishing', 'Analizar las cabeceras de un correo: Return-Path, Received, SPF y DMARC', 'Extraer y bloquear indicadores de compromiso (IOC)', 'Diseñar un simulacro de concienciación ético'],
  m9: ['Leer auth.log y reconocer una fuerza bruta seguida de un acceso', 'Encontrar procesos anómalos con ps y persistencia en cron', 'Erradicar en el orden correcto: tarea, proceso, fichero y credenciales', 'Mapear un incidente en tácticas de ATT&CK'],
  m10: ['Aplicar las fases de respuesta a incidentes del NIST', 'Detectar beaconing en un proxy y contener el canal de mando y control', 'Conservar evidencias con su hash antes de borrar', 'Estructurar un informe con resumen ejecutivo y conocer el plazo de 72 h del RGPD'],
};

const G = (term, def) => ({ term, def });
export const GLOSSARY = {
  m1: [
    G('Tríada CIA', 'Confidencialidad (solo lo ve quien debe), Integridad (no se altera sin permiso) y Disponibilidad (accesible cuando se necesita).'),
    G('Autorización y alcance', 'Permiso por escrito que fija qué sistemas, en qué fechas y con qué técnicas se puede auditar. Sin ella, la prueba es un delito.'),
    G('Art. 197 bis CP', 'Artículo del Código Penal español que castiga acceder sin autorización a un sistema informático.'),
    G('Divulgación responsable', 'Avisar de un fallo a su responsable sin explotarlo ni publicarlo hasta que se corrija.'),
    G('MITRE ATT&CK', 'Catálogo público de tácticas (el «para qué») y técnicas (el «cómo») de los adversarios reales.'),
    G('Defensa en profundidad', 'Varias capas de protección: si una falla, la siguiente frena al atacante.'),
  ],
  m2: [
    G('Permisos rwx', 'Lectura (r), escritura (w) y ejecución (x) para el dueño, el grupo y el resto.'),
    G('Notación octal', 'r=4, w=2, x=1, sumados por grupo: 600 = rw-------, 755 = rwxr-xr-x.'),
    G('Mínimo privilegio', 'Cada usuario o programa tiene solo los permisos imprescindibles.'),
    G('sudo', 'Ejecuta una orden como administrador (root). El fichero sudoers decide quién puede usarlo.'),
    G('FIM', 'Monitorización de integridad de ficheros: avisa cuando un fichero crítico cambia.'),
  ],
  m3: [
    G('OSINT', 'Inteligencia de fuentes abiertas: información pública sobre un objetivo.'),
    G('Reconocimiento pasivo', 'Recopilar información sin tocar los sistemas del objetivo. El activo sí les envía tráfico.'),
    G('WHOIS', 'Datos públicos de registro de un dominio.'),
    G('DNS: A, MX, NS, TXT', 'A = dirección IP · MX = servidor de correo · NS = servidores de nombres · TXT = texto (por ejemplo, SPF o DMARC).'),
    G('Metadatos', 'Información oculta en un documento: autor, programa y fechas.'),
    G('SPF · DKIM · DMARC', 'Registros que protegen el correo: quién puede enviar, la firma del mensaje y qué hacer con los que fallan (p=reject los rechaza).'),
    G('Superficie de ataque', 'Todo lo que un atacante puede tocar o aprovechar: servicios, personas, software y subdominios.'),
  ],
  m4: [
    G('Puerto', 'Número que identifica un servicio dentro de una máquina (22 SSH, 80 HTTP, 443 HTTPS…).'),
    G('Saludo TCP', 'SYN → SYN-ACK → ACK: así empieza toda conexión TCP.'),
    G('Abierto · cerrado · filtrado', 'Responde un servicio · responde RST (no hay servicio) · no responde porque un cortafuegos lo impide.'),
    G('Escaneo de puertos', 'Probar muchos puertos para ver cuáles responden. En los logs: una IP, muchos puertos y poco tiempo.'),
    G('Cortafuegos (iptables)', 'Filtra el tráfico. «iptables -A INPUT -s IP -j DROP» descarta lo que llega de esa IP.'),
    G('Telemetría', 'Datos que registran los sistemas. Sin una alerta asociada, nadie se entera.'),
  ],
  m5: [
    G('CVE', 'Identificador de una vulnerabilidad concreta en un producto concreto.'),
    G('CWE', 'Tipo de fallo: CWE-89 inyección SQL, CWE-79 XSS, CWE-798 credenciales en el código…'),
    G('CVSS', 'Gravedad de 0 a 10: baja (<4), media (4-6,9), alta (7-8,9) y crítica (9-10).'),
    G('Parche', 'Actualización que corrige una vulnerabilidad.'),
    G('Mitigación', 'Medida temporal que reduce el riesgo mientras no se puede parchear.'),
    G('Explotación activa', 'Vulnerabilidad que ya se está usando en ataques reales: va la primera.'),
  ],
  m6: [
    G('OWASP Top 10', 'Lista de los riesgos más críticos de las aplicaciones web.'),
    G('Inyección SQL', 'Los datos del usuario se mezclan con la consulta y alteran su lógica. Se corrige con consultas parametrizadas.'),
    G('XSS', 'Se inyecta código que ejecuta el navegador de la víctima. Se corrige escapando la salida.'),
    G('IDOR', 'Acceder a objetos ajenos cambiando un identificador. Se corrige comprobando a quién pertenece cada recurso.'),
    G('WAF', 'Cortafuegos de aplicaciones web: filtra patrones de ataque. No sustituye al código seguro.'),
    G('Autenticación y autorización', 'Quién eres frente a qué tienes derecho a hacer.'),
  ],
  m7: [
    G('Codificar', 'Cambiar el formato (Base64, hexadecimal). Se revierte sin clave.'),
    G('Cifrar', 'Ocultar el contenido. Solo se revierte con la clave (AES, RSA).'),
    G('Hash', 'Huella de un solo sentido. MD5 = 32 caracteres, SHA-1 = 40 y SHA-256 = 64.'),
    G('Sal', 'Valor aleatorio por usuario que hace que contraseñas iguales den hashes distintos.'),
    G('Argon2id · bcrypt', 'Algoritmos lentos, con sal, pensados para guardar contraseñas.'),
    G('MFA', 'Autenticación multifactor: algo que sabes más algo que tienes.'),
    G('Firma digital', 'Prueba quién publicó un fichero y que no ha cambiado.'),
  ],
  m8: [
    G('Ingeniería social', 'Manipular a personas usando la urgencia, el miedo, la autoridad o la curiosidad.'),
    G('Phishing · smishing', 'Engaño por correo · por SMS.'),
    G('Fraude del CEO', 'Suplantar a un directivo para pedir un pago urgente. Se para verificando por otro canal.'),
    G('Typosquatting', 'Dominio casi igual al legítimo (nebu1a en lugar de nebula).'),
    G('Return-Path · Received', 'Cabeceras que revelan el origen real de un correo, a diferencia del From.'),
    G('IOC', 'Indicador de compromiso: IP, dominio, URL o hash asociado a un ataque.'),
  ],
  m9: [
    G('SOC', 'Centro de operaciones de seguridad: vigila, detecta y responde.'),
    G('SIEM', 'Plataforma que reúne los logs y genera alertas.'),
    G('auth.log', 'Registro de Linux con los inicios de sesión (Failed/Accepted) y los usos de sudo.'),
    G('Fuerza bruta (T1110)', 'Probar muchas contraseñas. Lo grave es un acceso aceptado después.'),
    G('Persistencia', 'Lo que deja el atacante para volver: tareas cron, servicios, claves SSH…'),
    G('EDR', 'Software que vigila de forma continua los procesos y el comportamiento de cada equipo, y alerta o bloquea lo anómalo.'),
    G('Emulación de adversarios', 'Repetir de forma controlada las técnicas de un ataque para comprobar la detección.'),
  ],
  m10: [
    G('Ciclo NIST', 'Preparación → Detección y análisis → Contención → Erradicación → Recuperación → Lecciones aprendidas.'),
    G('Contención', 'Limitar el daño: aislar el equipo, bloquear el C2, deshabilitar cuentas.'),
    G('Cadena de custodia', 'Registro de quién manipuló cada evidencia y cuándo; el hash demuestra que no ha cambiado.'),
    G('Beaconing · C2', 'Conexiones periódicas de un implante a su servidor de mando y control.'),
    G('RGPD: 72 horas', 'Plazo para notificar a la autoridad de control (AEPD) una brecha con datos personales.'),
    G('Resumen ejecutivo', 'Primera parte del informe, para dirección: riesgo de negocio, sin jerga.'),
  ],
};
