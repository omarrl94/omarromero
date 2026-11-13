import { create } from 'zustand';
import type { Component, Project, TermRef, Wire } from './model/types';
import { PROJECT_VERSION } from './model/types';
import { defaultParams } from './model/library';
import { dosPilas } from './model/examples';
import type { Runtime, RuntimeState, SimEvent } from './model/netlist';
import { defaultPanel, type PanelConfig } from './model/panel';
import { currentLevel, UPSELL, VISITOR_LIMITS, visitorAllows } from './access';
import { syncReturns, UNIFILAR_TYPES } from './model/unifilar';
import { initialMeter, type MeterState } from './model/meter';
import { termPos } from './model/netlist';
import { nearestOnPolyline, snapG, snapJunction, splitWire, wirePoints } from './model/wiregeom';

/** Una fila de la hoja de medidas. */
export interface Measure { id: number; time: string; mode: string; points: string; value: number | null; text: string; unit: string; theory?: number }

const clone = <T,>(x: T): T => structuredClone(x);
const KEY = 'circuitossea:autosave';

function loadInitial(): Project {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* sin almacenamiento: seguimos con el ejemplo */ }
  return clone(dosPilas);
}

/** Migraciones del formato de proyecto. Hoy solo existe la versión 1. */
export function migrate(p: Project): Project {
  if (!p || !Array.isArray(p.components) || !Array.isArray(p.wires)) throw new Error('Archivo de proyecto no válido');
  return { ...p, version: PROJECT_VERSION, name: p.name ?? 'Sin título' };
}

export type InstId = 'meter' | 'scope' | 'watt';
export type ProbeKey = 'red' | 'black' | 'c1' | 'c2';
export interface InstWin { open: boolean; x: number | null; y: number | null; min: boolean }

export type View = 'schematic' | 'multifilar' | 'unifilar' | 'real' | 'cuadro' | 'plano' | 'juego' | 'averias' | 'boletin';

interface State {
  project: Project;
  past: Project[];
  future: Project[];
  selection: string[];
  wiring: TermRef | null;
  /** Codos ya fijados con clic del cable que se está dibujando, y orientación del siguiente tramo. */
  wiringPts: { x: number; y: number; v?: boolean }[];
  wiringFlip: boolean;
  clipboard: { components: Component[]; wires: Wire[] } | null;
  keys: boolean;
  toggleKeys(): void;
  addWirePoint(p: { x: number; y: number }): void;
  popWirePoint(): void;
  flipWire(): void;
  connectToWire(from: TermRef, wireId: string, p: { x: number; y: number }): boolean;
  rotateBy(ids: string[], dir: 1 | -1): void;
  nudge(dx: number, dy: number): void;
  copySelection(): void;
  cutSelection(): void;
  paste(at?: { x: number; y: number }): void;
  selectAll(): void;
  runtime: Runtime;
  booms: { id: number; comp: string; kind: RuntimeState }[];
  notices: { id: number; text: string }[];
  meter: MeterState;
  log: Measure[];
  sound: boolean;
  scopeTips: { c1: TermRef | null; c2: TermRef | null };
  scopeArm: 'c1' | 'c2' | null;
  dock: boolean;
  view: View;
  upsell: string | null;
  setUpsell(reason: string | null): void;
  inst: Record<InstId, InstWin>;
  toggleInst(id: InstId): void;
  moveInst(id: InstId, x: number, y: number): void;
  minInst(id: InstId): void;
  probeDrag: { key: ProbeKey; x: number; y: number } | null;
  setProbeDrag(d: { key: ProbeKey; x: number; y: number } | null): void;
  placeProbe(key: ProbeKey, t: TermRef | null): void;
  leftOpen: boolean;
  rightOpen: boolean;
  fitTick: number;
  fit(): void;
  setView(v: View): void;
  showCables: boolean;
  setWire(id: string, patch: Partial<Wire>): void;
  setPanel(p: Partial<PanelConfig>): void;
  setSheetData(s: NonNullable<Project['sheet']>): void;
  animate: boolean;
  showLabels: boolean;
  heat: boolean;
  dark: boolean;
  // acciones
  snapshot(): void;
  addComponent(type: string, x: number, y: number): string;
  moveComponents(ids: string[], dx: number, dy: number): void;
  rotateSelection(): void;
  deleteSelection(): void;
  duplicateSelection(): void;
  setParam(id: string, key: string, value: number | boolean): void;
  setLabel(id: string, label: string): void;
  addWire(a: TermRef, b: TermRef): void;
  select(ids: string[], additive?: boolean): void;
  startWire(t: TermRef | null): void;
  undo(): void;
  redo(): void;
  load(p: Project): void;
  applyEvents(ev: SimEvent[]): void;
  resetRuntime(): void;
  dismiss(id: number): void;
  setMeter(m: Partial<MeterState>): void;
  addLog(m: Omit<Measure, 'id' | 'time'>): void;
  setTheory(id: number, v: number | undefined): void;
  clearLog(): void;
  setScopeTip(ch: 'c1' | 'c2', t: TermRef | null): void;
  armScope(ch: 'c1' | 'c2' | null): void;
  toggle(k: 'animate' | 'showLabels' | 'heat' | 'dark' | 'sound' | 'dock' | 'showCables' | 'leftOpen' | 'rightOpen'): void;
}

let counter = 0;
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export const useStore = create<State>((set, get) => ({
  project: loadInitial(),
  past: [], future: [], selection: [], wiring: null,
  wiringPts: [], wiringFlip: false, clipboard: null, keys: false,
  runtime: {}, booms: [], notices: [], meter: { ...initialMeter }, log: [], sound: false, scopeTips: { c1: null, c2: null }, scopeArm: null, dock: false, view: 'schematic', upsell: null, leftOpen: true, rightOpen: typeof window === 'undefined' || window.innerWidth > 700, fitTick: 0,
  inst: { meter: { open: false, x: null, y: null, min: false }, scope: { open: false, x: null, y: null, min: false }, watt: { open: false, x: null, y: null, min: false } },
  probeDrag: null, showCables: true,
  animate: true, showLabels: true, heat: false,
  dark: typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches,

  snapshot() {
    set((s) => ({ past: [...s.past, clone(s.project)], future: [] }));
  },
  setUpsell(reason) { set({ upsell: reason }); },
  addComponent(type, x, y) {
    if (currentLevel() === 'visitor') {
      if (!visitorAllows(type)) { set({ upsell: UPSELL.components }); return ''; }
      if (get().project.components.filter((c) => c.type === type).length >= VISITOR_LIMITS[type]) { set({ upsell: UPSELL.limit }); return ''; }
    }
    if (get().view === 'unifilar' && !UNIFILAR_TYPES.has(type)) {
      set((st) => ({ notices: [...st.notices, { id: Date.now() + Math.random(), text: 'Este componente no se representa en unifilar: monta el unifilar con fuentes, aparamenta en serie (interruptor, fusible, magnetotérmico) y receptores. Para el resto usa el esquema o el multifilar.' }] }));
      return '';
    }
    get().snapshot();
    const id = uid(type[0].toUpperCase());
    const c: Component = { id, type, x: Math.round(x / 20) * 20, y: Math.round(y / 20) * 20, rot: 0, params: defaultParams(type) };
    set((s) => ({ project: { ...s.project, components: [...s.project.components, c] }, selection: [id] }));
    return id;
  },
  moveComponents(ids, dx, dy) {
    set((s) => ({
      project: {
        ...s.project,
        components: s.project.components.map((c) => (ids.includes(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c)),
      },
    }));
  },
  rotateSelection() {
    const { selection } = get();
    if (!selection.length) return;
    get().snapshot();
    set((s) => ({
      project: {
        ...s.project,
        components: s.project.components.map((c) =>
          selection.includes(c.id) ? { ...c, rot: ((c.rot + 90) % 360) as Component['rot'] } : c),
      },
    }));
  },
  deleteSelection() {
    const { selection } = get();
    if (!selection.length) return;
    get().snapshot();
    set((s) => ({
      project: syncReturns({
        ...s.project,
        components: s.project.components.filter((c) => !selection.includes(c.id)),
        wires: s.project.wires.filter(
          (w) => !selection.includes(w.id) && !selection.includes(w.a.comp) && !selection.includes(w.b.comp)),
      }, s.view === 'unifilar'),
      selection: [],
    }));
  },
  duplicateSelection() {
    if (currentLevel() === 'visitor') { set({ upsell: UPSELL.limit }); return; }
    const { selection, project } = get();
    const src = project.components.filter((c) => selection.includes(c.id));
    if (!src.length) return;
    get().snapshot();
    const map = new Map<string, string>();
    const copies = src.map((c) => {
      const id = uid(c.type[0].toUpperCase());
      map.set(c.id, id);
      return { ...clone(c), id, x: c.x + 40, y: c.y + 40 };
    });
    const wires: Wire[] = project.wires
      .filter((w) => map.has(w.a.comp) && map.has(w.b.comp))
      .map((w) => ({ ...clone(w), id: uid('w'), a: { ...w.a, comp: map.get(w.a.comp)! }, b: { ...w.b, comp: map.get(w.b.comp)! } }));
    set((s) => ({
      project: { ...s.project, components: [...s.project.components, ...copies], wires: [...s.project.wires, ...wires] },
      selection: copies.map((c) => c.id),
    }));
  },
  setParam(id, key, value) {
    set((s) => ({
      project: {
        ...s.project,
        components: s.project.components.map((c) => (c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c)),
      },
    }));
  },
  setLabel(id, label) {
    set((s) => ({
      project: { ...s.project, components: s.project.components.map((c) => (c.id === id ? { ...c, label } : c)) },
    }));
  },
  addWire(a, b) {
    if (a.comp === b.comp && a.term === b.term) return;
    const exists = get().project.wires.some(
      (w) => (same(w.a, a) && same(w.b, b)) || (same(w.a, b) && same(w.b, a)));
    if (exists) return;
    get().snapshot();
    const st0 = get();
    const route = st0.wiring && same(st0.wiring, a) ? { via: st0.wiringPts.length ? st0.wiringPts : undefined, vEnd: st0.wiringFlip || undefined } : {};
    set((s) => ({ project: syncReturns({ ...s.project, wires: [...s.project.wires, { id: uid('w'), a, b, ...route }] }, s.view === 'unifilar'), wiring: null, wiringPts: [], wiringFlip: false }));
  },
  select(ids, additive) {
    set((s) => ({ selection: additive ? [...new Set([...s.selection, ...ids])] : ids }));
  },
  setWire(id, patch) {
    set((s) => ({ project: { ...s.project, wires: s.project.wires.map((w) => (w.id === id ? { ...w, ...patch } : w)) } }));
  },
  setPanel(p) {
    set((s) => ({ project: { ...s.project, panel: { ...(s.project.panel ?? defaultPanel()), ...p } } }));
  },
  setSheetData(sh) { set((s) => ({ project: { ...s.project, sheet: sh } })); },
  toggleInst(id) {
    if (currentLevel() === 'visitor' && id !== 'meter') { set({ upsell: UPSELL.instruments }); return; }
    set((s) => ({ inst: { ...s.inst, [id]: { ...s.inst[id], open: !s.inst[id].open, min: false } } })); },
  moveInst(id, x, y) { set((s) => ({ inst: { ...s.inst, [id]: { ...s.inst[id], x, y } } })); },
  minInst(id) { set((s) => ({ inst: { ...s.inst, [id]: { ...s.inst[id], min: !s.inst[id].min } } })); },
  setProbeDrag(d) { set({ probeDrag: d }); },
  placeProbe(key, t) {
    if (key === 'red' || key === 'black') set((s) => ({ meter: { ...s.meter, [key]: t, armed: null } }));
    else set((s) => ({ scopeTips: { ...s.scopeTips, [key]: t }, scopeArm: null }));
  },
  fit() { set((s) => ({ fitTick: s.fitTick + 1 })); },
  setView(v) {
    if (currentLevel() === 'visitor' && v !== 'schematic') { set({ upsell: v === 'juego' || v === 'averias' || v === 'boletin' ? UPSELL.game : UPSELL.views }); return; }
    set({ view: v, wiring: null });
  },
  startWire(t) { set({ wiring: t, wiringPts: [], wiringFlip: false }); },
  toggleKeys() { set((s) => ({ keys: !s.keys })); },
  addWirePoint(p) { set((s) => ({ wiringPts: [...s.wiringPts, { x: snapG(p.x), y: snapG(p.y), v: s.wiringFlip || undefined }], wiringFlip: false })); },
  popWirePoint() { set((s) => ({ wiringPts: s.wiringPts.slice(0, -1) })); },
  flipWire() { set((s) => ({ wiringFlip: !s.wiringFlip })); },
  /** Termina un cable sobre otro: se crea un empalme en el punto y el cable atravesado se divide en dos. */
  connectToWire(from, wireId, p) {
    const s = get();
    const w = s.project.wires.find((x) => x.id === wireId);
    if (!w || w.auto) return false;
    const ca = s.project.components.find((c) => c.id === w.a.comp), cb = s.project.components.find((c) => c.id === w.b.comp);
    if (!ca || !cb) return false;
    const g = wirePoints(termPos(ca, w.a.term), termPos(cb, w.b.term), w);
    const hit = nearestOnPolyline(g.pts, p, 16);
    if (!hit) return false;
    const j = snapJunction(g.pts, hit);
    if (!j) return false;
    const route = s.wiring && same(s.wiring, from) ? { via: s.wiringPts.length ? s.wiringPts : undefined, vEnd: s.wiringFlip || undefined } : {};
    get().snapshot();
    const existing = s.project.components.find((c) => c.type === 'junction' && c.x === j.x && c.y === j.y);
    const J: Component = existing ?? { id: uid('J'), type: 'junction', x: j.x, y: j.y, rot: 0, params: {} };
    const target = { comp: J.id, term: 0 };
    const nw: Wire = { id: uid('w'), a: from, b: target, ...route };
    set((st) => {
      let wires = st.project.wires;
      if (!existing) { const [f, sec] = splitWire(w, g.viaCount, hit.seg, J.id, uid('w')); wires = wires.flatMap((x) => (x.id === w.id ? [f, sec] : [x])); }
      return { project: syncReturns({ ...st.project, components: existing ? st.project.components : [...st.project.components, J], wires: [...wires, nw] }, st.view === 'unifilar'), wiring: null, wiringPts: [], wiringFlip: false };
    });
    return true;
  },
  rotateBy(ids, dir) {
    if (!ids.length) return;
    burst();
    set((s) => ({ project: { ...s.project, components: s.project.components.map((c) => (ids.includes(c.id) ? { ...c, rot: (((c.rot + 90 * dir) % 360 + 360) % 360) as Component['rot'] } : c)) } }));
  },
  nudge(dx, dy) {
    const ids = get().selection.filter((id) => get().project.components.some((c) => c.id === id));
    if (!ids.length) return;
    burst();
    get().moveComponents(ids, dx, dy);
  },
  copySelection() {
    const { selection, project } = get();
    const comps = project.components.filter((c) => selection.includes(c.id));
    if (!comps.length) return;
    const set_ = new Set(comps.map((c) => c.id));
    set({ clipboard: clone({ components: comps, wires: project.wires.filter((w) => set_.has(w.a.comp) && set_.has(w.b.comp) && !w.auto) }) });
  },
  cutSelection() { get().copySelection(); get().deleteSelection(); },
  paste(at) {
    const cb = get().clipboard;
    if (!cb || !cb.components.length) return;
    if (currentLevel() === 'visitor') { set({ upsell: UPSELL.limit }); return; }
    const minX = Math.min(...cb.components.map((c) => c.x)), minY = Math.min(...cb.components.map((c) => c.y));
    const dx = at ? snapG(at.x - minX) : 40, dy = at ? snapG(at.y - minY) : 40;
    get().snapshot();
    const map = new Map<string, string>();
    const comps = cb.components.map((c) => { const id = uid(c.type[0].toUpperCase()); map.set(c.id, id); return { ...clone(c), id, x: c.x + dx, y: c.y + dy }; });
    const wires = cb.wires.map((w) => ({ ...clone(w), id: uid('w'), a: { ...w.a, comp: map.get(w.a.comp)! }, b: { ...w.b, comp: map.get(w.b.comp)! }, via: w.via?.map((q) => ({ ...q, x: q.x + dx, y: q.y + dy })) }));
    set((s) => ({ project: { ...s.project, components: [...s.project.components, ...comps], wires: [...s.project.wires, ...wires] }, selection: comps.map((c) => c.id) }));
  },
  selectAll() { set((s) => ({ selection: s.project.components.filter((c) => !c.hidden).map((c) => c.id) })); },
  undo() {
    const { past, project, future } = get();
    if (!past.length) return;
    set({ project: past[past.length - 1], past: past.slice(0, -1), future: [project, ...future], selection: [], wiring: null });
  },
  redo() {
    const { past, project, future } = get();
    if (!future.length) return;
    set({ project: future[0], future: future.slice(1), past: [...past, project], selection: [], wiring: null });
  },
  load(p) { set({ fitTick: get().fitTick + 1, project: migrate(p), past: [], future: [], selection: [], wiring: null, runtime: {}, notices: [], meter: { ...initialMeter } }); },
  applyEvents(ev) {
    if (!ev.length) return;
    set((s) => ({
      runtime: { ...s.runtime, ...Object.fromEntries(ev.map((e) => [e.id, e.state])) },
      notices: [...s.notices, ...ev.map((e) => ({ id: ++counter + Date.now(), text: e.text }))],
      booms: [...s.booms, ...ev.filter((e) => e.state !== 'tripped').map((e) => ({ id: ++counter + Date.now(), comp: e.id, kind: e.state }))],
    }));
    setTimeout(() => set((s) => ({ booms: s.booms.slice(ev.filter((e) => e.state !== 'tripped').length) })), 2600);
  },
  resetRuntime() { set({ runtime: {}, notices: [] }); },
  dismiss(id) { set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })); },
  setMeter(m) { set((s) => ({ meter: { ...s.meter, ...m }, scopeArm: m.armed ? null : s.scopeArm })); },
  addLog(m) {
    set((s) => ({ log: [...s.log, { ...m, id: s.log.length + 1, time: new Date().toLocaleTimeString('es-ES') }] }));
  },
  setTheory(id, v) { set((s) => ({ log: s.log.map((l) => (l.id === id ? { ...l, theory: v } : l)) })); },
  clearLog() { set({ log: [] }); },
  setScopeTip(ch, t) { set((s) => ({ scopeTips: { ...s.scopeTips, [ch]: t }, scopeArm: null })); },
  armScope(ch) { set({ scopeArm: ch, meter: { ...get().meter, armed: null } }); },
  toggle(k) { set((s) => ({ [k]: !s[k] }) as Partial<State>); },
}));

const same = (a: TermRef, b: TermRef) => a.comp === b.comp && a.term === b.term;
/** Agrupa en un solo paso de «deshacer» las acciones repetidas (rueda, flechas) hechas en menos de 600 ms. */
let lastBurst = 0;
function burst() { const now = Date.now(); if (now - lastBurst > 600) useStore.getState().snapshot(); lastBurst = now; }

// Guardado automático local (con debounce)
export const saveGuard = { suspended: false };
let timer: ReturnType<typeof setTimeout> | undefined;
useStore.subscribe((s, prev) => {
  if (s.project === prev.project || saveGuard.suspended) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s.project)); } catch { /* ignorar */ }
  }, 300);
});
