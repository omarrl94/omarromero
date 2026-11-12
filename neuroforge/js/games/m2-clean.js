// Misión 2 · Limpia el dataset: encuentra filas y columnas tóxicas antes de entrenar.
import { h } from '../ui.js';

const LEVELS = [
  {
    title: 'Notas de alumnos', target: '¿aprobará el curso?',
    cols: ['alumno', 'edad', 'horas_estudio', 'asistencia_%', 'aprobó'],
    rows: [
      ['Ana', 17, 12, 95, 'Sí'], ['Luis', 18, 4, 60, 'No'], ['Marta', 17, 15, 100, 'Sí'], ['Hugo', 212, 8, 80, 'Sí', 'Edad imposible: 212 años'],
      ['Sara', 18, 10, 90, 'Sí'], ['Pablo', 17, '', 70, 'No', 'Valor perdido en horas_estudio'], ['Lucía', 18, 7, 85, 'Sí'], ['Ana', 17, 12, 95, 'Sí', 'Duplicado de la fila 1'],
      ['Iván', 17, 3, 40, 'No'], ['Noa', 18, 9, 88, 'Sí'], ['Dani', 17, 6, 150, 'Sí', 'Asistencia del 150 %: imposible'], ['Eva', 18, 14, 97, 'Sí'],
    ],
  },
  {
    title: 'Fotos de mascotas', target: '¿gato o perro?', leak: [],
    cols: ['foto', 'peso_kg', 'orejas', 'cola_cm', 'especie'],
    rows: [
      ['f001', 4.2, 'puntiagudas', 28, 'gato'], ['f002', 25, 'caídas', 40, 'perro'], ['f003', 3.8, 'puntiagudas', 26, 'gato'], ['f004', 31, 'caídas', 45, 'perro'],
      ['f005', 4.5, 'puntiagudas', 30, 'perro', 'Etiqueta errónea: pesa 4,5 kg y es gato (foto de gato marcada como perro)'], ['f006', -3, 'puntiagudas', 27, 'gato', 'Peso negativo: error del sensor'], ['f007', 22, 'caídas', 38, 'perro'],
      ['f008', 5.0, 'puntiagudas', 29, 'gato'], ['f009', 24, 'caídas', 400, 'perro', 'Cola de 400 cm: valor atípico (error de unidades)'], ['f010', 3.5, 'puntiagudas', 25, 'gato'], ['f011', 27, 'caídas', 42, 'perro'], ['f002', 25, 'caídas', 40, 'perro', 'Duplicado de f002'],
    ],
  },
  {
    title: 'Predecir el abandono', target: '¿abandonará el instituto?', dropCols: { 'nota_final': 'Fuga de datos: solo se conoce al acabar el curso, cuando ya sabes si abandonó.', 'dni': 'Irrelevante (y dato personal): es un identificador único, no una característica útil.' },
    cols: ['dni', 'faltas', 'nota_final', 'trabaja', 'abandona'],
    rows: [
      ['1111A', 3, 7.5, 'No', 'No'], ['2222B', 25, 3.1, 'Sí', 'Sí'], ['3333C', 5, 6.8, 'No', 'No'], ['4444D', 30, 2.0, 'Sí', 'Sí'], ['5555E', '', 5.5, 'No', 'No', 'Valor perdido en faltas'],
      ['6666F', 2, 8.2, 'No', 'No'], ['7777G', 40, 1.5, 'Sí', 'Sí'], ['8888H', 999, 4.0, 'Sí', 'Sí', 'Faltas = 999: probable error de grabación'], ['9999I', 6, 6.0, 'No', 'No'], ['2222B', 25, 3.1, 'Sí', 'Sí', 'Duplicado de la fila 2'], ['1010J', 12, 5.0, 'Sí', 'No'], ['1212K', 28, 3.3, 'Sí', 'Sí'],
    ],
  },
];

export default {
  id: 2, title: 'Limpia el dataset', icon: '🧹', lesson: 2, color: '#a3ff3d',
  blurb: 'Datos reales = datos sucios. Encuentra valores imposibles, duplicados, etiquetas erróneas y columnas con trampa.',
  levels: LEVELS.map((l) => ({ name: l.title, desc: l.dropCols ? 'Filas y columnas' : 'Filas sucias' })),
  mount(root, li, api) {
    const L = LEVELS[li];
    const selR = new Set(), selC = new Set();
    const badRows = L.rows.map((r, i) => (r[5] ? i : -1)).filter((i) => i >= 0);
    const info = h('div.stat');
    const tbl = h('table.dtable');
    const result = h('div');
    const redraw = () => {
      tbl.replaceChildren(
        h('thead', h('tr', L.cols.map((c) => h('th', { class: (L.dropCols ? 'colsel ' : '') + (selC.has(c) ? 'drop' : ''), title: L.dropCols ? 'Clic para marcar la columna como tóxica' : '', onclick: L.dropCols ? () => { selC.has(c) ? selC.delete(c) : selC.add(c); redraw(); } : null }, c)))),
        h('tbody', L.rows.map((r, i) => h('tr', { class: selR.has(i) ? 'sel' : '', onclick: () => { selR.has(i) ? selR.delete(i) : selR.add(i); api.sfx('tick'); redraw(); } }, L.cols.map((_, k) => h('td', r[k] === '' ? h('i.rd', 'vacío') : String(r[k]))))))
      );
      info.replaceChildren(h('div', h('b', selR.size), 'filas marcadas'), L.dropCols ? h('div', h('b', selC.size), 'columnas marcadas') : '');
    };
    root.append(
      h('div.goal', h('b', L.title), ` — objetivo del modelo: `, h('i', L.target), '. ', 'Haz clic en las ', h('b.rd', 'filas'), ' que contaminarían el entrenamiento', L.dropCols ? [' y en las ', h('b.rd', 'cabeceras de columna'), ' que sean fuga de datos o irrelevantes'] : '', '. ¡Cuidado con eliminar datos buenos!'),
      h('div', { style: { overflowX: 'auto' } }, tbl), info,
      h('div.row', h('button.btn.l', { onclick: submit }, '🧪 Entrenar modelo con lo que queda')), result);
    redraw();
    function submit() {
      const missed = badRows.filter((i) => !selR.has(i));
      const wrong = [...selR].filter((i) => !badRows.includes(i));
      const cols = L.dropCols ? Object.keys(L.dropCols) : [];
      const missedC = cols.filter((c) => !selC.has(c)), wrongC = [...selC].filter((c) => !cols.includes(c));
      const errors = missed.length + wrong.length + missedC.length + wrongC.length;
      const lines = [];
      missed.forEach((i) => lines.push(h('li.rd', `Te dejaste la fila ${i + 1} (${L.rows[i][0]}): ${L.rows[i][5]}`)));
      wrong.forEach((i) => lines.push(h('li.am', `La fila ${i + 1} (${L.rows[i][0]}) era buena: has tirado datos válidos.`)));
      missedC.forEach((c) => lines.push(h('li.rd', `Columna «${c}»: ${L.dropCols[c]}`)));
      wrongC.forEach((c) => lines.push(h('li.am', `La columna «${c}» era útil.`)));
      const acc = Math.max(41, 96 - errors * 9);
      result.replaceChildren(h('div.glass', { style: { marginTop: '12px' } }, h('h3', `Precisión del modelo: ${acc} %`), errors ? h('ul', lines) : h('p.li', '¡Dataset impecable! Todo lo sucio fuera y todo lo bueno dentro.')));
      if (errors === 0) api.win(3, 'Dataset limpio al 100 %.');
      else if (errors <= 1 && badRows.length > 3) api.win(2, 'Casi perfecto: un único fallo.');
      else if (errors <= 2) api.win(1, 'Aprobado… pero el modelo aprendió alguna basura.');
      else api.sfx('bad');
    }
  },
};
