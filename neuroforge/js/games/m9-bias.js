// Misión 9 · Auditoría de sesgos: un banco usa IA para conceder préstamos.
import { h } from '../ui.js';
import { biasData, biasRun } from '../ml.js';

const LV = [
  { name: 'Detecta el sesgo', desc: 'Brecha < 10 pts', gap: 0.10, acc: 0.78, noPatch: false },
  { name: 'Cierra la brecha', desc: 'Brecha < 5 pts y precisión', gap: 0.05, acc: 0.84, noPatch: false },
  { name: 'Arréglalo de raíz', desc: 'Sin parches', gap: 0.05, acc: 0.85, noPatch: true },
];

export default {
  id: 9, title: 'Auditoría de sesgos', icon: '⚖️', lesson: 9, color: '#ffb534',
  blurb: 'El modelo de crédito de un banco discrimina a un grupo. Encuentra por qué y arréglalo sin destrozar su utilidad.',
  levels: LV.map((l) => ({ name: l.name, desc: l.desc })),
  mount(root, li, api) {
    const L = LV[li], rows = biasData();
    const o = { useGroup: true, useZip: true, reweight: false, equalize: false, fixLabels: false };
    const res = h('div'), msg = h('div');
    const chk = (key, label, help) => h('label.sw', h('input', { type: 'checkbox', checked: o[key], onchange: (e) => { o[key] = e.target.checked; } }), h('span', h('b', label), h('span.sm.mut', ' — ' + help)));
    let last = null;
    function run() {
      const r = biasRun(rows, o); last = r;
      const bar = (name, v, col) => h('div.bar', h('span', name), h('div.tr', h('i', { style: { width: v * 100 + '%', background: col } })), h('span', (v * 100).toFixed(0) + '%'));
      res.replaceChildren(h('h3', 'Resultado de la auditoría'), bar('Grupo A', r.rate0, 'var(--cyan)'), bar('Grupo B', r.rate1, 'var(--mag)'),
        h('div.stat', h('div', h('b.' + (r.gap <= L.gap ? 'li' : 'rd'), (r.gap * 100).toFixed(1) + ' pts'), `brecha de aprobación (meta < ${L.gap * 100})`), h('div', h('b.' + (r.acc >= L.acc ? 'li' : 'rd'), (r.acc * 100).toFixed(0) + '%'), `precisión vs. realidad justa (meta ≥ ${L.acc * 100}%)`), h('div', h('b', (r.accHist * 100).toFixed(0) + '%'), 'precisión vs. decisiones históricas')),
        h('p.sm.mut', 'Observa: copiar las decisiones históricas (sesgadas) da “mucha precisión” contra la historia… pero la historia estaba mal.'));
      const patches = o.equalize || o.reweight;
      if (r.gap > L.gap) { msg.replaceChildren(h('p.rd', r.gap > .15 ? 'Brecha enorme. El grupo B recibe muchos menos créditos con la misma capacidad de pago.' : 'Mejor, pero aún hay brecha.')); api.sfx('bad'); }
      else if (r.acc < L.acc) { msg.replaceChildren(h('p.am', 'Brecha cerrada, pero el modelo ya no acierta lo suficiente. Busca otra combinación.')); api.sfx('bad'); }
      else if (L.noPatch && o.equalize) msg.replaceChildren(h('p.am', 'Funciona, pero el umbral por grupo es un parche que trata los síntomas. En este nivel arréglalo de raíz (datos).'));
      else api.win(!patches && (o.fixLabels || (!o.useGroup && !o.useZip)) ? 3 : 2, `Brecha ${(r.gap * 100).toFixed(1)} pts, precisión ${(r.acc * 100).toFixed(0)} %.`);
    }
    root.append(h('div.goal', h('b', 'Caso: '), 'un banco entrena un modelo con sus créditos concedidos en el pasado. El ', h('b', 'grupo B'), ' (35 % de clientes) tiene la misma capacidad de pago que el A, pero históricamente se le exigía más. Configura cómo entrenar y audita el resultado.'),
      h('div.two', h('div.glass',
        chk('useGroup', 'Usar la columna «grupo»', 'el atributo protegido como variable'), chk('useZip', 'Usar «código postal»', 'correlaciona con el grupo (variable proxy)'),
        chk('reweight', 'Dar más peso al grupo B', 'reponderar ejemplos'), chk('equalize', 'Umbral distinto por grupo', 'corrección posterior (parche)'),
        chk('fixLabels', 'Re-etiquetar con auditores', 'corregir las decisiones históricas injustas'),
        h('button.btn.l', { style: { marginTop: '10px' }, onclick: run }, '🔍 Entrenar y auditar'), msg),
        h('div.glass', res, h('p.sm.mut', 'Pulsa «Entrenar y auditar» tras cada cambio. Pistas: ¿basta con quitar «grupo»? ¿qué hace el código postal?'))));
    return () => last;
  },
};
