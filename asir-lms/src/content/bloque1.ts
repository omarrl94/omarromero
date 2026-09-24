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
        title: "Anonimizar datos antes de usar un asistente de IA",
        goal: "Aprender a preparar información de forma que pueda analizarse con IA sin exponer datos personales.",
        environment: ["Máquina Ubuntu del laboratorio", "Fichero CSV de ejemplo con datos ficticios de alumnos (nombre, DNI, email, nota)"],
        steps: [
          { title: "Crear el fichero de ejemplo", detail: "Genera un CSV con 5 registros ficticios.", code: "cat > alumnos.csv <<'CSV'\nnombre,dni,email,nota\nAna Pérez,12345678Z,ana@correo.es,7\nLuis Gómez,87654321X,luis@correo.es,5\nMarta Ruiz,11223344B,marta@correo.es,9\nJon Arrieta,44332211C,jon@correo.es,6\nSara Díaz,55667788D,sara@correo.es,8\nCSV" },
          { title: "Identificar los datos personales", detail: "Señala qué columnas identifican a una persona directamente (nombre, DNI, email) y cuáles no (nota)." },
          { title: "Seudonimizar con un hash", detail: "Sustituye el DNI por un identificador derivado para poder relacionar registros sin revelar el dato.", code: "tail -n +2 alumnos.csv | while IFS=, read n d e nota; do\n  id=$(echo -n \"$d\" | sha256sum | cut -c1-10)\n  echo \"$id,$nota\"\ndone > anonimo.csv\ncat anonimo.csv" },
          { title: "Revisar el resultado", detail: "Comprueba que anonimo.csv solo contiene el identificador y la nota. Este fichero ya podría analizarse con un asistente de IA." },
          { title: "Reflexionar", detail: "¿Es anónimo o seudónimo? Escribe en tu cuaderno por qué, con el hash y el fichero original, aún podría reidentificarse a la persona (sigue siendo dato personal según el RGPD)." },
        ],
        check: "El fichero anonimo.csv no contiene nombres, DNI ni emails, y sabes explicar la diferencia entre anonimizar y seudonimizar.",
      },
      {
        title: "Redactar un acuerdo de autorización de auditoría",
        only: "SUPERIOR",
        goal: "Elaborar el documento de autorización y alcance que debe firmarse antes de cualquier prueba de seguridad.",
        environment: ["Procesador de textos", "Plantilla de ejemplo (PTES Pre-engagement)"],
        steps: [
          { title: "Definir las partes", detail: "Identifica cliente, empresa auditora, responsables técnicos de ambas partes y teléfono de emergencia." },
          { title: "Delimitar el alcance", detail: "Lista IPs, dominios y aplicaciones incluidos y, explícitamente, lo que queda excluido." },
          { title: "Fijar ventanas y técnicas", detail: "Indica fechas, horario permitido y técnicas autorizadas o prohibidas (por ejemplo, sin pruebas de denegación de servicio)." },
          { title: "Tratamiento de la información", detail: "Establece la confidencialidad de los hallazgos, el cifrado de los informes y la destrucción de datos al finalizar." },
          { title: "Revisión con IA", detail: "Pide a un asistente de IA que revise el documento buscando cláusulas ausentes. Contrasta cada sugerencia con la plantilla y la legislación." },
        ],
        check: "El documento incluye partes, alcance, exclusiones, ventanas, técnicas, confidencialidad, firmas y fecha.",
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
