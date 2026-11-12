import { create } from 'zustand';
import type { Component, Project, TermRef, Wire } from './model/types';
import { PROJECT_VERSION } from './model/types';
import { defaultParams } from './model/library';
import { dosPilas } from './model/examples';
import type { Runtime, SimEvent } from './model/netlist';
import { initialMeter, type MeterState } from './model/meter';

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

interface State {
  project: Project;
  past: Project[];
  future: Project[];
  selection: string[];
  wiring: TermRef | null;
  runtime: Runtime;
  notices: { id: number; text: string }[];
  meter: MeterState;
  log: Measure[];
  sound: boolean;
  scopeTips: { c1: TermRef | null; c2: TermRef | null };
  scopeArm: 'c1' | 'c2' | null;
  dock: boolean;
  view: 'schematic' | 'real';
  setView(v: 'schematic' | 'real'): void;
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
  toggle(k: 'animate' | 'showLabels' | 'heat' | 'dark' | 'sound' | 'dock'): void;
}

let counter = 0;
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export const useStore = create<State>((set, get) => ({
  project: loadInitial(),
  past: [], future: [], selection: [], wiring: null,
  runtime: {}, notices: [], meter: { ...initialMeter }, log: [], sound: false, scopeTips: { c1: null, c2: null }, scopeArm: null, dock: true, view: 'schematic',
  animate: true, showLabels: true, heat: false,
  dark: typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches,

  snapshot() {
    set((s) => ({ past: [...s.past, clone(s.project)], future: [] }));
  },
  addComponent(type, x, y) {
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
      project: {
        ...s.project,
        components: s.project.components.filter((c) => !selection.includes(c.id)),
        wires: s.project.wires.filter(
          (w) => !selection.includes(w.id) && !selection.includes(w.a.comp) && !selection.includes(w.b.comp)),
      },
      selection: [],
    }));
  },
  duplicateSelection() {
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
    set((s) => ({ project: { ...s.project, wires: [...s.project.wires, { id: uid('w'), a, b }] }, wiring: null }));
  },
  select(ids, additive) {
    set((s) => ({ selection: additive ? [...new Set([...s.selection, ...ids])] : ids }));
  },
  setView(v) { set({ view: v, wiring: null }); },
  startWire(t) { set({ wiring: t }); },
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
  load(p) { set({ project: migrate(p), past: [], future: [], selection: [], wiring: null, runtime: {}, notices: [], meter: { ...initialMeter } }); },
  applyEvents(ev) {
    if (!ev.length) return;
    set((s) => ({
      runtime: { ...s.runtime, ...Object.fromEntries(ev.map((e) => [e.id, e.state])) },
      notices: [...s.notices, ...ev.map((e) => ({ id: ++counter + Date.now(), text: e.text }))],
    }));
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

// Guardado automático local (con debounce)
let timer: ReturnType<typeof setTimeout> | undefined;
useStore.subscribe((s, prev) => {
  if (s.project === prev.project) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s.project)); } catch { /* ignorar */ }
  }, 300);
});
