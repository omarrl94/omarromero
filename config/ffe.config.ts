/**
 * Configuración editable de Conecta FFE.
 *
 * ÚNICO archivo que hay que tocar para cambiar fechas, horas, tutores, perfiles, zonas,
 * límites y enlaces a portales de empleo. Se importa desde el cliente y desde las funciones,
 * así que aquí NO puede haber secretos ni correos de empresas.
 */

export type Ciclo = 'DAM' | 'ASIR';
export type ModalidadId = 'A' | 'B';

export interface Modalidad {
  id: ModalidadId;
  nombre: string;
  /** Fechas ISO (AAAA-MM-DD). */
  inicio: string;
  fin: string;
  horasDia: number;
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

  modalidades: [
    { id: 'A', nombre: 'Modalidad A', inicio: '2027-03-01', fin: '2027-05-21', horasDia: 8 },
    { id: 'B', nombre: 'Modalidad B', inicio: '2027-02-18', fin: '2027-05-21', horasDia: 7 },
  ] satisfies Modalidad[],

  /** Horas totales de FFE por ciclo. */
  horas: {
    DAM: 320,
    ASIR: 420,
  } satisfies Record<Ciclo, number>,
  /** Marca para mostrar «pendiente de confirmar» junto a las horas. */
  horasPendientesDeConfirmar: { DAM: false, ASIR: true } satisfies Record<Ciclo, boolean>,

  /** Tutor de FFE de cada ciclo. `null` = pendiente: el correo se genera sin copia y se avisa. */
  tutores: {
    DAM: { nombre: 'Omar Romero', email: 'omar.romero@jrotero.es' },
    ASIR: null,
  } satisfies Record<Ciclo, Tutor | null>,

  /** Máximo orientativo de contactos (correos) a la misma empresa desde el mismo dispositivo. */
  maxContactosPorEmpresa: 3,

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
    { id: 'tecnoempleo', nombre: 'Tecnoempleo', plantilla: 'https://www.tecnoempleo.com/ofertas-trabajo/?te={q}&pr=,28,', probado: false, fechaPrueba: null, nota: 'pr=,28, = Madrid (por confirmar).' },
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

export const perfilesDe = (ciclo: Ciclo) => config.perfiles.filter((p) => p.ciclo === ciclo);
export const perfilPorId = (id: string) => config.perfiles.find((p) => p.id === id);
export const zonaPorId = (id: string) => config.zonas.find((z) => z.id === id);
export const modalidadPorId = (id: ModalidadId) => config.modalidades.find((m) => m.id === id)!;
