import type { TopicContent } from "./types";

// Bloque 3 · Defensa y hardening (temas 8-11). Enfoque defensivo (bastionado, configuración segura).
export const bloque3: Record<number, TopicContent> = {
  8: {
    theory: [
      {
        title: "Qué es el hardening",
        paragraphs: [
          "El hardening o bastionado consiste en reducir la superficie de ataque de un sistema: desactivar lo que no se usa, aplicar configuraciones seguras y mantenerlo actualizado. Un sistema recién instalado trae servicios y opciones pensados para la comodidad, no para la seguridad.",
          "En Windows se trabaja sobre cuentas, actualizaciones, el cortafuegos, el antivirus (Microsoft Defender) y las directivas del sistema.",
        ],
        bullets: [
          "Principio de mínima exposición: menos software y servicios, menos riesgo.",
          "Cuentas con contraseñas robustas y sin privilegios de administrador para el uso diario.",
          "Control de Cuentas de Usuario (UAC) activado.",
          "Cifrado del disco para proteger los datos si el equipo se pierde o roba.",
        ],
      },
      {
        title: "Cuentas, UAC y actualizaciones",
        paragraphs: [
          "Cada persona debe tener su propia cuenta y usar una cuenta estándar (no administrador) para las tareas cotidianas. El Control de Cuentas de Usuario pide confirmación cuando una acción requiere privilegios elevados, lo que frena muchos programas maliciosos.",
          "Windows Update corrige vulnerabilidades conocidas. Mantenerlo activo y al día es una de las medidas más eficaces y sencillas.",
        ],
      },
      {
        title: "Defender y cortafuegos",
        paragraphs: [
          "Microsoft Defender incluye antivirus, protección en tiempo real y cortafuegos. El cortafuegos de Windows filtra el tráfico de red por perfiles (dominio, privado, público); conviene revisar qué aplicaciones tienen permitido comunicarse.",
          "Cifrar el disco con BitLocker protege la información en caso de pérdida física del equipo.",
        ],
      },
      {
        title: "CIS Benchmarks, GPO y automatización",
        only: "SUPERIOR",
        paragraphs: [
          "Los CIS Benchmarks son guías de configuración segura consensuadas para cada sistema. Microsoft publica además sus Security Baselines. Aplicarlos de forma manual es lento; en un dominio se despliegan mediante Directivas de Grupo (GPO).",
          "Herramientas como LAPS gestionan de forma segura las contraseñas de administrador local, y AppLocker restringe qué aplicaciones pueden ejecutarse. La configuración puede generarse y auditarse con scripts, revisando siempre el resultado antes de aplicarlo.",
        ],
      },
      {
        title: "Hardening asistido por IA y detección basada en ML",
        only: "SUPERIOR",
        paragraphs: [
          "Un asistente de IA puede proponer una lista de verificación de bastionado o un borrador de script de configuración a partir de un CIS Benchmark. El técnico debe revisar cada línea: la IA puede sugerir opciones inexistentes o contraproducentes.",
          "Microsoft Defender for Endpoint incorpora detección basada en aprendizaje automático que identifica comportamientos anómalos, más allá de las firmas tradicionales.",
        ],
      },
    ],
    labs: [
      {
        title: "Bastionado básico de una cuenta y el cortafuegos en Windows",
        goal: "Configurar una cuenta estándar, comprobar las actualizaciones y revisar el cortafuegos en la máquina Windows del laboratorio.",
        environment: ["VM de Windows del laboratorio", "Instantánea previa para poder restaurar"],
        steps: [
          { title: "Restaurar la instantánea base", detail: "Antes de empezar, vuelve a la instantánea limpia de la VM de Windows." },
          { title: "Crear una cuenta estándar", detail: "En Configuración → Cuentas → Otros usuarios, crea una cuenta local de tipo «Usuario estándar» y asígnale una contraseña robusta. Úsala para el día a día." },
          { title: "Comprobar Windows Update", detail: "En Configuración → Windows Update, busca e instala las actualizaciones pendientes." },
          { title: "Revisar el estado de Defender", detail: "Abre Seguridad de Windows y verifica que la protección en tiempo real y el cortafuegos están activos en los tres perfiles." },
          { title: "Revisar reglas del cortafuegos", detail: "En «Firewall de Windows Defender con seguridad avanzada», revisa las reglas de entrada activas y anota qué aplicaciones tienen tráfico permitido." },
          { title: "Documentar los cambios", detail: "Anota en tu cuaderno cada cambio realizado y el estado antes y después. Toma una instantánea «08-hardening»." },
        ],
        check: "Existe una cuenta estándar, el sistema está actualizado, Defender y el cortafuegos están activos y has documentado los cambios.",
      },
      {
        title: "Lista de verificación de bastionado con ayuda de IA",
        only: "SUPERIOR",
        goal: "Elaborar y validar una checklist de hardening de Windows Server partiendo de un CIS Benchmark y contrastándola con un asistente de IA.",
        environment: ["Documento CIS Benchmark de Windows Server (resumen)", "Asistente de IA", "Hoja de cálculo"],
        steps: [
          { title: "Extraer 15 controles del benchmark", detail: "Selecciona 15 recomendaciones del CIS Benchmark (políticas de contraseña, auditoría, servicios innecesarios…) y ponlas en una tabla." },
          { title: "Pedir a la IA que la amplíe", detail: "Solicita al asistente controles adicionales relevantes. Marca cuáles acepta el benchmark y cuáles son invenciones o duplicados." },
          { title: "Clasificar por impacto", detail: "Para cada control indica impacto en seguridad (alto/medio/bajo) y posible efecto sobre la operativa." },
          { title: "Verificar dos controles en la VM", detail: "Comprueba en la VM de Windows si dos de los controles están aplicados y anota el resultado." },
          { title: "Conclusión", detail: "Escribe un párrafo sobre en qué ayudó la IA y qué errores cometió, justificando por qué la revisión humana es imprescindible." },
        ],
        check: "La checklist tiene al menos 15 controles verificados contra el benchmark, con impacto clasificado y una reflexión sobre el uso de la IA.",
      },
    ],
    activities: [
      { title: "Cuenta admin vs. estándar", description: "Explica con un ejemplo real por qué trabajar a diario con una cuenta de administrador aumenta el riesgo, y qué aporta el UAC." },
      { title: "Auditoría rápida de un equipo", description: "Sobre tu equipo del aula, comprueba y anota: estado de las actualizaciones, del antivirus, del cortafuegos y si el disco está cifrado." },
      { title: "Investiga BitLocker", description: "Resume cómo funciona el cifrado de disco, qué protege y qué NO protege (por ejemplo, frente a malware con el equipo encendido)." },
      { title: "Interpreta un CIS Benchmark", only: "SUPERIOR", description: "Escoge tres controles de un CIS Benchmark de Windows y explica qué riesgo mitiga cada uno y cómo se comprobaría." },
    ],
    projects: [
      {
        title: "Guía de bastionado de un equipo de oficina",
        only: "MEDIO",
        description: "Elabora una guía paso a paso para dejar seguro un ordenador Windows de una oficina pequeña.",
        deliverables: ["Documento con capturas del antes y el después", "Checklist de 10 medidas aplicadas"],
        evaluation: ["Medidas correctas y aplicadas (50%)", "Documentación con capturas (30%)", "Claridad (20%)"],
      },
      {
        title: "Plantilla de hardening para Windows Server",
        only: "SUPERIOR",
        description: "Diseña una plantilla de bastionado para un servidor Windows basada en CIS, indicando cómo se desplegaría mediante GPO en un dominio.",
        deliverables: ["Documento de controles priorizados", "Propuesta de despliegue con GPO", "Plan de verificación posterior"],
        evaluation: ["Cobertura y priorización de controles (40%)", "Viabilidad del despliegue (30%)", "Plan de verificación (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué es el hardening de un sistema?", options: ["Instalar más programas", "Reducir su superficie de ataque con configuración segura", "Aumentar la velocidad", "Cifrar solo el correo"], answer: 1, explanation: "Bastionar es reducir la exposición: quitar lo innecesario y configurar de forma segura." },
      { question: "¿Por qué conviene usar una cuenta estándar para el trabajo diario?", options: ["Es más rápida", "Limita el daño si el equipo se infecta", "Permite instalar cualquier programa", "No necesita contraseña"], answer: 1, explanation: "Sin privilegios de administrador, muchas acciones maliciosas quedan bloqueadas." },
      { question: "¿Qué corrige principalmente Windows Update?", options: ["El diseño del escritorio", "Vulnerabilidades conocidas del sistema", "La velocidad de Internet", "El tamaño del disco"], answer: 1, explanation: "Las actualizaciones cierran fallos de seguridad ya descubiertos." },
      { question: "¿Qué protege BitLocker?", options: ["Frente a virus en ejecución", "Los datos si el equipo se pierde o roban", "La conexión Wi-Fi", "Las contraseñas del navegador"], answer: 1, explanation: "El cifrado de disco protege la información almacenada ante el acceso físico no autorizado." },
      { question: "El Control de Cuentas de Usuario (UAC)…", options: ["Desactiva el antivirus", "Pide confirmación para acciones con privilegios elevados", "Acelera el arranque", "Cifra el correo"], answer: 1, explanation: "El UAC frena cambios que requieren permisos de administrador." },
      { question: "¿Qué son los CIS Benchmarks?", only: "SUPERIOR", options: ["Un antivirus", "Guías consensuadas de configuración segura", "Una ley europea", "Un lenguaje de programación"], answer: 1, explanation: "Son recomendaciones de bastionado revisadas por la comunidad para cada sistema." },
      { question: "En un dominio, ¿cómo se despliega de forma centralizada una configuración de seguridad?", only: "SUPERIOR", options: ["Copiándola a mano en cada equipo", "Mediante Directivas de Grupo (GPO)", "Reinstalando Windows", "Desactivando Defender"], answer: 1, explanation: "Las GPO aplican configuraciones a muchos equipos desde el controlador de dominio." },
    ],
  },

  9: {
    theory: [
      {
        title: "Usuarios, grupos y permisos en Linux",
        paragraphs: [
          "En Linux cada archivo tiene un propietario, un grupo y permisos de lectura, escritura y ejecución. Un buen control de permisos evita que un usuario acceda a lo que no le corresponde. La cuenta root es todopoderosa: se usa mediante sudo solo cuando es necesario.",
          "El principio de mínimo privilegio también aplica: servicios y usuarios con los permisos justos.",
        ],
        bullets: [
          "Permisos rwx para propietario, grupo y otros.",
          "sudo para tareas administrativas puntuales, en lugar de trabajar como root.",
          "Revisar quién pertenece a grupos sensibles (sudo, docker).",
        ],
      },
      {
        title: "Acceso remoto seguro con SSH",
        paragraphs: [
          "SSH permite administrar servidores de forma remota y cifrada. Es más seguro autenticarse con par de claves que con contraseña, y conviene deshabilitar el acceso directo de root.",
          "Herramientas como fail2ban bloquean temporalmente las direcciones que fallan repetidamente al iniciar sesión, mitigando intentos automatizados.",
        ],
      },
      {
        title: "Actualizaciones y servicios",
        paragraphs: [
          "Mantener el sistema actualizado (apt) cierra vulnerabilidades. Conviene desinstalar o desactivar servicios que no se usan y revisar qué puertos están a la escucha.",
        ],
      },
      {
        title: "SELinux/AppArmor, auditd y detección de anomalías",
        only: "SUPERIOR",
        paragraphs: [
          "SELinux y AppArmor son sistemas de control de acceso obligatorio que confinan lo que cada proceso puede hacer, de modo que aunque un servicio se vea comprometido, su capacidad de daño queda limitada.",
          "auditd registra eventos del sistema para su posterior análisis. Sobre esos registros de acceso pueden aplicarse modelos de aprendizaje automático que detectan comportamientos anómalos (accesos a horas inusuales, patrones raros), complementando las reglas fijas.",
        ],
      },
    ],
    labs: [
      {
        title: "Endurecer el acceso SSH del servidor",
        goal: "Configurar autenticación por clave y buenas prácticas de acceso en la VM Ubuntu del laboratorio.",
        environment: ["VM Ubuntu del laboratorio", "Instantánea previa"],
        steps: [
          { title: "Generar un par de claves", detail: "En tu equipo (o en otra VM) genera un par de claves.", code: "ssh-keygen -t ed25519 -C \"asir-lab\"" },
          { title: "Copiar la clave al servidor", detail: "Copia la clave pública al servidor para poder entrar sin contraseña.", code: "ssh-copy-id asir@10.10.10.X" },
          { title: "Comprobar el acceso por clave", detail: "Conéctate y verifica que entras sin que te pida contraseña." },
          { title: "Instalar fail2ban", detail: "Instala fail2ban para frenar intentos de acceso automatizados.", code: "sudo apt update && sudo apt install -y fail2ban\nsudo systemctl enable --now fail2ban" },
          { title: "Revisar servicios a la escucha", detail: "Comprueba qué servicios escuchan en la red y valora si alguno sobra.", code: "sudo ss -tlnp" },
          { title: "Documentar", detail: "Anota la configuración final y crea la instantánea «09-ssh»." },
        ],
        check: "Entras al servidor con clave, fail2ban está activo y sabes qué puertos están a la escucha.",
      },
      {
        title: "Confinar un servicio y revisar registros de auditoría",
        only: "SUPERIOR",
        goal: "Trabajar con AppArmor y auditd para limitar y observar el comportamiento de un servicio.",
        environment: ["VM Ubuntu del laboratorio", "Servicio de ejemplo (nginx)"],
        steps: [
          { title: "Comprobar el estado de AppArmor", detail: "Verifica qué perfiles están cargados.", code: "sudo aa-status" },
          { title: "Instalar y observar un perfil", detail: "Instala nginx y revisa si tiene perfil de AppArmor asociado; describe qué restringe." },
          { title: "Activar auditd", detail: "Instala auditd y comprueba que registra eventos.", code: "sudo apt install -y auditd\nsudo systemctl enable --now auditd" },
          { title: "Consultar el registro", detail: "Genera algún acceso y consúltalo en el registro de auditoría.", code: "sudo ausearch -m USER_LOGIN -ts recent" },
          { title: "Reflexión sobre ML", detail: "Explica cómo un modelo de detección de anomalías podría usar estos registros para avisar de accesos inusuales." },
        ],
        check: "AppArmor confina el servicio, auditd registra los accesos y sabes explicar el papel del ML en la detección.",
      },
    ],
    activities: [
      { title: "Lee unos permisos", description: "Dada la salida de `ls -l` de varios archivos, interpreta los permisos y di si alguno es demasiado abierto." },
      { title: "root vs. sudo", description: "Explica por qué es mejor usar sudo puntualmente que iniciar sesión como root de forma habitual." },
      { title: "Clave vs. contraseña", description: "Enumera las ventajas de la autenticación por clave SSH frente a la contraseña y en qué casos usarías cada una." },
      { title: "Control de acceso obligatorio", only: "SUPERIOR", description: "Compara SELinux y AppArmor: enfoque, facilidad de uso y en qué distribuciones predomina cada uno." },
    ],
    projects: [
      {
        title: "Servidor Linux básico y seguro",
        only: "MEDIO",
        description: "Configura la VM Ubuntu con usuarios, permisos correctos, SSH por clave y actualizaciones al día, y documéntalo.",
        deliverables: ["Documento con la configuración aplicada", "Checklist de bastionado básico"],
        evaluation: ["Configuración correcta (50%)", "Documentación (30%)", "Checklist (20%)"],
      },
      {
        title: "Bastionado y monitorización de un servidor Linux",
        only: "SUPERIOR",
        description: "Bastiona un servidor Ubuntu (SSH, servicios, AppArmor, auditd) y propone cómo detectar accesos anómalos con ayuda de ML.",
        deliverables: ["Guía de bastionado aplicada", "Configuración de auditoría", "Propuesta de detección de anomalías"],
        evaluation: ["Bastionado (40%)", "Auditoría y registros (30%)", "Propuesta de detección (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué representan los permisos rwx en Linux?", options: ["Red, web, x", "Lectura, escritura y ejecución", "Root, world, x", "Tres usuarios"], answer: 1, explanation: "rwx son los permisos de lectura, escritura y ejecución." },
      { question: "¿Cuál es la práctica recomendada para tareas administrativas?", options: ["Iniciar sesión siempre como root", "Usar sudo puntualmente desde una cuenta normal", "Desactivar las contraseñas", "Compartir la cuenta root"], answer: 1, explanation: "sudo concede privilegios solo cuando se necesitan, reduciendo el riesgo." },
      { question: "¿Qué método de acceso SSH es más seguro?", options: ["Contraseña corta", "Par de claves", "Sin autenticación", "Usuario root con contraseña"], answer: 1, explanation: "Las claves son mucho más robustas que las contraseñas y no viajan por la red." },
      { question: "¿Para qué sirve fail2ban?", options: ["Acelerar el servidor", "Bloquear IPs que fallan repetidamente al autenticarse", "Cifrar el disco", "Actualizar paquetes"], answer: 1, explanation: "Mitiga los intentos automatizados de acceso bloqueando temporalmente a quien falla mucho." },
      { question: "Mantener el sistema actualizado sirve sobre todo para…", options: ["Cambiar el fondo de pantalla", "Cerrar vulnerabilidades conocidas", "Ganar espacio en disco", "Aumentar la RAM"], answer: 1, explanation: "Las actualizaciones corrigen fallos de seguridad ya descubiertos." },
      { question: "¿Qué hacen SELinux o AppArmor?", only: "SUPERIOR", options: ["Aceleran la red", "Confinan lo que cada proceso puede hacer", "Sustituyen al antivirus", "Cifran el correo"], answer: 1, explanation: "Aplican control de acceso obligatorio que limita el daño de un servicio comprometido." },
      { question: "¿Qué aporta auditd?", only: "SUPERIOR", options: ["Un cortafuegos", "El registro de eventos del sistema para su análisis", "Un gestor de paquetes", "Un balanceador"], answer: 1, explanation: "auditd registra eventos que luego pueden analizarse, incluso con modelos de ML." },
    ],
  },

  10: {
    theory: [
      {
        title: "Seguridad perimetral: la primera línea",
        paragraphs: [
          "La seguridad perimetral protege la frontera entre la red interna y el exterior. Su pieza central es el cortafuegos, que decide qué tráfico se permite según reglas. Aunque hoy se combina con el modelo Zero Trust, sigue siendo una capa fundamental.",
          "Otros elementos son la DMZ (zona desmilitarizada donde se colocan los servicios accesibles desde Internet), los proxies y las VPN para el acceso remoto seguro.",
        ],
        bullets: [
          "Cortafuegos: filtra el tráfico por reglas (origen, destino, puerto, protocolo).",
          "DMZ: aísla los servicios públicos de la red interna.",
          "Proxy: intermedia y puede filtrar el tráfico web.",
          "VPN: crea un túnel cifrado para el teletrabajo.",
        ],
      },
      {
        title: "Cómo funciona una regla de cortafuegos",
        paragraphs: [
          "Una regla indica qué hacer (permitir o denegar) con un tráfico definido por origen, destino, puerto y protocolo. La política por defecto suele ser «denegar todo» y se abren solo los puertos necesarios.",
          "Por ejemplo, en un servidor web se permite el puerto 443 (HTTPS) y se deniega el resto.",
        ],
      },
      {
        title: "VPN para teletrabajo",
        paragraphs: [
          "Una VPN cifra la conexión entre el equipo remoto y la red de la organización, de forma que el trabajo desde casa sea tan seguro como desde la oficina. Es imprescindible combinarla con MFA.",
        ],
      },
      {
        title: "IDS/IPS, segmentación y reglas asistidas por IA",
        only: "SUPERIOR",
        paragraphs: [
          "Un IDS detecta tráfico sospechoso y avisa; un IPS además lo bloquea. Herramientas como Suricata analizan el tráfico con firmas y, cada vez más, con modelos de aprendizaje automático que detectan anomalías sin firma previa.",
          "La segmentación de red (VLAN, subredes, microsegmentación) limita el movimiento lateral: si un equipo se ve comprometido, el atacante no alcanza toda la red. Un asistente de IA puede ayudar a redactar o revisar reglas, que siempre deben validarse antes de aplicarse.",
        ],
      },
    ],
    labs: [
      {
        title: "Configurar el cortafuegos del servidor con UFW",
        goal: "Aplicar una política de «denegar por defecto» y abrir solo los puertos necesarios en la VM Ubuntu.",
        environment: ["VM Ubuntu del laboratorio", "Instantánea previa"],
        steps: [
          { title: "Revisar el estado", detail: "Comprueba el estado actual del cortafuegos.", code: "sudo ufw status verbose" },
          { title: "Política por defecto", detail: "Deniega todo el tráfico entrante y permite el saliente.", code: "sudo ufw default deny incoming\nsudo ufw default allow outgoing" },
          { title: "Permitir SSH", detail: "Abre el acceso SSH para no perder la administración.", code: "sudo ufw allow 22/tcp" },
          { title: "Activar el cortafuegos", detail: "Actívalo y confirma.", code: "sudo ufw enable\nsudo ufw status numbered" },
          { title: "Probar una regla", detail: "Abre y luego cierra el puerto 80, comprobando el estado tras cada cambio.", code: "sudo ufw allow 80/tcp\nsudo ufw delete allow 80/tcp" },
          { title: "Documentar", detail: "Anota la política final y crea la instantánea «10-firewall»." },
        ],
        check: "El cortafuegos deniega por defecto, solo permite los puertos previstos y sabes añadir y quitar reglas.",
      },
      {
        title: "Redactar reglas con IA y validarlas",
        only: "SUPERIOR",
        goal: "Diseñar la política de cortafuegos de una DMZ pidiendo apoyo a un asistente de IA y verificándola de forma crítica.",
        environment: ["Diagrama de red con DMZ (servidor web y BD)", "Asistente de IA"],
        steps: [
          { title: "Describir la topología", detail: "Dibuja una red con Internet, DMZ (servidor web) y red interna (base de datos)." },
          { title: "Definir el tráfico permitido", detail: "Especifica qué comunicaciones deben permitirse (Internet→web:443, web→BD:puerto de la BD) y cuáles no." },
          { title: "Pedir las reglas a la IA", detail: "Solicita al asistente un conjunto de reglas para esa política y revísalas una a una." },
          { title: "Detectar errores", detail: "Identifica al menos un problema en la propuesta (regla demasiado permisiva, puerto incorrecto, falta la política por defecto)." },
          { title: "Regla final", detail: "Escribe la tabla de reglas corregida y justifica cada una." },
        ],
        check: "La política respeta el mínimo privilegio, has detectado los errores de la propuesta y cada regla está justificada.",
      },
    ],
    activities: [
      { title: "Diseña una DMZ", description: "Dibuja el esquema de una red con DMZ para una empresa con web pública y base de datos interna, indicando dónde va cada servidor." },
      { title: "Reglas básicas", description: "Escribe las reglas de cortafuegos (permitir/denegar, puerto) para un servidor que solo debe ofrecer HTTPS y administración SSH." },
      { title: "VPN en casa", description: "Explica qué protege y qué no protege una VPN corporativa cuando trabajas desde casa." },
      { title: "IDS vs. IPS", only: "SUPERIOR", description: "Explica la diferencia entre IDS e IPS y pon un ejemplo de cuándo preferirías cada uno." },
    ],
    projects: [
      {
        title: "Cortafuegos de un pequeño servidor",
        only: "MEDIO",
        description: "Configura y documenta el cortafuegos de un servidor que ofrece una web, justificando cada puerto abierto.",
        deliverables: ["Tabla de reglas con justificación", "Capturas del estado del cortafuegos"],
        evaluation: ["Política de mínimo privilegio (50%)", "Justificación (30%)", "Documentación (20%)"],
      },
      {
        title: "Diseño perimetral con DMZ y segmentación",
        only: "SUPERIOR",
        description: "Diseña la seguridad perimetral de una pyme: DMZ, segmentación en VLAN, reglas de cortafuegos, VPN e IDS/IPS.",
        deliverables: ["Diagrama de red segmentada", "Tabla de reglas del cortafuegos", "Propuesta de IDS/IPS y VPN"],
        evaluation: ["Diseño y segmentación (40%)", "Reglas correctas (30%)", "IDS/IPS y VPN (20%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué hace un cortafuegos?", options: ["Cifra el disco", "Filtra el tráfico de red según reglas", "Instala actualizaciones", "Gestiona copias de seguridad"], answer: 1, explanation: "Decide qué tráfico permitir o denegar según origen, destino, puerto y protocolo." },
      { question: "¿Qué política por defecto es más segura?", options: ["Permitir todo", "Denegar todo y abrir solo lo necesario", "No tener reglas", "Permitir todo el tráfico entrante"], answer: 1, explanation: "«Denegar por defecto» reduce la superficie de ataque al mínimo necesario." },
      { question: "¿Qué es una DMZ?", options: ["Un antivirus", "Una zona donde se colocan los servicios accesibles desde Internet, aislados de la red interna", "Un tipo de cifrado", "Una copia de seguridad"], answer: 1, explanation: "La DMZ separa los servicios públicos de la red interna para contener incidentes." },
      { question: "¿Para qué sirve una VPN en teletrabajo?", options: ["Acelerar Internet", "Crear un túnel cifrado hacia la red corporativa", "Bloquear anuncios", "Actualizar el sistema"], answer: 1, explanation: "La VPN cifra la conexión del equipo remoto con la organización." },
      { question: "Para un servidor que solo ofrece HTTPS conviene…", options: ["Abrir todos los puertos", "Permitir el 443 y denegar el resto", "Desactivar el cortafuegos", "Permitir todo el tráfico entrante"], answer: 1, explanation: "Se abre solo el puerto del servicio y se cierra lo demás." },
      { question: "¿Qué diferencia a un IPS de un IDS?", only: "SUPERIOR", options: ["El IPS solo avisa", "El IPS además bloquea el tráfico sospechoso", "Son lo mismo", "El IDS cifra el tráfico"], answer: 1, explanation: "El IDS detecta y avisa; el IPS también actúa bloqueando." },
      { question: "¿Qué aporta la segmentación de red?", only: "SUPERIOR", options: ["Más velocidad siempre", "Limitar el movimiento lateral si un equipo se ve comprometido", "Eliminar la necesidad de cortafuegos", "Cifrar el disco"], answer: 1, explanation: "Si un segmento cae, el atacante no alcanza directamente el resto de la red." },
    ],
  },

  11: {
    theory: [
      {
        title: "Para qué sirve la criptografía",
        paragraphs: [
          "La criptografía protege la confidencialidad, la integridad y la autenticidad de la información. Se usa constantemente: al navegar por HTTPS, al enviar mensajes cifrados o al firmar documentos.",
          "Hay dos grandes familias de cifrado: simétrico (la misma clave cifra y descifra, muy rápido) y asimétrico (par de claves pública y privada, ideal para intercambiar claves y firmar).",
        ],
        bullets: [
          "Simétrico (AES): rápido, misma clave; el reto es compartir la clave con seguridad.",
          "Asimétrico (RSA, curvas elípticas): clave pública y privada; más lento, resuelve el intercambio.",
          "Hash (SHA-256): huella de un dato; verifica integridad, no es cifrado.",
          "Firma digital: garantiza autenticidad e integridad y aporta no repudio.",
        ],
      },
      {
        title: "Hash y firma digital",
        paragraphs: [
          "Una función hash produce una huella de longitud fija a partir de cualquier dato; si el dato cambia, la huella cambia. Sirve para comprobar integridad (por ejemplo, verificar que una descarga no se ha alterado) y para guardar contraseñas de forma segura.",
          "La firma digital combina hash y cifrado asimétrico: el emisor firma con su clave privada y cualquiera verifica con su clave pública, garantizando que el mensaje es suyo y no se ha modificado.",
        ],
      },
      {
        title: "Certificados y HTTPS",
        paragraphs: [
          "Un certificado digital vincula una clave pública con una identidad, avalado por una Autoridad de Certificación (CA). Es lo que permite que el navegador confíe en una web y establezca una conexión HTTPS cifrada mediante TLS.",
        ],
      },
      {
        title: "PKI, TLS seguro y criptografía post-cuántica",
        only: "SUPERIOR",
        paragraphs: [
          "Una Infraestructura de Clave Pública (PKI) gestiona el ciclo de vida de los certificados: emisión, renovación y revocación. Configurar TLS de forma segura implica usar versiones modernas del protocolo y conjuntos de cifrado robustos, deshabilitando los obsoletos.",
          "La criptografía post-cuántica desarrolla algoritmos resistentes a los futuros ordenadores cuánticos, que podrían romper parte de la criptografía asimétrica actual. El NIST ya ha estandarizado los primeros. La IA ayuda a detectar configuraciones TLS débiles a gran escala.",
        ],
      },
    ],
    labs: [
      {
        title: "Cifrar, hashear y verificar integridad",
        goal: "Experimentar con cifrado simétrico y funciones hash para entender confidencialidad e integridad.",
        environment: ["VM Ubuntu del laboratorio", "openssl (incluido)"],
        steps: [
          { title: "Crear un archivo", detail: "Crea un fichero de texto con un mensaje.", code: "echo \"Mensaje secreto del laboratorio\" > mensaje.txt" },
          { title: "Calcular su hash", detail: "Obtén la huella SHA-256 del archivo.", code: "sha256sum mensaje.txt" },
          { title: "Comprobar la integridad", detail: "Modifica una letra del archivo y vuelve a calcular el hash: observa que cambia por completo." },
          { title: "Cifrar con AES", detail: "Cifra el archivo con una contraseña.", code: "openssl enc -aes-256-cbc -pbkdf2 -salt -in mensaje.txt -out mensaje.enc" },
          { title: "Descifrar", detail: "Descífralo y comprueba que recuperas el original.", code: "openssl enc -d -aes-256-cbc -pbkdf2 -in mensaje.enc -out descifrado.txt\ndiff mensaje.txt descifrado.txt" },
          { title: "Documentar", detail: "Explica en tu cuaderno qué propiedad protege el hash y cuál el cifrado." },
        ],
        check: "Has cifrado y descifrado un archivo, y sabes explicar la diferencia entre hash (integridad) y cifrado (confidencialidad).",
      },
      {
        title: "Analizar el TLS de un servicio",
        only: "SUPERIOR",
        goal: "Levantar un servicio con TLS y evaluar la calidad de su configuración.",
        environment: ["VM Ubuntu del laboratorio", "openssl", "servidor web local"],
        steps: [
          { title: "Generar un certificado autofirmado", detail: "Crea una clave y un certificado para pruebas.", code: "openssl req -x509 -newkey rsa:2048 -nodes -keyout clave.pem -out cert.pem -days 30 -subj \"/CN=lab.local\"" },
          { title: "Servir por HTTPS", detail: "Levanta un servidor de prueba con TLS.", code: "openssl s_server -accept 8443 -cert cert.pem -key clave.pem -www" },
          { title: "Inspeccionar la conexión", detail: "Desde otra terminal, examina la versión de TLS y el cifrado negociado.", code: "openssl s_client -connect localhost:8443 </dev/null 2>/dev/null | grep -E \"Protocol|Cipher\"" },
          { title: "Valorar la configuración", detail: "Indica qué versiones de TLS deberían deshabilitarse y por qué (obsoletas)." },
          { title: "Reflexión post-cuántica", detail: "Resume qué riesgo supone la computación cuántica para la criptografía asimétrica actual y qué se está haciendo." },
        ],
        check: "Has servido un recurso por TLS, inspeccionado protocolo y cifrado, y sabes qué configuraciones son inseguras.",
      },
    ],
    activities: [
      { title: "Simétrico o asimétrico", description: "Para 6 situaciones (cifrar un disco, firmar un correo, HTTPS…), indica qué tipo de cifrado se usa y por qué." },
      { title: "El candado del navegador", description: "Explica qué comprueba el navegador cuando muestra el candado de una web y qué ocurre si el certificado no es válido." },
      { title: "Contraseñas y hash", description: "Explica por qué las contraseñas deben guardarse con hash (y sal) y no en texto claro." },
      { title: "TLS seguro", only: "SUPERIOR", description: "Investiga qué versiones de TLS están obsoletas y redacta una recomendación de configuración segura para un servidor web." },
    ],
    projects: [
      {
        title: "Guía de cifrado para el día a día",
        only: "MEDIO",
        description: "Elabora una guía práctica sobre cuándo y cómo cifrar información (discos, mensajes, copias) para usuarios no técnicos.",
        deliverables: ["Guía con ejemplos", "Tabla: qué cifrar y con qué herramienta"],
        evaluation: ["Corrección técnica (40%)", "Utilidad práctica (40%)", "Presentación (20%)"],
      },
      {
        title: "Política criptográfica de una organización",
        only: "SUPERIOR",
        description: "Redacta la política criptográfica de una empresa: algoritmos aprobados, gestión de certificados (PKI), configuración TLS y previsión post-cuántica.",
        deliverables: ["Documento de política", "Procedimiento de gestión de certificados", "Configuración TLS recomendada"],
        evaluation: ["Rigor técnico (40%)", "Gestión de certificados (25%)", "Configuración TLS (25%)", "Presentación (10%)"],
      },
    ],
    quiz: [
      { question: "¿Qué caracteriza al cifrado simétrico?", options: ["Usa dos claves distintas", "Usa la misma clave para cifrar y descifrar", "No usa claves", "Solo sirve para firmar"], answer: 1, explanation: "El cifrado simétrico emplea una única clave compartida; es rápido." },
      { question: "Una función hash sirve para…", options: ["Cifrar mensajes largos", "Obtener una huella que verifica integridad", "Acelerar la red", "Guardar la clave privada"], answer: 1, explanation: "El hash produce una huella que cambia si el dato se altera; verifica integridad." },
      { question: "¿Qué garantiza una firma digital?", options: ["Solo confidencialidad", "Autenticidad e integridad, con no repudio", "Más velocidad", "Anonimato total"], answer: 1, explanation: "La firma prueba quién emite el mensaje y que no se ha modificado." },
      { question: "¿Qué vincula un certificado digital?", options: ["Dos discos duros", "Una clave pública con una identidad, avalado por una CA", "Un usuario con una contraseña", "Dos redes"], answer: 1, explanation: "El certificado asocia una clave pública a una identidad mediante una Autoridad de Certificación." },
      { question: "¿Por qué las contraseñas se guardan con hash?", options: ["Para que ocupen menos", "Para no almacenarlas en texto claro y que no se puedan leer directamente", "Para cifrar el disco", "Para acelerar el login"], answer: 1, explanation: "Guardar el hash (con sal) evita exponer las contraseñas si la base de datos se filtra." },
      { question: "¿Qué gestiona una PKI?", only: "SUPERIOR", options: ["Las copias de seguridad", "El ciclo de vida de los certificados (emisión, renovación, revocación)", "El cortafuegos", "Las actualizaciones"], answer: 1, explanation: "La Infraestructura de Clave Pública administra los certificados de principio a fin." },
      { question: "La criptografía post-cuántica busca…", only: "SUPERIOR", options: ["Cifrar más rápido", "Algoritmos resistentes a los futuros ordenadores cuánticos", "Eliminar los certificados", "Sustituir el hash"], answer: 1, explanation: "Prepara la criptografía frente a la capacidad de cómputo cuántico." },
    ],
  },
};
