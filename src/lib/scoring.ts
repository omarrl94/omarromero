import { CICLOS, FAMILIAS, FAMILIAS_POR_ID, SITUACIONES } from '../data/fpData';
import { PREGUNTAS } from '../data/questions';
import type {
  CicloMatch,
  Dimension,
  DimensionScores,
  Familia,
  FamiliaMatch,
  Grado,
  Meta,
  MetaScores,
  Resultado,
  Respuestas,
  SituacionId,
} from '../types';

/** Orden canonico de las dimensiones. Fuente unica para recorrerlas. */
export const DIMENSIONES: Dimension[] = [
  'analitico',
  'creativo',
  'asistencial',
  'tecnico',
  'organizativo',
  'social',
  'cientifico',
];

/** Etiquetas legibles de cada dimension, para la UI y las explicaciones. */
export const ETIQUETA_DIMENSION: Record<Dimension, string> = {
  analitico: 'Pensamiento analítico',
  creativo: 'Creatividad',
  asistencial: 'Vocación de cuidado',
  tecnico: 'Habilidad técnica',
  organizativo: 'Organización',
  social: 'Trato con personas',
  cientifico: 'Método científico',
};

/** La misma etiqueta, en minuscula, para encajar dentro de una frase. */
export const ETIQUETA_DIMENSION_FRASE: Record<Dimension, string> = {
  analitico: 'resolver problemas con lógica',
  creativo: 'crear y dar forma a las ideas',
  asistencial: 'cuidar y acompañar a las personas',
  tecnico: 'trabajar con las manos y con máquinas',
  organizativo: 'organizar, planificar y que todo cuadre',
  social: 'el trato directo con la gente',
  cientifico: 'entender cómo funcionan las cosas con método',
};

export const ETIQUETA_META: Record<Meta, string> = {
  trabajarPronto: 'empezar a trabajar pronto',
  especializarse: 'especializarte a alto nivel',
  universidad: 'usar la FP como trampolín a la universidad',
};

/** Vector de dimensiones a cero. Se usa como punto de partida acumulador. */
function vectorVacio(): DimensionScores {
  return {
    analitico: 0,
    creativo: 0,
    asistencial: 0,
    tecnico: 0,
    organizativo: 0,
    social: 0,
    cientifico: 0,
  };
}

function metasVacias(): MetaScores {
  return { trabajarPronto: 0, especializarse: 0, universidad: 0 };
}

/**
 * Suma los pesos de las opciones elegidas.
 * Las respuestas a preguntas o opciones que ya no existen se ignoran, de forma
 * que un resultado guardado con una version antigua del test nunca rompe.
 */
export function calcularDimensiones(respuestas: Respuestas): DimensionScores {
  const total = vectorVacio();

  for (const pregunta of PREGUNTAS) {
    const elegida = respuestas[pregunta.id];
    if (!elegida) continue;

    const opcion = pregunta.opciones.find((o) => o.id === elegida);
    if (!opcion?.pesos) continue;

    for (const dim of DIMENSIONES) {
      total[dim] += opcion.pesos[dim] ?? 0;
    }
  }

  return total;
}

export function calcularMetas(respuestas: Respuestas): MetaScores {
  const total = metasVacias();

  for (const pregunta of PREGUNTAS) {
    const elegida = respuestas[pregunta.id];
    if (!elegida) continue;

    const opcion = pregunta.opciones.find((o) => o.id === elegida);
    if (!opcion?.metas) continue;

    total.trabajarPronto += opcion.metas.trabajarPronto ?? 0;
    total.especializarse += opcion.metas.especializarse ?? 0;
    total.universidad += opcion.metas.universidad ?? 0;
  }

  return total;
}

/** Longitud euclidea del vector. Devuelve 0 si el vector esta vacio. */
function magnitud(v: DimensionScores): number {
  return Math.sqrt(DIMENSIONES.reduce((acc, d) => acc + v[d] * v[d], 0));
}

/**
 * Similitud del coseno entre el perfil del estudiante y el de una familia.
 * Se usa coseno y no distancia porque lo que importa es la *forma* del perfil
 * (en que reparte su interes), no cuantos puntos ha acumulado en total.
 */
function similitudCoseno(a: DimensionScores, b: DimensionScores): number {
  const magA = magnitud(a);
  const magB = magnitud(b);
  if (magA === 0 || magB === 0) return 0;

  const producto = DIMENSIONES.reduce((acc, d) => acc + a[d] * b[d], 0);
  return producto / (magA * magB);
}

/**
 * Reescala el coseno a un porcentaje legible.
 * Entre vectores no negativos el coseno rara vez baja de 0,4, asi que sin
 * reescalar todas las familias parecerian igual de compatibles. El suelo abre
 * el abanico; el techo evita prometer un 100 % de encaje, que nunca es honesto.
 */
function cosenoAPorcentaje(coseno: number): number {
  const SUELO = 0.4;
  const TECHO_VISUAL = 97;
  const normalizado = (coseno - SUELO) / (1 - SUELO);
  return Math.round(Math.max(0, Math.min(1, normalizado)) * TECHO_VISUAL);
}

/**
 * Dimensiones que mas empujan el encaje: aquellas en las que coinciden la
 * fuerza del estudiante y el peso de la familia.
 */
function dimensionesClave(usuario: DimensionScores, familia: Familia): Dimension[] {
  return DIMENSIONES.filter((d) => usuario[d] > 0 && familia.perfil[d] > 0)
    .sort((a, b) => usuario[b] * familia.perfil[b] - usuario[a] * familia.perfil[a])
    .slice(0, 3);
}

/** Construye la explicacion en lenguaje natural del encaje con una familia. */
function explicarEncaje(familia: Familia, claves: Dimension[], afinidad: number): string {
  if (claves.length === 0) {
    return `Todavía no hay respuestas suficientes para explicar el encaje con ${familia.nombre}.`;
  }

  const frases = claves.map((d) => ETIQUETA_DIMENSION_FRASE[d]);
  const listado =
    frases.length === 1
      ? frases[0]
      : `${frases.slice(0, -1).join(', ')} y ${frases[frases.length - 1]}`;

  const intensidad = afinidad >= 75 ? 'encaja de lleno' : afinidad >= 55 ? 'encaja bien' : 'tiene puntos en común';

  return `En tus respuestas pesan mucho ${listado}. Eso ${intensidad} con ${familia.nombre}, una familia donde el día a día va justo de eso.`;
}

/** Ordena las familias por afinidad con el perfil del estudiante. */
export function calcularFamilias(dimensiones: DimensionScores): FamiliaMatch[] {
  return FAMILIAS.map((familia) => {
    const afinidad = cosenoAPorcentaje(similitudCoseno(dimensiones, familia.perfil));
    const claves = dimensionesClave(dimensiones, familia);

    return {
      familia,
      afinidad,
      dimensionesClave: claves,
      explicacion: explicarEncaje(familia, claves, afinidad),
    };
  }).sort((a, b) => b.afinidad - a.afinidad);
}

/**
 * Cuanto del interes del estudiante cae dentro del perfil ideal del ciclo.
 * Se normaliza contra el mejor reparto posible (sus dimensiones mas fuertes),
 * asi un ciclo que pide 2 dimensiones no sale penalizado frente a uno que pide 3.
 */
function encajePerfil(dimensiones: DimensionScores, perfilIdeal: Dimension[]): number {
  if (perfilIdeal.length === 0) return 50;

  const totalUsuario = DIMENSIONES.reduce((acc, d) => acc + dimensiones[d], 0);
  if (totalUsuario === 0) return 0;

  const obtenido = perfilIdeal.reduce((acc, d) => acc + dimensiones[d], 0);
  const mejorPosible = DIMENSIONES.map((d) => dimensiones[d])
    .sort((a, b) => b - a)
    .slice(0, perfilIdeal.length)
    .reduce((acc, valor) => acc + valor, 0);

  if (mejorPosible === 0) return 0;
  return Math.round((obtenido / mejorPosible) * 100);
}

/** Puntua cuanto se ajusta el grado del ciclo a la situacion de partida. */
function encajeGrado(grado: Grado, gradosPreferidos: Grado[]): number {
  const indice = gradosPreferidos.indexOf(grado);
  if (indice === 0) return 100;
  if (indice > 0) return 80;
  // Un grado fuera de la situacion declarada sigue siendo informacion util
  // (puede ser el paso siguiente), pero no debe encabezar la lista.
  return 35;
}

/**
 * Combina afinidad de familia, perfil del ciclo y grado accesible.
 * Los pesos priorizan la familia: equivocarse de sector duele mas que
 * equivocarse de ciclo dentro del sector correcto.
 */
export function calcularCiclos(
  dimensiones: DimensionScores,
  familias: FamiliaMatch[],
  gradosPreferidos: Grado[],
): CicloMatch[] {
  const afinidadPorFamilia = new Map(familias.map((f) => [f.familia.id, f.afinidad]));

  return CICLOS.map((ciclo) => {
    const familiaScore = afinidadPorFamilia.get(ciclo.familia) ?? 0;
    const perfilScore = encajePerfil(dimensiones, ciclo.perfilIdeal);
    const gradoScore = encajeGrado(ciclo.grado, gradosPreferidos);

    const encaje = Math.round(familiaScore * 0.55 + perfilScore * 0.3 + gradoScore * 0.15);

    return { ciclo, encaje: Math.max(0, Math.min(100, encaje)) };
  }).sort((a, b) => b.encaje - a.encaje || a.ciclo.nombre.localeCompare(b.ciclo.nombre, 'es'));
}

/**
 * Grado sugerido como punto de entrada.
 * Si el estudiante ya ha declarado su situacion academica, manda la situacion:
 * no tiene sentido recomendar un Grado Superior a quien aun no tiene la ESO.
 * Las metas solo deciden cuando ha elegido "quiero explorar todo".
 */
export function sugerirGrado(situacionId: SituacionId, metas: MetaScores): Grado {
  const situacion = SITUACIONES.find((s) => s.id === situacionId);
  const preferidos = situacion?.gradosPreferidos ?? ['medio'];

  if (situacionId !== 'explorar') {
    return preferidos[0] ?? 'medio';
  }

  const ordenadas = (Object.entries(metas) as [Meta, number][]).sort((a, b) => b[1] - a[1]);
  const dominante = ordenadas[0];

  if (!dominante || dominante[1] === 0) return 'medio';
  return dominante[0] === 'trabajarPronto' ? 'medio' : 'superior';
}

/** Ejecuta el calculo completo y devuelve el resultado listo para pintar. */
export function calcularResultado(situacionId: SituacionId, respuestas: Respuestas): Resultado {
  const situacion = SITUACIONES.find((s) => s.id === situacionId);
  const gradosPreferidos = situacion?.gradosPreferidos ?? ['basico', 'medio', 'superior'];

  const dimensiones = calcularDimensiones(respuestas);
  const metas = calcularMetas(respuestas);
  const familias = calcularFamilias(dimensiones);
  const ciclos = calcularCiclos(dimensiones, familias, gradosPreferidos);

  return {
    fecha: new Date().toISOString(),
    situacion: situacionId,
    respuestas,
    dimensiones,
    metas,
    familias,
    ciclos,
    gradoSugerido: sugerirGrado(situacionId, metas),
  };
}

/**
 * Rehidrata los objetos `familia` de un resultado guardado.
 * Lo persistido puede venir de una version anterior del catalogo, asi que las
 * familias se vuelven a resolver contra el dataset actual.
 */
export function rehidratarResultado(resultado: Resultado): Resultado {
  return {
    ...resultado,
    familias: resultado.familias
      .map((match) => {
        const familia = FAMILIAS_POR_ID[match.familia.id];
        return familia ? { ...match, familia } : null;
      })
      .filter((match): match is FamiliaMatch => match !== null),
  };
}

/** Convierte el vector en porcentajes sobre el total, para el grafico de perfil. */
export function porcentajesDimension(dimensiones: DimensionScores): { dimension: Dimension; porcentaje: number }[] {
  const maximo = Math.max(...DIMENSIONES.map((d) => dimensiones[d]), 0);

  return DIMENSIONES.map((dimension) => ({
    dimension,
    porcentaje: maximo === 0 ? 0 : Math.round((dimensiones[dimension] / maximo) * 100),
  })).sort((a, b) => b.porcentaje - a.porcentaje);
}
