import { useState } from 'react';
import { BUGS, STARTERS, daemonLook, daemonName, daemonType, maxHpOf, xpToNext, EVOLVE_AT } from './species.js';
import { ITEMS, fmtTime } from './save.js';
import { MEDALS } from './world.js';
import { LANGUAGES } from '../core/languages.js';
import { Creature, HpBar, Modal, TypeChip, Person } from './ui.jsx';

/** Menú de pausa. */
export function PauseMenu({ game, onClose, onOpen, onSave, onQuit }) {
  const items = [
    ['team', '◓', 'Equipo', `${game.team.length} daemon${game.team.length === 1 ? '' : 's'}`],
    ['dex', '▤', 'Bitdex', `${Object.keys(game.dex.caught).length}/32`],
    ['bag', '🎒', 'Mochila', `${(game.bag.cafe || 0) + (game.bag.expreso || 0)} objetos`],
    ['card', '✦', 'Ficha', `${(game.medals || []).length} medallas`],
    ['options', '⚙', 'Opciones', ''],
  ];
  return (
    <Modal title="Menú" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {items.map(([id, icon, label, sub]) => (
          <button key={id} type="button" onClick={() => onOpen(id)} className="flex items-center gap-3 rounded-xl border-2 border-slate-700 bg-slate-800/80 p-3 text-left hover:border-amber-300">
            <span className="text-2xl">{icon}</span>
            <span><span className="block font-bold">{label}</span><span className="text-xs text-slate-400">{sub}</span></span>
          </button>
        ))}
        <button type="button" onClick={onSave} className="flex items-center gap-3 rounded-xl border-2 border-slate-700 bg-slate-800/80 p-3 text-left hover:border-emerald-400">
          <span className="text-2xl">💾</span><span><span className="block font-bold">Guardar</span><span className="text-xs text-slate-400">También se guarda solo</span></span>
        </button>
      </div>
      <button type="button" onClick={onQuit} className="mt-4 w-full rounded-lg bg-slate-800 py-2 text-sm text-slate-300 hover:bg-slate-700">Volver a la pantalla de título</button>
    </Modal>
  );
}

export function TeamView({ game, update, onClose }) {
  const [sel, setSel] = useState(null);
  const lead = (uid) => update((g) => {
    const i = g.team.findIndex((m) => m.uid === uid);
    const team = [...g.team];
    const [m] = team.splice(i, 1);
    return { ...g, team: [m, ...team] };
  });
  const heal = (uid, item) => update((g) => {
    if (!g.bag[item]) return g;
    return { ...g, bag: { ...g.bag, [item]: g.bag[item] - 1 }, team: g.team.map((m) => (m.uid === uid ? { ...m, hp: Math.min(maxHpOf(m.level), m.hp + ITEMS[item].heal) } : m)) };
  });
  const m = sel ? game.team.find((d) => d.uid === sel) : null;
  return (
    <Modal title="Equipo" onClose={onClose} wide>
      <p className="mb-3 text-sm text-slate-400">El primero de la lista sale a combatir. Todos programan en <b style={{ color: LANGUAGES[game.lang].color }}>{LANGUAGES[game.lang].name}</b>: el lenguaje de tu daemon inicial.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {game.team.map((d, i) => (
          <button key={d.uid} type="button" onClick={() => setSel(d.uid)} className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left ${sel === d.uid ? 'border-amber-300 bg-slate-800' : 'border-slate-700 bg-slate-800/60'} ${d.hp <= 0 ? 'opacity-60' : ''}`}>
            <Creature look={daemonLook(d)} size={64} still={sel !== d.uid} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-bold">{i === 0 && '★ '}{daemonName(d)}</span><span className="text-xs text-slate-300">Nv{d.level}</span></div>
              <div className="my-1"><TypeChip type={daemonType(d)} /></div>
              <HpBar value={d.hp} max={maxHpOf(d.level)} />
            </div>
          </button>
        ))}
      </div>
      {m && (
        <div className="mt-4 rounded-xl border-2 border-slate-700 bg-slate-900/80 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Creature look={daemonLook(m)} size={96} />
            <div className="min-w-0 flex-1 text-sm">
              <div className="text-lg font-bold">{daemonName(m)} <span className="text-sm text-slate-400">Nv{m.level}</span></div>
              <div className="text-slate-300">Experiencia: {m.xp}/{xpToNext(m.level)}</div>
              {m.kind === 'starter' && <div className="text-slate-400">{STARTERS[m.species].blurb}{m.level < EVOLVE_AT[1] && ` Evoluciona al nivel ${m.level < EVOLVE_AT[0] ? EVOLVE_AT[0] : EVOLVE_AT[1]}.`}</div>}
              {m.kind === 'bug' && <div className="text-slate-400">{BUGS.find((b) => b.id === m.species).entry}</div>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={game.team[0].uid === m.uid} onClick={() => lead(m.uid)} className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-40">★ Sacar primero</button>
            {Object.entries(ITEMS).map(([id, it]) => (
              <button key={id} type="button" disabled={!game.bag[id] || m.hp >= maxHpOf(m.level)} onClick={() => heal(m.uid, id)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-bold disabled:opacity-40">{it.name} ({game.bag[id] || 0})</button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function DexView({ game, onClose }) {
  const [sel, setSel] = useState(null);
  const b = sel ? BUGS.find((x) => x.id === sel) : null;
  const caught = Object.keys(game.dex.caught).length;
  const seen = Object.keys(game.dex.seen).length;
  return (
    <Modal title={`Bitdex · ${caught} depurados · ${seen} vistos`} onClose={onClose} wide>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {BUGS.map((x) => {
          const isCaught = game.dex.caught[x.id];
          const isSeen = game.dex.seen[x.id];
          return (
            <button key={x.id} type="button" onClick={() => isSeen && setSel(x.id)} className={`flex flex-col items-center rounded-lg border-2 p-1 ${sel === x.id ? 'border-amber-300' : 'border-slate-700'} ${isCaught ? 'bg-slate-800' : 'bg-slate-900'}`}>
              <Creature look={x.look} size={48} still silhouette={!isSeen} />
              <span className="text-[9px] text-slate-400">#{String(x.dex).padStart(3, '0')}</span>
              <span className="w-full truncate text-center text-[10px]">{isSeen ? x.name : '???'}</span>
              {isCaught && <span className="text-[10px] text-emerald-400">◓</span>}
            </button>
          );
        })}
      </div>
      {b && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border-2 border-slate-700 bg-slate-900/80 p-3">
          <Creature look={b.look} size={110} glitch={game.dex.caught[b.id] ? 0 : 1} />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold">#{String(b.dex).padStart(3, '0')} {b.name}</div>
            <div className="my-1"><TypeChip type={b.type} /></div>
            <p className="text-sm text-slate-300">{b.entry}</p>
            <p className="mt-1 text-xs text-slate-500">{game.dex.caught[b.id] ? 'Depurado.' : 'Visto, pero aún sin depurar en estado salvaje.'}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function BagView({ game, onClose }) {
  return (
    <Modal title="Mochila" onClose={onClose}>
      <div className="mb-3 rounded-lg bg-slate-800/70 p-3 text-sm">Bits: <b className="text-amber-300">{game.bits}</b></div>
      {Object.entries(ITEMS).map(([id, it]) => (
        <div key={id} className="mb-2 rounded-lg bg-slate-800/70 p-3">
          <div className="font-bold">{it.name} ×{game.bag[id] || 0}</div>
          <div className="text-xs text-slate-400">{it.desc} Úsalo desde «Equipo» o durante un combate.</div>
        </div>
      ))}
    </Modal>
  );
}

export function CardView({ game, onClose }) {
  const medals = game.medals || [];
  return (
    <Modal title="Ficha de programador" onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-slate-800 p-2"><Person look="hero" size={72} /></div>
        <div className="text-sm">
          <div className="text-lg font-bold">{game.name}</div>
          <div className="text-slate-300">Lenguaje: <b style={{ color: LANGUAGES[game.lang].color }}>{LANGUAGES[game.lang].name}</b></div>
          <div className="text-slate-300">Bits: {game.bits} · Tiempo: {fmtTime(game.playMs)}</div>
          <div className="text-slate-300">Funciones arregladas: {Object.keys(game.solved || {}).length} · Ataques: {game.stats.attacks || 0}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {MEDALS.map((name, i) => {
          const has = medals.includes(i + 1);
          return (
            <div key={name} className={`flex flex-col items-center rounded-xl border-2 p-2 text-center ${has ? 'border-amber-300 bg-amber-950/30' : 'border-slate-700 bg-slate-900'}`}>
              <span className={`text-3xl ${has ? '' : 'opacity-20 grayscale'}`}>{['⬢', '⟳', '▦', '∞'][i]}</span>
              <span className="mt-1 text-[10px] leading-tight text-slate-300">{has ? name : '???'}</span>
            </div>
          );
        })}
      </div>
      {game.flags.boss && <p className="mt-4 rounded-lg bg-amber-400/15 p-3 text-center text-sm text-amber-200">★ Héroe de Bitlandia: has derrotado a la Legión Null.</p>}
    </Modal>
  );
}

export function OptionsView({ game, update, onClose }) {
  const set = (k, v) => update((g) => ({ ...g, settings: { ...g.settings, [k]: v } }));
  const row = (k, label) => (
    <label className="mb-2 flex cursor-pointer items-center justify-between rounded-lg bg-slate-800/70 p-3">
      <span>{label}</span>
      <input type="checkbox" checked={!!game.settings[k]} onChange={(e) => set(k, e.target.checked)} className="h-5 w-5 accent-amber-400" />
    </label>
  );
  return (
    <Modal title="Opciones" onClose={onClose}>
      {row('music', 'Música')}
      {row('sound', 'Efectos de sonido')}
      <div className="mt-4 rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-400">
        <b className="text-slate-200">Controles:</b> flechas o WASD para moverte · Mayús para correr · Z, Espacio o Enter para hablar · X, Esc o M para el menú · Ctrl+Enter para atacar en combate.
      </div>
    </Modal>
  );
}

/** Tienda del Centro Daemon. */
export function ShopView({ game, update, onClose }) {
  const buy = (id) => update((g) => (g.bits < ITEMS[id].price ? g : { ...g, bits: g.bits - ITEMS[id].price, bag: { ...g.bag, [id]: (g.bag[id] || 0) + 1 } }));
  return (
    <Modal title="Tienda del Centro" onClose={onClose}>
      <div className="mb-3 rounded-lg bg-slate-800/70 p-3 text-sm">Tienes <b className="text-amber-300">{game.bits}</b> bits.</div>
      {Object.entries(ITEMS).map(([id, it]) => (
        <div key={id} className="mb-2 flex items-center justify-between gap-3 rounded-lg bg-slate-800/70 p-3">
          <div><div className="font-bold">{it.name} <span className="text-xs text-slate-400">(tienes {game.bag[id] || 0})</span></div><div className="text-xs text-slate-400">{it.desc}</div></div>
          <button type="button" disabled={game.bits < it.price} onClick={() => buy(id)} className="shrink-0 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-40">{it.price} bits</button>
        </div>
      ))}
    </Modal>
  );
}
