/** Manual del instalador dentro del juego. Los valores salen de RULES (un único sitio); todos están sin verificar. */
import { RULES, SOURCES, maxEarthOhm } from './rules';

export interface ManualPage { id: string; icon: string; title: string; paras: string[]; checklist?: string[]; values?: { label: string; value: string }[]; source?: string }
const n = (v: number) => String(v).replace('.', ',');

export const MANUAL: ManualPage[] = [
  { id: 'boletin', icon: '📋', title: 'El boletín y para qué sirve',
    paras: [
      'Antes de dar de alta una instalación, el instalador autorizado comprueba que cumple el reglamento y firma el boletín (certificado de instalación). Con su firma se responsabiliza de que es segura.',
      'Firmar sin haber medido, o firmar una instalación con un defecto, no es un descuido: es poner en riesgo a las personas que van a vivir ahí. Tu trabajo hoy es medir bien y decidir con la cabeza, no con las prisas del cliente.',
      'Cada medida tiene dos preguntas: ¿la hice en las condiciones correctas? y ¿el valor cumple? Si la primera falla, la medida no vale aunque el número parezca bueno.',
    ] },
  { id: 'preparacion', icon: '🔌', title: 'Preparar la instalación',
    paras: [
      'Los ensayos de aislamiento y de continuidad se hacen SIN tensión: el aparato inyecta su propia señal y alguien podría estar conectado. Abre el interruptor general (IGA) y comprueba que no hay tensión.',
      'Desconecta los receptores: una lavadora o un televisor tienen su propia resistencia y falsearían la medida. Desconecta también el limitador de sobretensiones, que conduce con las tensiones de ensayo.',
      'El ensayo del diferencial es al revés: necesita tensión. Cierra el IGA, pero deja los receptores desconectados, porque sus fugas se suman a las del ensayo.',
    ],
    checklist: ['Aislamiento y continuidad: IGA abierto, receptores fuera, limitador de sobretensiones fuera', 'Continuidad: anula la resistencia de las puntas antes', 'Diferencial: IGA cerrado y receptores fuera', 'Tierra: abre el enlace entre la pica y la instalación'] },
  { id: 'continuidad', icon: '〰', title: 'Continuidad del conductor de protección',
    paras: ['Se mide entre la barra de tierra y la toma más alejada del circuito. Debe haber continuidad real: una resistencia baja, sin saltos.', 'Las puntas del aparato tienen su propia resistencia. Si no las anulas («cero»), se suma a la lectura y puedes dar por mala una instalación buena.'],
    values: [{ label: 'Umbral del juego', value: `≤ ${n(RULES.pe.maxOhm)} Ω` }, { label: 'Puntas sin anular', value: `+ ${n(RULES.pe.leadsOhm)} Ω` }], source: SOURCES.pe.note },
  { id: 'aislamiento', icon: '🟡', title: 'Resistencia de aislamiento',
    paras: ['Se mide con el megóhmetro entre todas las parejas de conductores: fase–tierra, neutro–tierra y fase–neutro. Un defecto puede esconderse en una sola pareja.', 'La tensión de ensayo importa: con menos de la prescrita, un aislamiento defectuoso puede salir «bien». Usa la tensión que pide el reglamento.', 'Valores altos son buenos: el aparato marca «> 500 MΩ» cuando el aislamiento es excelente. Un valor justo por debajo del mínimo sigue siendo NO APTO: no hay «casi».'],
    values: [{ label: 'Tensión de ensayo', value: `${RULES.iso.testV} V` }, { label: 'Resistencia mínima', value: `${n(RULES.iso.minMOhm)} MΩ` }], source: SOURCES.iso.note },
  { id: 'tierra', icon: '🟢', title: 'Resistencia de la puesta a tierra',
    paras: ['Se mide con el telurómetro y dos picas auxiliares clavadas en línea con la pica de la instalación. Las auxiliares deben estar lo bastante lejos para que no se solapen sus zonas de influencia.', 'Antes de medir hay que separar la pica del resto de la instalación; si no, mides la tierra en paralelo con otras masas y sale menor de lo real.', `El límite sale de la tensión de contacto: con un diferencial de ${RULES.rcd.inmA} mA, R ≤ ${RULES.earth.vContact} V / ${n(RULES.rcd.inmA / 1000)} A = ${Math.round(maxEarthOhm())} Ω.`],
    values: [{ label: 'Distancia mínima de las picas auxiliares', value: `${RULES.earth.minAuxDistance} m` }, { label: 'Resistencia máxima con 30 mA', value: `${Math.round(maxEarthOhm())} Ω` }], source: SOURCES.earth.note },
  { id: 'diferencial', icon: '⚪', title: 'Disparo del diferencial',
    paras: ['El comprobador inyecta una fuga creciente y anota a qué corriente dispara y cuánto tarda. Debe disparar entre la mitad y el total de su sensibilidad: no antes (saltaría sin motivo) y no después (no protegería).', 'También cuenta el tiempo: tiene que cortar rápido. Un diferencial que dispara tarde, o no dispara con 30 mA, no protege a nadie.'],
    values: [{ label: 'Dispara entre', value: `${n(RULES.rcd.inmA * RULES.rcd.minFrac)} y ${RULES.rcd.inmA} mA` }, { label: 'Tiempo con IΔn', value: `≤ ${RULES.rcd.maxT1} ms` }, { label: 'Tiempo con 5·IΔn', value: `≤ ${RULES.rcd.maxT5} ms` }], source: SOURCES.rcd.note },
  { id: 'decidir', icon: '🖊', title: 'Cómo decidir: firmar o negarse',
    paras: ['Cada medida válida que no cumple es un defecto. Un solo defecto sin resolver basta para NO firmar.', 'Si todas las medidas válidas son aptas y has verificado todo lo exigible, firma. Negarte sin motivo cuesta una mala nota y un cliente enfadado; firmar con un defecto cuesta mucho más.', 'Medir poco es tan peligroso como medir mal: firmar «porque no he encontrado nada» sin haber medido todo no es una verificación.'] },
];
