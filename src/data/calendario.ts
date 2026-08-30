/**
 * Calendario orientativo de admisión y matrícula en FP.
 *
 * IMPORTANTE: las fechas exactas las publica cada comunidad autónoma en su
 * propia resolución anual y cambian todos los años. Aquí se recogen las FASES
 * y las ventanas aproximadas en las que suelen caer, que es lo que de verdad
 * sirve para no llegar tarde; para el día concreto hay que ir al portal oficial.
 *
 * Por eso cada comunidad lleva su enlace: es el dato que no caduca.
 */

export interface FaseCalendario {
  id: string;
  nombre: string;
  ventana: string;
  descripcion: string;
}

export interface ComunidadAutonoma {
  id: string;
  nombre: string;
  portal: string;
}

export const AVISO_CALENDARIO =
  'Las fechas exactas las publica cada comunidad autónoma en su resolución anual y cambian ' +
  'cada curso. Usa estas ventanas para organizarte y confirma siempre el día concreto en el ' +
  'portal oficial de tu comunidad.';

/** Fases del proceso, comunes a casi todas las comunidades. */
export const FASES: FaseCalendario[] = [
  {
    id: 'informacion',
    nombre: 'Infórmate y elige',
    ventana: 'De enero a abril',
    descripcion:
      'Mira la oferta de centros de tu zona, visita jornadas de puertas abiertas y habla con el departamento de orientación. Es el momento de hacer el test y de descartar con criterio.',
  },
  {
    id: 'requisitos',
    nombre: 'Asegura el requisito de acceso',
    ventana: 'De febrero a junio',
    descripcion:
      'Si no tienes el título que hace falta, apúntate a la prueba de acceso o al curso de preparación. Las convocatorias suelen cerrarse meses antes que la admisión.',
  },
  {
    id: 'solicitud',
    nombre: 'Presenta la solicitud de admisión',
    ventana: 'De mayo a julio',
    descripcion:
      'Es el trámite que reserva tu sitio en la lista. Puedes pedir varios ciclos y centros por orden de preferencia: rellena todas las opciones que te valgan, no solo la primera.',
  },
  {
    id: 'listas',
    nombre: 'Consulta listas y reclama',
    ventana: 'De junio a julio',
    descripcion:
      'Salen las listas provisionales, se abre un plazo corto de reclamación y después llegan las definitivas. Si no entras a la primera, quedas en lista de espera: no la abandones.',
  },
  {
    id: 'matricula',
    nombre: 'Formaliza la matrícula',
    ventana: 'De julio a septiembre',
    descripcion:
      'Estar admitido no es estar matriculado. Si dejas pasar el plazo, pierdes la plaza y pasa al siguiente de la lista.',
  },
  {
    id: 'extraordinaria',
    nombre: 'Plazo extraordinario y vacantes',
    ventana: 'De septiembre a octubre',
    descripcion:
      'Muchos centros sacan plazas libres tras la matrícula ordinaria. Si te quedaste fuera, llama directamente al centro: aquí se recolocan más alumnos de lo que parece.',
  },
];

/** Portales oficiales de admisión de FP por comunidad autónoma. */
export const COMUNIDADES: ComunidadAutonoma[] = [
  { id: 'andalucia', nombre: 'Andalucía', portal: 'https://www.juntadeandalucia.es/educacion/secretariavirtual' },
  { id: 'aragon', nombre: 'Aragón', portal: 'https://educa.aragon.es' },
  { id: 'asturias', nombre: 'Asturias', portal: 'https://www.educastur.es' },
  { id: 'baleares', nombre: 'Illes Balears', portal: 'https://www.caib.es/sites/fp' },
  { id: 'canarias', nombre: 'Canarias', portal: 'https://www.gobiernodecanarias.org/educacion' },
  { id: 'cantabria', nombre: 'Cantabria', portal: 'https://www.educantabria.es' },
  { id: 'castillalamancha', nombre: 'Castilla-La Mancha', portal: 'https://www.castillalamancha.es/gobierno/educacionculturaydeportes' },
  { id: 'castillayleon', nombre: 'Castilla y León', portal: 'https://www.educa.jcyl.es' },
  { id: 'cataluna', nombre: 'Cataluña', portal: 'https://preinscripcio.gencat.cat' },
  { id: 'ceuta', nombre: 'Ceuta y Melilla', portal: 'https://www.educacionfpydeportes.gob.es' },
  { id: 'extremadura', nombre: 'Extremadura', portal: 'https://www.educarex.es' },
  { id: 'galicia', nombre: 'Galicia', portal: 'https://www.edu.xunta.gal/fp' },
  { id: 'larioja', nombre: 'La Rioja', portal: 'https://www.larioja.org/edu-fp' },
  { id: 'madrid', nombre: 'Comunidad de Madrid', portal: 'https://www.comunidad.madrid/servicios/educacion' },
  { id: 'murcia', nombre: 'Región de Murcia', portal: 'https://www.carm.es/educacion' },
  { id: 'navarra', nombre: 'Navarra', portal: 'https://www.educacion.navarra.es' },
  { id: 'paisvasco', nombre: 'País Vasco', portal: 'https://www.euskadi.eus/formacion-profesional' },
  { id: 'valencia', nombre: 'Comunitat Valenciana', portal: 'https://ceice.gva.es/es/web/formacion-profesional' },
];

/** Portal estatal, útil para comparar oferta entre comunidades. */
export const PORTAL_ESTATAL = {
  nombre: 'Todo FP (Ministerio de Educación)',
  url: 'https://www.todofp.es',
};
