/**
 * Configuración editable de Conecta FFE.
 *
 * ÚNICO archivo que hay que tocar para cambiar fechas, horas, tutores, perfiles, zonas,
 * límites y enlaces a portales de empleo. Se importa desde el cliente y desde las funciones,
 * así que aquí NO puede haber secretos ni correos de empresas.
 */

export type Ciclo = 'DAM' | 'ASIR' | 'ACOM';
export type ModalidadId = 'A' | 'B';

export interface Modalidad {
  id: ModalidadId;
  nombre: string;
  /** Fechas ISO (AAAA-MM-DD). */
  inicio: string;
  fin: string;
  horasDia: number;
}

export interface InfoCiclo {
  id: Ciclo;
  /** Nombre corto para chips, filtros, asuntos y firmas. */
  corto: string;
  /** Nombre completo del título. */
  nombre: string;
  grado: 'medio' | 'superior';
  familia: string;
  /** Texto para «estoy cursando 2.º de …» en los correos. */
  enCorreo: string;
  /** Clase de color de la marca (Tailwind) para el selector. */
  color: string;
}

export interface Tutor {
  nombre: string;
  email: string;
}

export interface Perfil {
  id: string;
  ciclo: Ciclo;
  nombre: string;
  descripcion: string;
  /** Palabras para detectar el perfil en ofertas y empresas (minúsculas, sin tildes). */
  palabrasClave: string[];
  /** Términos de búsqueda para APIs y enlaces profundos. */
  busqueda: string;
}

export interface Zona {
  id: string;
  nombre: string;
  /** Municipios o distritos incluidos (para mostrar y para filtrar ofertas por ubicación). */
  incluye: string[];
}

export interface EnlaceProfundo {
  id: string;
  nombre: string;
  /**
   * Plantilla con {q} (términos) y {lugar} (ubicación), ambos ya codificados para URL.
   * Solo se muestran en producción los que tengan `probado: true` (ver docs/INVESTIGACION-FUENTES.md).
   */
  plantilla: string;
  probado: boolean;
  /** Fecha ISO de la última comprobación manual o con `npm run comprobar:enlaces`. */
  fechaPrueba: string | null;
  nota?: string;
  /** Solo para estos ciclos (p. ej. portales solo de informática). Sin indicar: todos. */
  ciclos?: Ciclo[];
}

export const config = {
  centro: {
    nombre: 'C.F.P. José Ramón Otero',
    ciudad: 'Madrid',
    web: 'https://www.jrotero.es',
    /** Contacto para retiradas y avisos de privacidad. */
    contactoPrivacidad: 'omar.romero@jrotero.es',
  },

  curso: '2026-2027',

  /** Ciclos del centro que usan la aplicación. El orden es el de los selectores. */
  ciclos: [
    { id: 'DAM', corto: 'DAM', nombre: 'Desarrollo de Aplicaciones Multiplataforma', grado: 'superior', familia: 'Informática y Comunicaciones', enCorreo: 'Desarrollo de Aplicaciones Multiplataforma (DAM)', color: 'bg-salvia' },
    { id: 'ASIR', corto: 'ASIR', nombre: 'Administración de Sistemas Informáticos en Red', grado: 'superior', familia: 'Informática y Comunicaciones', enCorreo: 'Administración de Sistemas Informáticos en Red (ASIR)', color: 'bg-terracota' },
    { id: 'ACOM', corto: 'Actividades Comerciales', nombre: 'Técnico en Actividades Comerciales', grado: 'medio', familia: 'Comercio y Marketing', enCorreo: 'Actividades Comerciales (ciclo de grado medio de Comercio y Marketing)', color: 'bg-amarillo' },
  ] satisfies InfoCiclo[],

  modalidades: [
    { id: 'A', nombre: 'Modalidad A', inicio: '2027-03-01', fin: '2027-05-21', horasDia: 8 },
    { id: 'B', nombre: 'Modalidad B', inicio: '2027-02-18', fin: '2027-05-21', horasDia: 7 },
  ] satisfies Modalidad[],

  /** Horas totales de FFE por ciclo. */
  horas: {
    DAM: 320,
    ASIR: 420,
    /**
     * En la Comunidad de Madrid la FFE de Actividades Comerciales suma 500 h entre 1.º y 2.º
     * (Decreto 102/2024). Pon aquí las horas del periodo en el que se usa la aplicación.
     */
    ACOM: 500,
  } satisfies Record<Ciclo, number>,
  /** Marca para mostrar «pendiente de confirmar» junto a las horas. */
  horasPendientesDeConfirmar: { DAM: false, ASIR: true, ACOM: true } satisfies Record<Ciclo, boolean>,

  /** Tutor de FFE de cada ciclo. `null` = pendiente: el correo se genera sin copia y se avisa. */
  tutores: {
    DAM: { nombre: 'Omar Romero', email: 'omar.romero@jrotero.es' },
    ASIR: null,
    ACOM: null,
  } satisfies Record<Ciclo, Tutor | null>,

  /** Máximo orientativo de contactos (correos) a la misma empresa desde el mismo dispositivo. */
  maxContactosPorEmpresa: 3,

  /**
   * Textos del correo de los tutores a las empresas (editables). Cada ciclo lleva SOLO su bloque:
   * DAM con lo que hacen en DAM y ASIR con lo que hacen en ASIR.
   */
  textosCorreoTutor: {
    ciclos: {
      DAM: {
        titulo: 'DESARROLLO DE APLICACIONES MULTIPLATAFORMA (DAM)',
        intro:
          'Nuestros alumnos llegarán a las prácticas con un perfil multiplataforma completo: programan en Java, Kotlin, C#, Python y JavaScript, y cursan además una asignatura específica de IA y otra anual de Python. Están preparados para colaborar en tareas como:',
        tareas: [
          'Desarrollo de aplicaciones de escritorio con interfaces en Swing y JavaFX.',
          'Desarrollo de interfaces y aplicaciones web con HTML, CSS y React.',
          'Creación de aplicaciones Android con Kotlin y Jetpack Compose, incluyendo persistencia de datos, Firebase, APIs REST, sensores, multimedia y publicación en Google Play.',
          'Desarrollo de videojuegos y aplicaciones interactivas con Unity y C#.',
          'Programación concurrente, servicios y comunicaciones en red con Java.',
          'Diseño y gestión de bases de datos SQL y NoSQL, y acceso a datos desde aplicaciones.',
          'Adaptación de sistemas de gestión empresarial (ERP).',
          'Automatización de tareas, análisis de datos y proyectos de IA y big data con Python.',
          'Pruebas, depuración, mantenimiento y documentación técnica de aplicaciones.',
        ],
        ia: 'En DAM la utilizan para programar más rápido, analizar y revisar código, detectar errores y vulnerabilidades y agilizar las pruebas y la documentación.',
      },
      ASIR: {
        titulo: 'ADMINISTRACIÓN DE SISTEMAS INFORMÁTICOS EN RED (ASIR)',
        intro:
          'Nuestros alumnos de ASIR llegarán a las prácticas preparados para proteger, administrar y mantener en marcha la infraestructura tecnológica de una empresa, con los certificados CCNA, AWS Foundation y Cisco CyberOps y una sólida formación en ciberseguridad. Podrán colaborar en objetivos como:',
        tareas: [
          'Vigilar la seguridad de la empresa: monitorizar los sistemas y analizar registros para detectar amenazas e incidentes a tiempo.',
          'Blindar los sistemas frente a ataques: localizar vulnerabilidades, aplicar medidas de bastionado y controlar los accesos.',
          'Proteger la red corporativa con cortafuegos, VPN y proxies.',
          'Garantizar la continuidad del negocio con copias de seguridad, recuperación de datos y alta disponibilidad.',
          'Administrar infraestructuras Windows y Linux y sus servicios de red (DHCP, DNS, HTTP…).',
          'Desplegar y gestionar servicios en la nube con AWS.',
          'Configurar, mantener y diagnosticar redes corporativas (routers, switches y puntos de acceso).',
          'Mantener a punto los equipos y el software de la empresa.',
        ],
        ia: 'En ASIR se apoyan en ella para analizar registros, investigar incidentes de seguridad, diagnosticar problemas y reforzar la protección de los sistemas.',
      },
      // Basado en los resultados de aprendizaje del Real Decreto 1688/2011 y el plan de Madrid (docs/CICLO-ACTIVIDADES-COMERCIALES.md).
      ACOM: {
        titulo: 'ACTIVIDADES COMERCIALES (GRADO MEDIO)',
        intro:
          'Nuestro alumnado de Actividades Comerciales llegará a las prácticas preparado para vender, atender al cliente y dinamizar un comercio, tanto en tienda física como en el canal online. Su formación abarca todo el ciclo comercial, desde la compra, el almacén y la venta hasta el marketing y el comercio electrónico, e incluye inglés profesional y digitalización aplicada. Podrá colaborar en tareas como:',
        tareas: [
          'Venta y asesoramiento al cliente en tienda, aplicando técnicas de venta, negociación y cierre, y gestionando el cobro con el terminal punto de venta (TPV).',
          'Venta técnica y telemarketing: ofertas comerciales de productos tecnológicos, servicios, alta gama e inmuebles, y captación y fidelización de clientes por teléfono.',
          'Dinamización del punto de venta: implantación y reposición del producto, escaparatismo, cartelería, señalética y acciones promocionales, midiendo sus resultados.',
          'Comercio electrónico: mantenimiento de la web, la tienda online y el catálogo, y gestión de las ventas y pedidos online.',
          'Marketing digital y redes sociales: ejecución del plan de marketing digital, publicación de contenidos, dinamización de comunidades y posicionamiento web.',
          'Marketing e investigación comercial: análisis del mercado, de la competencia y de los clientes, y apoyo en las políticas de producto, precio, distribución y comunicación.',
          'Atención al cliente y posventa: información, seguimiento de pedidos, gestión de quejas y reclamaciones y mantenimiento de la base de datos de clientes.',
          'Almacén y logística: recepción, ubicación, preparación y expedición de pedidos, control de stocks e inventarios con programas de gestión de almacén.',
          'Compras y aprovisionamiento: previsión de la demanda, pedidos a proveedores, control de albaranes y facturas y análisis de la rentabilidad del surtido.',
          'Gestión administrativa del comercio: documentación comercial, facturación electrónica, hojas de cálculo y bases de datos, y materiales publicitarios con diseño gráfico.',
          'Atención a clientes en inglés, de palabra y por escrito.',
        ],
        ia: 'En Actividades Comerciales la utilizan para crear descripciones de producto y contenidos para redes sociales, analizar datos de ventas y de clientes, preparar campañas y promociones y agilizar la atención al cliente.',
        iaCierre:
          'Lo hacen con criterio profesional, revisando y validando siempre lo que genera la IA. Llegarán a la empresa preparados para trabajar como lo hacen ya los equipos comerciales y de marketing más innovadores.',
      },
    },
    iaTitulo: 'INTELIGENCIA ARTIFICIAL EN TODO SU TRABAJO',
    iaIntro:
      'La gran apuesta innovadora de nuestros ciclos es la inteligencia artificial, que nuestros alumnos aplican como herramienta de análisis para potenciar al máximo su trabajo.',
    iaCierre:
      'Lo hacen con criterio profesional, revisando y validando siempre lo que genera la IA. Llegarán a la empresa preparados para trabajar como lo hacen ya los equipos técnicos más innovadores.',
    llamada:
      'Si te parece interesante, podemos hablar diez minutos por teléfono para contarte cómo funciona y ver qué perfil os encajaría mejor. Si la persona indicada es otra, te agradecería que me indicaras con quién debo hablar.',
  },

  /**
   * Textos del correo de cada alumno/a (editables). Van en primera persona y cada alumno recibe
   * SOLO el bloque de su ciclo. Las tareas de cada ciclo se comparten con el correo del tutor.
   */
  textosCorreoAlumno: {
    ciclos: {
      DAM: {
        intro:
          'Llegaré a las prácticas con un perfil multiplataforma completo: programo en Java, Kotlin, C#, Python y JavaScript, y curso además una asignatura específica de IA y otra anual de Python. Estoy preparado/a para colaborar en tareas como:',
        ia: 'La utilizo para programar más rápido, analizar y revisar código, detectar errores y vulnerabilidades y agilizar las pruebas y la documentación.',
      },
      ASIR: {
        intro:
          'Llegaré a las prácticas preparado/a para proteger, administrar y mantener en marcha la infraestructura tecnológica de una empresa, con los certificados CCNA, AWS Foundation y Cisco CyberOps y una sólida formación en ciberseguridad. Podré colaborar en objetivos como:',
        ia: 'Me apoyo en ella para analizar registros, investigar incidentes de seguridad, diagnosticar problemas y reforzar la protección de los sistemas.',
      },
      ACOM: {
        intro:
          'Llegaré a las prácticas preparado/a para vender, atender al cliente y dinamizar un comercio, tanto en tienda física como en el canal online. Mi formación abarca todo el ciclo comercial, desde la compra, el almacén y la venta hasta el marketing y el comercio electrónico, e incluye inglés profesional y digitalización aplicada. Puedo colaborar en tareas como:',
        ia: 'La utilizo para crear descripciones de producto y contenidos para redes sociales, analizar datos de ventas y de clientes, preparar campañas y promociones y agilizar la atención al cliente.',
        iaCierre:
          'Lo hago con criterio profesional, revisando y validando siempre lo que genera la IA, para llegar a la empresa preparado/a para trabajar como lo hacen ya los equipos comerciales y de marketing más innovadores.',
      },
    },
    iaTitulo: 'INTELIGENCIA ARTIFICIAL EN TODO MI TRABAJO',
    iaIntro: 'La gran apuesta innovadora de mi ciclo es la inteligencia artificial, que aplico como herramienta de análisis para potenciar al máximo mi trabajo.',
    iaCierre:
      'Lo hago con criterio profesional, revisando y validando siempre lo que genera la IA, para llegar a la empresa preparado/a para trabajar como lo hacen ya los equipos técnicos más innovadores.',
    llamada:
      'Si te parece interesante, podemos hablar diez minutos por teléfono para contarte qué sé hacer y ver en qué podría ayudaros. Si la persona indicada es otra, te agradecería que me indicaras con quién debo hablar.',
  },

  /** Sección de tutores: envío desde la cuenta del tutor, siempre en CCO y por lotes. */
  tutores_envio: {
    /** Máximo de empresas por correo (en CCO). Evita filtros antispam y límites de Outlook/Gmail. */
    maxDestinatariosPorLote: 40,
    /** Días mínimos antes de volver a escribir a la misma empresa desde la sección de tutores. */
    diasEntreEnvios: 30,
  },

  /** Días tras los cuales una oferta sin fecha de caducidad se considera caducada. */
  diasMaximosOferta: 45,

  perfiles: [
    // DAM
    { id: 'dam-web', ciclo: 'DAM', nombre: 'Desarrollo web', descripcion: 'Frontend y full-stack: HTML, CSS, JavaScript, TypeScript, React, Angular.', palabrasClave: ['web', 'frontend', 'front-end', 'full stack', 'fullstack', 'javascript', 'typescript', 'react', 'angular', 'vue', 'html', 'css', 'php', 'laravel', 'wordpress'], busqueda: 'desarrollador web junior' },
    { id: 'dam-escritorio', ciclo: 'DAM', nombre: 'Aplicaciones de escritorio', descripcion: 'Java, C#/.NET, interfaces de escritorio.', palabrasClave: ['escritorio', 'desktop', 'c#', '.net', 'dotnet', 'java', 'wpf', 'javafx', 'winforms'], busqueda: 'desarrollador .NET Java junior' },
    { id: 'dam-android', ciclo: 'DAM', nombre: 'Móvil Android', descripcion: 'Kotlin, Java, Flutter y apps móviles.', palabrasClave: ['android', 'kotlin', 'movil', 'mobile', 'flutter', 'react native', 'ios', 'app'], busqueda: 'desarrollador android junior' },
    { id: 'dam-videojuegos', ciclo: 'DAM', nombre: 'Videojuegos y Unity', descripcion: 'Unity, C#, Unreal, gamificación y realidad extendida.', palabrasClave: ['videojuego', 'videojuegos', 'unity', 'unreal', 'game', 'gaming', 'gameplay', 'realidad virtual', 'xr'], busqueda: 'programador unity junior' },
    { id: 'dam-backend', ciclo: 'DAM', nombre: 'Backend y APIs', descripcion: 'Java/Spring, Node.js, Python, APIs REST y microservicios.', palabrasClave: ['backend', 'back-end', 'api', 'rest', 'spring', 'node', 'nodejs', 'microservicios', 'java', 'python', 'django', 'go'], busqueda: 'desarrollador backend junior' },
    { id: 'dam-bbdd', ciclo: 'DAM', nombre: 'Bases de datos', descripcion: 'SQL, modelado, PL/SQL, MongoDB.', palabrasClave: ['sql', 'base de datos', 'bases de datos', 'database', 'oracle', 'postgresql', 'mysql', 'mongodb', 'pl/sql', 'dba'], busqueda: 'SQL bases de datos junior' },
    { id: 'dam-erp', ciclo: 'DAM', nombre: 'ERP', descripcion: 'SAP, Odoo, Microsoft Dynamics y consultoría técnica.', palabrasClave: ['erp', 'sap', 'abap', 'odoo', 'dynamics', 'navision', 'business central', 'crm', 'salesforce'], busqueda: 'consultor ERP SAP Odoo junior' },
    { id: 'dam-datos-ia', ciclo: 'DAM', nombre: 'Datos e IA con Python', descripcion: 'Python, análisis de datos, machine learning, IA generativa.', palabrasClave: ['python', 'datos', 'data', 'machine learning', 'inteligencia artificial', 'ia', 'ai', 'pandas', 'analytics', 'llm', 'big data'], busqueda: 'python datos inteligencia artificial junior' },
    // ASIR
    { id: 'asir-ciberseguridad', ciclo: 'ASIR', nombre: 'Ciberseguridad y SOC', descripcion: 'SOC, SIEM, análisis de incidentes, pentesting básico.', palabrasClave: ['ciberseguridad', 'seguridad', 'security', 'soc', 'siem', 'pentest', 'pentesting', 'blue team', 'ciberinteligencia', 'incidentes'], busqueda: 'ciberseguridad SOC junior' },
    { id: 'asir-sistemas', ciclo: 'ASIR', nombre: 'Sistemas', descripcion: 'Windows Server, Linux, virtualización, Active Directory.', palabrasClave: ['sistemas', 'linux', 'windows server', 'active directory', 'virtualizacion', 'vmware', 'administrador de sistemas', 'sysadmin', 'microinformatica'], busqueda: 'técnico de sistemas junior' },
    { id: 'asir-redes', ciclo: 'ASIR', nombre: 'Redes', descripcion: 'Cisco, conmutación, routing, comunicaciones.', palabrasClave: ['redes', 'network', 'networking', 'cisco', 'ccna', 'comunicaciones', 'routing', 'switching', 'telecomunicaciones', 'noc'], busqueda: 'técnico de redes junior' },
    { id: 'asir-cloud', ciclo: 'ASIR', nombre: 'Cloud y AWS', descripcion: 'AWS, Azure, DevOps, contenedores e infraestructura como código.', palabrasClave: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'terraform', 'nube'], busqueda: 'cloud AWS devops junior' },
    { id: 'asir-soporte', ciclo: 'ASIR', nombre: 'Soporte técnico', descripcion: 'Helpdesk, atención a usuarios, ITSM.', palabrasClave: ['soporte', 'helpdesk', 'help desk', 'service desk', 'microinformatica', 'atencion al usuario', 'tecnico it', 'itil', 'cau'], busqueda: 'soporte técnico informático junior' },
    { id: 'asir-datos-ia-seguridad', ciclo: 'ASIR', nombre: 'Datos e IA aplicada a la seguridad', descripcion: 'Automatización, scripting, detección con datos e IA.', palabrasClave: ['python', 'automatizacion', 'scripting', 'detection', 'deteccion', 'ia', 'ai', 'machine learning', 'threat', 'datos'], busqueda: 'python ciberseguridad automatización junior' },
    // Actividades Comerciales (grado medio): un perfil por área de los módulos del título
    { id: 'acom-venta', ciclo: 'ACOM', nombre: 'Venta y atención en tienda', descripcion: 'Dependiente/a, asesor/a de ventas, caja y TPV (Procesos de venta).', palabrasClave: ['dependiente', 'dependienta', 'vendedor', 'vendedora', 'asesor de ventas', 'asesora de ventas', 'ayudante de tienda', 'auxiliar de tienda', 'cajero', 'cajera', 'retail', 'tienda', 'store'], busqueda: 'dependiente prácticas' },
    { id: 'acom-venta-tecnica', ciclo: 'ACOM', nombre: 'Venta técnica y comercial', descripcion: 'Comercial, telemarketing, productos tecnológicos, alta gama e inmobiliaria (Venta técnica).', palabrasClave: ['comercial', 'agente comercial', 'gestor comercial', 'ventas', 'televenta', 'telemarketing', 'inmobiliaria', 'asesor inmobiliario', 'captacion', 'key account', 'b2b'], busqueda: 'comercial junior prácticas' },
    { id: 'acom-marketing-digital', ciclo: 'ACOM', nombre: 'Marketing digital y redes sociales', descripcion: 'Redes sociales, contenidos, SEO y campañas (Marketing y Comercio electrónico).', palabrasClave: ['marketing digital', 'marketing', 'redes sociales', 'social media', 'community manager', 'contenidos', 'seo', 'sem', 'email marketing', 'growth', 'publicidad'], busqueda: 'marketing digital prácticas' },
    { id: 'acom-ecommerce', ciclo: 'ACOM', nombre: 'Comercio electrónico', descripcion: 'Tienda online, catálogo, marketplaces y pedidos online (Comercio electrónico).', palabrasClave: ['ecommerce', 'e-commerce', 'comercio electronico', 'tienda online', 'marketplace', 'shopify', 'prestashop', 'woocommerce', 'catalogo', 'amazon'], busqueda: 'ecommerce prácticas' },
    { id: 'acom-visual', ciclo: 'ACOM', nombre: 'Escaparatismo y visual merchandising', descripcion: 'Implantación de producto, escaparates, cartelería y promociones (Dinamización del punto de venta).', palabrasClave: ['visual merchandising', 'visual merchandiser', 'merchandising', 'escaparatismo', 'escaparatista', 'reponedor', 'reponedora', 'promotor', 'promotora', 'trade marketing', 'punto de venta'], busqueda: 'visual merchandising prácticas' },
    { id: 'acom-atencion-cliente', ciclo: 'ACOM', nombre: 'Atención al cliente', descripcion: 'Información, posventa, quejas y reclamaciones, CRM (Servicios de atención comercial).', palabrasClave: ['atencion al cliente', 'customer service', 'customer care', 'teleoperador', 'teleoperadora', 'call center', 'contact center', 'posventa', 'postventa', 'recepcionista', 'experiencia de cliente'], busqueda: 'atención al cliente prácticas' },
    { id: 'acom-logistica', ciclo: 'ACOM', nombre: 'Almacén, compras y logística', descripcion: 'Recepción, pedidos, stocks, inventarios y aprovisionamiento (Técnicas de almacén y Gestión de compras).', palabrasClave: ['almacen', 'logistica', 'mozo de almacen', 'preparador de pedidos', 'picking', 'stock', 'inventario', 'compras', 'aprovisionamiento', 'supply chain', 'expediciones'], busqueda: 'auxiliar de almacén logística prácticas' },
    { id: 'acom-gestion-comercio', ciclo: 'ACOM', nombre: 'Gestión de tienda y administración comercial', descripcion: 'Documentación comercial, facturación, hoja de cálculo y gestión de un pequeño comercio.', palabrasClave: ['administrativo comercial', 'auxiliar administrativo', 'back office', 'facturacion', 'gestion comercial', 'encargado de tienda', 'subencargado', 'responsable de tienda', 'franquicia'], busqueda: 'auxiliar administrativo comercial prácticas' },
  ] satisfies Perfil[],

  zonas: [
    { id: 'madrid', nombre: 'Madrid capital', incluye: ['Madrid'] },
    { id: 'norte', nombre: 'Norte', incluye: ['Alcobendas', 'San Sebastián de los Reyes', 'Tres Cantos', 'Colmenar Viejo'] },
    { id: 'sur', nombre: 'Sur', incluye: ['Getafe', 'Leganés', 'Móstoles', 'Fuenlabrada', 'Alcorcón', 'Parla', 'Pinto'] },
    { id: 'este', nombre: 'Este / Corredor del Henares', incluye: ['Alcalá de Henares', 'Torrejón de Ardoz', 'Coslada', 'San Fernando de Henares', 'Rivas-Vaciamadrid'] },
    { id: 'oeste', nombre: 'Oeste', incluye: ['Pozuelo de Alarcón', 'Las Rozas', 'Majadahonda', 'Boadilla del Monte', 'Villaviciosa de Odón'] },
    { id: 'remoto', nombre: 'Remoto / híbrido', incluye: [] },
  ] satisfies Zona[],

  /**
   * Enlaces profundos a buscadores en los que NO se hace scraping.
   * Placeholders: {q} y {lugar} (ya codificados). Ver docs/INVESTIGACION-FUENTES.md.
   */
  enlacesProfundos: [
    { id: 'linkedin', nombre: 'LinkedIn Empleos', plantilla: 'https://www.linkedin.com/jobs/search/?keywords={q}&location={lugar}&f_E=1%2C2', probado: true, fechaPrueba: '2026-11-05', nota: 'f_E=1 prácticas, 2 nivel inicial. Responde 200 sin pedir inicio de sesión (comprobación automática desde GitHub Actions, 05/11/2026). Revisar a mano que el filtro es el esperado.' },
    { id: 'indeed', nombre: 'Indeed', plantilla: 'https://es.indeed.com/jobs?q={q}&l={lugar}', probado: false, fechaPrueba: null },
    { id: 'infojobs', nombre: 'InfoJobs (web)', plantilla: 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword={q}&provinceIds=33', probado: true, fechaPrueba: '2026-11-05', nota: 'provinceIds=33 = Madrid (por confirmar a mano). Responde 200 sin pedir inicio de sesión (comprobación automática desde GitHub Actions, 05/11/2026). Revisar a mano que el filtro es el esperado.' },
    { id: 'tecnoempleo', nombre: 'Tecnoempleo', plantilla: 'https://www.tecnoempleo.com/ofertas-trabajo/?te={q}&pr=,28,', probado: false, fechaPrueba: null, nota: 'pr=,28, = Madrid (por confirmar). Portal solo de empleo tecnológico.', ciclos: ['DAM', 'ASIR'] },
    { id: 'glassdoor', nombre: 'Glassdoor', plantilla: 'https://www.glassdoor.es/Empleo/empleos.htm?sc.keyword={q}&locKeyword={lugar}', probado: false, fechaPrueba: null },
    { id: 'wttj', nombre: 'Welcome to the Jungle', plantilla: 'https://www.welcometothejungle.com/es/jobs?query={q}&aroundQuery={lugar}', probado: true, fechaPrueba: '2026-11-05', nota: 'Responde 200 sin pedir inicio de sesión (comprobación automática desde GitHub Actions, 05/11/2026). Revisar a mano que el filtro es el esperado.' },
  ] satisfies EnlaceProfundo[],

  /** Ubicación por defecto para las búsquedas. */
  lugarBusqueda: 'Madrid',

  /** Cuentas: quién puede registrarse y quién administra. */
  cuentas: {
    /** Dominio del correo del alumnado (registro como alumno/a). */
    dominioAlumnado: 'a.jrotero.es',
    /** Dominio del correo del profesorado (registro como tutor/a, pendiente de aprobación). */
    dominioProfesorado: 'jrotero.es',
    /** Superadministradores: aprueban tutores y asignan roles. Se pueden añadir más con SUPERADMIN_EMAILS. */
    superadmins: ['omar.romero@jrotero.es'],
    /** Minutos de validez del código de doble factor enviado por correo. */
    minutosCodigo: 10,
    /** Horas que dura la verificación de doble factor en un navegador. */
    horasDobleFactor: 12,
  },

  acceso: {
    /** Intentos fallidos permitidos por IP en la ventana. */
    maxIntentos: 5,
    ventanaMinutos: 15,
    /** Duración de la sesión tras introducir el código. */
    sesionHoras: 12,
  },
} as const;

export type Config = typeof config;
export type PerfilId = (typeof config.perfiles)[number]['id'];
export type ZonaId = (typeof config.zonas)[number]['id'];

export const cicloPorId = (id: Ciclo) => config.ciclos.find((c) => c.id === id)!;
export const IDS_CICLOS = config.ciclos.map((c) => c.id) as Ciclo[];
export const perfilesDe = (ciclo: Ciclo) => config.perfiles.filter((p) => p.ciclo === ciclo);
export const perfilPorId = (id: string) => config.perfiles.find((p) => p.id === id);
export const zonaPorId = (id: string) => config.zonas.find((z) => z.id === id);
export const modalidadPorId = (id: ModalidadId) => config.modalidades.find((m) => m.id === id)!;
