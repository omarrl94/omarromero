/** Instalador profesional automático: sirve para los tests y para «ver cómo lo haría un profesional». */
import { analyze, defaultCircuit, inBathZone, emptyState, roomAt, type Dev, type GState } from './logic';
import { circuitDef, dev, PIA_RATINGS, SECTIONS_GAME, type DevKind } from './data';
import { area, houseOf, officeId, type Room } from './houses';
import type { Client } from './clients';

export function autoSolve(houseId: string, client: Client): GState {
  const house = houseOf(houseId);
  const st = emptyState(house);
  const has = (id: string) => client.reqs.some((q) => q.id === id);
  let n = 0;
  const add = (kind: DevKind, x: number, y: number) => { const d: Dev = { id: `a${++n}`, kind, x, y, circuit: null }; d.circuit = defaultCircuit(kind, roomAt(house, x, y)); st.devices.push(d); return d; };
  const link = (sw: Dev, l: Dev) => st.links.push({ sw: sw.id, light: l.id });
  const spread = (r: Room, k: number, y: number, pad = 0.4) => Array.from({ length: k }, (_, i) => r.x + pad + ((r.w - 2 * pad) * (i + 0.5)) / k);
  const doorIn = (r: Room) => {
    const d = house.doors.find((q) => q.orient === 'h' && q.x >= r.x - 0.01 && q.x + q.len <= r.x + r.w + 0.01 && (Math.abs(q.y - r.y) < 0.01 || Math.abs(q.y - (r.y + r.h)) < 0.01));
    if (!d) return { x: r.x + 0.5, y: r.y + 0.4 };
    const top = Math.abs(d.y - r.y) < 0.01;
    return { x: d.x + d.len + 0.25, y: d.y + (top ? 0.3 : -0.3) };
  };
  for (const r of house.rooms) {
    const lights: Dev[] = [];
    const door = doorIn(r);
    switch (r.kind) {
      case 'salon': {
        const nl = Math.max(2, Math.ceil(area(r) / 18));
        spread(r, nl, 0).forEach((x) => lights.push(add('luz', x, r.y + r.h / 2)));
        const sw = add('int', door.x, door.y); lights.forEach((l) => link(sw, l));
        spread(r, Math.max(3, Math.ceil(area(r) / 6)), 0).forEach((x) => add('toma', x, r.y + r.h - 0.2));
        add('tomaTV', r.x + 1.6, r.y + 0.3);
        if (has('acSalon')) add('ac', r.x + r.w - 0.6, r.y + 0.3);
        break;
      }
      case 'cocina': {
        lights.push(add('luz', r.x + r.w / 2, r.y + r.h / 2));
        const sw = add('int', door.x, door.y); link(sw, lights[0]);
        add('toma', r.x + r.w - 0.3, r.y + 1.8); add('toma', r.x + r.w - 0.3, r.y + 2.6);
        add('tomaHorno', r.x + 1.2, r.y + 0.75);
        add('tomaLav', r.x + 0.3, r.y + r.h - 0.9); add('tomaLav', r.x + 1.0, r.y + r.h - 0.2);
        break;
      }
      case 'bano': {
        lights.push(add('luz', r.x + 0.9, r.y + r.h / 2));
        link(add('int', door.x, door.y), lights[0]);
        const spot = [[0.3, r.h - 0.4], [r.w / 2, r.h - 0.3], [0.3, 0.4], [r.w - 0.3, r.h - 0.3], [r.w / 2, 0.3]].map(([dx, dy]) => ({ x: r.x + dx, y: r.y + dy })).find((p) => !inBathZone(house, p, 0.7)) ?? { x: r.x + 0.3, y: r.y + r.h - 0.4 };
        add('toma', spot.x, spot.y);
        break;
      }
      case 'dormitorio': {
        lights.push(add('luz', r.x + r.w / 2, r.y + r.h / 2 - 0.4));
        const office = has('teletrabajo') && r.id === officeId(house);
        if (r.id === 'd1' && has('conmD1')) { const a = add('conm', door.x, door.y), b = add('conm', r.x + r.w / 2 + 1.3, r.y + r.h - 1.5); link(a, lights[0]); link(b, lights[0]); }
        else link(add('int', door.x, door.y), lights[0]);
        if (office) { spread(r, 6, 0).forEach((x) => add('toma', x, r.y + 0.25)); add('tomaTV', r.x + 0.4, r.y + 1.4); }
        else { add('toma', r.x + 0.3, r.y + 1.0); add('toma', r.x + r.w - 0.3, r.y + 1.0); add('toma', r.x + r.w / 2, r.y + 0.25); }
        if (r.id === 'd1' && has('tv')) add('tomaTV', r.x + r.w / 2 + 0.5, r.y + 0.3);
        break;
      }
      case 'pasillo': {
        const nl = Math.ceil(Math.max(r.w, r.h) / 5);
        spread(r, nl, 0, 0.8).forEach((x) => lights.push(add('luz', x, r.y + r.h / 2)));
        if (has('conmPasillo')) { const a = add('conm', r.x + 0.9, r.y + 0.3), b = add('conm', r.x + r.w - 0.5, r.y + 0.3); lights.forEach((l) => { link(a, l); link(b, l); }); }
        else { const sw = add('int', r.x + 0.9, r.y + 0.3); lights.forEach((l) => link(sw, l)); }
        spread(r, Math.max(1, Math.floor(Math.max(r.w, r.h) / 5)), 0, 2).forEach((x) => add('toma', x, r.y + r.h - 0.2));
        break;
      }
      case 'terraza': {
        if (has('luzTerraza')) { const l = add('luzExt', r.x + r.w / 2, r.y + r.h / 2); link(add('detector', r.x + r.w * 0.3 + 1.2, r.y + r.h - 0.3), l); }
        break;
      }
      case 'garaje': { if (has('ev')) add('ev', r.x + 0.3, r.y + r.h / 2); break; }
    }
  }
  // Viviendas grandes: las bases de uso general se reparten en dos circuitos para no superar los 16 A
  const gen = st.devices.filter((d) => d.circuit === 'C2');
  const load = gen.reduce((a, d) => a + dev(d.kind).p, 0) * circuitDef('C2').use / 230;
  if (load > 14) { const xs = gen.map((d) => d.x).sort((a, b) => a - b); const cut = xs[Math.floor(xs.length / 2)]; gen.filter((d) => d.x >= cut).forEach((d) => (d.circuit = 'C2b')); }
  st.panel = { ...house.panelDefault };
  // Calibres y secciones: los mínimos de cada circuito, ajustados hasta cumplir caída, Iz y magnético
  for (const id of Object.keys(analyze(st, house).circuits)) {
    const def = circuitDef(id);
    let section = def.section, curve: 5 | 10 | 20 = 10, inA = def.inA;
    for (let i = 0; i < 6; i++) {
      st.choices[id] = { inA, section, curve };
      const ci = analyze(st, house).circuits[id];
      if (ci.iz < inA || ci.dropPct > ci.dropLimit) { section = SECTIONS_GAME[Math.min(SECTIONS_GAME.length - 1, SECTIONS_GAME.indexOf(section) + 1)]; continue; }
      if (ci.icc < curve * inA) { if (curve === 10) { curve = 5; continue; } section = SECTIONS_GAME[Math.min(SECTIONS_GAME.length - 1, SECTIONS_GAME.indexOf(section) + 1)]; continue; }
      if (ci.ibUse > inA) { inA = PIA_RATINGS.find((p) => p > inA) ?? inA; continue; }
      break;
    }
  }
  const an = analyze(st, house);
  const iga = [25, 32, 40, 50, 63].find((v) => v >= an.igaMin) ?? 63;
  st.board = { iga, idCount: Math.ceil(Object.keys(an.circuits).length / 5), idA: [25, 40, 63].find((v) => v >= iga) ?? 63, idMa: 30, idType: 'A', spd: true };
  return st;
}
