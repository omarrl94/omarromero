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
    perfil: { analitico: 5, creativo: 3, asistencial: 0, tecnico: 4, organizativo: 3, social: 1, cientifico: 2 },
    colorClass: 'bg-familia-informatica',
    icono: 'Code2',
  },
  {
    id: 'sanidad',
    nombre: 'Sanidad',
    claim: 'Cuidar con criterio técnico',
    descripcion:
      'Cuidados al paciente, laboratorio, imagen diagnóstica y emergencias. Combina el trato humano con protocolos exigentes y mucha precisión.',
    perfil: { analitico: 3, creativo: 0, asistencial: 5, tecnico: 3, organizativo: 2, social: 3, cientifico: 5 },
    colorClass: 'bg-familia-sanidad',
    icono: 'HeartPulse',
  },
  {
    id: 'administracion',
    nombre: 'Administración y Gestión',
    claim: 'Que todo cuadre y funcione',
    descripcion:
      'Contabilidad, fiscalidad, recursos humanos y gestión de empresa. Para quien tiene cabeza ordenada y le gusta que los números y los plazos encajen.',
    perfil: { analitico: 3, creativo: 1, asistencial: 1, tecnico: 1, organizativo: 5, social: 3, cientifico: 1 },
    colorClass: 'bg-familia-administracion',
    icono: 'Calculator',
  },
  {
    id: 'electricidad',
    nombre: 'Electricidad y Electrónica',
    claim: 'Hacer que la energía llegue donde tiene que llegar',
    descripcion:
      'Instalaciones eléctricas, automatización, robótica y domótica. Mucho trabajo con las manos y con el esquema delante; sector con paro casi cero.',
    perfil: { analitico: 4, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 1, cientifico: 3 },
    colorClass: 'bg-familia-electricidad',
    icono: 'Zap',
  },
  {
    id: 'imagen',
    nombre: 'Imagen y Sonido',
    claim: 'Contar historias con cámara y mesa de mezclas',
    descripcion:
      'Audiovisual, animación 3D, videojuegos, sonido directo y postproducción. Creatividad con una capa técnica muy real detrás.',
    perfil: { analitico: 2, creativo: 5, asistencial: 1, tecnico: 4, organizativo: 2, social: 3, cientifico: 1 },
    colorClass: 'bg-familia-imagen',
    icono: 'Clapperboard',
  },
  {
    id: 'hosteleria',
    nombre: 'Hostelería y Turismo',
    claim: 'Un oficio que se nota en cuanto entras por la puerta',
    descripcion:
      'Cocina, pastelería, sala y turismo. Ritmo alto, equipo, servicio y una salida internacional que pocas familias tienen.',
    perfil: { analitico: 1, creativo: 4, asistencial: 2, tecnico: 4, organizativo: 3, social: 5, cientifico: 1 },
    colorClass: 'bg-familia-hosteleria',
    icono: 'ChefHat',
  },
  {
    id: 'sociocultural',
    nombre: 'Servicios Socioculturales y a la Comunidad',
    claim: 'Estar cuando de verdad hace falta',
    descripcion:
      'Educación infantil, dependencia, integración social y mediación. La familia de quien escucha bien y sabe acompañar a personas en momentos difíciles.',
    perfil: { analitico: 1, creativo: 3, asistencial: 5, tecnico: 0, organizativo: 3, social: 5, cientifico: 1 },
    colorClass: 'bg-familia-sociocultural',
    icono: 'Users',
  },
  {
    id: 'mecanica',
    nombre: 'Fabricación Mecánica',
    claim: 'De un plano a una pieza que existe',
    descripcion:
      'Mecanizado, soldadura, CNC y diseño de producto. Industria pura, con máquinas caras y con empresas buscando gente cualificada.',
    perfil: { analitico: 3, creativo: 1, asistencial: 0, tecnico: 5, organizativo: 2, social: 1, cientifico: 2 },
    colorClass: 'bg-familia-mecanica',
    icono: 'Cog',
  },
  {
    id: 'comercio',
    nombre: 'Comercio y Marketing',
    claim: 'Conectar un producto con quien lo necesita',
    descripcion:
      'Marketing digital, ventas, logística y comercio internacional. Para perfiles con don de gentes que además saben leer datos.',
    perfil: { analitico: 2, creativo: 3, asistencial: 1, tecnico: 1, organizativo: 4, social: 5, cientifico: 1 },
    colorClass: 'bg-familia-comercio',
    icono: 'ShoppingBag',
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
    duracionHoras: 2000,
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
    duracionHoras: 2000,
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
    duracionHoras: 2000,
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
