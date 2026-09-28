import type { TopicContent } from "./types";

// Bloque 1 · Fundamentos y marco legal (temas 0-1)
export const bloque1: Record<number, TopicContent> = {
  0: {
    theory: [
      {
        title: "¿Qué es la seguridad informática?",
        paragraphs: [
          "La seguridad informática es el conjunto de medidas técnicas, organizativas y legales que protegen la información y los sistemas que la tratan. No se limita a instalar un antivirus: incluye procedimientos, formación de las personas y cumplimiento normativo.",
          "Se suele resumir en la triada CIA: Confidencialidad (solo acceden quienes están autorizados), Integridad (la información no se altera sin autorización) y Disponibilidad (la información y los servicios están accesibles cuando se necesitan). Este módulo trabaja las tres, con especial atención a la disponibilidad.",
        ],
        bullets: [
          "Confidencialidad → cifrado, control de accesos, permisos.",
          "Integridad → hashes, firmas digitales, control de versiones y copias.",
          "Disponibilidad → redundancia, clústeres, balanceo, copias de seguridad.",
          "Además: autenticación (demostrar quién eres) y no repudio (no poder negar una acción).",
        ],
      },
      {
        title: "Activos, amenazas, vulnerabilidades y riesgo",
        paragraphs: [
          "Un activo es cualquier recurso con valor para la organización: datos, servidores, aplicaciones, personas o reputación. Una amenaza es un evento que puede dañar un activo (un incendio, un malware, un error humano). Una vulnerabilidad es una debilidad que permite que la amenaza se materialice (un sistema sin actualizar, una contraseña débil).",
          "El riesgo combina la probabilidad de que una amenaza aproveche una vulnerabilidad con el impacto que causaría. Se puede reducir (aplicar medidas), transferir (seguro, proveedor), aceptar (documentándolo) o evitar (eliminar la actividad).",
        ],
        bullets: [
          "Riesgo ≈ Probabilidad × Impacto.",
          "Salvaguardas preventivas (evitan), detectivas (avisan) y correctivas (recuperan).",
          "Seguridad física (acceso a la sala, SAI, climatización) y lógica (software, permisos).",
        ],
      },
      {
        title: "Buenas prácticas básicas",
        paragraphs: [
          "La mayoría de incidentes se evitan con hábitos sencillos: contraseñas largas y únicas guardadas en un gestor, autenticación multifactor (MFA), actualizaciones al día, copias de seguridad y desconfianza ante mensajes urgentes o inesperados.",
          "El principio de mínimo privilegio indica que cada usuario y servicio debe tener solo los permisos imprescindibles. La defensa en profundidad propone varias capas de protección, de modo que si una falla, las demás siguen protegiendo.",
        ],
      },
      {
        title: "La IA en el panorama de la ciberseguridad",
        paragraphs: [
          "La IA generativa ha cambiado ambos lados: los atacantes redactan correos de phishing sin faltas y en cualquier idioma, clonan voces o automatizan tareas; los defensores usan modelos para clasificar alertas, detectar anomalías y resumir incidentes.",
          "Los asistentes de IA son una herramienta más: aceleran el trabajo, pero pueden equivocarse (alucinaciones) y no deben recibir datos confidenciales sin autorización. La responsabilidad final siempre es del técnico que revisa y aplica la respuesta.",
        ],
      },
      {
        title: "Marcos de referencia: Zero Trust, MITRE ATT&CK y ATLAS",
        only: "SUPERIOR",
        paragraphs: [
          "Zero Trust sustituye la idea de «red interna de confianza» por la verificación continua de identidad, dispositivo y contexto en cada acceso. Se apoya en segmentación, MFA y registro exhaustivo.",
          "MITRE ATT&CK es una base de conocimiento de tácticas y técnicas observadas en ataques reales; se usa para evaluar la cobertura de detección de una organización. MITRE ATLAS aplica la misma idea a sistemas de IA: envenenamiento de datos, evasión de modelos o inyección de instrucciones (prompt injection).",
          "Para el análisis de riesgos formal en el sector público español se usa MAGERIT (con la herramienta PILAR), que identifica activos, dimensiones de valor (D-I-C-A-T), amenazas y salvaguardas.",
        ],
      },
    ],
    labs: [
      {
        title: "Montar el laboratorio virtual del módulo",
        goal: "Preparar un entorno aislado de máquinas virtuales donde realizar todas las prácticas del curso sin afectar a ninguna red real.",
        environment: ["Ordenador con 8 GB de RAM o más", "VirtualBox 7 (o VMware Workstation Player)", "ISO de Ubuntu Server 24.04 LTS y de Windows Server de evaluación"],
        steps: [
          { title: "Instalar VirtualBox", detail: "Descarga VirtualBox desde virtualbox.org e instálalo con las opciones por defecto. Instala también el Extension Pack de la misma versión." },
          { title: "Crear una red NAT aislada", detail: "En VirtualBox abre Archivo → Herramientas → Gestor de red → Redes NAT y crea una red llamada «ASIR-LAB» con el rango 10.10.10.0/24 y DHCP activado. Todas las VM del curso irán en esta red." },
          { title: "Crear la VM de Ubuntu Server", detail: "Nueva máquina: 2 GB RAM, 2 CPU, disco de 25 GB. En Red, adaptador 1 → «Red NAT» → ASIR-LAB. Instala el sistema con usuario «asir» y marca «Install OpenSSH server»." },
          { title: "Actualizar el sistema", detail: "Inicia sesión y actualiza los paquetes. Anota la IP que recibe la máquina.", code: "sudo apt update && sudo apt full-upgrade -y\nip -br addr" },
          { title: "Tomar una instantánea", detail: "Con la VM apagada, crea una instantánea llamada «00-base». Antes de cada práctica volverás a este punto si algo sale mal." },
          { title: "Documentar el laboratorio", detail: "Crea un documento con: nombre de cada VM, sistema operativo, IP, usuario y propósito. Lo irás ampliando durante todo el curso." },
        ],
        check: "La VM de Ubuntu tiene IP en 10.10.10.0/24, responde a `ping` desde otra VM de la misma red NAT y existe la instantánea «00-base».",
      },
      {
        title: "Análisis de riesgos simplificado de un aula",
        only: "SUPERIOR",
        goal: "Aplicar la metodología de análisis de riesgos (inspirada en MAGERIT) a un caso real: el aula de informática.",
        environment: ["Hoja de cálculo (LibreOffice Calc o Excel)", "Inventario del aula (equipos, switch, servidor, proyector)"],
        steps: [
          { title: "Inventariar activos", detail: "Lista al menos 10 activos del aula (hardware, software, datos, servicios, personas) y asigna a cada uno un valor de 1 a 5 en Confidencialidad, Integridad y Disponibilidad." },
          { title: "Identificar amenazas", detail: "Para cada activo, identifica 2 o 3 amenazas (catálogo MAGERIT: desastres naturales, origen industrial, errores, ataques intencionados)." },
          { title: "Estimar probabilidad e impacto", detail: "Puntúa de 1 a 5 la probabilidad de cada amenaza y su impacto. Calcula el riesgo como producto y colorea la celda (verde < 6, amarillo 6-14, rojo ≥ 15)." },
          { title: "Proponer salvaguardas", detail: "Para cada riesgo rojo o amarillo propone una salvaguarda y clasifícala como preventiva, detectiva o correctiva." },
          { title: "Pedir una revisión a un asistente de IA", detail: "Pega tu tabla anonimizada en un asistente de IA y pídele amenazas que falten. Anota qué sugerencias aceptas y cuáles descartas, justificando por qué." },
          { title: "Calcular el riesgo residual", detail: "Recalcula el riesgo suponiendo aplicadas las salvaguardas y compara ambas matrices." },
        ],
        check: "La hoja contiene activos valorados, matriz de riesgo coloreada, salvaguardas clasificadas y riesgo residual inferior al inicial.",
      },
    ],
    activities: [
      { title: "Clasifica los incidentes", description: "Lee 10 titulares de noticias de ciberseguridad recientes (INCIBE, Xataka, BleepingComputer) e indica qué dimensión de la triada CIA se vio afectada en cada caso." },
      { title: "Amenaza, vulnerabilidad o riesgo", description: "Dada una lista de 15 frases (p. ej. «el servidor no tiene SAI», «un corte eléctrico»), clasifica cada una como activo, amenaza, vulnerabilidad o salvaguarda." },
      { title: "Auditoría de tus contraseñas", description: "Comprueba en haveibeenpwned.com si tu correo ha aparecido en alguna filtración. Instala un gestor de contraseñas (Bitwarden o KeePassXC) y activa MFA en al menos dos cuentas." },
      { title: "Detecta el phishing generado por IA", description: "Analiza los 5 correos que proporcionará el profesor e identifica cuáles son fraudulentos. Explica qué indicios has usado, teniendo en cuenta que ya no tienen faltas de ortografía." },
      { title: "Mapea un ataque en MITRE ATT&CK", only: "SUPERIOR", description: "Escoge un informe público de un incidente (por ejemplo, un ransomware conocido) y relaciona cada fase descrita con su táctica y técnica en attack.mitre.org." },
    ],
    projects: [
      {
        title: "Plan de seguridad básico para una pequeña empresa",
        only: "MEDIO",
        description: "Una gestoría de 8 empleados te pide unas recomendaciones de seguridad. Redacta un plan sencillo con los activos más importantes, los principales riesgos y las medidas básicas que propones.",
        deliverables: ["Documento PDF de 4-6 páginas", "Tabla de activos y riesgos", "Lista de 10 buenas prácticas para los empleados"],
        evaluation: ["Identifica correctamente activos y amenazas (30%)", "Medidas realistas y bien justificadas (40%)", "Claridad y presentación (30%)"],
      },
      {
        title: "Análisis de riesgos y estrategia Zero Trust",
        only: "SUPERIOR",
        description: "Realiza el análisis de riesgos de una pyme de 50 empleados con oficina, teletrabajo y servicios en la nube, y propone una hoja de ruta hacia un modelo Zero Trust.",
        deliverables: ["Informe con análisis de riesgos (metodología MAGERIT simplificada)", "Matriz de riesgo inicial y residual", "Hoja de ruta Zero Trust priorizada a 12 meses", "Presentación de 10 minutos"],
        evaluation: ["Rigor metodológico del análisis (35%)", "Coherencia de la hoja de ruta con los riesgos (35%)", "Uso crítico de fuentes y de la IA (15%)", "Presentación oral (15%)"],
      },
    ],
    quiz: [
      { question: "¿Qué dimensión de la seguridad garantiza que solo las personas autorizadas acceden a la información?", options: ["Integridad", "Confidencialidad", "Disponibilidad", "Trazabilidad"], answer: 1, explanation: "La confidencialidad protege la información frente a accesos no autorizados." },
      { question: "Un servidor web caído durante horas afecta principalmente a…", options: ["La confidencialidad", "La integridad", "La disponibilidad", "El no repudio"], answer: 2, explanation: "Si el servicio no está accesible cuando se necesita, se pierde disponibilidad." },
      { question: "«El servidor no tiene contraseña de administrador» es un ejemplo de…", options: ["Amenaza", "Vulnerabilidad", "Activo", "Salvaguarda"], answer: 1, explanation: "Es una debilidad que una amenaza puede aprovechar: una vulnerabilidad." },
      { question: "¿Qué principio indica que cada usuario debe tener solo los permisos imprescindibles?", options: ["Defensa en profundidad", "Mínimo privilegio", "Seguridad por oscuridad", "Separación de redes"], answer: 1, explanation: "El mínimo privilegio limita el daño si una cuenta se ve comprometida." },
      { question: "Una copia de seguridad es una salvaguarda de tipo…", options: ["Preventiva", "Detectiva", "Correctiva", "Disuasoria"], answer: 2, explanation: "Permite recuperarse tras el incidente, por eso es correctiva." },
      { question: "¿Cuál es un riesgo real al usar un asistente de IA en el trabajo?", options: ["Que responda demasiado rápido", "Que se le envíen datos confidenciales y queden fuera de control", "Que no sepa programar", "Ninguno, siempre es seguro"], answer: 1, explanation: "Enviar datos sensibles a un servicio externo puede suponer una fuga de información." },
      { question: "¿Qué propone el modelo Zero Trust?", only: "SUPERIOR", options: ["Confiar en todo lo que esté dentro de la red corporativa", "Verificar continuamente cada acceso según identidad, dispositivo y contexto", "Eliminar los cortafuegos", "Usar solo contraseñas largas"], answer: 1, explanation: "Zero Trust elimina la confianza implícita y verifica cada petición." },
      { question: "¿Qué recoge MITRE ATLAS?", only: "SUPERIOR", options: ["Vulnerabilidades de Windows", "Tácticas y técnicas de ataque contra sistemas de IA", "Normativa europea de IA", "Un antivirus basado en IA"], answer: 1, explanation: "ATLAS es el equivalente de ATT&CK para amenazas contra modelos de aprendizaje automático." },
    ],
  },

  1: {
    theory: [
      {
        title: "Protección de datos: RGPD y LOPDGDD",
        paragraphs: [
          "El Reglamento General de Protección de Datos (RGPD, UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD) regulan el tratamiento de datos personales: cualquier información sobre una persona física identificada o identificable (nombre, DNI, IP, imagen, voz…).",
          "Los datos deben tratarse con licitud, lealtad y transparencia, para fines concretos, minimizando lo recogido y conservándolo solo el tiempo necesario, con medidas de seguridad adecuadas. Las brechas de seguridad con riesgo para las personas deben notificarse a la AEPD en un máximo de 72 horas.",
        ],
        bullets: [
          "Derechos de las personas: acceso, rectificación, supresión, oposición, limitación y portabilidad.",
          "Categorías especiales (salud, biometría, ideología…) requieren protección reforzada.",
          "Sanciones de hasta 20 millones de euros o el 4 % de la facturación anual global.",
        ],
      },
      {
        title: "Delitos informáticos y el Código Penal",
        paragraphs: [
          "El Código Penal español castiga, entre otros, el acceso no autorizado a sistemas (art. 197 bis), la interceptación de datos, los daños informáticos (art. 264), las estafas informáticas (art. 248) y la producción o distribución de herramientas destinadas a cometer estos delitos (art. 197 ter).",
          "Por eso toda prueba de seguridad sobre sistemas ajenos requiere autorización previa y por escrito. En este curso solo se practica sobre el laboratorio propio.",
        ],
      },
      {
        title: "ENS y Directiva NIS2",
        paragraphs: [
          "El Esquema Nacional de Seguridad (Real Decreto 311/2022) es obligatorio para el sector público y sus proveedores. Clasifica los sistemas en categoría BÁSICA, MEDIA o ALTA y define las medidas que deben aplicarse.",
          "La Directiva NIS2 amplía las obligaciones de ciberseguridad a más sectores esenciales e importantes (energía, sanidad, transporte, digital…), exige gestión de riesgos, notificación de incidentes y responsabilidad de la dirección.",
        ],
      },
      {
        title: "Inteligencia Artificial y privacidad",
        paragraphs: [
          "El Reglamento Europeo de Inteligencia Artificial (AI Act) clasifica los sistemas de IA según su riesgo: prácticas prohibidas (p. ej. puntuación social), alto riesgo (selección de personal, infraestructuras críticas, educación), riesgo de transparencia (chatbots, contenido sintético que debe identificarse) y riesgo mínimo.",
          "Si se introducen datos personales en un modelo de IA, se aplica el RGPD: hay que tener una base legal, informar a las personas y valorar si el proveedor reutiliza esos datos para entrenar. Una buena práctica es anonimizar la información antes de enviarla a un asistente.",
        ],
      },
      {
        title: "Aplicación práctica: EIPD, contratos y auditorías autorizadas",
        only: "SUPERIOR",
        paragraphs: [
          "La Evaluación de Impacto relativa a la Protección de Datos (EIPD) es obligatoria cuando un tratamiento supone alto riesgo, como el uso de IA para perfilar personas. Describe el tratamiento, evalúa necesidad y proporcionalidad, analiza los riesgos y propone medidas.",
          "Un encargo de auditoría de seguridad debe incluir contrato, alcance (qué sistemas, qué horario, qué técnicas), acuerdo de confidencialidad y persona de contacto. Sin este documento, una auditoría puede constituir delito.",
        ],
      },
    ],
    labs: [
      {
        title: "Proteger datos personales antes de usarlos con IA (RGPD en la práctica)",
        goal:
          "Al terminar sabrás distinguir qué información es un dato personal y transformar un fichero real en una versión seudonimizada que se puede analizar (por ejemplo, con un asistente de IA) sin exponer la identidad de las personas.",
        relation:
          "El Tema 1 explica el RGPD y la LOPDGDD: cómo hay que tratar los datos personales y qué significa minimizar y seudonimizar. Aquí lo aplicas paso a paso sobre un fichero, viendo con tus propios ojos la diferencia entre «anonimizar» y «seudonimizar» que exige la ley.",
        duration: "30–40 min",
        environment: [
          "Máquina Ubuntu del laboratorio (o cualquier terminal Linux/macOS; en Windows, usa Git Bash o WSL)",
          "La herramienta sha256sum (viene incluida en Linux)",
          "Tu cuaderno de prácticas para anotar conclusiones",
        ],
        steps: [
          {
            title: "Crear un fichero con datos personales de ejemplo",
            detail:
              "Vas a simular una lista de alumnos con datos FICTICIOS (nunca uses datos reales de compañeros). Copia el bloque en la terminal y pulsa Enter para crear el fichero alumnos.csv.",
            code: "cat > alumnos.csv <<'CSV'\nnombre,dni,email,nota\nAna Pérez,12345678Z,ana@correo.es,7\nLuis Gómez,87654321X,luis@correo.es,5\nMarta Ruiz,11223344B,marta@correo.es,9\nJon Arrieta,44332211C,jon@correo.es,6\nSara Díaz,55667788D,sara@correo.es,8\nCSV\ncat alumnos.csv",
            expected: "La terminal muestra las 5 filas con nombre, dni, email y nota. Ya tienes un fichero con datos personales.",
          },
          {
            title: "Identificar qué columnas son datos personales",
            detail:
              "Según el RGPD, un dato personal es cualquier información que identifique o pueda identificar a una persona. Escribe en tu cuaderno, para cada columna, si es identificador directo, dato personal o no personal: nombre (identificador directo), dni (identificador directo), email (dato personal), nota (dato personal asociado, pero no identifica por sí solo).",
            expected: "Tienes clasificadas las 4 columnas y sabes justificar por qué el DNI y el email identifican a una persona.",
          },
          {
            title: "Aplicar el principio de minimización: quedarte solo con lo necesario",
            detail:
              "Imagina que solo necesitas estudiar la distribución de notas. No hace falta el nombre ni el email. La minimización (art. 5 RGPD) dice: trata los mínimos datos imprescindibles. Extrae únicamente una referencia y la nota.",
            code: "tail -n +2 alumnos.csv | while IFS=, read nombre dni email nota; do\n  ref=$(echo -n \"$dni\" | sha256sum | cut -c1-10)\n  echo \"$ref,$nota\"\ndone > seudonimo.csv\ncat seudonimo.csv",
            expected:
              "seudonimo.csv contiene solo un código (p. ej. a1b2c3d4e5) y la nota. Han desaparecido nombre, DNI y email, pero cada alumno sigue teniendo una referencia estable.",
          },
          {
            title: "Comprobar que ya no hay datos identificativos a la vista",
            detail: "Verifica que en el fichero resultante no aparece ningún nombre, DNI ni email.",
            code: "grep -E 'Pérez|12345678Z|@correo' seudonimo.csv || echo 'OK: no quedan datos identificativos visibles'",
            expected: "Se imprime «OK: no quedan datos identificativos visibles». El fichero ya se podría compartir con una IA para analizar notas.",
          },
          {
            title: "Entender por qué esto es SEUDONIMIZACIÓN y no ANONIMIZACIÓN",
            detail:
              "Aquí está la clave legal del tema. Si guardas la tabla original, puedes volver a calcular el mismo hash del DNI y reidentificar a la persona. Por eso, según el RGPD, el fichero sigue siendo dato personal (seudonimizado), NO anónimo. Solo sería anónimo si fuese imposible reidentificar. Anótalo en tu cuaderno con tus palabras.",
            expected:
              "Sabes explicar: seudonimizado = protegido pero reversible con información adicional (sigue bajo el RGPD); anónimo = irreversible (fuera del RGPD).",
          },
          {
            title: "Reflexión final sobre el uso de IA",
            detail:
              "Responde por escrito: ¿podrías pegar el fichero original en un asistente de IA en la nube? ¿Y el seudonimizado? ¿Qué riesgo legal habría en cada caso y qué harías para minimizarlo?",
            expected: "Tienes una conclusión razonada que conecta la práctica con la obligación del RGPD de no exponer datos personales a terceros sin base legal.",
          },
        ],
        check:
          "Has generado seudonimo.csv sin nombres, DNI ni emails; la comprobación con grep confirma que no quedan datos identificativos; y sabes explicar con tus palabras la diferencia entre seudonimizar y anonimizar y por qué importa según el RGPD.",
      },
      {
        title: "Redactar el documento de autorización de una auditoría (la ley antes que el teclado)",
        only: "SUPERIOR",
        goal:
          "Al terminar tendrás redactado un documento de autorización y alcance, el papel que debe firmarse ANTES de tocar ningún sistema en una auditoría de seguridad, con todas las cláusulas imprescindibles.",
        relation:
          "El Tema 1 deja claro que acceder a sistemas ajenos sin permiso es delito (art. 197 bis del Código Penal). La frontera entre un hacker ético y un delito es, literalmente, este documento firmado. Aquí construyes esa autorización, aplicando el marco legal del tema a un caso real.",
        duration: "45–60 min",
        environment: [
          "Procesador de textos (Word, Google Docs o LibreOffice)",
          "Un caso de ejemplo: la empresa ficticia «TecnoRiego S.L.» quiere que auditen su web y su servidor de pruebas",
          "Opcional: un asistente de IA para revisar el borrador",
        ],
        steps: [
          {
            title: "Identificar a las partes y los contactos de emergencia",
            detail:
              "Redacta el encabezado: quién autoriza (TecnoRiego S.L., con su representante legal), quién audita (tu nombre/empresa) y un responsable técnico y un teléfono de contacto por cada parte para parar la prueba si algo se tuerce.",
            expected: "El documento identifica sin ambigüedad a ambas partes y a quién llamar durante la auditoría.",
          },
          {
            title: "Delimitar el alcance: qué SÍ y qué NO se audita",
            detail:
              "Lista de forma explícita lo incluido (p. ej. el dominio web.tecnoriego.local y la IP del servidor de pruebas 10.10.10.20) y lo excluido (correo corporativo, equipos de empleados, sistemas en producción). Todo lo que no esté escrito, no está autorizado.",
            expected: "Cualquier persona que lea el documento sabe exactamente qué sistemas se pueden tocar y cuáles quedan fuera.",
          },
          {
            title: "Fijar la ventana temporal y las técnicas permitidas",
            detail:
              "Indica fechas y horario (p. ej. del 5 al 9 de mayo, de 20:00 a 06:00 para no afectar al negocio) y qué técnicas se permiten o se prohíben expresamente (por ejemplo, prohibidas las pruebas de denegación de servicio y la ingeniería social a empleados).",
            expected: "El documento acota cuándo y cómo se puede actuar, evitando daños o sorpresas.",
          },
          {
            title: "Tratamiento y confidencialidad de los hallazgos (enlazar con el RGPD)",
            detail:
              "Añade cláusulas sobre cómo se protegen los datos que se encuentren: confidencialidad, cifrado de los informes, prohibición de exfiltrar datos reales y destrucción segura de la información al finalizar. Aquí conecta con el RGPD del tema.",
            expected: "El acuerdo protege legalmente la información a la que se acceda durante la auditoría.",
          },
          {
            title: "Cierre legal: firmas, fecha y cláusula de autorización expresa",
            detail:
              "Incluye una frase de autorización expresa («TecnoRiego S.L. autoriza a … a realizar las pruebas descritas sobre los sistemas indicados»), espacio para firma y fecha de ambas partes. Sin firma, no hay autorización.",
            expected: "El documento queda listo para firmar; ya distingue una auditoría legal de un acceso no autorizado.",
          },
          {
            title: "Revisión crítica con ayuda de IA",
            detail:
              "Pide a un asistente de IA que revise tu borrador buscando cláusulas ausentes. Contrasta CADA sugerencia con lo visto en el tema: acepta lo que aporte y descarta lo que no aplique, anotando por qué. La IA ayuda, pero la responsabilidad legal es tuya.",
            expected: "Tienes una versión mejorada y sabes justificar qué sugerencias de la IA aceptaste y cuáles no.",
          },
        ],
        check:
          "Tu documento incluye: partes y contactos, alcance con inclusiones y exclusiones, ventana temporal, técnicas permitidas/prohibidas, confidencialidad y tratamiento de datos, y autorización expresa con firma y fecha. Sabes explicar por qué sin este papel la misma actividad sería un delito del art. 197 CP.",
      },
    ],
    activities: [
      { title: "¿Es dato personal?", description: "Clasifica 15 ejemplos (matrícula de coche, IP dinámica, foto de grupo, nota media anónima…) como dato personal, categoría especial o no personal, justificando la respuesta." },
      { title: "Análisis de una sanción de la AEPD", description: "Busca en aepd.es una resolución sancionadora reciente relacionada con una brecha de seguridad y resume qué ocurrió, qué artículo se incumplió y qué medidas lo habrían evitado." },
      { title: "Clasificación según el AI Act", description: "Clasifica 8 usos de IA (chatbot de atención al cliente, cribado de CV, reconocimiento facial en la calle, filtro antispam…) en su nivel de riesgo." },
      { title: "Política de uso de IA en el aula", description: "Redacta 8 normas para el uso responsable de asistentes de IA por parte del alumnado del ciclo." },
      { title: "Comparativa ENS vs. NIS2", only: "SUPERIOR", description: "Elabora una tabla comparativa del ENS y NIS2: ámbito, obligaciones, notificación de incidentes y sanciones." },
    ],
    projects: [
      {
        title: "Guía de protección de datos para el centro",
        only: "MEDIO",
        description: "Elabora una guía breve para el personal del centro sobre cómo tratar los datos del alumnado y cómo usar herramientas de IA sin vulnerar el RGPD.",
        deliverables: ["Guía de 4-5 páginas o infografía", "Decálogo de buenas prácticas", "Ejemplo de anonimización"],
        evaluation: ["Corrección legal (40%)", "Utilidad práctica (40%)", "Presentación (20%)"],
      },
      {
        title: "EIPD de un sistema de IA",
        only: "SUPERIOR",
        description: "Una empresa quiere usar un modelo de IA que analiza los correos de los empleados para detectar fugas de información. Realiza la Evaluación de Impacto en Protección de Datos y la clasificación según el AI Act.",
        deliverables: ["Documento EIPD completo (descripción, necesidad, riesgos, medidas)", "Clasificación AI Act justificada", "Recomendación final: viable / viable con condiciones / no viable"],
        evaluation: ["Rigor jurídico (40%)", "Análisis de riesgos (30%)", "Medidas propuestas (20%)", "Redacción (10%)"],
      },
    ],
    quiz: [
      { question: "¿Cuál es el plazo máximo para notificar una brecha de datos a la AEPD?", options: ["24 horas", "72 horas", "7 días", "1 mes"], answer: 1, explanation: "El RGPD establece 72 horas desde que se tiene constancia de la brecha." },
      { question: "¿Cuál de estos es un dato personal?", options: ["La temperatura media de Bilbao", "La dirección IP de un usuario", "El número de alumnos del centro", "El precio de un servidor"], answer: 1, explanation: "Una IP puede identificar a una persona, por lo que es dato personal." },
      { question: "¿Qué norma es obligatoria para el sector público español en materia de seguridad?", options: ["ISO 9001", "ENS", "PCI-DSS", "ITIL"], answer: 1, explanation: "El Esquema Nacional de Seguridad (RD 311/2022) aplica al sector público y sus proveedores." },
      { question: "Realizar pruebas de intrusión sobre un sistema sin autorización…", options: ["Es legal si no se roban datos", "Puede constituir un delito de acceso no autorizado", "Es legal con fines educativos", "Solo es sancionable si lo hace una empresa"], answer: 1, explanation: "El art. 197 bis CP castiga el acceso no autorizado, sin importar la intención." },
      { question: "Según el AI Act, un chatbot de atención al cliente es de riesgo…", options: ["Prohibido", "Alto", "De transparencia (debe informar de que es una IA)", "No regulado en absoluto"], answer: 2, explanation: "Los chatbots deben informar al usuario de que interactúa con una IA." },
      { question: "¿Qué es la seudonimización?", options: ["Borrar todos los datos", "Sustituir identificadores de forma que solo con información adicional se reidentifica", "Cifrar el disco duro", "Publicar datos sin nombre"], answer: 1, explanation: "Los datos seudonimizados siguen siendo datos personales porque pueden reidentificarse." },
      { question: "¿Cuándo es obligatoria una EIPD?", only: "SUPERIOR", options: ["Siempre que haya datos", "Cuando el tratamiento supone probablemente un alto riesgo para los derechos de las personas", "Solo en el sector público", "Nunca, es voluntaria"], answer: 1, explanation: "El art. 35 RGPD la exige para tratamientos de alto riesgo, como el perfilado con IA." },
      { question: "¿Qué documento debe existir antes de iniciar una auditoría de seguridad?", only: "SUPERIOR", options: ["Un informe final", "Un acuerdo firmado con alcance y autorización", "Una factura", "Ninguno"], answer: 1, explanation: "La autorización y el alcance por escrito protegen legalmente a ambas partes." },
    ],
  },
};
