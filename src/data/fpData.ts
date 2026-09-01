import type { Ciclo, Familia, FamiliaId, Grado, Situacion } from '../types';

/* ==========================================================================
   Familias profesionales
   El campo `perfil` puntua de 0 a 5 cuanto pesa cada dimension vocacional en
   esa familia. Es la referencia contra la que se compara al estudiante.
   ========================================================================== */

export const FAMILIAS: Familia[] = [
  {
    id: 'informatica',
    nombre: 'Informática y Comunicaciones',
    claim: 'Construir lo que otros usan cada día',
    descripcion:
      'Programación, redes, sistemas y ciberseguridad. Es la familia de quien disfruta desmontando un problema hasta entender por qué falla y luego lo arregla.',
    perfil: { analitico: 5, creativo: 3, asistencial: 0, tecnico: 4, organizativo: 3, social: 1, cientifico: 2, fisico: 0 },
    colorClass: 'bg-familia-informatica',
    icono: 'Code2',
  },
  {
    id: 'sanidad',
    nombre: 'Sanidad',
    claim: 'Cuidar con criterio técnico',
    descripcion:
      'Cuidados al paciente, laboratorio, imagen diagnóstica y emergencias. Combina el trato humano con protocolos exigentes y mucha precisión.',
    perfil: { analitico: 3, creativo: 0, asistencial: 5, tecnico: 3, organizativo: 2, social: 3, cientifico: 5, fisico: 2 },
    colorClass: 'bg-familia-sanidad',
    icono: 'HeartPulse',
  },
  {
    id: 'administracion',
    nombre: 'Administración y Gestión',
    claim: 'Que todo cuadre y funcione',
    descripcion:
      'Contabilidad, fiscalidad, recursos humanos y gestión de empresa. Para quien tiene cabeza ordenada y le gusta que los números y los plazos encajen.',
    perfil: { analitico: 3, creativo: 1, asistencial: 1, tecnico: 1, organizativo: 5, social: 3, cientifico: 1, fisico: 0 },
    colorClass: 'bg-familia-administracion',
    icono: 'Calculator',
  },
  {
    id: 'electricidad',
    nombre: 'Electricidad y Electrónica',
    claim: 'Hacer que la energía llegue donde tiene que llegar',
    descripcion:
      'Instalaciones eléctricas, automatización, robótica y domótica. Mucho trabajo con las manos y con el esquema delante; sector con paro casi cero.',
    perfil: { analitico: 4, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 1, cientifico: 3, fisico: 3 },
    colorClass: 'bg-familia-electricidad',
    icono: 'Zap',
  },
  {
    id: 'imagen',
    nombre: 'Imagen y Sonido',
    claim: 'Contar historias con cámara y mesa de mezclas',
    descripcion:
      'Audiovisual, animación 3D, videojuegos, sonido directo y postproducción. Creatividad con una capa técnica muy real detrás.',
    perfil: { analitico: 2, creativo: 5, asistencial: 1, tecnico: 4, organizativo: 2, social: 3, cientifico: 1, fisico: 2 },
    colorClass: 'bg-familia-imagen',
    icono: 'Clapperboard',
  },
  {
    id: 'hosteleria',
    nombre: 'Hostelería y Turismo',
    claim: 'Un oficio que se nota en cuanto entras por la puerta',
    descripcion:
      'Cocina, pastelería, sala y turismo. Ritmo alto, equipo, servicio y una salida internacional que pocas familias tienen.',
    perfil: { analitico: 1, creativo: 4, asistencial: 2, tecnico: 4, organizativo: 3, social: 5, cientifico: 1, fisico: 4 },
    colorClass: 'bg-familia-hosteleria',
    icono: 'ChefHat',
  },
  {
    id: 'sociocultural',
    nombre: 'Servicios Socioculturales y a la Comunidad',
    claim: 'Estar cuando de verdad hace falta',
    descripcion:
      'Educación infantil, dependencia, integración social y mediación. La familia de quien escucha bien y sabe acompañar a personas en momentos difíciles.',
    perfil: { analitico: 1, creativo: 3, asistencial: 5, tecnico: 0, organizativo: 3, social: 5, cientifico: 1, fisico: 2 },
    colorClass: 'bg-familia-sociocultural',
    icono: 'Users',
  },
  {
    id: 'mecanica',
    nombre: 'Fabricación Mecánica',
    claim: 'De un plano a una pieza que existe',
    descripcion:
      'Mecanizado, soldadura, CNC y diseño de producto. Industria pura, con máquinas caras y con empresas buscando gente cualificada.',
    perfil: { analitico: 3, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 1, cientifico: 2, fisico: 3 },
    colorClass: 'bg-familia-mecanica',
    icono: 'Cog',
  },
  {
    id: 'comercio',
    nombre: 'Comercio y Marketing',
    claim: 'Conectar un producto con quien lo necesita',
    descripcion:
      'Marketing digital, ventas, logística y comercio internacional. Para perfiles con don de gentes que además saben leer datos.',
    perfil: { analitico: 2, creativo: 3, asistencial: 1, tecnico: 1, organizativo: 4, social: 5, cientifico: 1, fisico: 1 },
    colorClass: 'bg-familia-comercio',
    icono: 'ShoppingBag',
  },
  {
    id: 'automocion',
    nombre: 'Transporte y Mantenimiento de Vehículos',
    claim: 'Diagnosticar lo que otros solo oyen como un ruido raro',
    descripcion:
      'Mecánica, electromecánica y electrónica del automóvil. Los coches se han llenado de software y sensores, y hacen falta técnicos que entiendan las dos mitades.',
    perfil: { analitico: 3, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 1, cientifico: 2, fisico: 4 },
    colorClass: 'bg-familia-automocion',
    icono: 'Car',
  },
  {
    id: 'deportes',
    nombre: 'Actividades Físicas y Deportivas',
    claim: 'Vivir del movimiento y hacer que otros se muevan',
    descripcion:
      'Entrenamiento, animación deportiva y actividades en el medio natural. Para quien no concibe pasar ocho horas sentado y sabe motivar a un grupo.',
    perfil: { analitico: 1, creativo: 2, asistencial: 3, tecnico: 1, organizativo: 3, social: 5, cientifico: 2, fisico: 5 },
    colorClass: 'bg-familia-deportes',
    icono: 'Dumbbell',
  },
  {
    id: 'quimica',
    nombre: 'Química',
    claim: 'El sector que fabrica lo que todo lo demás necesita',
    descripcion:
      'Laboratorio y planta química: análisis, control de calidad y procesos industriales. Farmacéuticas, alimentación, cosmética y medio ambiente contratan aquí.',
    perfil: { analitico: 4, creativo: 1, asistencial: 0, tecnico: 3, organizativo: 3, social: 1, cientifico: 5, fisico: 1 },
    colorClass: 'bg-familia-quimica',
    icono: 'Microscope',
  },
  {
    id: 'instalacion',
    nombre: 'Instalación y Mantenimiento',
    claim: 'Que la planta no pare nunca',
    descripcion:
      'Mantenimiento industrial, frío, climatización y mecatrónica. Mezcla mecánica, electricidad y electrónica en el mismo puesto: por eso escasean los perfiles.',
    perfil: { analitico: 3, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 3, social: 1, cientifico: 2, fisico: 4 },
    colorClass: 'bg-familia-instalacion',
    icono: 'Cog',
  },
  {
    id: 'textil',
    nombre: 'Textil, Confección y Piel',
    claim: 'De un boceto a una prenda que se puede llevar',
    descripcion:
      'Patronaje, confección y diseño técnico de prendas. Una familia pequeña, muy artesanal y con demanda constante en talleres y marcas.',
    perfil: { analitico: 2, creativo: 5, asistencial: 0, tecnico: 4, organizativo: 3, social: 1, cientifico: 1, fisico: 2 },
    colorClass: 'bg-familia-textil',
    icono: 'Palette',
  },
];

/** Acceso indexado a las familias, para evitar `find()` en cada render. */
export const FAMILIAS_POR_ID: Record<FamiliaId, Familia> = FAMILIAS.reduce(
  (acc, familia) => {
    acc[familia.id] = familia;
    return acc;
  },
  {} as Record<FamiliaId, Familia>,
);

/* ==========================================================================
   Metadatos de los grados
   ========================================================================== */

export const GRADOS: Record<Grado, { nombre: string; corto: string; titulo: string; acceso: string }> = {
  basico: {
    nombre: 'Grado Básico',
    corto: 'Básico',
    titulo: 'Título Profesional Básico (+ título de ESO)',
    acceso: 'Entre 15 y 17 años, con propuesta del equipo docente.',
  },
  medio: {
    nombre: 'Grado Medio',
    corto: 'Medio',
    titulo: 'Técnico/a',
    acceso: 'Título de ESO, Grado Básico o prueba de acceso.',
  },
  superior: {
    nombre: 'Grado Superior',
    corto: 'Superior',
    titulo: 'Técnico/a Superior',
    acceso: 'Bachillerato, un Grado Medio o prueba de acceso.',
  },
};

/* ==========================================================================
   Situaciones de partida (paso 1 del test)
   ========================================================================== */

export const SITUACIONES: Situacion[] = [
  {
    id: 'sinEso',
    titulo: 'Aún no tengo la ESO',
    descripcion:
      'Estoy en la ESO y no la veo clara, o quiero empezar ya con algo práctico y con las manos.',
    gradosPreferidos: ['basico'],
    nota: 'El Grado Básico se cursa entre los 15 y los 17 años y te da el título de ESO al terminar.',
  },
  {
    id: 'conEso',
    titulo: 'Tengo la ESO (o la prueba de acceso)',
    descripcion:
      'Quiero formarme como técnico o técnica y empezar a trabajar en un sector concreto.',
    gradosPreferidos: ['medio'],
  },
  {
    id: 'conBachillerato',
    titulo: 'Tengo Bachillerato o un Grado Medio',
    descripcion:
      'Busco especializarme a alto nivel, con más responsabilidad y mejores condiciones de entrada.',
    gradosPreferidos: ['superior'],
  },
  {
    id: 'explorar',
    titulo: 'Quiero explorar todo',
    descripcion:
      'Todavía no sé qué me pega. Enséñame opciones de los tres grados y ya decidiré.',
    gradosPreferidos: ['basico', 'medio', 'superior'],
  },
];

/* ==========================================================================
   Catálogo de ciclos formativos
   Selección representativa de títulos LOE/LOGSE reales del sistema español.
   Las horas son las de la duración oficial del ciclo completo.
   ========================================================================== */

export const CICLOS: Ciclo[] = [
  /* --- Informática y Comunicaciones --- */
  {
    id: 'fpb-informatica-oficina',
    nombre: 'Informática de Oficina',
    familia: 'informatica',
    grado: 'basico',
    descripcion:
      'Montaje y reparación básica de equipos, instalación de software de oficina y atención al usuario. Un primer contacto muy práctico con la informática.',
    habilidadesClave: ['Montaje de equipos', 'Ofimática', 'Mantenimiento básico', 'Atención al usuario'],
    salidasLaborales: ['Ayudante de mantenimiento informático', 'Auxiliar de oficina técnica', 'Grabador de datos'],
    perfilIdeal: ['tecnico', 'organizativo'],
    tagsAfinidad: ['hardware', 'taller', 'atencionPublico'],
    asignaturasTipicas: ['Montaje y mantenimiento de equipos', 'Aplicaciones ofimáticas', 'Instalación de sistemas operativos', 'Atención al cliente'],
    continuidad: {
      especializacion: ['Grado Medio de Sistemas Microinformáticos y Redes'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-smr',
    nombre: 'Sistemas Microinformáticos y Redes',
    siglas: 'SMR',
    familia: 'informatica',
    grado: 'medio',
    descripcion:
      'Instalas y mantienes equipos, sistemas operativos y redes locales. Es el ciclo que forma al técnico que hace que la informática de una empresa no se caiga.',
    habilidadesClave: ['Redes locales', 'Sistemas operativos', 'Hardware', 'Soporte técnico', 'Seguridad básica'],
    salidasLaborales: ['Técnico de sistemas', 'Instalador de redes', 'Soporte informático (helpdesk)', 'Reparación de equipos'],
    perfilIdeal: ['tecnico', 'analitico'],
    tagsAfinidad: ['redes', 'hardware', 'programacion', 'taller'],
    asignaturasTipicas: ['Redes locales', 'Sistemas operativos monopuesto y en red', 'Montaje y mantenimiento de equipos', 'Seguridad informática', 'Servicios en red'],
    continuidad: {
      especializacion: ['Grado Superior de ASIR, DAM o DAW'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-dam',
    nombre: 'Desarrollo de Aplicaciones Multiplataforma',
    siglas: 'DAM',
    familia: 'informatica',
    grado: 'superior',
    descripcion:
      'Programación de aplicaciones de escritorio, móviles y servicios en la nube, con bases de datos y acceso a datos. Uno de los ciclos con mayor demanda del país.',
    habilidadesClave: ['Java y Kotlin', 'Bases de datos', 'Programación móvil', 'Interfaces', 'Control de versiones'],
    salidasLaborales: ['Programador/a de aplicaciones', 'Desarrollador/a móvil', 'Analista programador', 'Técnico de calidad de software'],
    perfilIdeal: ['analitico', 'tecnico', 'creativo'],
    tagsAfinidad: ['programacion', 'videojuegos', 'precision'],
    asignaturasTipicas: ['Programación', 'Bases de datos', 'Acceso a datos', 'Desarrollo de interfaces', 'Programación multimedia y dispositivos móviles', 'Sistemas de gestión empresarial'],
    continuidad: {
      especializacion: ['Curso de especialización en Inteligencia Artificial y Big Data', 'Curso de especialización en Ciberseguridad'],
      universidad: ['Ingeniería Informática', 'Ingeniería del Software', 'Ciencia de Datos'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-daw',
    nombre: 'Desarrollo de Aplicaciones Web',
    siglas: 'DAW',
    familia: 'informatica',
    grado: 'superior',
    descripcion:
      'Desarrollo web de principio a fin: la parte que ve el usuario, la lógica del servidor y el despliegue. Puedes trabajar en remoto casi desde el primer empleo.',
    habilidadesClave: ['HTML, CSS y JavaScript', 'Backend y APIs', 'Bases de datos', 'Despliegue', 'Accesibilidad'],
    salidasLaborales: ['Desarrollador/a web front-end', 'Desarrollador/a back-end', 'Programador/a de comercio electrónico'],
    perfilIdeal: ['analitico', 'creativo', 'tecnico'],
    tagsAfinidad: ['programacion', 'diseno', 'redes'],
    asignaturasTipicas: ['Desarrollo web en entorno cliente', 'Desarrollo web en entorno servidor', 'Bases de datos', 'Diseño de interfaces web', 'Despliegue de aplicaciones web'],
    continuidad: {
      especializacion: ['Curso de especialización en Inteligencia Artificial y Big Data', 'Curso de especialización en Ciberseguridad'],
      universidad: ['Ingeniería Informática', 'Ingeniería del Software', 'Diseño Digital'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-asir',
    nombre: 'Administración de Sistemas Informáticos en Red',
    siglas: 'ASIR',
    familia: 'informatica',
    grado: 'superior',
    descripcion:
      'Servidores, virtualización, redes corporativas y ciberseguridad. Es la puerta natural a los perfiles de sistemas, cloud y DevOps.',
    habilidadesClave: ['Servidores Linux y Windows', 'Virtualización', 'Redes', 'Ciberseguridad', 'Alta disponibilidad'],
    salidasLaborales: ['Administrador/a de sistemas', 'Técnico de redes', 'Especialista en ciberseguridad', 'Técnico de soporte cloud'],
    perfilIdeal: ['analitico', 'tecnico', 'organizativo'],
    tagsAfinidad: ['redes', 'hardware', 'programacion', 'gestion'],
    asignaturasTipicas: ['Administración de sistemas operativos', 'Servicios de red e internet', 'Implantación de aplicaciones web', 'Seguridad y alta disponibilidad', 'Fundamentos de hardware'],
    continuidad: {
      especializacion: ['Curso de especialización en Ciberseguridad', 'Curso de especialización en Inteligencia Artificial y Big Data'],
      universidad: ['Ingeniería Informática', 'Ingeniería de Sistemas de Telecomunicación'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta: 'Todo el mundo entra a Informática pensando en programar, así que los perfiles de sistemas, redes y cloud se quedan sin cubrir. Es la rama con menos competencia y sueldos igual de altos.',
    diaEnElTrabajo:
      'Un servidor deja de responder a media mañana y media empresa se queda sin trabajar. Entras por consola, lees los registros, ves que un disco del almacenamiento ha muerto y lanzas la reconstrucción. Nadie pierde un solo archivo, y la mayoría ni se entera de que pasó algo.',
  },

  /* --- Sanidad --- */
  {
    id: 'gm-auxiliar-enfermeria',
    nombre: 'Cuidados Auxiliares de Enfermería',
    siglas: 'TCAE',
    familia: 'sanidad',
    grado: 'medio',
    descripcion:
      'Cuidados básicos al paciente, higiene, apoyo en consulta y preparación de material sanitario. Uno de los ciclos con más contratación del sistema.',
    habilidadesClave: ['Cuidados al paciente', 'Higiene hospitalaria', 'Esterilización', 'Primeros auxilios', 'Trato humano'],
    salidasLaborales: ['Auxiliar de enfermería en hospital', 'Auxiliar en centros de mayores', 'Auxiliar de consulta y clínica dental'],
    perfilIdeal: ['asistencial', 'social', 'cientifico'],
    tagsAfinidad: ['cuidadoPersonas', 'urgencias', 'precision'],
    asignaturasTipicas: ['Técnicas básicas de enfermería', 'Higiene del medio hospitalario', 'Operaciones administrativas', 'Promoción de la salud', 'Técnicas de ayuda odontológica'],
    continuidad: {
      especializacion: ['Grado Superior de Higiene Bucodental, Laboratorio Clínico o Documentación Sanitaria'],
      universidad: [],
    },
    duracionHoras: 1400,
  },
  {
    id: 'gm-emergencias',
    nombre: 'Emergencias Sanitarias',
    familia: 'sanidad',
    grado: 'medio',
    descripcion:
      'Atención al paciente en ambulancia y en la vía pública, soporte vital y coordinación con el centro de urgencias. Trabajo con adrenalina y protocolo.',
    habilidadesClave: ['Soporte vital básico', 'Inmovilización', 'Conducción sanitaria', 'Triaje', 'Trabajo bajo presión'],
    salidasLaborales: ['Técnico en emergencias sanitarias (TES)', 'Personal de ambulancia', 'Operador de central de urgencias'],
    perfilIdeal: ['asistencial', 'tecnico', 'social'],
    tagsAfinidad: ['urgencias', 'cuidadoPersonas', 'deporte'],
    asignaturasTipicas: ['Atención sanitaria inicial en situaciones de emergencia', 'Evacuación y traslado de pacientes', 'Logística sanitaria en emergencias', 'Teleemergencias', 'Anatomofisiología'],
    continuidad: {
      especializacion: ['Grado Superior de la familia de Sanidad'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-farmacia',
    nombre: 'Farmacia y Parafarmacia',
    familia: 'sanidad',
    grado: 'medio',
    descripcion:
      'Dispensación de medicamentos bajo supervisión, control de stock y consejo al cliente en parafarmacia. Mezcla mostrador y rigor sanitario.',
    habilidadesClave: ['Dispensación', 'Control de almacén', 'Dermofarmacia', 'Atención al cliente', 'Formulación básica'],
    salidasLaborales: ['Técnico de farmacia', 'Auxiliar de parafarmacia', 'Almacén de distribución farmacéutica'],
    perfilIdeal: ['asistencial', 'organizativo', 'cientifico'],
    tagsAfinidad: ['cuidadoPersonas', 'laboratorio', 'atencionPublico', 'precision'],
    asignaturasTipicas: ['Dispensación de productos farmacéuticos', 'Oficina de farmacia', 'Formulación magistral', 'Anatomofisiología y patología básicas', 'Promoción de la salud'],
    continuidad: {
      especializacion: ['Grado Superior de Laboratorio Clínico y Biomédico'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-laboratorio-clinico',
    nombre: 'Laboratorio Clínico y Biomédico',
    familia: 'sanidad',
    grado: 'superior',
    descripcion:
      'Analizas muestras biológicas con técnicas de bioquímica, microbiología y genética. Si te gustó la biología del instituto, este es tu sitio.',
    habilidadesClave: ['Análisis de muestras', 'Microbiología', 'Bioquímica', 'Control de calidad', 'Manejo de autoanalizadores'],
    salidasLaborales: ['Técnico de laboratorio clínico', 'Laboratorio de investigación', 'Industria farmacéutica', 'Banco de sangre'],
    perfilIdeal: ['cientifico', 'analitico', 'tecnico'],
    tagsAfinidad: ['laboratorio', 'precision', 'cuidadoPersonas'],
    asignaturasTipicas: ['Análisis bioquímico', 'Microbiología clínica', 'Técnicas de inmunodiagnóstico', 'Fisiopatología general', 'Biología molecular y citogenética'],
    continuidad: {
      especializacion: ['Curso de especialización en Medicina Nuclear y Radiofarmacia'],
      universidad: ['Biotecnología', 'Bioquímica', 'Enfermería', 'Farmacia'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-imagen-diagnostico',
    nombre: 'Imagen para el Diagnóstico y Medicina Nuclear',
    familia: 'sanidad',
    grado: 'superior',
    descripcion:
      'Manejas equipos de radiología, TAC, resonancia y medicina nuclear. Tecnología puntera aplicada directamente al diagnóstico del paciente.',
    habilidadesClave: ['Radiología', 'TAC y resonancia', 'Radioprotección', 'Anatomía', 'Atención al paciente'],
    salidasLaborales: ['Técnico de radiodiagnóstico', 'Técnico de medicina nuclear', 'Radiología veterinaria'],
    perfilIdeal: ['cientifico', 'tecnico', 'asistencial'],
    tagsAfinidad: ['laboratorio', 'precision', 'cuidadoPersonas'],
    asignaturasTipicas: ['Técnicas de radiología simple', 'Tomografía computarizada y ecografía', 'Técnicas de imagen por resonancia magnética', 'Medicina nuclear', 'Protección radiológica'],
    continuidad: {
      especializacion: ['Curso de especialización en Radiofarmacia'],
      universidad: ['Enfermería', 'Medicina', 'Física'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-higiene-bucodental',
    nombre: 'Higiene Bucodental',
    familia: 'sanidad',
    grado: 'superior',
    descripcion:
      'Realizas limpiezas, selladores y exploración bucodental, y educas al paciente en prevención. Consulta propia dentro de la clínica dental.',
    habilidadesClave: ['Profilaxis dental', 'Exploración bucal', 'Educación para la salud', 'Radiografía dental'],
    salidasLaborales: ['Higienista dental', 'Clínicas dentales', 'Programas de salud pública escolar'],
    perfilIdeal: ['asistencial', 'tecnico', 'cientifico'],
    tagsAfinidad: ['cuidadoPersonas', 'precision', 'atencionPublico'],
    asignaturasTipicas: ['Exploración de la cavidad oral', 'Intervención bucodental preventiva', 'Epidemiología en salud oral', 'Educación para la salud oral', 'Primeros auxilios'],
    continuidad: {
      especializacion: ['Cursos de especialización en salud pública oral'],
      universidad: ['Odontología', 'Enfermería'],
    },
    duracionHoras: 2000,
  },

  /* --- Administración y Gestión --- */
  {
    id: 'fpb-servicios-administrativos',
    nombre: 'Servicios Administrativos',
    familia: 'administracion',
    grado: 'basico',
    descripcion:
      'Archivo, tramitación básica de documentos, atención telefónica y ofimática. Aprendes el día a día real de una oficina.',
    habilidadesClave: ['Archivo y registro', 'Ofimática', 'Atención telefónica', 'Tramitación básica'],
    salidasLaborales: ['Auxiliar administrativo', 'Recepcionista', 'Auxiliar de archivo'],
    perfilIdeal: ['organizativo', 'social'],
    tagsAfinidad: ['gestion', 'atencionPublico', 'numeros'],
    asignaturasTipicas: ['Tratamiento informático de datos', 'Técnicas administrativas básicas', 'Archivo y comunicación', 'Atención al cliente'],
    continuidad: {
      especializacion: ['Grado Medio de Gestión Administrativa'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-gestion-administrativa',
    nombre: 'Gestión Administrativa',
    familia: 'administracion',
    grado: 'medio',
    descripcion:
      'Facturación, nóminas, tesorería y gestión documental con software de empresa. Un ciclo transversal: sirve para casi cualquier sector.',
    habilidadesClave: ['Contabilidad básica', 'Nóminas', 'Facturación', 'Software de gestión', 'Atención al cliente'],
    salidasLaborales: ['Auxiliar administrativo', 'Administrativo comercial', 'Gestión de tesorería', 'Empleado de gestoría'],
    perfilIdeal: ['organizativo', 'analitico', 'social'],
    tagsAfinidad: ['gestion', 'numeros', 'atencionPublico'],
    asignaturasTipicas: ['Técnica contable', 'Operaciones administrativas de compraventa', 'Operaciones administrativas de recursos humanos', 'Tratamiento de la documentación contable', 'Empresa y Administración'],
    continuidad: {
      especializacion: ['Grado Superior de Administración y Finanzas o Asistencia a la Dirección'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-administracion-finanzas',
    nombre: 'Administración y Finanzas',
    familia: 'administracion',
    grado: 'superior',
    descripcion:
      'Contabilidad avanzada, fiscalidad, recursos humanos y análisis financiero. El ciclo que más convalida créditos si luego quieres ir a la universidad.',
    habilidadesClave: ['Contabilidad avanzada', 'Fiscalidad', 'Recursos humanos', 'Análisis financiero', 'Excel avanzado'],
    salidasLaborales: ['Técnico contable', 'Gestor administrativo', 'Departamento de RRHH', 'Asesoría fiscal y laboral'],
    perfilIdeal: ['organizativo', 'analitico'],
    tagsAfinidad: ['numeros', 'gestion', 'emprender'],
    asignaturasTipicas: ['Contabilidad y fiscalidad', 'Gestión financiera', 'Recursos humanos y responsabilidad social', 'Gestión de la documentación jurídica', 'Simulación empresarial'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización de la gestión administrativa'],
      universidad: ['Administración y Dirección de Empresas', 'Economía', 'Contabilidad y Finanzas', 'Relaciones Laborales'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-asistencia-direccion',
    nombre: 'Asistencia a la Dirección',
    familia: 'administracion',
    grado: 'superior',
    descripcion:
      'Organizas la agenda, la comunicación y los eventos de un equipo directivo, normalmente en dos idiomas. Mucha responsabilidad y visión de conjunto.',
    habilidadesClave: ['Organización de agenda', 'Inglés profesional', 'Protocolo', 'Gestión documental', 'Comunicación'],
    salidasLaborales: ['Asistente de dirección', 'Coordinador/a de oficina', 'Gestión de eventos corporativos'],
    perfilIdeal: ['organizativo', 'social'],
    tagsAfinidad: ['gestion', 'idiomas', 'atencionPublico', 'liderazgo'],
    asignaturasTipicas: ['Comunicación y atención al cliente', 'Protocolo empresarial', 'Inglés y segunda lengua extranjera', 'Gestión de la documentación jurídica', 'Ofimática avanzada'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización de la gestión administrativa'],
      universidad: ['Administración y Dirección de Empresas', 'Traducción e Interpretación', 'Turismo'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta: 'Suena a secretariado antiguo y no lo es: coordinas la agenda, la comunicación y los eventos de un equipo directivo, en dos idiomas. Se ve la empresa entera desde dentro.',
    diaEnElTrabajo:
      'Tienes que cuadrar una reunión con tres directivos en dos husos horarios, reservar sala, preparar la documentación y avisar a un proveedor en inglés. A las nueve todo está en pie y la dirección solo tiene que sentarse y decidir.',
  },

  /* --- Electricidad y Electrónica --- */
  {
    id: 'fpb-electricidad',
    nombre: 'Electricidad y Electrónica',
    familia: 'electricidad',
    grado: 'basico',
    descripcion:
      'Montaje de instalaciones eléctricas sencillas, canalizaciones y pequeñas reparaciones. Taller desde la primera semana.',
    habilidadesClave: ['Montaje eléctrico', 'Herramienta de taller', 'Lectura de esquemas', 'Prevención de riesgos'],
    salidasLaborales: ['Ayudante de electricista', 'Auxiliar de montaje eléctrico', 'Mantenimiento básico de edificios'],
    perfilIdeal: ['tecnico'],
    tagsAfinidad: ['electricidad', 'taller', 'construccion'],
    asignaturasTipicas: ['Instalaciones eléctricas y domóticas', 'Equipos eléctricos y electrónicos', 'Instalaciones de telecomunicaciones', 'Prevención de riesgos'],
    continuidad: {
      especializacion: ['Grado Medio de Instalaciones Eléctricas y Automáticas'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-instalaciones-electricas',
    nombre: 'Instalaciones Eléctricas y Automáticas',
    familia: 'electricidad',
    grado: 'medio',
    descripcion:
      'Instalaciones de vivienda e industria, domótica, cuadros y automatismos. Con el título puedes tramitar el carné de instalador y trabajar por tu cuenta.',
    habilidadesClave: ['Instalaciones de BT', 'Automatismos', 'Domótica', 'Cuadros eléctricos', 'Normativa REBT'],
    salidasLaborales: ['Electricista de edificios', 'Instalador de automatismos', 'Mantenimiento industrial', 'Autónomo instalador'],
    perfilIdeal: ['tecnico', 'analitico'],
    tagsAfinidad: ['electricidad', 'taller', 'construccion', 'maquinaria'],
    asignaturasTipicas: ['Instalaciones eléctricas interiores', 'Automatismos industriales', 'Instalaciones de distribución', 'Instalaciones domóticas', 'Máquinas eléctricas'],
    continuidad: {
      especializacion: ['Grado Superior de Sistemas Electrotécnicos o Automatización y Robótica'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-sistemas-electrotecnicos',
    nombre: 'Sistemas Electrotécnicos y Automatizados',
    familia: 'electricidad',
    grado: 'superior',
    descripcion:
      'Diseñas y supervisas instalaciones eléctricas de media tensión, automatización industrial y eficiencia energética. Perfil de mando en obra.',
    habilidadesClave: ['Proyectos eléctricos', 'Autómatas programables', 'Media tensión', 'Eficiencia energética', 'Gestión de equipos'],
    salidasLaborales: ['Jefe de equipo de instalaciones', 'Técnico de proyectos eléctricos', 'Mantenimiento industrial avanzado'],
    perfilIdeal: ['tecnico', 'analitico', 'organizativo'],
    tagsAfinidad: ['electricidad', 'construccion', 'gestion', 'maquinaria'],
    asignaturasTipicas: ['Configuración de instalaciones eléctricas', 'Técnicas y procesos en instalaciones eléctricas', 'Documentación técnica', 'Gestión del montaje y mantenimiento', 'Eficiencia energética'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización del mantenimiento industrial', 'Curso de especialización en Eficiencia energética'],
      universidad: ['Ingeniería Eléctrica', 'Ingeniería Electrónica Industrial', 'Ingeniería de Energía'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-automatizacion-robotica',
    nombre: 'Automatización y Robótica Industrial',
    familia: 'electricidad',
    grado: 'superior',
    descripcion:
      'Programación de robots, PLC, visión artificial y líneas de producción automatizadas. El corazón técnico de la industria 4.0.',
    habilidadesClave: ['Programación de PLC', 'Robótica industrial', 'SCADA', 'Neumática e hidráulica', 'Visión artificial'],
    salidasLaborales: ['Programador/a de robots', 'Técnico de automatización', 'Puesta en marcha de líneas', 'Mantenimiento predictivo'],
    perfilIdeal: ['tecnico', 'analitico', 'cientifico'],
    tagsAfinidad: ['maquinaria', 'electricidad', 'programacion', 'precision'],
    asignaturasTipicas: ['Sistemas de medida y regulación', 'Robótica industrial', 'Comunicaciones industriales', 'Sistemas programables avanzados', 'Informática industrial'],
    continuidad: {
      especializacion: ['Curso de especialización en Fabricación inteligente', 'Curso de especialización en Digitalización del mantenimiento industrial'],
      universidad: ['Ingeniería Electrónica Industrial y Automática', 'Ingeniería Mecatrónica', 'Ingeniería Robótica'],
    },
    duracionHoras: 2000,
  },

  /* --- Imagen y Sonido --- */
  {
    id: 'gm-video-dj-sonido',
    nombre: 'Vídeo Disc-jockey y Sonido',
    familia: 'imagen',
    grado: 'medio',
    descripcion:
      'Sonido en directo, sesiones de DJ, iluminación y montaje de espectáculos. Aprendes con equipo real de sala y de escenario.',
    habilidadesClave: ['Sonido directo', 'Mesa de mezclas', 'Iluminación', 'Montaje de eventos', 'Edición de audio'],
    salidasLaborales: ['Técnico de sonido', 'DJ profesional', 'Montaje de espectáculos', 'Sonorización de salas'],
    perfilIdeal: ['creativo', 'tecnico', 'social'],
    tagsAfinidad: ['audiovisual', 'diseno', 'atencionPublico'],
    asignaturasTipicas: ['Instalación y montaje de equipos de sonido', 'Control de sonido en directo', 'Animación musical en vivo', 'Toma y edición digital de sonido', 'Iluminación de espectáculos'],
    continuidad: {
      especializacion: ['Grado Superior de Sonido para Audiovisuales y Espectáculos'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-animaciones-3d',
    nombre: 'Animaciones 3D, Juegos y Entornos Interactivos',
    familia: 'imagen',
    grado: 'superior',
    descripcion:
      'Modelado, texturizado, rigging y animación para videojuegos, cine y realidad virtual. Terminas con un portfolio, que es lo que de verdad te contrata.',
    habilidadesClave: ['Modelado 3D', 'Animación', 'Motores de videojuego', 'Texturizado', 'Portfolio'],
    salidasLaborales: ['Artista 3D', 'Animador/a', 'Diseñador/a de niveles', 'Realidad virtual y aumentada'],
    perfilIdeal: ['creativo', 'tecnico', 'analitico'],
    tagsAfinidad: ['videojuegos', 'diseno', 'audiovisual', 'programacion'],
    asignaturasTipicas: ['Modelado 3D', 'Animación de elementos 3D', 'Realización del montaje y postproducción', 'Proyectos de animación', 'Desarrollo de entornos interactivos'],
    continuidad: {
      especializacion: ['Curso de especialización en Animación 3D avanzada'],
      universidad: ['Diseño Multimedia y Gráfico', 'Desarrollo de Videojuegos', 'Bellas Artes'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-realizacion-audiovisual',
    nombre: 'Realización de Proyectos Audiovisuales y Espectáculos',
    familia: 'imagen',
    grado: 'superior',
    descripcion:
      'Diriges y coordinas rodajes, directos de televisión y espectáculos: escaleta, equipo y decisiones en tiempo real.',
    habilidadesClave: ['Realización', 'Planificación de rodaje', 'Dirección de equipo', 'Montaje', 'Directo multicámara'],
    salidasLaborales: ['Realizador/a de televisión', 'Ayudante de dirección', 'Regidor/a de espectáculos', 'Productor/a de contenidos'],
    perfilIdeal: ['creativo', 'organizativo', 'social'],
    tagsAfinidad: ['audiovisual', 'diseno', 'liderazgo', 'gestion'],
    asignaturasTipicas: ['Planificación de la realización', 'Realización en televisión', 'Procesos de regiduría', 'Realización del montaje y postproducción', 'Medios técnicos audiovisuales'],
    continuidad: {
      especializacion: ['Curso de especialización en Audiodescripción y subtitulación'],
      universidad: ['Comunicación Audiovisual', 'Cine y Medios Audiovisuales', 'Periodismo'],
    },
    duracionHoras: 2000,
  },

  /* --- Hostelería y Turismo --- */
  {
    id: 'fpb-cocina-restauracion',
    nombre: 'Cocina y Restauración',
    familia: 'hosteleria',
    grado: 'basico',
    descripcion:
      'Preelaboración de alimentos, cocina sencilla y servicio de sala. Se aprende de pie, en cocina, con producto real.',
    habilidadesClave: ['Preelaboración', 'Higiene alimentaria', 'Servicio de sala', 'Trabajo en equipo'],
    salidasLaborales: ['Ayudante de cocina', 'Ayudante de camarero', 'Office y colectividades'],
    perfilIdeal: ['tecnico', 'social'],
    tagsAfinidad: ['cocina', 'taller', 'atencionPublico'],
    asignaturasTipicas: ['Técnicas elementales de preelaboración', 'Procesos básicos de producción culinaria', 'Aprovisionamiento y conservación', 'Técnicas elementales de servicio'],
    continuidad: {
      especializacion: ['Grado Medio de Cocina y Gastronomía o de Servicios en Restauración'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-cocina-gastronomia',
    nombre: 'Cocina y Gastronomía',
    familia: 'hosteleria',
    grado: 'medio',
    descripcion:
      'Técnicas de cocina, escandallos, cocina creativa y organización de partidas. Salida inmediata y muy internacional.',
    habilidadesClave: ['Técnicas culinarias', 'Escandallos', 'Seguridad alimentaria', 'Cocina creativa', 'Ritmo de servicio'],
    salidasLaborales: ['Cocinero/a', 'Jefe/a de partida', 'Cocina de hotel', 'Catering y colectividades'],
    perfilIdeal: ['creativo', 'tecnico', 'social'],
    tagsAfinidad: ['cocina', 'taller', 'precision'],
    asignaturasTipicas: ['Técnicas culinarias', 'Procesos básicos de pastelería y repostería', 'Productos culinarios', 'Ofertas gastronómicas', 'Seguridad e higiene en la manipulación de alimentos'],
    continuidad: {
      especializacion: ['Grado Superior de Dirección de Cocina'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-direccion-cocina',
    nombre: 'Dirección de Cocina',
    familia: 'hosteleria',
    grado: 'superior',
    descripcion:
      'Diseño de cartas, costes, gestión de compras y dirección de brigada. El paso de cocinar a dirigir la cocina.',
    habilidadesClave: ['Gestión de costes', 'Diseño de cartas', 'Dirección de equipo', 'Compras y proveedores', 'Innovación culinaria'],
    salidasLaborales: ['Jefe/a de cocina', 'Gerente de restaurante', 'Asesoría gastronómica', 'I+D de producto'],
    perfilIdeal: ['creativo', 'organizativo', 'tecnico'],
    tagsAfinidad: ['cocina', 'gestion', 'liderazgo', 'emprender'],
    asignaturasTipicas: ['Control del aprovisionamiento de materias primas', 'Procesos de elaboración culinaria', 'Gestión de la producción en cocina', 'Gastronomía y nutrición', 'Recursos humanos en restauración'],
    continuidad: {
      especializacion: ['Curso de especialización en Panadería y bollería artesanales', 'Curso de especialización en Pastelería'],
      universidad: ['Gastronomía y Artes Culinarias', 'Nutrición Humana y Dietética', 'Turismo'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-guia-turistica',
    nombre: 'Guía, Información y Asistencias Turísticas',
    familia: 'hosteleria',
    grado: 'superior',
    descripcion:
      'Guías visitas, diseñas itinerarios y asistes a viajeros en destino, normalmente en varios idiomas. Muy poca oficina.',
    habilidadesClave: ['Idiomas', 'Diseño de itinerarios', 'Comunicación en público', 'Patrimonio', 'Gestión de grupos'],
    salidasLaborales: ['Guía turístico/a', 'Agente de viajes', 'Asistente en aeropuertos y cruceros', 'Oficina de turismo'],
    perfilIdeal: ['social', 'organizativo', 'creativo'],
    tagsAfinidad: ['idiomas', 'atencionPublico', 'aireLibre', 'gestion'],
    asignaturasTipicas: ['Diseño de productos turísticos', 'Servicios de información turística', 'Procesos de guía y asistencia', 'Inglés y segunda lengua extranjera', 'Recursos turísticos'],
    continuidad: {
      especializacion: ['Curso de especialización en Turismo sostenible'],
      universidad: ['Turismo', 'Traducción e Interpretación', 'Historia del Arte'],
    },
    duracionHoras: 2000,
  },

  /* --- Servicios Socioculturales y a la Comunidad --- */
  {
    id: 'gm-dependencia',
    nombre: 'Atención a Personas en Situación de Dependencia',
    familia: 'sociocultural',
    grado: 'medio',
    descripcion:
      'Acompañas a personas mayores o con discapacidad en su día a día, en domicilio o en centro. Vocación pura con técnica detrás.',
    habilidadesClave: ['Cuidados personales', 'Movilización', 'Apoyo psicosocial', 'Primeros auxilios', 'Escucha activa'],
    salidasLaborales: ['Auxiliar de ayuda a domicilio', 'Gerocultor/a en residencia', 'Asistente personal', 'Centros de día'],
    perfilIdeal: ['asistencial', 'social'],
    tagsAfinidad: ['cuidadoPersonas', 'urgencias', 'atencionPublico'],
    asignaturasTipicas: ['Atención y apoyo psicosocial', 'Atención sanitaria', 'Higiene', 'Apoyo domiciliario', 'Teleasistencia', 'Primeros auxilios'],
    continuidad: {
      especializacion: ['Grado Superior de Integración Social o Educación Infantil'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-educacion-infantil',
    nombre: 'Educación Infantil',
    familia: 'sociocultural',
    grado: 'superior',
    descripcion:
      'Diseñas y aplicas proyectos educativos para niños de 0 a 6 años. Puedes ser tutor/a del primer ciclo de infantil con este título.',
    habilidadesClave: ['Desarrollo infantil', 'Programación de aulas', 'Juego y expresión', 'Relación con familias', 'Detección temprana'],
    salidasLaborales: ['Educador/a infantil (0-3 años)', 'Técnico de apoyo en aulas de infantil', 'Ludotecas y ocio educativo'],
    perfilIdeal: ['asistencial', 'social', 'creativo'],
    tagsAfinidad: ['ensenanza', 'cuidadoPersonas'],
    asignaturasTipicas: ['Didáctica de la educación infantil', 'Desarrollo cognitivo y motor', 'Expresión y comunicación', 'El juego infantil y su metodología', 'Intervención con familias'],
    continuidad: {
      especializacion: ['Curso de especialización en Atención temprana'],
      universidad: ['Educación Infantil', 'Educación Primaria', 'Pedagogía', 'Psicología'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-integracion-social',
    nombre: 'Integración Social',
    familia: 'sociocultural',
    grado: 'superior',
    descripcion:
      'Programas de inserción con colectivos en riesgo: menores, migración, adicciones, violencia de género o discapacidad. Trabajo social de campo.',
    habilidadesClave: ['Intervención social', 'Mediación', 'Diseño de proyectos', 'Lengua de signos', 'Trabajo en red'],
    salidasLaborales: ['Integrador/a social', 'Educador/a de centro de menores', 'Mediador/a intercultural', 'Técnico de inserción laboral'],
    perfilIdeal: ['asistencial', 'social', 'organizativo'],
    tagsAfinidad: ['cuidadoPersonas', 'ensenanza', 'gestion', 'atencionPublico'],
    asignaturasTipicas: ['Contexto de la intervención social', 'Mediación comunitaria', 'Inserción sociolaboral', 'Sistemas aumentativos y alternativos de comunicación', 'Atención a unidades de convivencia'],
    continuidad: {
      especializacion: ['Curso de especialización en Mediación comunitaria'],
      universidad: ['Trabajo Social', 'Educación Social', 'Psicología', 'Sociología'],
    },
    duracionHoras: 2000,
  },

  /* --- Fabricación Mecánica --- */
  {
    id: 'fpb-fabricacion-montaje',
    nombre: 'Fabricación y Montaje',
    familia: 'mecanica',
    grado: 'basico',
    descripcion:
      'Corte, soldadura básica y montaje de estructuras metálicas y tuberías. Oficio de taller con salida rápida.',
    habilidadesClave: ['Soldadura básica', 'Corte y conformado', 'Lectura de planos', 'Montaje de estructuras'],
    salidasLaborales: ['Ayudante de soldador', 'Auxiliar de montaje industrial', 'Operario de taller metálico'],
    perfilIdeal: ['tecnico'],
    tagsAfinidad: ['taller', 'maquinaria', 'construccion'],
    asignaturasTipicas: ['Operaciones básicas de fabricación', 'Soldadura y carpintería metálica', 'Redes de evacuación', 'Fontanería y calefacción básica'],
    continuidad: {
      especializacion: ['Grado Medio de Mecanizado o de Soldadura y Calderería'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-mecanizado',
    nombre: 'Mecanizado',
    familia: 'mecanica',
    grado: 'medio',
    descripcion:
      'Fabricas piezas con torno, fresadora y máquinas de control numérico a partir de un plano. Precisión de centésimas de milímetro.',
    habilidadesClave: ['Torno y fresa', 'CNC', 'Metrología', 'Interpretación de planos', 'Control de calidad'],
    salidasLaborales: ['Operario/a de CNC', 'Tornero/fresador', 'Verificador de calidad', 'Taller de matricería'],
    perfilIdeal: ['tecnico', 'analitico'],
    tagsAfinidad: ['maquinaria', 'taller', 'precision'],
    asignaturasTipicas: ['Procesos de mecanizado', 'Mecanizado por control numérico', 'Fabricación por arranque de viruta', 'Metrología y ensayos', 'Interpretación gráfica'],
    continuidad: {
      especializacion: ['Grado Superior de Programación de la Producción en Fabricación Mecánica'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-programacion-produccion',
    nombre: 'Programación de la Producción en Fabricación Mecánica',
    familia: 'mecanica',
    grado: 'superior',
    descripcion:
      'Planificas la producción de una planta: métodos, tiempos, aprovisionamiento y calidad. Perfil de mando intermedio en la industria.',
    habilidadesClave: ['Planificación de producción', 'Programación CNC', 'Gestión de calidad', 'Lean manufacturing', 'Costes'],
    salidasLaborales: ['Técnico de planificación', 'Jefe/a de taller', 'Responsable de calidad', 'Programador/a CAM'],
    perfilIdeal: ['organizativo', 'tecnico', 'analitico'],
    tagsAfinidad: ['maquinaria', 'gestion', 'numeros', 'liderazgo'],
    asignaturasTipicas: ['Definición de procesos de mecanizado', 'Programación de sistemas automáticos', 'Gestión de la calidad y ambiental', 'Programación de la producción', 'Fabricación asistida por ordenador (CAM)'],
    continuidad: {
      especializacion: ['Curso de especialización en Fabricación inteligente', 'Curso de especialización en Fabricación aditiva'],
      universidad: ['Ingeniería Mecánica', 'Ingeniería en Diseño Industrial', 'Ingeniería de Organización Industrial'],
    },
    duracionHoras: 2000,
  },

  /* --- Comercio y Marketing --- */
  {
    id: 'gm-actividades-comerciales',
    nombre: 'Actividades Comerciales',
    familia: 'comercio',
    grado: 'medio',
    descripcion:
      'Venta, escaparatismo, gestión de un pequeño comercio y tienda online. Muy práctico y con salida en cualquier ciudad.',
    habilidadesClave: ['Técnicas de venta', 'Escaparatismo', 'Gestión de stock', 'Comercio electrónico', 'Atención al cliente'],
    salidasLaborales: ['Vendedor/a especializado', 'Encargado/a de tienda', 'Gestor de tienda online', 'Comercio propio'],
    perfilIdeal: ['social', 'organizativo', 'creativo'],
    tagsAfinidad: ['ventas', 'atencionPublico', 'emprender', 'diseno'],
    asignaturasTipicas: ['Dinamización del punto de venta', 'Técnicas de venta', 'Gestión de compras', 'Comercio electrónico', 'Servicios de atención comercial'],
    continuidad: {
      especializacion: ['Grado Superior de Marketing y Publicidad, Gestión de Ventas o Comercio Internacional'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-marketing-publicidad',
    nombre: 'Marketing y Publicidad',
    familia: 'comercio',
    grado: 'superior',
    descripcion:
      'Investigación de mercados, campañas digitales, redes sociales y analítica. Creatividad que se mide con datos.',
    habilidadesClave: ['Marketing digital', 'Analítica web', 'Redes sociales', 'Investigación de mercados', 'Diseño de campañas'],
    salidasLaborales: ['Técnico de marketing digital', 'Community manager', 'Analista de mercados', 'Agencia de publicidad'],
    perfilIdeal: ['creativo', 'social', 'analitico'],
    tagsAfinidad: ['ventas', 'diseno', 'emprender', 'numeros'],
    asignaturasTipicas: ['Investigación comercial', 'Diseño y elaboración de material de comunicación', 'Políticas de marketing', 'Marketing digital', 'Lanzamiento de productos y servicios'],
    continuidad: {
      especializacion: ['Curso de especialización en Marketing y comunicación digital'],
      universidad: ['Marketing e Investigación de Mercados', 'Publicidad y Relaciones Públicas', 'Administración y Dirección de Empresas'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-comercio-internacional',
    nombre: 'Comercio Internacional',
    familia: 'comercio',
    grado: 'superior',
    descripcion:
      'Importación, exportación, aduanas, logística y financiación internacional. Idiomas obligatorios y salida fuera de España.',
    habilidadesClave: ['Aduanas', 'Logística internacional', 'Inglés comercial', 'Medios de pago', 'Negociación'],
    salidasLaborales: ['Técnico de comercio exterior', 'Agente de aduanas', 'Responsable de logística', 'Export manager junior'],
    perfilIdeal: ['organizativo', 'analitico', 'social'],
    tagsAfinidad: ['idiomas', 'gestion', 'numeros', 'emprender'],
    asignaturasTipicas: ['Gestión administrativa del comercio internacional', 'Logística de almacenamiento', 'Transporte internacional', 'Financiación internacional', 'Negociación internacional'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización de la gestión administrativa'],
      universidad: ['Comercio Internacional', 'Administración y Dirección de Empresas', 'Economía'],
    },
    duracionHoras: 2000,
  },

  /* --- Transporte y Mantenimiento de Vehículos --- */
  {
    id: 'fpb-mantenimiento-vehiculos',
    nombre: 'Mantenimiento de Vehículos',
    familia: 'automocion',
    grado: 'basico',
    descripcion:
      'Operaciones básicas de taller: neumáticos, frenos, cambios de aceite y desmontaje de piezas. Se aprende con el coche delante, no en una pizarra.',
    habilidadesClave: ['Mantenimiento básico', 'Desmontaje de piezas', 'Herramienta de taller', 'Prevención de riesgos'],
    salidasLaborales: ['Ayudante de mecánico', 'Operario de taller rápido', 'Auxiliar de neumáticos y frenos'],
    perfilIdeal: ['tecnico', 'fisico'],
    tagsAfinidad: ['vehiculos', 'taller', 'maquinaria'],
    asignaturasTipicas: ['Mecanizado básico y soldadura', 'Amovibles', 'Preparación de superficies', 'Mantenimiento básico de vehículos'],
    continuidad: {
      especializacion: ['Grado Medio de Electromecánica de Vehículos Automóviles'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gm-electromecanica-vehiculos',
    nombre: 'Electromecánica de Vehículos Automóviles',
    familia: 'automocion',
    grado: 'medio',
    descripcion:
      'Diagnosticas y reparas motor, transmisión, frenos y toda la electrónica del coche. Con la llegada del vehículo eléctrico faltan técnicos por todas partes.',
    habilidadesClave: ['Diagnosis electrónica', 'Motores térmicos', 'Sistemas de carga', 'Vehículo eléctrico e híbrido', 'Frenos y suspensión'],
    salidasLaborales: ['Mecánico electricista', 'Técnico de diagnosis', 'Taller de vehículo eléctrico', 'Servicio oficial de marca'],
    perfilIdeal: ['tecnico', 'analitico', 'fisico'],
    tagsAfinidad: ['vehiculos', 'maquinaria', 'electricidad', 'taller'],
    asignaturasTipicas: ['Motores', 'Sistemas de transmisión y frenado', 'Circuitos de fluidos', 'Sistemas de carga y arranque', 'Sistemas de seguridad y confort'],
    continuidad: {
      especializacion: ['Grado Superior de Automoción', 'Curso de especialización en Mantenimiento de vehículos híbridos y eléctricos'],
      universidad: [],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-automocion',
    nombre: 'Automoción',
    familia: 'automocion',
    grado: 'superior',
    descripcion:
      'Diriges un taller: diagnosis avanzada, gestión de garantías, presupuestos y equipo. El puente entre la llave inglesa y la oficina.',
    habilidadesClave: ['Diagnosis avanzada', 'Gestión de taller', 'Sistemas electrónicos', 'Presupuestos y garantías', 'Dirección de equipo'],
    salidasLaborales: ['Jefe/a de taller', 'Perito de seguros', 'Técnico de posventa', 'Responsable de servicio de marca'],
    perfilIdeal: ['tecnico', 'organizativo', 'analitico'],
    tagsAfinidad: ['vehiculos', 'maquinaria', 'gestion', 'liderazgo'],
    asignaturasTipicas: ['Sistemas eléctricos y de seguridad', 'Motores térmicos y sus sistemas auxiliares', 'Elementos amovibles y fijos', 'Gestión y logística del mantenimiento', 'Estructuras del vehículo'],
    continuidad: {
      especializacion: ['Curso de especialización en Mantenimiento de vehículos híbridos y eléctricos', 'Curso de especialización en Digitalización del mantenimiento industrial'],
      universidad: ['Ingeniería Mecánica', 'Ingeniería en Organización Industrial', 'Ingeniería Electrónica Industrial'],
    },
    duracionHoras: 2000,
  },

  /* --- Actividades Físicas y Deportivas --- */
  {
    id: 'gm-guia-medio-natural',
    nombre: 'Guía en el Medio Natural y de Tiempo Libre',
    familia: 'deportes',
    grado: 'medio',
    descripcion:
      'Conduces grupos por montaña, bici o caballo y organizas actividades de tiempo libre. Tu oficina es el campo y tu material, una mochila.',
    habilidadesClave: ['Guiado en montaña', 'Bicicleta y equitación', 'Socorrismo en el medio natural', 'Dinamización de grupos', 'Orientación'],
    salidasLaborales: ['Guía de montaña y barrancos', 'Monitor/a de tiempo libre', 'Empresa de turismo activo', 'Campamentos y albergues'],
    perfilIdeal: ['fisico', 'social', 'asistencial'],
    tagsAfinidad: ['deporte', 'aireLibre', 'atencionPublico', 'urgencias'],
    asignaturasTipicas: ['Técnicas de equitación', 'Guía de baja y media montaña', 'Guía de bicicleta', 'Atención a grupos', 'Socorrismo en el medio natural'],
    continuidad: {
      especializacion: ['Grado Superior de Enseñanza y Animación Sociodeportiva o Acondicionamiento Físico'],
      universidad: [],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta: 'Poca gente sabe que se puede vivir de guiar en montaña. Con las homologaciones y algo de idiomas, el turismo activo contrata todo el año, no solo en verano.',
    diaEnElTrabajo:
      'Sales con un grupo de doce personas a una ruta de media montaña. Miras el parte, decides cambiar el itinerario por la niebla, marcas el ritmo y vuelves con todos abajo antes de que caiga la tarde. Tu despacho ha sido un collado a mil metros.',
  },
  {
    id: 'gs-acondicionamiento-fisico',
    nombre: 'Acondicionamiento Físico',
    familia: 'deportes',
    grado: 'superior',
    descripcion:
      'Diseñas y diriges programas de entrenamiento en sala, en agua y en grupo, adaptados a cada persona. Es el ciclo del entrenador personal con base científica.',
    habilidadesClave: ['Planificación del entrenamiento', 'Valoración funcional', 'Fitness en sala y grupo', 'Actividades acuáticas', 'Primeros auxilios'],
    salidasLaborales: ['Entrenador/a personal', 'Técnico de sala de fitness', 'Preparador/a físico', 'Programas de salud en centros deportivos'],
    perfilIdeal: ['fisico', 'cientifico', 'social'],
    tagsAfinidad: ['deporte', 'cuidadoPersonas', 'atencionPublico', 'precision'],
    asignaturasTipicas: ['Valoración de la condición física', 'Fitness en sala de entrenamiento polivalente', 'Actividades básicas de acondicionamiento físico con soporte musical', 'Actividades especializadas en el medio acuático', 'Habilidades sociales'],
    continuidad: {
      especializacion: ['Curso de especialización en Actividad física y salud'],
      universidad: ['Ciencias de la Actividad Física y del Deporte', 'Fisioterapia', 'Nutrición Humana y Dietética'],
    },
    duracionHoras: 2000,
  },
  {
    id: 'gs-ensenanza-sociodeportiva',
    nombre: 'Enseñanza y Animación Sociodeportiva',
    familia: 'deportes',
    grado: 'superior',
    descripcion:
      'Enseñas deporte y organizas actividades para colegios, clubes y ayuntamientos. Mitad técnico deportivo, mitad educador.',
    habilidadesClave: ['Enseñanza deportiva', 'Dinamización de grupos', 'Organización de eventos', 'Juegos y actividades', 'Inclusión deportiva'],
    salidasLaborales: ['Animador/a sociodeportivo', 'Monitor/a de deporte escolar', 'Coordinador/a de actividades municipales', 'Clubes y federaciones'],
    perfilIdeal: ['fisico', 'social', 'organizativo'],
    tagsAfinidad: ['deporte', 'ensenanza', 'atencionPublico'],
    asignaturasTipicas: ['Juegos y actividades físico-recreativas', 'Actividades de ocio y tiempo libre', 'Enseñanza de actividades físico-deportivas individuales y de equipo', 'Metodología de la enseñanza', 'Dinamización grupal'],
    continuidad: {
      especializacion: ['Curso de especialización en Actividad física y salud'],
      universidad: ['Ciencias de la Actividad Física y del Deporte', 'Educación Primaria', 'Educación Social'],
    },
    duracionHoras: 2000,
  },

  /* --- Gemas ocultas: alta inserción, pocas matrículas --- */
  {
    id: 'gs-mantenimiento-aeromecanico',
    nombre: 'Mantenimiento Aeromecánico de Aviones con Motor de Turbina',
    familia: 'automocion',
    grado: 'superior',
    descripcion:
      'Mantienes y certificas aeronaves siguiendo normativa aeronáutica europea. Pocas plazas en toda España y las aerolíneas se pelean por los titulados.',
    habilidadesClave: ['Motores de turbina', 'Sistemas hidráulicos', 'Normativa EASA', 'Inspección estructural', 'Inglés técnico'],
    salidasLaborales: ['Técnico de mantenimiento en aerolínea', 'Talleres MRO aeronáuticos', 'Mantenimiento en aviación ejecutiva', 'Fabricantes aeronáuticos'],
    perfilIdeal: ['tecnico', 'analitico', 'cientifico'],
    tagsAfinidad: ['maquinaria', 'vehiculos', 'precision', 'taller'],
    asignaturasTipicas: ['Motores de turbina de gas', 'Sistemas de aeronaves', 'Aerodinámica y estructuras', 'Electricidad y electrónica de aeronaves', 'Legislación aeronáutica'],
    continuidad: {
      especializacion: ['Habilitaciones de tipo EASA Parte-66'],
      universidad: ['Ingeniería Aeroespacial', 'Ingeniería Mecánica'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Hay muy pocos centros que lo impartan en toda España y exige inglés técnico, así que casi nadie se entera de que existe. Las aerolíneas, mientras tanto, no dan abasto.',
    diaEnElTrabajo:
      'Entras al hangar de madrugada, cuando el avión ya ha aterrizado y tienes una ventana corta antes del primer vuelo. Revisas la lista de tareas, abres los paneles del motor, compruebas holguras y presiones, y firmas cada operación: tu firma es la que autoriza que ese avión vuelva a volar.',
  },
  {
    id: 'gs-audiologia-protesica',
    nombre: 'Audiología Protésica',
    familia: 'sanidad',
    grado: 'superior',
    descripcion:
      'Haces pruebas de audición y adaptas audífonos e implantes. Con la población envejeciendo, la demanda crece y casi nadie conoce el ciclo.',
    habilidadesClave: ['Audiometría', 'Adaptación de audífonos', 'Otoscopia', 'Atención al paciente', 'Moldes a medida'],
    salidasLaborales: ['Audioprotesista en gabinete', 'Centros auditivos', 'Casas comerciales de audioprótesis', 'Servicios de otorrinolaringología'],
    perfilIdeal: ['cientifico', 'asistencial', 'tecnico'],
    tagsAfinidad: ['laboratorio', 'cuidadoPersonas', 'precision', 'atencionPublico'],
    asignaturasTipicas: ['Audición y comunicación verbal', 'Elaboración de moldes y protectores', 'Elección y adaptación de prótesis auditivas', 'Acústica', 'Atención al hipoacúsico'],
    continuidad: {
      especializacion: ['Cursos de especialización en implantes y audiología infantil'],
      universidad: ['Logopedia', 'Óptica y Optometría', 'Enfermería'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Se confunde con óptica o con enfermería y no es ninguna de las dos. Con la población envejeciendo, la demanda sube todos los años.',
    diaEnElTrabajo:
      'Entra una señora que lleva dos años diciendo que la gente habla bajo. Le haces la audiometría en cabina, le explicas la curva en su idioma y le pruebas un audífono. Cuando lo enciendes y oye la voz de su hija con claridad, entiendes por qué este trabajo engancha.',
  },
  {
    id: 'gs-quimica-industrial',
    nombre: 'Química Industrial',
    familia: 'quimica',
    grado: 'superior',
    descripcion:
      'Controlas procesos de planta química: reactores, destilación y calidad del producto. Farmacéuticas y petroquímicas contratan casi antes de terminar.',
    habilidadesClave: ['Control de procesos', 'Instrumentación', 'Calidad y seguridad', 'Reactores y destilación', 'Normativa ambiental'],
    salidasLaborales: ['Técnico de planta química', 'Control de calidad en farmacéutica', 'Industria alimentaria', 'Tratamiento de aguas'],
    perfilIdeal: ['cientifico', 'tecnico', 'organizativo'],
    tagsAfinidad: ['laboratorio', 'maquinaria', 'precision', 'gestion'],
    asignaturasTipicas: ['Operaciones unitarias', 'Regulación y control de procesos', 'Química industrial aplicada', 'Seguridad química y ambiental', 'Mantenimiento electromecánico'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización del mantenimiento industrial'],
      universidad: ['Ingeniería Química', 'Química', 'Ciencias Ambientales'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'La química arrastra fama de difícil y de laboratorio, cuando el grueso del empleo está en planta: farmacéuticas, alimentación y tratamiento de aguas.',
    diaEnElTrabajo:
      'Empiezas revisando los parámetros del reactor en la sala de control: temperatura, presión, caudal. Algo se ha desviado durante la noche, así que bajas a planta con el casco, tomas una muestra y la llevas al laboratorio. Corriges la dosificación y el lote se salva.',
  },
  {
    id: 'gs-mecatronica-industrial',
    nombre: 'Mecatrónica Industrial',
    familia: 'instalacion',
    grado: 'superior',
    descripcion:
      'Mantienes líneas de producción completas: mecánica, electricidad, neumática y automatismos a la vez. Es el perfil que más escasea en la industria española.',
    habilidadesClave: ['Mantenimiento predictivo', 'Automatismos', 'Neumática e hidráulica', 'Electricidad industrial', 'Diagnóstico de averías'],
    salidasLaborales: ['Técnico de mantenimiento industrial', 'Jefe/a de equipo de mantenimiento', 'Puesta en marcha de líneas', 'Servicio técnico de maquinaria'],
    perfilIdeal: ['tecnico', 'analitico', 'fisico'],
    tagsAfinidad: ['maquinaria', 'electricidad', 'taller', 'precision'],
    asignaturasTipicas: ['Sistemas mecánicos', 'Sistemas hidráulicos y neumáticos', 'Sistemas eléctricos y electrónicos', 'Configuración de sistemas mecatrónicos', 'Procesos de fabricación'],
    continuidad: {
      especializacion: ['Curso de especialización en Fabricación inteligente', 'Curso de especialización en Digitalización del mantenimiento industrial'],
      universidad: ['Ingeniería Mecatrónica', 'Ingeniería Electrónica Industrial y Automática', 'Ingeniería Mecánica'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Su nombre no dice nada a un chaval de dieciocho años. Detrás está el perfil que más escasea en la industria: quien entiende mecánica, electricidad y automatismos a la vez.',
    diaEnElTrabajo:
      'La línea 3 se ha parado y cada minuto cuesta dinero. Miras el autómata, descartas el sensor, sigues el circuito neumático y encuentras una electroválvula agarrotada. Veinte minutos después la línea vuelve a girar y el jefe de planta te da las gracias por el nombre de pila.',
  },
  {
    id: 'gs-patronaje-moda',
    nombre: 'Patronaje y Moda',
    familia: 'textil',
    grado: 'superior',
    descripcion:
      'Conviertes un diseño en patrones industriales que se pueden coser y escalar por tallas. Detrás de cada prenda que compras hay alguien con este título.',
    habilidadesClave: ['Patronaje industrial', 'Escalado de tallas', 'CAD textil', 'Confección de prototipos', 'Análisis de tejidos'],
    salidasLaborales: ['Patronista', 'Técnico de producto en marca de moda', 'Taller de confección', 'Escalado y prototipado'],
    perfilIdeal: ['creativo', 'tecnico', 'organizativo'],
    tagsAfinidad: ['diseno', 'taller', 'precision'],
    asignaturasTipicas: ['Patronaje industrial', 'Escalado y marcada', 'Industrialización de patrones', 'Materias textiles', 'Diseño técnico asistido'],
    continuidad: {
      especializacion: ['Cursos de especialización en moda sostenible y prototipado digital'],
      universidad: ['Diseño de Moda', 'Bellas Artes', 'Ingeniería de Diseño Industrial'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Todo el mundo quiere diseñar y nadie quiere patronar, pero sin patronista no hay prenda. Las marcas se pelean por los pocos que salen.',
    diaEnElTrabajo:
      'Te llega el boceto de una chaqueta y una tela que cae de forma rara. Levantas el patrón en CAD, cortas un prototipo en crudo y lo pruebas en maniquí. Sobra tela en la sisa, corriges dos centímetros, y esa corrección se repetirá en las miles de unidades que salgan de fábrica.',
  },

  /* --- Gemas de rama: títulos reales con poca matrícula y mucha demanda --- */
  {
    id: 'gs-mantenimiento-electronico',
    nombre: 'Mantenimiento Electrónico',
    familia: 'electricidad',
    grado: 'superior',
    descripcion:
      'Diagnosticas y reparas equipos electrónicos industriales, médicos y de telecomunicaciones a nivel de componente. Casi nadie lo pide y casi nadie sabe hacerlo.',
    habilidadesClave: ['Diagnóstico a nivel de componente', 'Instrumentación de medida', 'Electrónica digital', 'Equipos industriales', 'Telecomunicaciones'],
    salidasLaborales: ['Técnico de mantenimiento electrónico', 'Servicio técnico de electromedicina', 'Reparación de equipos industriales', 'Instalaciones de telecomunicación'],
    perfilIdeal: ['tecnico', 'analitico', 'cientifico'],
    tagsAfinidad: ['electricidad', 'hardware', 'precision', 'maquinaria'],
    asignaturasTipicas: ['Sistemas electrónicos analógicos', 'Equipos de radiofrecuencia', 'Mantenimiento de equipos de electrónica industrial', 'Técnicas y procesos de montaje', 'Instrumentación de medida'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización del mantenimiento industrial'],
      universidad: ['Ingeniería Electrónica Industrial y Automática', 'Ingeniería de Sistemas de Telecomunicación'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Suena a reparar televisores y hoy es electromedicina, industria y telecomunicaciones. Reparar a nivel de componente es un oficio casi extinguido y muy bien pagado.',
    diaEnElTrabajo:
      'Llega una placa de un equipo de electromedicina que el fabricante da por perdida. La pones en el banco, sigues la señal con el osciloscopio y encuentras un condensador seco que cuesta treinta céntimos. Sueldas, pruebas y devuelves a la vida una máquina de miles de euros.',
  },
  {
    id: 'gs-iluminacion-captacion',
    nombre: 'Iluminación, Captación y Tratamiento de Imagen',
    familia: 'imagen',
    grado: 'superior',
    descripcion:
      'Eres quien decide cómo se ve un plano: la luz, la cámara y el color. Todo el mundo quiere dirigir; casi nadie se forma en lo que de verdad hace que una imagen funcione.',
    habilidadesClave: ['Iluminación de set', 'Operación de cámara', 'Etalonaje y color', 'Óptica', 'Postproducción de imagen'],
    salidasLaborales: ['Ayudante de cámara', 'Técnico de iluminación', 'Etalonador/a', 'Operador/a de cámara en televisión'],
    perfilIdeal: ['creativo', 'tecnico', 'analitico'],
    tagsAfinidad: ['audiovisual', 'diseno', 'precision', 'taller'],
    asignaturasTipicas: ['Iluminación de espacios escénicos', 'Captación de imagen audiovisual', 'Tratamiento y ajuste de imagen', 'Luminotecnia', 'Proyectos de fotografía'],
    continuidad: {
      especializacion: ['Curso de especialización en Iluminación para audiovisuales'],
      universidad: ['Comunicación Audiovisual', 'Bellas Artes', 'Cine y Medios Audiovisuales'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Quien entra en audiovisual quiere dirigir o editar. La luz y la cámara, que es lo que de verdad se contrata en cada rodaje, se quedan sin gente.',
    diaEnElTrabajo:
      'El director quiere que la escena parezca amanecer, pero son las cuatro de la tarde y llueve. Montas dos paneles, filtras la luz a temperatura de mañana, mides con el fotómetro y ajustas el diafragma. En el monitor, de pronto, es de día.',
  },
  {
    id: 'gm-panaderia-reposteria',
    nombre: 'Panadería, Repostería y Confitería',
    familia: 'hosteleria',
    grado: 'medio',
    descripcion:
      'Masas madre, bollería, tartas y chocolate a nivel profesional. Los obradores llevan años buscando gente formada y las aulas están medio vacías.',
    habilidadesClave: ['Masas y fermentación', 'Repostería', 'Chocolatería', 'Seguridad alimentaria', 'Escandallos'],
    salidasLaborales: ['Panadero/a artesano', 'Pastelero/a en obrador', 'Repostería de hotel', 'Obrador propio'],
    perfilIdeal: ['tecnico', 'creativo', 'fisico'],
    tagsAfinidad: ['cocina', 'taller', 'precision', 'emprender'],
    asignaturasTipicas: ['Elaboraciones de panadería y bollería', 'Procesos básicos de pastelería y repostería', 'Postres en restauración', 'Materias primas y procesos', 'Seguridad e higiene alimentaria'],
    continuidad: {
      especializacion: ['Curso de especialización en Panadería y bollería artesanales', 'Curso de especialización en Pastelería', 'Grado Superior de Dirección de Cocina'],
      universidad: [],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Tiene fama de madrugón y de oficio antiguo. Es de los pocos ciclos donde puedes montar tu propio negocio a los pocos años de terminar.',
    diaEnElTrabajo:
      'Entras a las cinco de la mañana, cuando la ciudad duerme y el obrador ya huele. Sacas la masa que fermentó toda la noche, la formas a mano y la metes al horno. A las siete, cuando abre la tienda, el pan que la gente se lleva lo has hecho tú entero.',
  },
  {
    id: 'gs-mediacion-comunicativa',
    nombre: 'Mediación Comunicativa',
    familia: 'sociocultural',
    grado: 'superior',
    descripcion:
      'Haces posible la comunicación de personas sordas, sordociegas o con dificultades del habla. Se estudia lengua de signos y sobra trabajo en cuanto sales.',
    habilidadesClave: ['Lengua de signos española', 'Sistemas alternativos de comunicación', 'Guía-interpretación', 'Intervención con familias', 'Accesibilidad'],
    salidasLaborales: ['Mediador/a comunicativo', 'Guía-intérprete de personas sordociegas', 'Apoyo en centros educativos', 'Asociaciones y servicios de accesibilidad'],
    perfilIdeal: ['asistencial', 'social', 'organizativo'],
    tagsAfinidad: ['cuidadoPersonas', 'ensenanza', 'atencionPublico', 'idiomas'],
    asignaturasTipicas: ['Lengua de signos española', 'Intervención con personas sordociegas', 'Sistemas aumentativos y alternativos de comunicación', 'Contexto de la mediación comunicativa', 'Habilidades sociales'],
    continuidad: {
      especializacion: ['Curso de especialización en Mediación comunitaria'],
      universidad: ['Logopedia', 'Trabajo Social', 'Educación Social'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Casi nadie sabe que existe una FP donde se aprende lengua de signos. Los servicios de accesibilidad llevan años sin cubrir plazas.',
    diaEnElTrabajo:
      'Acompañas a una persona sorda a una consulta médica. No traduces palabra por palabra: te aseguras de que entiende el diagnóstico y de que el médico entiende sus dudas. Sales de allí sabiendo que sin ti esa conversación no habría existido.',
  },
  {
    id: 'gm-soldadura-caldereria',
    nombre: 'Soldadura y Calderería',
    familia: 'mecanica',
    grado: 'medio',
    descripcion:
      'Sueldas y construyes estructuras, depósitos y tuberías industriales. Un buen soldador con homologaciones no está parado ni una semana, y hay muy pocos.',
    habilidadesClave: ['Soldadura TIG y MIG', 'Trazado y conformado', 'Lectura de planos', 'Homologaciones', 'Estructuras metálicas'],
    salidasLaborales: ['Soldador/a homologado', 'Calderero/a industrial', 'Montaje de estructuras', 'Mantenimiento en planta e industria naval'],
    perfilIdeal: ['tecnico', 'fisico'],
    tagsAfinidad: ['taller', 'maquinaria', 'construccion', 'precision'],
    asignaturasTipicas: ['Soldadura en atmósfera natural y protegida', 'Trazado, corte y conformado', 'Mecanizado', 'Interpretación gráfica', 'Metrología y ensayos'],
    continuidad: {
      especializacion: ['Grado Superior de Construcciones Metálicas', 'Homologaciones de soldadura por procedimiento'],
      universidad: [],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'Arrastra el estigma de trabajo sucio, y es de los oficios mejor pagados sin estudios universitarios. Un soldador homologado elige dónde trabaja.',
    diaEnElTrabajo:
      'Tienes delante un depósito que debe aguantar presión durante veinte años. Preparas el bisel, calientas, y haces un cordón que después pasará por rayos X. Cuando el informe dice que no hay ni un poro, sabes exactamente cuánto vale ese oficio.',
  },
  {
    id: 'gs-transporte-logistica',
    nombre: 'Transporte y Logística',
    familia: 'comercio',
    grado: 'superior',
    descripcion:
      'Organizas cómo se mueven las mercancías: rutas, almacenes, aduanas y costes. Todo el comercio del mundo depende de esto y casi nadie lo elige.',
    habilidadesClave: ['Gestión de almacén', 'Planificación de rutas', 'Comercio internacional', 'Costes logísticos', 'Software de gestión'],
    salidasLaborales: ['Jefe/a de tráfico', 'Responsable de almacén', 'Técnico de operaciones logísticas', 'Agente de transporte'],
    perfilIdeal: ['organizativo', 'analitico', 'social'],
    tagsAfinidad: ['gestion', 'numeros', 'liderazgo', 'idiomas'],
    asignaturasTipicas: ['Gestión administrativa del transporte', 'Organización del almacén', 'Logística de aprovisionamiento', 'Transporte internacional de mercancías', 'Comercialización del transporte'],
    continuidad: {
      especializacion: ['Curso de especialización en Digitalización de la gestión administrativa'],
      universidad: ['Administración y Dirección de Empresas', 'Comercio Internacional', 'Ingeniería de Organización Industrial'],
    },
    duracionHoras: 2000,
    gemaOculta: true,
    porQueOculta:
      'No se enseña en el instituto y suena a camiones. Es el sistema nervioso de todo el comercio, y con muy poca competencia para entrar.',
    diaEnElTrabajo:
      'Un camión se avería en Francia con carga perecedera dentro. En veinte minutos localizas otro transportista, rehaces la ruta, avisas al cliente y salvas el pedido. Nadie se entera de que hubo un problema: eso es exactamente tu trabajo bien hecho.',
  },
];

/** Ciclos agrupados por familia, calculado una sola vez al importar. */
export const CICLOS_POR_FAMILIA: Record<FamiliaId, Ciclo[]> = FAMILIAS.reduce(
  (acc, familia) => {
    acc[familia.id] = CICLOS.filter((ciclo) => ciclo.familia === familia.id);
    return acc;
  },
  {} as Record<FamiliaId, Ciclo[]>,
);
