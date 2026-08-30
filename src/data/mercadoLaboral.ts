import type { DatosMercado } from '../types';

/**
 * ================== LÉEME ANTES DE USAR ESTOS DATOS ==================
 *
 * Las cifras de este fichero son ESTIMACIONES ORIENTATIVAS, elaboradas como
 * bandas razonables por familia y grado. NO son estadísticas oficiales y NO
 * deben presentarse como tales.
 *
 * Viven en un fichero aparte del catálogo a propósito: el catálogo (títulos,
 * módulos, itinerarios) es estable y verificable en el BOE y en Todo FP; esto
 * otro depende del año, del sector y sobre todo de la provincia, y caduca.
 *
 * Para publicar esta app con datos reales, sustituye estos valores por los de:
 *   - Observatorio de las Ocupaciones del SEPE (informes por ocupación)
 *   - Estadística de Inserción Laboral de los titulados de FP (Ministerio
 *     de Educación / INE)
 *   - Encuesta de Estructura Salarial del INE
 *   - Los observatorios de empleo de cada comunidad autónoma
 *
 * Mientras tanto, la interfaz las etiqueta siempre como orientativas y muestra
 * el aviso de abajo. No quites ese aviso sin haber sustituido los datos.
 * =====================================================================
 */
export const AVISO_DATOS_MERCADO =
  'Cifras orientativas, no oficiales: sirven para comparar ciclos entre sí, no ' +
  'para prever tu sueldo. Varían mucho según provincia, empresa y convenio.';

/** Etiqueta corta para acompañar cualquier cifra de mercado en la interfaz. */
export const ETIQUETA_ORIENTATIVO = 'Estimación orientativa';

/**
 * Datos por ciclo. Las bandas salariales son euros brutos anuales de entrada,
 * a jornada completa. `cargaLogica` y `cargaPractica` van de 1 a 5 y describen
 * el tipo de esfuerzo del ciclo, no su dificultad absoluta.
 */
export const MERCADO: Record<string, DatosMercado> = {
  // ---- Informática y Comunicaciones ----
  'fpb-informatica-oficina': { insercion: 58, salarioMin: 15000, salarioMax: 18000, demanda: 'media', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 3 },
  'gm-smr': { insercion: 78, salarioMin: 18000, salarioMax: 24000, demanda: 'alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 4 },
  'gs-dam': { insercion: 92, salarioMin: 22000, salarioMax: 32000, demanda: 'muy-alta', modalidades: ['presencial', 'dual', 'teletrabajo'], cargaLogica: 5, cargaPractica: 3 },
  'gs-daw': { insercion: 91, salarioMin: 22000, salarioMax: 32000, demanda: 'muy-alta', modalidades: ['presencial', 'dual', 'teletrabajo'], cargaLogica: 5, cargaPractica: 3 },
  'gs-asir': { insercion: 90, salarioMin: 23000, salarioMax: 33000, demanda: 'muy-alta', modalidades: ['presencial', 'dual', 'teletrabajo'], cargaLogica: 4, cargaPractica: 4 },

  // ---- Sanidad ----
  'gm-auxiliar-enfermeria': { insercion: 85, salarioMin: 17000, salarioMax: 22000, demanda: 'muy-alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gm-emergencias': { insercion: 80, salarioMin: 18000, salarioMax: 24000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 5 },
  'gm-farmacia': { insercion: 76, salarioMin: 16000, salarioMax: 21000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 3 },
  'gs-laboratorio-clinico': { insercion: 86, salarioMin: 20000, salarioMax: 27000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 4, cargaPractica: 4 },
  'gs-imagen-diagnostico': { insercion: 88, salarioMin: 21000, salarioMax: 29000, demanda: 'muy-alta', modalidades: ['presencial'], cargaLogica: 4, cargaPractica: 4 },
  'gs-higiene-bucodental': { insercion: 84, salarioMin: 19000, salarioMax: 26000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 4 },
  'gs-audiologia-protesica': { insercion: 94, salarioMin: 21000, salarioMax: 30000, demanda: 'muy-alta', modalidades: ['presencial'], cargaLogica: 4, cargaPractica: 4 },

  // ---- Administración y Gestión ----
  'fpb-servicios-administrativos': { insercion: 55, salarioMin: 15000, salarioMax: 18000, demanda: 'media', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 2 },
  'gm-gestion-administrativa': { insercion: 72, salarioMin: 16500, salarioMax: 22000, demanda: 'alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 2 },
  'gs-administracion-finanzas': { insercion: 84, salarioMin: 20000, salarioMax: 28000, demanda: 'alta', modalidades: ['presencial', 'dual', 'teletrabajo'], cargaLogica: 4, cargaPractica: 2 },
  'gs-asistencia-direccion': { insercion: 78, salarioMin: 19000, salarioMax: 27000, demanda: 'media', modalidades: ['presencial', 'teletrabajo'], cargaLogica: 3, cargaPractica: 2 },

  // ---- Electricidad y Electrónica ----
  'fpb-electricidad': { insercion: 68, salarioMin: 16000, salarioMax: 19000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gm-instalaciones-electricas': { insercion: 89, salarioMin: 19000, salarioMax: 26000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 5 },
  'gs-sistemas-electrotecnicos': { insercion: 91, salarioMin: 23000, salarioMax: 32000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 4, cargaPractica: 5 },
  'gs-automatizacion-robotica': { insercion: 93, salarioMin: 25000, salarioMax: 35000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 5, cargaPractica: 4 },

  // ---- Imagen y Sonido ----
  'gm-video-dj-sonido': { insercion: 62, salarioMin: 16000, salarioMax: 22000, demanda: 'media', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gs-animaciones-3d': { insercion: 74, salarioMin: 19000, salarioMax: 28000, demanda: 'alta', modalidades: ['presencial', 'teletrabajo'], cargaLogica: 4, cargaPractica: 4 },
  'gs-realizacion-audiovisual': { insercion: 70, salarioMin: 18000, salarioMax: 27000, demanda: 'media', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 4 },

  // ---- Hostelería y Turismo ----
  'fpb-cocina-restauracion': { insercion: 72, salarioMin: 15500, salarioMax: 19000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 1, cargaPractica: 5 },
  'gm-cocina-gastronomia': { insercion: 86, salarioMin: 17000, salarioMax: 24000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 2, cargaPractica: 5 },
  'gs-direccion-cocina': { insercion: 88, salarioMin: 21000, salarioMax: 32000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 5 },
  'gs-guia-turistica': { insercion: 73, salarioMin: 18000, salarioMax: 26000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 3 },

  // ---- Servicios Socioculturales ----
  'gm-dependencia': { insercion: 87, salarioMin: 16000, salarioMax: 21000, demanda: 'muy-alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gs-educacion-infantil': { insercion: 82, salarioMin: 17000, salarioMax: 23000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 4 },
  'gs-integracion-social': { insercion: 78, salarioMin: 18000, salarioMax: 24000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 4 },

  // ---- Fabricación Mecánica ----
  'fpb-fabricacion-montaje': { insercion: 70, salarioMin: 16000, salarioMax: 19500, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gm-mecanizado': { insercion: 90, salarioMin: 19000, salarioMax: 27000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 5 },
  'gs-programacion-produccion': { insercion: 92, salarioMin: 24000, salarioMax: 34000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 4, cargaPractica: 4 },

  // ---- Comercio y Marketing ----
  'gm-actividades-comerciales': { insercion: 74, salarioMin: 16000, salarioMax: 22000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 3 },
  'gs-marketing-publicidad': { insercion: 80, salarioMin: 19000, salarioMax: 28000, demanda: 'alta', modalidades: ['presencial', 'teletrabajo'], cargaLogica: 4, cargaPractica: 3 },
  'gs-comercio-internacional': { insercion: 82, salarioMin: 21000, salarioMax: 30000, demanda: 'alta', modalidades: ['presencial', 'teletrabajo'], cargaLogica: 4, cargaPractica: 2 },

  // ---- Transporte y Mantenimiento de Vehículos ----
  'fpb-mantenimiento-vehiculos': { insercion: 71, salarioMin: 16000, salarioMax: 19500, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gm-electromecanica-vehiculos': { insercion: 90, salarioMin: 19000, salarioMax: 27000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 3, cargaPractica: 5 },
  'gs-automocion': { insercion: 91, salarioMin: 23000, salarioMax: 33000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 4, cargaPractica: 5 },
  'gs-mantenimiento-aeromecanico': { insercion: 96, salarioMin: 26000, salarioMax: 40000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 5, cargaPractica: 5 },

  // ---- Actividades Físicas y Deportivas ----
  'gm-guia-medio-natural': { insercion: 68, salarioMin: 16000, salarioMax: 22000, demanda: 'media', modalidades: ['presencial'], cargaLogica: 2, cargaPractica: 5 },
  'gs-acondicionamiento-fisico': { insercion: 79, salarioMin: 18000, salarioMax: 26000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 5 },
  'gs-ensenanza-sociodeportiva': { insercion: 76, salarioMin: 17500, salarioMax: 25000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 5 },

  // ---- Química / Instalación / Textil ----
  'gs-quimica-industrial': { insercion: 94, salarioMin: 24000, salarioMax: 34000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 5, cargaPractica: 4 },
  'gs-mecatronica-industrial': { insercion: 95, salarioMin: 25000, salarioMax: 36000, demanda: 'muy-alta', modalidades: ['presencial', 'dual'], cargaLogica: 4, cargaPractica: 5 },
  'gs-patronaje-moda': { insercion: 88, salarioMin: 18000, salarioMax: 26000, demanda: 'alta', modalidades: ['presencial'], cargaLogica: 3, cargaPractica: 5 },
};

export const ETIQUETA_DEMANDA: Record<DatosMercado['demanda'], string> = {
  media: 'Demanda media',
  alta: 'Demanda alta',
  'muy-alta': 'Demanda muy alta',
};

export const ETIQUETA_MODALIDAD: Record<'presencial' | 'dual' | 'teletrabajo', string> = {
  presencial: 'Presencial',
  dual: 'Dual intensiva',
  teletrabajo: 'Admite teletrabajo',
};

/** Devuelve los datos de un ciclo, o `null` si todavía no están estimados. */
export function datosMercado(cicloId: string): DatosMercado | null {
  return MERCADO[cicloId] ?? null;
}

/** Formatea una banda salarial como "20.000 – 28.000 € / año". */
export function formatearSalario(min: number, max: number): string {
  const miles = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${miles(min)} – ${miles(max)} € / año`;
}
