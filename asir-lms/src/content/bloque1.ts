import type { TopicContent } from "./types";

// Bloque 1 · Fundamentos y marco legal (temas 0-1)
export const bloque1: Record<number, TopicContent> = {
  0: {
    theory: [
      {
        title: "¿Qué es la seguridad informática?",
        key: "Proteger la información en sus tres dimensiones: que solo la vea quien debe (C), que no se altere (I) y que esté disponible cuando se necesita (A).",
        paragraphs: [
          "La seguridad informática es el conjunto de medidas técnicas, organizativas y legales que protegen la información y los sistemas que la tratan. No se limita a instalar un antivirus: incluye procedimientos, formación de las personas y cumplimiento normativo.",
          "Se suele resumir en la triada CIA: Confidencialidad, Integridad y Disponibilidad. Este módulo trabaja las tres, con especial atención a la disponibilidad.",
        ],
        table: {
          caption: "La triada CIA de un vistazo",
          headers: ["Dimensión", "Qué garantiza", "Cómo se protege", "Si falla…"],
          rows: [
            ["Confidencialidad", "Solo accede quien está autorizado", "Cifrado, permisos, control de acceso", "Fuga de datos"],
            ["Integridad", "La información no se altera sin permiso", "Hashes, firma digital, copias", "Datos manipulados o corruptos"],
            ["Disponibilidad", "El servicio está accesible cuando se necesita", "Redundancia, clústeres, copias", "Caída del servicio"],
          ],
        },
        bullets: [
          "Además de la triada: autenticación (demostrar quién eres) y no repudio (no poder negar una acción).",
        ],
        why: "Porque toda medida de seguridad que estudies en el curso (un cifrado, un cortafuegos, una copia) sirve para reforzar una de estas tres dimensiones. Saber cuál te ayuda a elegir la medida correcta ante cada problema.",
      },
      {
        title: "Activos, amenazas, vulnerabilidades y riesgo",
        key: "Riesgo ≈ Probabilidad × Impacto. Se reduce actuando sobre las vulnerabilidades, no sobre las amenazas (que no controlas).",
        paragraphs: [
          "Antes de proteger algo hay que saber QUÉ proteges y DE QUÉ. Estos cuatro conceptos son el lenguaje básico de toda la ciberseguridad.",
          "El riesgo se puede reducir (aplicar medidas), transferir (seguro, proveedor), aceptar (documentándolo) o evitar (eliminar la actividad).",
        ],
        table: {
          caption: "Los cuatro conceptos con un ejemplo",
          headers: ["Concepto", "Qué es", "Ejemplo"],
          rows: [
            ["Activo", "Recurso con valor a proteger", "El servidor con las notas del alumnado"],
            ["Amenaza", "Evento que puede dañar el activo", "Un ransomware, un incendio, un error humano"],
            ["Vulnerabilidad", "Debilidad que permite el daño", "El servidor sin actualizar o sin copia"],
            ["Riesgo", "Probabilidad × impacto del daño", "Alta pérdida de datos si no hay copias"],
          ],
        },
        bullets: [
          "Salvaguardas preventivas (evitan), detectivas (avisan) y correctivas (recuperan).",
          "Seguridad física (acceso a la sala, SAI, climatización) y lógica (software, permisos).",
        ],
        why: "Porque no puedes protegerlo todo por igual: este lenguaje te permite priorizar y poner los recursos donde el riesgo es mayor, que es justo lo que harás en el laboratorio de análisis de riesgos.",
      },
      {
        title: "Buenas prácticas básicas",
        key: "La mayoría de los incidentes se evitan con hábitos sencillos, no con herramientas caras.",
        paragraphs: [
          "Contraseñas largas y únicas en un gestor, autenticación multifactor (MFA), actualizaciones al día, copias de seguridad y desconfianza ante mensajes urgentes o inesperados: eso frena la mayor parte de los ataques.",
          "El principio de mínimo privilegio indica que cada usuario y servicio debe tener solo los permisos imprescindibles. La defensa en profundidad propone varias capas de protección, de modo que si una falla, las demás siguen protegiendo.",
        ],
        bullets: [
          "Mínimo privilegio: menos permisos, menos daño posible.",
          "Defensa en profundidad: varias capas, no una sola barrera.",
          "MFA: aunque roben la contraseña, no entran.",
        ],
        why: "Porque como futuro técnico tu primer trabajo no será desplegar sistemas sofisticados, sino asegurarte de que estas prácticas básicas se cumplen: ahí está el 80 % de la protección real.",
      },
      {
        title: "La IA en el panorama de la ciberseguridad",
        key: "La IA es una herramienta de doble filo: potencia igual el ataque que la defensa, y siempre necesita supervisión humana.",
        paragraphs: [
          "La IA generativa ha cambiado ambos lados: los atacantes redactan correos de phishing sin faltas y en cualquier idioma, clonan voces o automatizan tareas; los defensores usan modelos para clasificar alertas, detectar anomalías y resumir incidentes.",
          "Los asistentes de IA aceleran el trabajo, pero pueden equivocarse (alucinaciones) y no deben recibir datos confidenciales sin autorización. La responsabilidad final siempre es del técnico que revisa y aplica la respuesta.",
        ],
        why: "Porque durante todo el curso usarás la IA como apoyo. Entender desde el principio que se equivoca y que no puede recibir datos sensibles evita los dos errores más graves al trabajar con ella.",
      },
      {
        title: "Marcos de referencia: Zero Trust, MITRE ATT&CK y ATLAS",
        only: "SUPERIOR",
        key: "Los marcos de referencia son «mapas» comunes para diseñar la defensa y medir si detectas los ataques.",
        paragraphs: [
          "Zero Trust sustituye la idea de «red interna de confianza» por la verificación continua de identidad, dispositivo y contexto en cada acceso. Se apoya en segmentación, MFA y registro exhaustivo.",
          "MITRE ATT&CK es una base de conocimiento de tácticas y técnicas observadas en ataques reales; se usa para evaluar la cobertura de detección de una organización. MITRE ATLAS aplica la misma idea a los sistemas de IA (envenenamiento de datos, evasión de modelos, prompt injection).",
          "Para el análisis de riesgos formal en el sector público español se usa MAGERIT (con la herramienta PILAR), que identifica activos, dimensiones de valor (D-I-C-A-T), amenazas y salvaguardas.",
        ],
        why: "Porque en el mundo profesional no se improvisa: estos marcos dan un lenguaje y una checklist compartidos que permiten comparar tu nivel de seguridad con un estándar y justificar tus decisiones ante un cliente o auditor.",
      },
    ],
    labs: [
      {
        title: "Montar tu laboratorio virtual seguro (tu «campo de pruebas» del curso)",
        goal:
          "Al terminar tendrás un entorno de máquinas virtuales aislado donde podrás practicar TODO el módulo sin ningún riesgo para tu equipo ni para ninguna red real: podrás romper cosas, probar y volver atrás con un clic.",
        relation:
          "El Tema 0 introduce los conceptos de activo, amenaza, vulnerabilidad y riesgo, y la idea de trabajar de forma segura. Este taller crea el entorno controlado y aislado donde aplicarás esos conceptos durante todo el curso: es la base de las buenas prácticas del tema.",
        duration: "45–60 min",
        environment: [
          "Un ordenador con al menos 8 GB de RAM y 30 GB de disco libre",
          "VirtualBox 7 (gratuito, en virtualbox.org) o VMware Workstation Player",
          "La imagen ISO de Ubuntu Server 24.04 LTS (descárgala de ubuntu.com)",
        ],
        steps: [
          {
            title: "Instalar VirtualBox y su Extension Pack",
            detail:
              "Descarga VirtualBox de virtualbox.org e instálalo con las opciones por defecto. Descarga también el «Extension Pack» de la MISMA versión e instálalo (doble clic sobre el fichero).",
            expected: "Al abrir VirtualBox ves su ventana principal (aún sin máquinas) y, en Archivo → Preferencias → Extensiones, aparece el Extension Pack instalado.",
          },
          {
            title: "Crear una red aislada solo para el laboratorio",
            detail:
              "Abre Archivo → Herramientas → Gestor de red → pestaña «Redes NAT» → Crear. Ponle nombre «ASIR-LAB», rango 10.10.10.0/24 y activa DHCP. Todas tus VM del curso irán en esta red, separada de tu red de casa.",
            expected: "En la lista de Redes NAT aparece «ASIR-LAB» con el rango 10.10.10.0/24 y DHCP activado.",
          },
          {
            title: "Crear la máquina virtual de Ubuntu Server",
            detail:
              "Pulsa «Nueva»: nombre «ubuntu-lab», 2 GB de RAM, 2 CPU y disco de 25 GB. En Configuración → Red → Adaptador 1, elige «Red NAT» y selecciona «ASIR-LAB». Arranca la VM con la ISO de Ubuntu Server.",
            expected: "La máquina «ubuntu-lab» arranca desde la ISO y aparece el instalador de Ubuntu Server.",
          },
          {
            title: "Instalar Ubuntu con usuario y SSH",
            detail:
              "Sigue el instalador: crea el usuario «asir» con una contraseña que recuerdes y, cuando lo ofrezca, marca «Install OpenSSH server». Al terminar, reinicia e inicia sesión.",
            expected: "Puedes iniciar sesión en la VM con el usuario «asir» y llegas a la línea de comandos.",
          },
          {
            title: "Actualizar el sistema y anotar su IP",
            detail: "Ya dentro, actualiza los paquetes y averigua la dirección IP que le ha dado la red del laboratorio.",
            code: "sudo apt update && sudo apt full-upgrade -y\nip -br addr",
            expected: "El sistema queda actualizado y ves una IP del tipo 10.10.10.x (la de tu VM en la red ASIR-LAB). Apúntala.",
          },
          {
            title: "Guardar una instantánea «00-base»",
            detail:
              "Apaga la VM. En VirtualBox, con la VM seleccionada, ve a «Instantáneas» → «Tomar» y llámala «00-base». Antes de cada práctica podrás volver aquí si algo sale mal.",
            expected: "En la pestaña Instantáneas aparece «00-base». Ahora tienes un punto de restauración seguro.",
          },
        ],
        check:
          "Tu VM de Ubuntu tiene una IP 10.10.10.x en la red ASIR-LAB, está actualizada, puedes iniciar sesión y existe la instantánea «00-base». Ya tienes tu laboratorio listo para todo el curso.",
        evidence: [
          "Captura de la red NAT «ASIR-LAB» y de la lista de instantáneas con «00-base».",
          "La IP que obtuvo tu VM y una captura del comando ip -br addr.",
        ],
      },
      {
        title: "Analizar los riesgos de un aula con la metodología MAGERIT",
        only: "SUPERIOR",
        goal:
          "Al terminar sabrás hacer un análisis de riesgos real: inventariar activos, valorarlos, identificar amenazas, calcular el riesgo y proponer salvaguardas, usando una versión simplificada de MAGERIT (la metodología oficial en España).",
        relation:
          "El Tema 0 define activo, amenaza, vulnerabilidad y riesgo (riesgo ≈ probabilidad × impacto) y las salvaguardas. Aquí conviertes esa teoría en una tabla de análisis de riesgos aplicada a un caso concreto —el aula—, que es exactamente lo que se hace en el mundo profesional.",
        duration: "50–70 min",
        environment: [
          "Una hoja de cálculo (LibreOffice Calc, Excel o Google Sheets)",
          "El aula de informática como caso de estudio (equipos, switch, servidor, proyector, datos, personas)",
          "Opcional: un asistente de IA para contrastar amenazas",
        ],
        steps: [
          {
            title: "Inventariar los activos del aula",
            detail:
              "Crea una tabla y lista al menos 10 activos de distintos tipos: hardware (PCs, switch), software, datos (trabajos del alumnado), servicios (Internet) y personas. Para cada uno, valora de 1 a 5 su Confidencialidad, Integridad y Disponibilidad.",
            expected: "Tienes una tabla con 10+ activos, cada uno con sus tres valoraciones (C, I, D) de 1 a 5.",
          },
          {
            title: "Identificar amenazas por activo",
            detail:
              "Para cada activo, añade 2 o 3 amenazas posibles usando las categorías de MAGERIT: desastres naturales, de origen industrial, errores humanos y ataques intencionados.",
            expected: "Cada activo tiene asociadas al menos 2 amenazas realistas y clasificadas por categoría.",
          },
          {
            title: "Estimar probabilidad e impacto y calcular el riesgo",
            detail:
              "Para cada amenaza, puntúa de 1 a 5 la probabilidad y el impacto. Calcula el riesgo = probabilidad × impacto y colorea la celda: verde (< 6), amarillo (6–14), rojo (≥ 15).",
            expected: "Tienes una matriz de riesgo coloreada donde se ven de un vistazo los riesgos rojos (los más urgentes).",
          },
          {
            title: "Proponer salvaguardas y clasificarlas",
            detail:
              "Para cada riesgo amarillo o rojo, propón una salvaguarda y clasifícala como preventiva (evita), detectiva (avisa) o correctiva (recupera).",
            expected: "Cada riesgo importante tiene al menos una salvaguarda propuesta y clasificada por tipo.",
          },
          {
            title: "Contrastar con un asistente de IA",
            detail:
              "Pega tu tabla (sin datos personales) en un asistente de IA y pídele amenazas o salvaguardas que se te hayan escapado. Anota cuáles aceptas y cuáles descartas, y por qué.",
            expected: "Has añadido o descartado sugerencias de la IA de forma justificada, mejorando tu análisis.",
          },
          {
            title: "Calcular el riesgo residual",
            detail:
              "Vuelve a calcular el riesgo suponiendo aplicadas las salvaguardas y compara la matriz «antes» con la «después».",
            expected: "El riesgo residual (después de las salvaguardas) es claramente menor que el inicial.",
          },
        ],
        check:
          "Tu hoja contiene: inventario de activos valorados en C-I-D, amenazas por activo, matriz de riesgo coloreada, salvaguardas clasificadas y una comparación de riesgo inicial vs. residual que demuestra la mejora.",
        evidence: [
          "La hoja de cálculo completa (o capturas de la matriz de riesgo antes y después).",
          "Una tabla resumen con los 3 riesgos más altos y la salvaguarda propuesta para cada uno.",
        ],
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
        key: "Un dato personal es cualquier información que identifique a una persona; tratarlo mal puede costar millones y, sobre todo, dañar a las personas.",
        paragraphs: [
          "El RGPD (UE 2016/679) y la LOPDGDD (Ley Orgánica 3/2018) regulan el tratamiento de datos personales: cualquier información sobre una persona identificada o identificable (nombre, DNI, IP, imagen, voz…).",
          "Los datos deben tratarse con licitud, lealtad y transparencia, para fines concretos, minimizando lo recogido y conservándolo solo el tiempo necesario. Las brechas con riesgo para las personas se notifican a la AEPD en un máximo de 72 horas.",
        ],
        bullets: [
          "Derechos de las personas: acceso, rectificación, supresión, oposición, limitación y portabilidad.",
          "Categorías especiales (salud, biometría, ideología…) requieren protección reforzada.",
          "Sanciones de hasta 20 millones de euros o el 4 % de la facturación anual global.",
        ],
        why: "Porque como técnico manejarás datos personales constantemente (usuarios, empleados, alumnos). Saber qué es un dato personal y cómo minimizarlo es lo que te separa de provocar una brecha o una sanción.",
      },
      {
        title: "Delitos informáticos y el Código Penal",
        key: "La diferencia entre un hacker ético y un delincuente es una sola cosa: la autorización por escrito.",
        paragraphs: [
          "El Código Penal castiga el acceso no autorizado a sistemas (art. 197 bis), la interceptación de datos, los daños informáticos (art. 264), las estafas informáticas (art. 248) y hasta crear o distribuir herramientas para cometer estos delitos (art. 197 ter).",
          "Por eso toda prueba de seguridad sobre sistemas ajenos requiere autorización previa y por escrito. En este curso solo se practica sobre el laboratorio propio.",
        ],
        why: "Porque vas a aprender técnicas de auditoría potentes. Usarlas sin permiso es delito, aunque no causes daño. Este límite legal es la base de toda tu carrera profesional.",
      },
      {
        title: "ENS y Directiva NIS2",
        key: "Normas obligatorias que dicen QUÉ nivel de seguridad debe tener una organización según su importancia.",
        paragraphs: [
          "El Esquema Nacional de Seguridad (RD 311/2022) es obligatorio para el sector público y sus proveedores. Clasifica los sistemas en categoría BÁSICA, MEDIA o ALTA y define las medidas de cada nivel.",
          "La Directiva NIS2 amplía las obligaciones de ciberseguridad a más sectores esenciales e importantes (energía, sanidad, transporte, digital…): gestión de riesgos, notificación de incidentes y responsabilidad de la dirección.",
        ],
        why: "Porque si trabajas para la Administración o para un sector esencial, estas normas no son opcionales: definen tu trabajo y su incumplimiento tiene consecuencias legales y económicas.",
      },
      {
        title: "Inteligencia Artificial y privacidad",
        key: "El AI Act clasifica la IA por riesgo; y si metes datos personales en una IA, sigue aplicando el RGPD.",
        paragraphs: [
          "El Reglamento Europeo de IA (AI Act) clasifica los sistemas de IA según su riesgo y exige más obligaciones cuanto mayor es ese riesgo.",
          "Si introduces datos personales en un modelo de IA, se aplica el RGPD: hay que tener base legal, informar a las personas y valorar si el proveedor reutiliza esos datos. Buena práctica: anonimizar antes de enviar nada a un asistente.",
        ],
        table: {
          caption: "Niveles de riesgo del AI Act",
          headers: ["Nivel", "Ejemplos", "Qué exige la ley"],
          rows: [
            ["Riesgo inaceptable", "Puntuación social, manipulación", "Prohibido"],
            ["Alto riesgo", "Selección de personal, educación, infraestructuras", "Controles estrictos y supervisión"],
            ["Riesgo de transparencia", "Chatbots, contenido sintético (deepfakes)", "Avisar de que es IA / está generado"],
            ["Riesgo mínimo", "Filtro antispam, videojuegos", "Sin obligaciones específicas"],
          ],
        },
        why: "Porque cada vez integrarás más IA en los sistemas. Saber en qué nivel de riesgo cae y qué exige la ley te evita crear un producto ilegal o exponer datos personales sin querer.",
      },
      {
        title: "Aplicación práctica: EIPD, contratos y auditorías autorizadas",
        only: "SUPERIOR",
        key: "Antes de tratar datos de alto riesgo o de auditar, primero va el papeleo legal: EIPD y contrato con alcance.",
        paragraphs: [
          "La Evaluación de Impacto relativa a la Protección de Datos (EIPD) es obligatoria cuando un tratamiento supone alto riesgo (p. ej. usar IA para perfilar personas). Describe el tratamiento, evalúa necesidad y proporcionalidad, analiza riesgos y propone medidas.",
          "Un encargo de auditoría debe incluir contrato, alcance (qué sistemas, qué horario, qué técnicas), acuerdo de confidencialidad y persona de contacto. Sin ese documento, la auditoría puede ser delito.",
        ],
        why: "Porque en el trabajo real la parte legal va ANTES que el teclado: una EIPD o un contrato de auditoría bien hechos te protegen a ti y a tu cliente. Es exactamente lo que practicarás en el laboratorio de este tema.",
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
