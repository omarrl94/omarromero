import { create } from 'zustand';
import { makeClient, type Client } from './clients';
import { autoSolve } from './solver';
import { defaultBoard, defaultChoice, defaultCircuit, emptyState, roomAt, type Board, type Choice, type GState } from './logic';
import { dev, type DevKind } from './data';
import { houseOf } from './houses';

export type Stage = 'briefing' | 'obra' | 'cuadro' | 'inspeccion' | 'resultado';
export type Tool = DevKind | 'panel' | 'move' | 'delete' | 'link';
export interface Career { jobs: number; money: number; best: number; stars: number }

const KEY = 'circuitossea:game';
const CAREER = 'circuitossea:career';
const load = <T,>(k: string): T | null => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

interface G {
  stage: Stage; seed: number; level: number; client: Client; state: GState;
  tool: Tool | null; selected: string | null; linkFrom: string | null;
  showRoutes: boolean; showLinks: boolean;
  career: Career;
  newClient(seed?: number, level?: number): void;
  setStage(s: Stage): void;
  setTool(t: Tool | null): void;
  place(x: number, y: number): void;
  moveDev(id: string, x: number, y: number): void;
  removeDev(id: string): void;
  setCircuit(id: string, c: string | null): void;
  click(id: string): void;
  select(id: string | null): void;
  setChoice(cid: string, p: Partial<Choice>): void;
  setBoard(p: Partial<Board>): void;
  setPanelPos(x: number, y: number): void;
  reset(): void;
  solve(): void;
  finish(score: number, stars: number): void;
  toggle(k: 'showRoutes' | 'showLinks'): void;
  setCareer(c: Career): void;
}

const saved = load<{ seed: number; level: number; state: GState; stage: Stage }>(KEY);
const startSeed = saved?.seed ?? Math.floor(Math.random() * 90000) + 10;
const startLevel = saved?.level ?? 1;
const startClient = makeClient(startSeed, startLevel);
let uidN = 0;
const uid = () => `p${Date.now().toString(36)}${(uidN++).toString(36)}`;

export const useGame = create<G>((set, get) => ({
  stage: saved?.stage && saved.stage !== 'briefing' ? saved.stage : 'briefing',
  seed: startSeed, level: startLevel, client: startClient,
  state: saved?.state ?? emptyState(houseOf(startClient.houseId)),
  tool: null, selected: null, linkFrom: null, showRoutes: true, showLinks: true,
  career: load<Career>(CAREER) ?? { jobs: 0, money: 0, best: 0, stars: 0 },

  newClient(seed, level) {
    const s = seed ?? Math.floor(Math.random() * 90000) + 10;
    const lv = level ?? get().level;
    const c = makeClient(s, lv);
    set({ seed: s, level: lv, client: c, state: emptyState(houseOf(c.houseId)), stage: 'briefing', tool: null, selected: null, linkFrom: null });
  },
  setStage(stage) { set({ stage, tool: null, linkFrom: null }); },
  setTool(tool) { set({ tool, linkFrom: null, selected: null }); },
  place(x, y) {
    const { tool, state, client } = get();
    const house = houseOf(client.houseId);
    if (!tool || ['move', 'delete', 'link'].includes(tool)) return;
    if (tool === 'panel') { set((s) => ({ state: { ...s.state, panel: { x, y } } })); return; }
    const room = roomAt(house, x, y);
    if (!room) return;
    const id = uid();
    const kind = tool as DevKind;
    const d = { id, kind, x, y, circuit: defaultCircuit(kind, room) };
    const links = [...state.links];
    const sameRoom = (o: { x: number; y: number }) => roomAt(house, o.x, o.y)?.id === room.id;
    if (kind === 'int' || kind === 'conm' || kind === 'detector') {
      const want = kind === 'detector' ? 'luzExt' : 'luz';
      const lights = state.devices.filter((o) => o.kind === want && sameRoom(o));
      const free = lights.filter((l) => !links.some((k) => k.light === l.id));
      const t = (free[0] ?? lights[0]);
      if (t) links.push({ sw: id, light: t.id });
    }
    if (kind === 'luz' || kind === 'luzExt') {
      const sw = state.devices.find((o) => (kind === 'luzExt' ? o.kind === 'detector' : o.kind === 'int' || o.kind === 'conm') && sameRoom(o) && !links.some((k) => k.sw === o.id));
      if (sw) links.push({ sw: sw.id, light: id });
    }
    set({ state: { ...state, devices: [...state.devices, d], links }, selected: id });
  },
  moveDev(id, x, y) { set((s) => ({ state: { ...s.state, devices: s.state.devices.map((d) => (d.id === id ? { ...d, x, y } : d)) } })); },
  removeDev(id) { set((s) => ({ selected: null, state: { ...s.state, devices: s.state.devices.filter((d) => d.id !== id), links: s.state.links.filter((l) => l.sw !== id && l.light !== id) } })); },
  setCircuit(id, c) { set((s) => ({ state: { ...s.state, devices: s.state.devices.map((d) => (d.id === id ? { ...d, circuit: c } : d)) } })); },
  select(id) { set({ selected: id }); },
  click(id) {
    const { tool, linkFrom, state } = get();
    const d = state.devices.find((x) => x.id === id);
    if (!d) return;
    if (tool === 'delete') { get().removeDev(id); return; }
    if (tool === 'link') {
      if (['int', 'conm', 'detector'].includes(d.kind)) { set({ linkFrom: id, selected: id }); return; }
      if (linkFrom && (d.kind === 'luz' || d.kind === 'luzExt')) {
        const has = state.links.some((l) => l.sw === linkFrom && l.light === id);
        set({ state: { ...state, links: has ? state.links.filter((l) => !(l.sw === linkFrom && l.light === id)) : [...state.links, { sw: linkFrom, light: id }] } });
      }
      return;
    }
    set({ selected: id });
  },
  setChoice(cid, p) { set((s) => ({ state: { ...s.state, choices: { ...s.state.choices, [cid]: { ...(s.state.choices[cid] ?? defaultChoice()), ...p } } } })); },
  setBoard(p) { set((s) => ({ state: { ...s.state, board: { ...(s.state.board ?? defaultBoard()), ...p } } })); },
  setPanelPos(x, y) { set((s) => ({ state: { ...s.state, panel: { x, y } } })); },
  reset() { set((s) => ({ state: emptyState(houseOf(s.client.houseId)), stage: 'obra', selected: null, tool: null })); },
  solve() { const { client } = get(); set({ state: autoSolve(client.houseId, client), selected: null, tool: null }); },
  finish(score, stars) {
    const { career, client } = get();
    const pay = Math.round((client.budget * 0.18 * score) / 100 / 5) * 5;
    const c = { jobs: career.jobs + 1, money: career.money + pay, best: Math.max(career.best, score), stars: career.stars + stars };
    save(CAREER, c);
    set({ career: c, stage: 'resultado' });
  },
  toggle(k) { set((s) => ({ [k]: !s[k] }) as Partial<G>); },
  setCareer(c) { save(CAREER, c); set({ career: c }); },
}));

let t: ReturnType<typeof setTimeout> | undefined;
useGame.subscribe((s, p) => {
  if (s.state === p.state && s.stage === p.stage && s.seed === p.seed) return;
  clearTimeout(t);
  t = setTimeout(() => save(KEY, { seed: s.seed, level: s.level, state: s.state, stage: s.stage }), 300);
});
export const priceOf = (k: DevKind) => dev(k).price;
