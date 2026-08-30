/**
 * Genera la presentación del proyecto (20 diapositivas, con notas del ponente).
 *
 * Vive en su propia carpeta y con su propio package.json para no arrastrar
 * react, sharp ni pptxgenjs a las dependencias de la aplicación web, que no
 * los necesita para nada.
 *
 * Uso:  cd presentacion && npm install && npm run build
 */
import pptxgen from 'pptxgenjs';
import { generarIconos } from './iconos.mjs';

/* ==========================================================================
   Paleta: la del propio producto, para que la presentación y la app se
   reconozcan como la misma cosa. Oro dominante, terracota y salvia de apoyo,
   tinta y crema como fondos.
   ========================================================================== */
const INK = '1A1A1A';
const INK_SOFT = '2E2E2E';
const CREMA = 'F7F4F0';
const BLANCO = 'FFFFFF';
const ORO = 'EFC12F';
const ORO_CLARO = 'F7D968';
const TERRACOTA = 'E39F7D';
const SALVIA = '3F7D68';
const TXT = '3A3530';
const TXT_SOFT = '6B6560';
const BORDE = 'E2DDD7';

const SANS = 'Calibri';
const TITULO = 'Arial';
const MONO = 'Courier New';

const W = 10;
const H = 5.625;
const M = 0.55;

const iconosOscuros = await generarIconos('#1A1A1A');
const iconosClaros = await generarIconos('#F7F4F0');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'OrientaFP';
pres.title = 'OrientaFP — Presentación del proyecto';

/* -------------------------- Ayudantes de composición -------------------------- */

const sombra = () => ({ type: 'outer', angle: 90, blur: 8, offset: 1, color: '1A1A1A', opacity: 0.1 });

/** Eyebrow en monoespaciada, el mismo recurso que usa la app. */
function eyebrow(slide, texto, { color = TXT_SOFT, y = 0.42 } = {}) {
  slide.addText(texto.toUpperCase(), {
    x: M, y, w: W - M * 2, h: 0.25,
    fontFace: MONO, fontSize: 10, bold: true, color, charSpacing: 1.6,
    isTextBox: true, margin: 0,
  });
}

function titulo(slide, texto, { color = INK, y = 0.70, size = 29, w = W - M * 2 } = {}) {
  slide.addText(texto, {
    // 1,02" da cabida a dos líneas a 29pt sin invadir el subtítulo.
    x: M, y, w, h: 1.02,
    fontFace: TITULO, fontSize: size, bold: true, color, lineSpacingMultiple: 0.92,
    isTextBox: true, margin: 0,
  });
}

function subtitulo(slide, texto, { y = 1.80, w = W - M * 2, color = TXT_SOFT, size = 12.5 } = {}) {
  slide.addText(texto, {
    x: M, y, w, h: 0.44,
    fontFace: SANS, fontSize: size, color, lineSpacingMultiple: 1.15,
    isTextBox: true, margin: 0,
  });
}

/** Tarjeta blanca con sombra suave: el motivo que se repite en todo el deck. */
function tarjeta(slide, { x, y, w, h, relleno = BLANCO }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: relleno }, line: { color: BORDE, width: 1 }, shadow: sombra(),
  });
}

/** Círculo de color con un icono dentro. Motivo visual constante. */
function insignia(slide, { x, y, d = 0.5, color = ORO, icono, oscuro = true }) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 } });
  if (icono) {
    const p = d * 0.28;
    slide.addImage({
      data: (oscuro ? iconosOscuros : iconosClaros)[icono],
      x: x + p, y: y + p, w: d - p * 2, h: d - p * 2,
    });
  }
}

/** Círculo con un número, para los pasos numerados. */
function numero(slide, { x, y, d = 0.44, n, fondo = ORO, color = INK }) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fondo }, line: { color: fondo, width: 0 } });
  slide.addText(String(n), {
    x, y, w: d, h: d,
    fontFace: TITULO, fontSize: 15, bold: true, color, align: 'center', valign: 'middle',
    isTextBox: true, margin: 0,
  });
}

function nuevaClara() {
  const s = pres.addSlide();
  s.background = { color: CREMA };
  return s;
}

function nuevaOscura() {
  const s = pres.addSlide();
  s.background = { color: INK };
  return s;
}

/** Pie discreto con el número de diapositiva. */
function pie(slide, n, { claro = true } = {}) {
  slide.addText(`OrientaFP · ${n}/20`, {
    x: W - M - 1.6, y: H - 0.45, w: 1.6, h: 0.25,
    fontFace: MONO, fontSize: 8, color: claro ? TXT_SOFT : '8A857F', align: 'right',
    isTextBox: true, margin: 0,
  });
}

/* ========================================================================== */
/* 1 — Portada                                                                */
/* ========================================================================== */
{
  const s = nuevaOscura();
  // Círculos decorativos, el mismo recurso del hero de la app.
  s.addShape(pres.ShapeType.ellipse, { x: 7.7, y: -1.1, w: 3.4, h: 3.4, fill: { color: ORO, transparency: 82 }, line: { width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 8.7, y: 3.5, w: 2.2, h: 2.2, fill: { color: TERRACOTA, transparency: 84 }, line: { width: 0 } });

  s.addText('ORIENTACIÓN VOCACIONAL · FORMACIÓN PROFESIONAL', {
    x: M, y: 1.15, w: 7.5, h: 0.3,
    fontFace: MONO, fontSize: 11, bold: true, color: ORO, charSpacing: 1.8, isTextBox: true, margin: 0,
  });
  s.addText('OrientaFP', {
    x: M, y: 1.5, w: 7.5, h: 1.1,
    fontFace: TITULO, fontSize: 54, bold: true, color: CREMA, isTextBox: true, margin: 0,
  });
  s.addText('Deja de elegir a ciegas: descubre qué Formación Profesional encaja contigo', {
    x: M, y: 2.65, w: 6.6, h: 0.75,
    fontFace: SANS, fontSize: 16, color: 'C9C4BE', lineSpacingMultiple: 1.15, isTextBox: true, margin: 0,
  });

  const datos = [['20', 'preguntas'], ['46', 'ciclos reales'], ['14', 'familias'], ['3', 'grados']];
  datos.forEach(([v, l], i) => {
    const x = M + i * 1.62;
    s.addText(v, { x, y: 3.75, w: 1.5, h: 0.5, fontFace: TITULO, fontSize: 28, bold: true, color: ORO, isTextBox: true, margin: 0 });
    s.addText(l, { x, y: 4.24, w: 1.5, h: 0.3, fontFace: MONO, fontSize: 9, color: '8A857F', isTextBox: true, margin: 0 });
  });

  s.addText('Aplicación web · React + TypeScript · Gratuita y sin registro', {
    x: M, y: 4.95, w: 8, h: 0.3,
    fontFace: SANS, fontSize: 11, color: '6E6862', isTextBox: true, margin: 0,
  });
  s.addNotes('OrientaFP es una aplicación web de orientación vocacional para la Formación Profesional en España. Nace de una idea sencilla: a los 15 o 16 años se toma una decisión importante con información dispersa, llena de mitos y escrita en lenguaje administrativo. Esta presentación recorre qué hace la herramienta, cómo funciona por dentro y qué hay que saber antes de publicarla.');
}

/* ========================================================================== */
/* 2 — El problema                                                            */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Punto de partida');
  titulo(s, 'Se elige a los 15 años, y casi siempre a ciegas');
  subtitulo(s, 'Tres obstáculos concretos que esta herramienta ataca de forma directa.');

  const problemas = [
    ['aviso', 'Los mitos deciden por ti', 'La idea de que la FP es «para quien no vale» viene de hace treinta años, pero sigue pesando en casa y en clase más que cualquier dato.'],
    ['catalogo', 'El catálogo oficial es ilegible', 'Cientos de títulos repartidos en 26 familias, descritos con lenguaje normativo. Nadie de 15 años lee un BOE para decidir su futuro.'],
    ['diana', 'Nadie conecta perfil y oficio', 'Existen tests genéricos y existen listados de ciclos, pero rara vez algo que una «cómo eres» con «qué podrías estudiar mañana».'],
  ];

  problemas.forEach(([ico, tit, txt], i) => {
    const x = M + i * 3.05;
    tarjeta(s, { x, y: 2.42, w: 2.8, h: 2.3 });
    insignia(s, { x: x + 0.28, y: 2.66, d: 0.5, color: ORO, icono: ico });
    s.addText(tit, {
      x: x + 0.28, y: 3.28, w: 2.24, h: 0.5,
      fontFace: TITULO, fontSize: 13, bold: true, color: INK, lineSpacingMultiple: 0.95, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.28, y: 3.78, w: 2.24, h: 0.88,
      fontFace: SANS, fontSize: 10.5, color: TXT_SOFT, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
    });
  });
  pie(s, 2);
  s.addNotes('El problema no es la falta de información: es que está dispersa, escrita en lenguaje administrativo y contaminada por prejuicios. La herramienta ataca los tres frentes: desmonta mitos con datos, traduce el catálogo a lenguaje cercano y conecta el perfil personal con ciclos concretos.');
}

/* ========================================================================== */
/* 3 — Qué es                                                                 */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'La propuesta');
  titulo(s, 'Una herramienta que informa, orienta y compara');
  subtitulo(s, 'Doce minutos de recorrido completo: leer, responder, entender el resultado y explorar alternativas.');

  const pilares = [
    ['libro', 'Informa', 'Una guía en lenguaje natural sobre qué es la FP hoy: los tres grados, la FP Dual, los cursos de especialización y cómo se salta de un sitio a otro.'],
    ['cerebro', 'Orienta', 'Un test de 20 preguntas cotidianas que devuelve una familia profesional con porcentaje de afinidad y los ciclos concretos que encajan.'],
    ['balanza', 'Compara', 'Un catálogo explorable de 46 ciclos y un comparador cara a cara para decidir entre opciones parecidas con criterios claros.'],
  ];

  pilares.forEach(([ico, tit, txt], i) => {
    const y = 2.32 + i * 1.0;
    insignia(s, { x: M, y: y + 0.02, d: 0.62, color: i === 0 ? ORO : i === 1 ? TERRACOTA : SALVIA, icono: ico, oscuro: i !== 2 });
    s.addText(tit, {
      x: M + 0.85, y, w: 2, h: 0.32,
      fontFace: TITULO, fontSize: 16, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: M + 0.85, y: y + 0.32, w: 7.4, h: 0.62,
      fontFace: SANS, fontSize: 11.5, color: TXT_SOFT, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
    });
  });
  pie(s, 3);
  s.addNotes('Tres funciones, en este orden deliberado. Primero informar, porque quien no sabe qué es la FP no puede elegirla bien. Después orientar con el test. Y por último comparar, porque la duda real casi nunca es "qué sector" sino "cuál de estos dos ciclos parecidos".');
}

/* ========================================================================== */
/* 4 — El recorrido                                                           */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Experiencia de uso');
  titulo(s, 'El recorrido, en cuatro pasos');
  subtitulo(s, 'Cada paso funciona por separado: se puede explorar el catálogo sin hacer el test, o leer la guía y volver otro día.');

  const pasos = [
    ['Lee la guía', 'Qué es la FP hoy, los tres grados y los mitos desmontados.'],
    ['Haz el test', '20 preguntas cotidianas, unos tres minutos. Se guarda si lo dejas a medias.'],
    ['Recibe el diagnóstico', 'Arquetipo, familia con % de afinidad, ciclos recomendados y hoja de ruta.'],
    ['Explora y compara', 'Catálogo completo, comparador cara a cara e informe descargable.'],
  ];

  pasos.forEach(([tit, txt], i) => {
    const x = M + i * 2.28;
    tarjeta(s, { x, y: 2.4, w: 2.05, h: 2.1 });
    numero(s, { x: x + 0.25, y: 2.62, n: i + 1 });
    s.addText(tit, {
      x: x + 0.25, y: 3.18, w: 1.6, h: 0.4,
      fontFace: TITULO, fontSize: 12.5, bold: true, color: INK, lineSpacingMultiple: 0.95, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.25, y: 3.6, w: 1.58, h: 0.8,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
    if (i < 3) {
      s.addText('→', {
        x: x + 2.03, y: 3.2, w: 0.26, h: 0.3,
        fontFace: TITULO, fontSize: 15, bold: true, color: TERRACOTA, align: 'center', isTextBox: true, margin: 0,
      });
    }
  });
  pie(s, 4);
  s.addNotes('El recorrido es lineal pero no obligatorio. Cada vista tiene su propia URL, así que se puede compartir el enlace del catálogo o de la guía por separado. El test se guarda en el navegador: si alguien lo deja a medias, al volver le ofrece retomarlo donde estaba.');
}

/* ========================================================================== */
/* 5 — La guía informativa                                                    */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 1 · Antes del test');
  titulo(s, 'La guía: qué es la FP, sin lenguaje de folleto');
  subtitulo(s, 'Seis motivos, cuatro mitos desmontados y los tres grados explicados uno a uno.', { w: 5.1 });

  const puntos = [
    'Se aprende haciendo desde el primer día',
    'La FP Dual mete al alumno en la empresa, y a menudo cobrando',
    'Existen los cursos de especialización, los «másteres de la FP»',
    'Ningún camino se cierra: hay pasarelas entre grados',
  ];
  puntos.forEach((p, i) => {
    const y = 2.35 + i * 0.44;
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.02, y: y + 0.07, w: 0.13, h: 0.13, fill: { color: ORO }, line: { width: 0 } });
    s.addText(p, {
      x: M + 0.3, y, w: 4.7, h: 0.4,
      fontFace: SANS, fontSize: 11.5, color: TXT, lineSpacingMultiple: 1.05, isTextBox: true, margin: 0,
    });
  });

  const grados = [
    ['Grado Básico', 'Sin ESO · 15-17 años', 'Un oficio práctico y el título de ESO al terminar.', ORO],
    ['Grado Medio', 'Con ESO o prueba', 'Título de Técnico y paso directo al Superior, sin prueba.', TERRACOTA],
    ['Grado Superior', 'Bachillerato o G. Medio', 'Técnico Superior, mando intermedio y universidad sin selectividad.', SALVIA],
  ];
  grados.forEach(([tit, req, txt, color], i) => {
    const y = 2.32 + i * 0.88;
    tarjeta(s, { x: 5.5, y, w: 3.95, h: 0.78 });
    s.addShape(pres.ShapeType.ellipse, { x: 5.7, y: y + 0.28, w: 0.22, h: 0.22, fill: { color }, line: { width: 0 } });
    s.addText(tit, {
      x: 6.02, y: y + 0.11, w: 2.1, h: 0.26,
      fontFace: TITULO, fontSize: 12, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(req, {
      x: 8.0, y: y + 0.13, w: 1.35, h: 0.22,
      fontFace: MONO, fontSize: 8, color: TXT_SOFT, align: 'right', isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: 6.02, y: y + 0.37, w: 3.3, h: 0.36,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, lineSpacingMultiple: 1.05, isTextBox: true, margin: 0,
    });
  });
  pie(s, 5);
  s.addNotes('Este módulo va antes del test a propósito. Un test vocacional no sirve de nada si quien lo hace arrastra la idea de que la FP es un plan B. Primero se desmonta esa idea; después se orienta.');
}

/* ========================================================================== */
/* 6 — El test                                                                */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 2 · El cuestionario');
  titulo(s, '20 preguntas cotidianas, cero jerga académica');
  subtitulo(s, 'Cuatro opciones por pregunta, 80 respuestas posibles. Ninguna opción es «la buena»: las cuatro llevan a algún sitio.');

  const bloques = [
    ['A', 'Afinidades técnicas', 'Preguntas 1-5', 'Cómo reaccionas si se rompe algo, con qué herramientas te sientes cómodo, qué información te gusta analizar.'],
    ['B', 'Situaciones reales', 'Preguntas 6-10', 'Qué papel coges al organizar un viaje, cómo actúas ante un desmayo o ante un cliente enfadado.'],
    ['C', 'Gustos y hobbies', 'Preguntas 11-15', 'Qué contenido te engancha, cómo cocinas, qué papel tiene el deporte y el aire libre en tu vida.'],
    ['D', 'Metas y futuro', 'Preguntas 16-20', 'Para cuándo quieres cobrar, dónde te ves en cinco años, si te atrae emprender o seguir estudiando.'],
  ];

  bloques.forEach(([letra, tit, rango, txt], i) => {
    const x = M + (i % 2) * 4.6;
    const y = 2.3 + Math.floor(i / 2) * 1.28;
    tarjeta(s, { x, y, w: 4.35, h: 1.15 });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.22, y: y + 0.22, w: 0.42, h: 0.42, rectRadius: 0.06,
      fill: { color: INK }, line: { width: 0 },
    });
    s.addText(letra, {
      x: x + 0.22, y: y + 0.22, w: 0.42, h: 0.42,
      fontFace: TITULO, fontSize: 14, bold: true, color: ORO, align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    });
    s.addText(tit, {
      x: x + 0.78, y: y + 0.2, w: 2.1, h: 0.26,
      fontFace: TITULO, fontSize: 12.5, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(rango, {
      x: x + 3.05, y: y + 0.22, w: 1.1, h: 0.22,
      fontFace: MONO, fontSize: 8, color: TXT_SOFT, align: 'right', isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.78, y: y + 0.5, w: 3.35, h: 0.58,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
  });
  pie(s, 6);
  s.addNotes('Las preguntas hablan de la vida real, no de vocaciones abstractas: qué haces si se rompe el wifi, qué papel coges en un trabajo en grupo. Eso hace que las respuestas sean sinceras, porque no hay una opción que quede visiblemente mejor que otra.');
}

/* ========================================================================== */
/* 7 — El algoritmo                                                           */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 3 · El motor');
  titulo(s, 'El algoritmo mide dos cosas a la vez');
  subtitulo(s, 'Las dimensiones dicen cómo eres; las etiquetas, de qué va el trabajo que te atrae. Hacen falta las dos.');

  const ejes = [
    ['8', 'dimensiones vocacionales', 'Analítico · Creativo · Asistencial · Técnico · Organizativo · Social · Científico · Físico', ORO, 'cerebro'],
    ['26', 'etiquetas de afinidad', 'Programación · Cocina · Vehículos · Deporte · Laboratorio · Ventas · Taller · Idiomas…', TERRACOTA, 'diana'],
    ['4', 'metas de futuro', 'Trabajar pronto · Especializarse · Universidad · Emprender', SALVIA, 'cohete'],
  ];

  ejes.forEach(([n, l, det, color, ico], i) => {
    const y = 2.34 + i * 0.96;
    tarjeta(s, { x: M, y, w: 8.9, h: 0.86 });
    insignia(s, { x: M + 0.22, y: y + 0.18, d: 0.5, color, icono: ico, oscuro: i !== 2 });
    s.addText(n, {
      x: M + 0.85, y: y + 0.14, w: 0.62, h: 0.4,
      fontFace: TITULO, fontSize: 22, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(l, {
      x: M + 1.5, y: y + 0.19, w: 2.6, h: 0.3,
      fontFace: TITULO, fontSize: 12, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(det, {
      x: M + 1.5, y: y + 0.48, w: 7.1, h: 0.32,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, isTextBox: true, margin: 0,
    });
  });

  s.addText('Por qué dos ejes: dos ciclos de la misma familia pueden pedir perfiles muy distintos. DAM programa y ASIR administra servidores; por dimensiones quedan empatados, y solo las etiquetas los separan.', {
    x: M, y: 5.0, w: 7.0, h: 0.42,
    fontFace: SANS, fontSize: 9.5, italic: true, color: TXT_SOFT, lineSpacingMultiple: 1.05, isTextBox: true, margin: 0,
  });
  pie(s, 7);
  s.addNotes('Este es el corazón técnico. La afinidad de familia se calcula con similitud del coseno entre el vector del estudiante y el de cada familia: importa la forma del perfil, en qué reparte su interés, no cuántos puntos acumula en total. Las etiquetas entran después, para ordenar ciclos hermanos.');
}

/* ========================================================================== */
/* 8 — La fórmula                                                             */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Cómo se calcula el encaje');
  titulo(s, 'Cuatro factores, con pesos deliberados');
  subtitulo(s, 'La familia pesa más que nada: equivocarse de sector duele más que equivocarse de ciclo dentro del sector correcto.');

  const pesos = [
    ['45%', 'Afinidad de familia', ORO],
    ['20%', 'Perfil del ciclo', TERRACOTA],
    ['20%', 'Etiquetas de afinidad', SALVIA],
    ['15%', 'Grado accesible', '9A958F'],
  ];
  pesos.forEach(([p, l, color], i) => {
    const x = M + i * 2.28;
    tarjeta(s, { x, y: 2.3, w: 2.05, h: 1.25 });
    s.addText(p, {
      x: x + 0.2, y: 2.48, w: 1.65, h: 0.5,
      fontFace: TITULO, fontSize: 26, bold: true, color, isTextBox: true, margin: 0,
    });
    s.addText(l, {
      x: x + 0.2, y: 3.0, w: 1.65, h: 0.45,
      fontFace: SANS, fontSize: 10.5, color: TXT_SOFT, lineSpacingMultiple: 1.05, isTextBox: true, margin: 0,
    });
  });

  tarjeta(s, { x: M, y: 3.78, w: 8.9, h: 1.15, relleno: 'FDF6E0' });
  insignia(s, { x: M + 0.28, y: 4.08, d: 0.52, color: ORO, icono: 'escudo' });
  s.addText('El techo del resultado es 97 %, nunca 100 %', {
    x: M + 0.95, y: 3.98, w: 7.7, h: 0.3,
    fontFace: TITULO, fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0,
  });
  s.addText('Prometer un encaje perfecto no sería honesto. También se aplica un suelo al reescalar: entre vectores no negativos la similitud rara vez baja de 0,4, y sin corregirlo todas las familias parecerían igual de compatibles.', {
    x: M + 0.95, y: 4.28, w: 7.7, h: 0.55,
    fontFace: SANS, fontSize: 10, color: TXT_SOFT, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
  });
  pie(s, 8);
  s.addNotes('Los pesos no son arbitrarios. La familia domina porque es el error más caro. El grado pesa poco pero existe, para que a alguien sin la ESO no se le recomiende de primeras un Grado Superior. Y el techo del 97 % es una decisión de honestidad: un test de 20 preguntas no puede prometer certeza absoluta.');
}

/* ========================================================================== */
/* 9 — Resultados                                                             */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 4 · La pantalla de resultados');
  titulo(s, 'Qué recibe el estudiante al terminar');
  subtitulo(s, 'Un diagnóstico completo, no solo un porcentaje.');

  const items = [
    ['Arquetipo vocacional', 'Un perfil con nombre y descripción, para poder contarlo en una frase.'],
    ['Familia con % de afinidad', 'Con la explicación en lenguaje natural de por qué encaja.'],
    ['Perfil por dimensiones', 'Ocho barras que muestran en qué reparte su energía.'],
    ['Ciclos recomendados', 'Filtrables por grado, con encaje individual y ficha completa.'],
    ['Segunda y tercera opción', 'Porque a veces la primera no convence, y conviene tener alternativas.'],
    ['Hoja de ruta e informe', 'El itinerario del ciclo principal y un informe descargable.'],
  ];
  items.forEach(([tit, txt], i) => {
    const x = M + (i % 2) * 4.6;
    const y = 2.32 + Math.floor(i / 2) * 0.92;
    s.addShape(pres.ShapeType.ellipse, { x, y: y + 0.06, w: 0.28, h: 0.28, fill: { color: ORO }, line: { width: 0 } });
    s.addText(String(i + 1), {
      x, y: y + 0.06, w: 0.28, h: 0.28,
      fontFace: TITULO, fontSize: 10, bold: true, color: INK, align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    });
    s.addText(tit, {
      x: x + 0.42, y, w: 3.9, h: 0.28,
      fontFace: TITULO, fontSize: 12, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.42, y: y + 0.28, w: 3.9, h: 0.5,
      fontFace: SANS, fontSize: 10, color: TXT_SOFT, lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
  });
  pie(s, 9);
  s.addNotes('La pantalla evita el error clásico de los tests vocacionales: soltar un veredicto y punto. Aquí se explica el porqué, se ofrecen alternativas y se dan los siguientes pasos concretos. El propio texto de la pantalla dice que es una recomendación para abrir puertas, no una etiqueta.');
}

/* ========================================================================== */
/* 10 — Los arquetipos                                                        */
/* ========================================================================== */
{
  const s = nuevaOscura();
  s.addText('LOS CINCO ARQUETIPOS', {
    x: M, y: 0.42, w: 8.9, h: 0.25,
    fontFace: MONO, fontSize: 10, bold: true, color: ORO, charSpacing: 1.6, isTextBox: true, margin: 0,
  });
  titulo(s, 'El resultado, contado en una frase', { color: CREMA });
  subtitulo(s, 'No añaden una medida nueva: traducen el mismo vector de dimensiones a algo que se recuerda y se comparte.', { color: '9A958F' });

  const arq = [
    ['El Creador Digital', 'Lo que imaginas, lo construyes'],
    ['El Guardián Asistencial', 'Estar cuando de verdad hace falta'],
    ['El Maestro de Engranajes', 'Si tiene piezas, lo entiendes'],
    ['El Estratega Organizador', 'Que todo cuadre y llegue a tiempo'],
    ['El Explorador de Campo', 'Tu oficina no tiene techo'],
  ];
  const colores = ['8A5CD6', '297A6C', '9C5A2A', '3D6EA8', '4A7F3C'];

  arq.forEach(([n, l], i) => {
    const x = M + i * 1.79;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.4, w: 1.62, h: 2.1, rectRadius: 0.08,
      fill: { color: INK_SOFT }, line: { color: colores[i], width: 1 },
    });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.58, y: 2.62, w: 0.46, h: 0.46, fill: { color: colores[i] }, line: { width: 0 } });
    s.addText(n, {
      x: x + 0.15, y: 3.24, w: 1.32, h: 0.62,
      fontFace: TITULO, fontSize: 11, bold: true, color: CREMA, align: 'center', lineSpacingMultiple: 0.95, isTextBox: true, margin: 0,
    });
    s.addText(`«${l}»`, {
      x: x + 0.12, y: 3.88, w: 1.38, h: 0.5,
      fontFace: SANS, fontSize: 8.5, italic: true, color: '9A958F', align: 'center', lineSpacingMultiple: 1.05, isTextBox: true, margin: 0,
    });
  });
  pie(s, 10, { claro: false });
  s.addNotes('Los arquetipos son la capa de gamificación. Se asignan por similitud del coseno igual que las familias, así que no son un adorno desconectado: salen del mismo cálculo. Su valor es comunicativo: "soy un Maestro de Engranajes" se recuerda y se cuenta; "tengo 81 % de afinidad con Fabricación Mecánica" no.');
}

/* ========================================================================== */
/* 11 — Comparador                                                            */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 5 · Comparador');
  titulo(s, 'Cara a cara: dos o tres ciclos, seis criterios');
  subtitulo(s, 'Cuando la duda ya no es el sector sino cuál de estas opciones parecidas elegir.');

  const criterios = [
    ['Grado y horas', 'Nivel y duración oficial'],
    ['Inserción laboral', 'Porcentaje estimado'],
    ['Sueldo de entrada', 'Banda en euros brutos/año'],
    ['Demanda del mercado', 'Media, alta o muy alta'],
    ['Modalidad', 'Presencial, dual o teletrabajo'],
    ['Tipo de esfuerzo', 'Carga lógica frente a práctica'],
  ];
  criterios.forEach(([tit, txt], i) => {
    const x = M + (i % 3) * 3.05;
    const y = 2.3 + Math.floor(i / 3) * 1.28;
    tarjeta(s, { x, y, w: 2.8, h: 1.15 });
    s.addText(tit, {
      x: x + 0.25, y: y + 0.24, w: 2.3, h: 0.3,
      fontFace: TITULO, fontSize: 12, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.25, y: y + 0.56, w: 2.3, h: 0.4,
      fontFace: SANS, fontSize: 10, color: TXT_SOFT, isTextBox: true, margin: 0,
    });
  });

  s.addText('Además: los módulos clave y las salidas principales de cada ciclo, uno al lado del otro.', {
    x: M, y: 5.02, w: 7.0, h: 0.3,
    fontFace: SANS, fontSize: 9.5, italic: true, color: TXT_SOFT, isTextBox: true, margin: 0,
  });
  pie(s, 11);
  s.addNotes('El comparador nace de una observación: la duda real de un estudiante rara vez es "sanidad o informática", sino "Grado Medio de esto o Grado Superior de aquello". Ver las métricas alineadas en columnas resuelve esa duda mucho mejor que leer dos descripciones seguidas.');
}

/* ========================================================================== */
/* 12 — Itinerarios                                                           */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 6 · Itinerarios');
  titulo(s, 'Nada se cierra: el recorrido completo, dibujado');
  subtitulo(s, 'Desde dónde partes hasta dónde puedes llegar, con los pasos opcionales marcados como tales.');

  const ruta = [
    ['Punto de partida', 'Sin ESO, con ESO, con Bachillerato o con un Grado Medio ya hecho.', '9A958F'],
    ['El ciclo elegido', 'Básico, Medio o Superior. Dos cursos, 2.000 horas con prácticas en empresa.', ORO],
    ['Especialización', 'Los «másteres de la FP»: IA y Big Data, Ciberseguridad, Vehículos híbridos…', TERRACOTA],
    ['Universidad', 'Sin selectividad desde el Grado Superior, con 30 a 60 créditos ECTS convalidados.', SALVIA],
  ];
  ruta.forEach(([tit, txt, color], i) => {
    const y = 2.3 + i * 0.72;
    s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.08, w: 0.34, h: 0.34, fill: { color }, line: { width: 0 } });
    s.addText(String(i + 1), {
      x: M, y: y + 0.08, w: 0.34, h: 0.34,
      fontFace: TITULO, fontSize: 11, bold: true, color: i === 3 ? CREMA : INK, align: 'center', valign: 'middle', isTextBox: true, margin: 0,
    });
    if (i < 3) {
      s.addShape(pres.ShapeType.rect, { x: M + 0.16, y: y + 0.42, w: 0.02, h: 0.3, fill: { color: BORDE }, line: { width: 0 } });
    }
    s.addText(tit, {
      x: M + 0.55, y, w: 3, h: 0.3,
      fontFace: TITULO, fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: M + 0.55, y: y + 0.3, w: 8.2, h: 0.35,
      fontFace: SANS, fontSize: 10.5, color: TXT_SOFT, isTextBox: true, margin: 0,
    });
    if (i >= 2) {
      s.addText('OPCIONAL', {
        x: 8.6, y: y + 0.04, w: 0.85, h: 0.22,
        fontFace: MONO, fontSize: 7.5, bold: true, color: TXT_SOFT, align: 'right', isTextBox: true, margin: 0,
      });
    }
  });
  pie(s, 12);
  s.addNotes('Este módulo responde al miedo más común: "si me meto en FP, ¿me cierro puertas?". La respuesta visual es que no. Del Básico se pasa al Medio, del Medio al Superior sin prueba, y del Superior a la universidad sin selectividad y con créditos ya convalidados.');
}

/* ========================================================================== */
/* 13 — Gemas ocultas                                                         */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 7 · Descubrimiento');
  titulo(s, 'Gemas ocultas: alta inserción, pocas matrículas');
  subtitulo(s, 'No están vacíos porque sean malos, sino porque casi nadie sabe que existen. Un botón «Sorpréndeme» los saca al azar.', { w: 5.6 });

  const gemas = [
    'Mantenimiento Aeromecánico de Aviones',
    'Audiología Protésica',
    'Química Industrial',
    'Mecatrónica Industrial',
    'Patronaje y Moda',
  ];
  gemas.forEach((g, i) => {
    const y = 2.4 + i * 0.44;
    insignia(s, { x: M, y: y - 0.02, d: 0.3, color: ORO, icono: 'gema' });
    s.addText(g, {
      x: M + 0.45, y, w: 5.1, h: 0.32,
      fontFace: SANS, fontSize: 11.5, color: TXT, isTextBox: true, margin: 0,
    });
  });

  tarjeta(s, { x: 6.2, y: 2.3, w: 3.25, h: 2.3 });
  s.addText('Hasta 96 %', {
    x: 6.45, y: 2.6, w: 2.8, h: 0.55,
    fontFace: TITULO, fontSize: 27, bold: true, color: INK, isTextBox: true, margin: 0,
  });
  s.addText('DE INSERCIÓN ESTIMADA', {
    x: 6.45, y: 3.14, w: 2.8, h: 0.24,
    fontFace: MONO, fontSize: 8.5, bold: true, color: TXT_SOFT, charSpacing: 1, isTextBox: true, margin: 0,
  });
  s.addText('Cada gema incluye un relato de «Un día en el trabajo», para que se entienda qué se hace de verdad en ese oficio.', {
    x: 6.45, y: 3.55, w: 2.8, h: 0.85,
    fontFace: SANS, fontSize: 10, color: TXT_SOFT, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
  });
  pie(s, 13);
  s.addNotes('Estos ciclos tienen un problema de marketing, no de calidad. El botón "Sorpréndeme" existe porque no se puede comparar lo que no se sabe que existe: hace falta un empujón al azar antes de que el estudiante pueda tener una opinión. Los relatos son descripciones de la tarea, no testimonios de personas reales, y la app lo dice.');
}

/* ========================================================================== */
/* 14 — Mitos                                                                 */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 8 · Mitos');
  titulo(s, 'Cuatro tópicos, cuatro respuestas con datos');
  subtitulo(s, 'Tarjetas giratorias: delante el mito, detrás la realidad y el dato que la sostiene.');

  const mitos = [
    ['«La FP es para quien no vale»', 'Hay más ofertas que titulados en electricidad, mecanizado, mecatrónica e informática. Esa escasez no se da en formaciones fáciles.'],
    ['«Si haces FP, adiós universidad»', 'Desde el Grado Superior se entra sin selectividad, con 30 a 60 créditos ECTS reconocidos según la titulación.'],
    ['«Con FP se cobra poco»', 'Los perfiles técnicos más escasos arrancan en bandas que muchos titulados universitarios tardan años en alcanzar.'],
    ['«Si me equivoco, pierdo dos años»', 'Los módulos comunes convalidan entre ciclos, y del Medio se pasa al Superior sin prueba de acceso.'],
  ];
  mitos.forEach(([m, r], i) => {
    const x = M + (i % 2) * 4.6;
    const y = 2.3 + Math.floor(i / 2) * 1.32;
    tarjeta(s, { x, y, w: 4.35, h: 1.2 });
    s.addText(m, {
      x: x + 0.25, y: y + 0.18, w: 3.9, h: 0.28,
      fontFace: TITULO, fontSize: 11.5, bold: true, color: 'C0392B', isTextBox: true, margin: 0,
    });
    s.addText(r, {
      x: x + 0.25, y: y + 0.5, w: 3.9, h: 0.6,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
  });
  pie(s, 14);
  s.addNotes('Los mitos son el mayor obstáculo de la FP, y casi todos vienen de cómo era el sistema hace treinta años. Las tarjetas giratorias funcionan bien aquí: obligan a un gesto, y ese gesto hace que la refutación se lea de verdad en lugar de pasar de largo.');
}

/* ========================================================================== */
/* 15 — El informe                                                            */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Módulo 9 · Informe');
  titulo(s, 'Un informe que se puede imprimir y llevar');
  subtitulo(s, 'Pensado para enseñárselo a la familia o al departamento de orientación del centro.', { w: 5.2 });

  const partes = [
    'Arquetipo vocacional y afinidad por familias',
    'Los ciclos mejor valorados, con sus salidas laborales',
    'Hoja de ruta académica sugerida, paso a paso',
    'Checklist con las 6 fases de admisión y matrícula',
    'Portales oficiales de las 18 comunidades autónomas',
  ];
  partes.forEach((p, i) => {
    const y = 2.32 + i * 0.46;
    s.addShape(pres.ShapeType.rect, { x: M, y: y + 0.06, w: 0.16, h: 0.16, fill: { color: CREMA }, line: { color: INK, width: 1 } });
    s.addText(p, {
      x: M + 0.34, y, w: 5.1, h: 0.34,
      fontFace: SANS, fontSize: 11, color: TXT, isTextBox: true, margin: 0,
    });
  });

  tarjeta(s, { x: 6.3, y: 2.3, w: 3.15, h: 2.15 });
  insignia(s, { x: 6.6, y: 2.58, d: 0.5, color: ORO, icono: 'descarga' });
  s.addText('Sin librerías de PDF', {
    x: 6.6, y: 3.2, w: 2.6, h: 0.3,
    fontFace: TITULO, fontSize: 12.5, bold: true, color: INK, isTextBox: true, margin: 0,
  });
  s.addText('Se usa una hoja de estilos de impresión y el propio diálogo del navegador, que ya ofrece «Guardar como PDF». Menos peso y mejor resultado que un lienzo rasterizado.', {
    x: 6.6, y: 3.52, w: 2.6, h: 0.85,
    fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
  });
  pie(s, 15);
  s.addNotes('Decisión técnica que merece explicarse: no se incluye ninguna librería de PDF. El informe se maqueta con CSS de impresión y el navegador hace el resto. Pesa menos, el texto queda seleccionable y se imprime nítido, cosa que no ocurre con las soluciones que rasterizan la pantalla.');
}

/* ========================================================================== */
/* 16 — El catálogo                                                           */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'El contenido');
  titulo(s, '46 ciclos reales en 14 familias profesionales');
  subtitulo(s, 'Títulos del sistema educativo español, con sus módulos, salidas e itinerarios.', { w: 5 });

  s.addChart(
    pres.ChartType.bar,
    [{ name: 'Ciclos', labels: ['Grado Básico', 'Grado Medio', 'Grado Superior'], values: [6, 13, 27] }],
    {
      x: 0.35, y: 2.15, w: 4.6, h: 2.7,
      barDir: 'col',
      chartColors: [ORO, TERRACOTA, SALVIA],
      varyColors: true,
      showTitle: true, title: 'Ciclos por grado', titleFontSize: 11, titleColor: TXT_SOFT, titleFontFace: SANS,
      showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelColor: INK, dataLabelFontFace: SANS,
      showLegend: false,
      catAxisLabelColor: TXT_SOFT, catAxisLabelFontSize: 9.5, catAxisLabelFontFace: SANS,
      valAxisHidden: true,
      valGridLine: { style: 'none' },
      catGridLine: { style: 'none' },
      plotArea: { fill: { color: CREMA } },
      chartArea: { fill: { color: CREMA } },
    },
  );

  const fam = [
    'Informática', 'Sanidad', 'Administración', 'Electricidad', 'Imagen y Sonido',
    'Hostelería', 'Sociocultural', 'Fabricación Mecánica', 'Comercio', 'Automoción',
    'Deportes', 'Química', 'Instalación', 'Textil',
  ];
  s.addText('LAS 14 FAMILIAS', {
    x: 5.4, y: 2.25, w: 4, h: 0.25,
    fontFace: MONO, fontSize: 9, bold: true, color: TXT_SOFT, charSpacing: 1.2, isTextBox: true, margin: 0,
  });
  fam.forEach((f, i) => {
    const x = 5.4 + (i % 2) * 2.05;
    const y = 2.58 + Math.floor(i / 2) * 0.32;
    s.addShape(pres.ShapeType.ellipse, { x, y: y + 0.08, w: 0.1, h: 0.1, fill: { color: TERRACOTA }, line: { width: 0 } });
    s.addText(f, {
      x: x + 0.2, y, w: 1.85, h: 0.26,
      fontFace: SANS, fontSize: 10, color: TXT, isTextBox: true, margin: 0,
    });
  });
  pie(s, 16);
  s.addNotes('El catálogo no pretende ser exhaustivo: el sistema español tiene 26 familias y cientos de títulos. Son 46 ciclos representativos, elegidos para cubrir los tres grados y los sectores con más salida. Añadir uno nuevo es un objeto más en un fichero: el explorador, el buscador y el algoritmo lo recogen solos.');
}

/* ========================================================================== */
/* 17 — Cómo está construido                                                  */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Bajo el capó');
  titulo(s, 'Cómo está construido');
  subtitulo(s, 'Sin backend, sin base de datos y sin cuentas de usuario: todo ocurre en el navegador.');

  const stack = [
    ['codigo', 'React 18 + Vite 5 + TypeScript', 'Modo estricto, sin errores de compilación. 35 ficheros fuente, unas 6.600 líneas.'],
    ['catalogo', 'Tailwind CSS + framer-motion', 'Los colores son variables CSS, así que el modo oscuro no duplica una sola clase.'],
    ['escudo', 'localStorage con versionado', 'Guarda el test a medias y el resultado. Todo envuelto en try/catch: el modo incógnito no lo tumba.'],
  ];
  stack.forEach(([ico, tit, txt], i) => {
    const y = 2.3 + i * 0.92;
    insignia(s, { x: M, y: y + 0.05, d: 0.54, color: i === 0 ? ORO : i === 1 ? TERRACOTA : SALVIA, icono: ico, oscuro: i !== 2 });
    s.addText(tit, {
      x: M + 0.78, y, w: 5, h: 0.3,
      fontFace: TITULO, fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: M + 0.78, y: y + 0.3, w: 5.6, h: 0.5,
      fontFace: SANS, fontSize: 10.5, color: TXT_SOFT, lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
  });

  tarjeta(s, { x: 6.75, y: 2.3, w: 2.7, h: 2.4 });
  const metricas = [['133 kB', 'JavaScript comprimido'], ['0', 'peticiones a servidor'], ['7', 'vistas con URL propia']];
  metricas.forEach(([v, l], i) => {
    const y = 2.55 + i * 0.72;
    s.addText(v, {
      x: 6.98, y, w: 2.3, h: 0.36,
      fontFace: TITULO, fontSize: 19, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(l, {
      x: 6.98, y: y + 0.34, w: 2.3, h: 0.26,
      fontFace: SANS, fontSize: 9, color: TXT_SOFT, isTextBox: true, margin: 0,
    });
  });
  pie(s, 17);
  s.addNotes('Al no haber backend, el despliegue es un hosting estático y el coste de mantenimiento es prácticamente cero. No se recoge ningún dato personal: el test vive en el navegador de quien lo hace y no sale de ahí. Eso simplifica mucho la conversación sobre privacidad en un producto dirigido a menores.');
}

/* ========================================================================== */
/* 18 — Calidad                                                               */
/* ========================================================================== */
{
  const s = nuevaClara();
  eyebrow(s, 'Calidad');
  titulo(s, 'Accesibilidad y dos guardias automáticas');
  subtitulo(s, 'Un test vocacional que recomienda mal es peor que no tener test. Estas comprobaciones existen por eso.');

  tarjeta(s, { x: M, y: 2.28, w: 4.35, h: 2.35 });
  insignia(s, { x: M + 0.25, y: 2.5, d: 0.48, color: SALVIA, icono: 'personas', oscuro: false });
  s.addText('Accesibilidad AA', {
    x: M + 0.25, y: 3.08, w: 3.9, h: 0.3,
    fontFace: TITULO, fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0,
  });
  [
    'Contraste verificado en claro y en oscuro',
    'Navegación completa por teclado y foco visible',
    'Landmarks, aria y un solo h1 por vista',
    'Se respeta «reducir movimiento»',
  ].forEach((t, i) => {
    s.addText(t, {
      x: M + 0.25, y: 3.42 + i * 0.29, w: 3.9, h: 0.26,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, bullet: true, isTextBox: true, margin: 0,
    });
  });

  tarjeta(s, { x: 5.1, y: 2.28, w: 4.35, h: 2.35 });
  insignia(s, { x: 5.35, y: 2.5, d: 0.48, color: ORO, icono: 'refresco' });
  s.addText('npm run check', {
    x: 5.35, y: 3.08, w: 3.9, h: 0.3,
    fontFace: TITULO, fontSize: 13, bold: true, color: INK, isTextBox: true, margin: 0,
  });
  [
    'Equilibrio: ninguna dimensión puede quedarse corta',
    'Etiquetas: ninguna puede ser inalcanzable en el test',
    'Mercado: bandas y escalas dentro de rango',
    '10 perfiles arquetípicos deben aterrizar bien',
  ].forEach((t, i) => {
    s.addText(t, {
      x: 5.35, y: 3.42 + i * 0.29, w: 3.9, h: 0.26,
      fontFace: SANS, fontSize: 9.5, color: TXT_SOFT, bullet: true, isTextBox: true, margin: 0,
    });
  });

  s.addText('Estas guardias corren también en el despliegue: si alguien rompe el dataset, la publicación falla en lugar de sacar a producción un test que recomienda cualquier cosa.', {
    x: M, y: 4.9, w: 7.0, h: 0.34,
    fontFace: SANS, fontSize: 9.5, italic: true, color: TXT_SOFT, isTextBox: true, margin: 0,
  });
  pie(s, 18);
  s.addNotes('Merece la pena contar por qué existen estas guardias. Durante el desarrollo aparecieron dos fallos reales que ningún compilador detecta: cuatro etiquetas que los ciclos declaraban pero el test nunca podía producir, y un desequilibrio que impedía a Sanidad salir primera por mucho que encajara. Los dos eran invisibles hasta que se midieron.');
}

/* ========================================================================== */
/* 19 — Honestidad de los datos                                               */
/* ========================================================================== */
{
  const s = nuevaOscura();
  s.addText('LO MÁS IMPORTANTE DE ESTA PRESENTACIÓN', {
    x: M, y: 0.42, w: 8.9, h: 0.25,
    fontFace: MONO, fontSize: 10, bold: true, color: ORO, charSpacing: 1.6, isTextBox: true, margin: 0,
  });
  titulo(s, 'Qué datos son sólidos y cuáles son estimaciones', { color: CREMA });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 1.85, w: 4.35, h: 2.75, rectRadius: 0.08,
    fill: { color: INK_SOFT }, line: { color: SALVIA, width: 1 },
  });
  s.addText('SÓLIDO Y VERIFICABLE', {
    x: M + 0.28, y: 2.08, w: 3.8, h: 0.25,
    fontFace: MONO, fontSize: 9, bold: true, color: '7EC8AA', charSpacing: 1, isTextBox: true, margin: 0,
  });
  [
    'Los 46 títulos y sus módulos',
    'Los requisitos de acceso a cada grado',
    'Las pasarelas entre grados y a la universidad',
    'Los portales oficiales de las 18 comunidades',
  ].forEach((t, i) => {
    s.addText(t, {
      x: M + 0.28, y: 2.45 + i * 0.42, w: 3.8, h: 0.38,
      fontFace: SANS, fontSize: 10.5, color: 'C9C4BE', bullet: true, isTextBox: true, margin: 0,
    });
  });
  s.addText('Contrastable en el BOE y en Todo FP.', {
    x: M + 0.28, y: 4.18, w: 3.8, h: 0.28,
    fontFace: SANS, fontSize: 9.5, italic: true, color: '8A857F', isTextBox: true, margin: 0,
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: 5.1, y: 1.85, w: 4.35, h: 2.75, rectRadius: 0.08,
    fill: { color: INK_SOFT }, line: { color: TERRACOTA, width: 1 },
  });
  s.addText('ESTIMACIÓN ORIENTATIVA', {
    x: 5.38, y: 2.08, w: 3.8, h: 0.25,
    fontFace: MONO, fontSize: 9, bold: true, color: TERRACOTA, charSpacing: 1, isTextBox: true, margin: 0,
  });
  [
    'Porcentajes de inserción laboral',
    'Bandas salariales de entrada',
    'Nivel de demanda del mercado',
    'Ventanas del calendario de matrícula',
  ].forEach((t, i) => {
    s.addText(t, {
      x: 5.38, y: 2.45 + i * 0.42, w: 3.8, h: 0.38,
      fontFace: SANS, fontSize: 10.5, color: 'C9C4BE', bullet: true, isTextBox: true, margin: 0,
    });
  });
  s.addText('Aisladas en un único fichero, etiquetadas como orientativas en pantalla.', {
    x: 5.38, y: 4.18, w: 3.8, h: 0.28,
    fontFace: SANS, fontSize: 9.5, italic: true, color: '8A857F', isTextBox: true, margin: 0,
  });

  s.addText('Antes de publicarlo como servicio real hay que sustituir esas estimaciones por datos del SEPE, del INE y de los observatorios autonómicos. El código dice dónde y cómo.', {
    x: M, y: 4.82, w: 8.9, h: 0.45,
    fontFace: SANS, fontSize: 11, color: ORO, lineSpacingMultiple: 1.1, isTextBox: true, margin: 0,
  });
  pie(s, 19, { claro: false });
  s.addNotes('Esta es la diapositiva que no hay que saltarse. Las cifras de inserción y salario son estimaciones razonadas, no estadísticas oficiales, y viven aisladas en src/data/mercadoLaboral.ts precisamente para que se puedan sustituir de una sentada. La interfaz las etiqueta como orientativas en cada pantalla. El calendario recoge fases y ventanas aproximadas, no fechas concretas, porque cada comunidad publica las suyas cada curso. Decirlo abiertamente es parte del producto: una herramienta de orientación que finge precisión que no tiene pierde toda su credibilidad.');
}

/* ========================================================================== */
/* 20 — Cierre                                                                */
/* ========================================================================== */
{
  const s = nuevaOscura();
  s.addShape(pres.ShapeType.ellipse, { x: 8.1, y: -0.9, w: 2.8, h: 2.8, fill: { color: ORO, transparency: 85 }, line: { width: 0 } });

  s.addText('ESTADO Y SIGUIENTES PASOS', {
    x: M, y: 0.55, w: 8.9, h: 0.25,
    fontFace: MONO, fontSize: 10, bold: true, color: ORO, charSpacing: 1.6, isTextBox: true, margin: 0,
  });
  titulo(s, 'Listo para publicar', { color: CREMA, y: 0.88, size: 34 });

  const estado = [
    ['Ya funciona', 'Compila sin errores, pasa las dos guardias y está verificado en móvil y escritorio.'],
    ['Despliegue', 'Netlify, con el repositorio conectado o subiendo un zip. Un hosting estático basta.'],
    ['Siguiente paso', 'Sustituir las estimaciones de mercado por datos oficiales antes de abrirlo al público.'],
    ['Después', 'Ampliar el catálogo, añadir oferta por centro y traducir a las lenguas cooficiales.'],
  ];
  estado.forEach(([tit, txt], i) => {
    const x = M + (i % 2) * 4.6;
    const y = 2.1 + Math.floor(i / 2) * 1.28;
    s.addShape(pres.ShapeType.roundRect, {
      x, y, w: 4.35, h: 1.12, rectRadius: 0.08,
      fill: { color: INK_SOFT }, line: { width: 0 },
    });
    s.addText(tit, {
      x: x + 0.28, y: y + 0.18, w: 3.8, h: 0.28,
      fontFace: TITULO, fontSize: 13, bold: true, color: ORO, isTextBox: true, margin: 0,
    });
    s.addText(txt, {
      x: x + 0.28, y: y + 0.5, w: 3.8, h: 0.5,
      fontFace: SANS, fontSize: 10, color: 'C9C4BE', lineSpacingMultiple: 1.08, isTextBox: true, margin: 0,
    });
  });

  s.addText('OrientaFP · Orientación de Formación Profesional', {
    x: M, y: 4.85, w: 8.9, h: 0.3,
    fontFace: MONO, fontSize: 9.5, color: '8A857F', isTextBox: true, margin: 0,
  });
  s.addNotes('Cierre: el producto está terminado y verificado a nivel técnico. Lo único que separa la versión actual de una publicable de cara al público es sustituir las estimaciones de mercado por datos oficiales. A partir de ahí, las líneas naturales de crecimiento son ampliar el catálogo, cruzarlo con la oferta real de centros por provincia y traducirlo a las lenguas cooficiales.');
}

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.argv[2] ?? join(raiz, 'OrientaFP-presentacion.pptx');

await pres.writeFile({ fileName: destino });
console.log('Presentación generada:', destino);
