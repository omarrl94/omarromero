import { useState } from 'react';
import { BUGS, STARTERS, daemonSprite, daemonName, daemonType, maxHpOf, xpToNext, EVOLVE_AT } from './species.js';
import { ITEMS, fmtTime } from './save.js';
import { MEDALS, ZONES } from './world.js';
import { CHAPTERS, LESSON_NO, TOTAL, lessonLabel, nextInCourse, examDone } from './curriculum.js';
import LessonBook from './Lesson.jsx';
import { BUG } from './species.js';
import { LANGUAGES } from '../core/languages.js';
import { sfx } from './assets.js';
import { Creature, CreatureFace, HpBar, Modal, TypeChip, Face } from './ui.jsx';


/** Menú de pausa. */
export function PauseMenu({ game, onClose, onOpen, onSave, onQuit }) {
  const items = [
    ['course', 'Temario', `${Object.keys(game.solved || {}).length}/${TOTAL} lecciones`],
    ['team', 'Equipo', `${game.team.length} daemon${game.team.length === 1 ? '' : 's'}`],
    ['dex', 'Bitdex', `${Object.keys(game.dex.caught).length}/${TOTAL} depurados`],
    ['bag', 'Mochila', `${(game.bag.cafe || 0) + (game.bag.expreso || 0)} objetos`],
    ['card', 'Ficha', `${(game.medals || []).length} medallas`],
    ['options', 'Opciones', 'Música y sonido'],
  ];
  return (
    <Modal title="Menú" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {items.map(([id, label, sub]) => (
          <button key={id} type="button" onClick={() => { sfx('accept'); onOpen(id); }} className="menu-tile">
            <span className="block text-lg font-bold">{label}</span>
            <span className="text-xs text-[#7a5a45]">{sub}</span>
          </button>
        ))}
        <button type="button" onClick={onSave} className="menu-tile">
          <span className="block text-lg font-bold">Guardar</span>
          <span className="text-xs text-[#7a5a45]">También se guarda solo</span>
        </button>
      </div>
      <button type="button" onClick={onQuit} className="pp-btn mt-4 w-full">Volver a la pantalla de título</button>
    </Modal>
  );
}

export function TeamView({ game, update, onClose }) {
  const [sel, setSel] = useState(game.team[0] && game.team[0].uid);
  const lead = (uid) => update((g) => {
    const i = g.team.findIndex((m) => m.uid === uid);
    const team = [...g.team];
    const [m] = team.splice(i, 1);
    return { ...g, team: [m, ...team] };
  });
  const heal = (uid, item) => { sfx('heal'); update((g) => {
    if (!g.bag[item]) return g;
    return { ...g, bag: { ...g.bag, [item]: g.bag[item] - 1 }, team: g.team.map((m) => (m.uid === uid ? { ...m, hp: Math.min(maxHpOf(m.level), m.hp + ITEMS[item].heal) } : m)) };
  }); };
  const m = sel ? game.team.find((d) => d.uid === sel) : null;
  return (
    <Modal title="Equipo" onClose={onClose} wide>
      <p className="mb-3 text-sm text-[#6b4a35]">El primero de la lista sale a combatir. Todos programan en <b>{LANGUAGES[game.lang].name}</b>, el lenguaje de tu daemon inicial.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {game.team.map((d, i) => (
          <button key={d.uid} type="button" onClick={() => setSel(d.uid)} className={`menu-tile flex items-center gap-3 !p-2 ${sel === d.uid ? 'menu-tile-on' : ''} ${d.hp <= 0 ? 'opacity-60' : ''}`}>
            <div className="face-frame shrink-0"><CreatureFace sprite={daemonSprite(d)} size={44} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="truncate font-bold">{i === 0 && '★ '}{daemonName(d)}</span><span className="text-xs">Nv{d.level}</span></div>
              <div className="my-1"><TypeChip type={daemonType(d)} /></div>
              <HpBar value={d.hp} max={maxHpOf(d.level)} />
            </div>
          </button>
        ))}
      </div>
      {m && (
        <div className="case-card mt-4 p-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="creature-stage"><Creature sprite={daemonSprite(m)} size={112} /></div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="text-xl font-bold">{daemonName(m)} <span className="text-sm">Nv{m.level}</span></div>
              <div>Experiencia: {m.xp}/{xpToNext(m.level)}</div>
              {m.kind === 'starter' && <div className="mt-1 text-[#6b4a35]">{STARTERS[m.species].blurb}{m.level < EVOLVE_AT[1] && ` Evoluciona al nivel ${m.level < EVOLVE_AT[0] ? EVOLVE_AT[0] : EVOLVE_AT[1]}.`}</div>}
              {m.kind === 'bug' && <div className="mt-1 text-[#6b4a35]">{BUGS.find((b) => b.id === m.species).entry}</div>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={game.team[0].uid === m.uid} onClick={() => lead(m.uid)} className="pp-btn">★ Sacar primero</button>
            {Object.entries(ITEMS).map(([id, it]) => (
              <button key={id} type="button" disabled={!game.bag[id] || m.hp >= maxHpOf(m.level)} onClick={() => heal(m.uid, id)} className="pp-btn">{it.name} ({game.bag[id] || 0})</button>
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
      {b && (
        <div className="case-card mb-3 flex flex-wrap items-center gap-4 p-3">
          <div className="creature-stage"><Creature sprite={b.sprite} size={104} glitch={!game.dex.caught[b.id]} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold">#{String(b.dex).padStart(3, '0')} {b.name}</div>
            <div className="my-1"><TypeChip type={b.type} /></div>
            <p className="text-sm">{b.entry}</p>
            <p className="mt-1 text-xs text-[#7a5a45]">{game.dex.caught[b.id] ? 'Depurado.' : 'Visto, pero aún sin depurar en estado salvaje.'}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {BUGS.map((x) => {
          const isCaught = game.dex.caught[x.id];
          const isSeen = game.dex.seen[x.id];
          return (
            <button key={x.id} type="button" onClick={() => isSeen && setSel(x.id)} className={`menu-tile flex flex-col items-center !p-1 ${sel === x.id ? 'menu-tile-on' : ''}`}>
              <CreatureFace sprite={x.sprite} size={42} silhouette={!isSeen} />
              <span className="text-[10px] text-[#7a5a45]">#{String(x.dex).padStart(3, '0')}</span>
              <span className="w-full truncate text-center text-[11px] font-bold">{isSeen ? x.name : '???'}</span>
              {isCaught && <span className="text-[10px] text-[#2f7d32]">● depurado</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function BagView({ game, onClose }) {
  return (
    <Modal title="Mochila" onClose={onClose}>
      <div className="case-card mb-3 p-3 text-sm">Bits: <b className="text-[#b5651d]">{game.bits}</b></div>
      {Object.entries(ITEMS).map(([id, it]) => (
        <div key={id} className="case-card mb-2 p-3">
          <div className="font-bold">{it.name} ×{game.bag[id] || 0}</div>
          <div className="text-xs text-[#6b4a35]">{it.desc} Úsalo desde «Equipo» o durante un combate.</div>
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
        <Face look="hero" size={72} />
        <div className="text-sm">
          <div className="text-xl font-bold">{game.name}</div>
          <div>Lenguaje: <b>{LANGUAGES[game.lang].name}</b></div>
          <div>Bits: {game.bits} · Tiempo: {fmtTime(game.playMs)}</div>
          <div>Funciones arregladas: {Object.keys(game.solved || {}).length} · Ataques: {game.stats.attacks || 0}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {MEDALS.map((name, i) => {
          const has = medals.includes(i + 1);
          return (
            <div key={name} className={`menu-tile flex flex-col items-center !p-2 text-center ${has ? 'menu-tile-on' : 'opacity-60'}`}>
              <span className={`medal ${has ? 'medal-on' : ''}`}>{i + 1}</span>
              <span className="mt-1 text-[11px] leading-tight">{has ? name : '???'}</span>
            </div>
          );
        })}
      </div>
      {game.flags.boss && <p className="case-card case-ok mt-4 p-3 text-center text-sm font-bold">★ Héroe de Bitlandia: has derrotado a la Legión Null.</p>}
    </Modal>
  );
}

export function OptionsView({ game, update, onClose }) {
  const set = (k, v) => update((g) => ({ ...g, settings: { ...g.settings, [k]: v } }));
  const row = (k, label) => (
    <label className="menu-tile mb-2 flex cursor-pointer items-center justify-between">
      <span className="font-bold">{label}</span>
      <input type="checkbox" checked={!!game.settings[k]} onChange={(e) => set(k, e.target.checked)} className="h-5 w-5 accent-[#c0561f]" />
    </label>
  );
  return (
    <Modal title="Opciones" onClose={onClose}>
      {row('music', 'Música')}
      {row('sound', 'Efectos de sonido')}
      <div className="case-card mt-4 p-3 text-xs leading-relaxed">
        <b>Controles:</b> flechas o WASD para moverte · Mayús para correr · Z, Espacio o Enter para hablar · X, Esc o M para el menú · Ctrl+Enter para atacar en combate.
      </div>
      <p className="mt-3 text-[11px] text-[#7a5a45]">Gráficos, música y sonidos: «Ninja Adventure» de Pixel-boy y AAA (dominio público, CC0).</p>
    </Modal>
  );
}

/** Tienda del Centro Daemon. */
export function ShopView({ game, update, onClose }) {
  const buy = (id) => { sfx('coin'); update((g) => (g.bits < ITEMS[id].price ? g : { ...g, bits: g.bits - ITEMS[id].price, bag: { ...g.bag, [id]: (g.bag[id] || 0) + 1 } })); };
  return (
    <Modal title="Tienda del Centro" onClose={onClose}>
      <div className="case-card mb-3 p-3 text-sm">Tienes <b className="text-[#b5651d]">{game.bits}</b> bits.</div>
      {Object.entries(ITEMS).map(([id, it]) => (
        <div key={id} className="case-card mb-2 flex items-center justify-between gap-3 p-3">
          <div><div className="font-bold">{it.name} <span className="text-xs font-normal">(tienes {game.bag[id] || 0})</span></div><div className="text-xs text-[#6b4a35]">{it.desc}</div></div>
          <button type="button" disabled={game.bits < it.price} onClick={() => buy(id)} className="pp-btn shrink-0">{it.price} bits</button>
        </div>
      ))}
    </Modal>
  );
}

/** Temario: el curso completo en orden, con el estado de cada lección y su repaso. */
export function CourseView({ game, onClose }) {
  const [open, setOpen] = useState(null);
  const solved = game.solved || {};
  const next = nextInCourse(game);
  const reached = (ch) => ch.n === 1 || examDone(game, CHAPTERS[ch.n - 2]);
  const examOk = (ch) => examDone(game, ch);
  const row = (id, exam) => {
    const done = !!solved[id];
    const isNext = id === next;
    return (
      <button key={id} type="button" disabled={!done} onClick={() => setOpen(id)} className={`course-row ${done ? 'course-done' : isNext ? 'course-next' : 'course-locked'}`}>
        <span className="course-no">{LESSON_NO[id]}</span>
        <span className="min-w-0 flex-1 truncate text-left">{lessonLabel(id)}{exam && <span className="ml-1 text-[11px] font-bold text-[#b5651d]">EXAMEN</span>}</span>
        {(done || game.dex.seen[id]) && <CreatureFace sprite={BUG[id].sprite} size={24} />}
        <span className="w-20 shrink-0 text-right text-[12px] font-bold">{done ? 'Aprendido' : isNext ? 'Siguiente' : '—'}</span>
      </button>
    );
  };
  return (
    <Modal title={`Temario · ${Object.keys(solved).length} de ${TOTAL} lecciones`} onClose={onClose} wide>
      {open ? (
        <div>
          <button type="button" className="pp-btn mb-3" onClick={() => setOpen(null)}>◂ Volver al temario</button>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#b5651d]">Lección {LESSON_NO[open]} · {lessonLabel(open)}</div>
          <LessonBook key={open} id={open} lang={game.lang} onDone={() => setOpen(null)} doneLabel="Volver al temario" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#6b4a35]">El curso va de lo sencillo a lo complejo. Cada capítulo se aprende en una zona y termina con un examen en el gimnasio. Pulsa una lección aprendida para repasarla.</p>
          {CHAPTERS.map((ch) => (
            <div key={ch.id} className={`case-card p-2.5 ${reached(ch) ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="pixel-title text-xl text-[#7a3b1e]">Capítulo {ch.n} · {ch.title}</div>
                <span className="text-xs font-bold">{reached(ch) ? (examOk(ch) ? '✔ Superado' : ZONES.find((z) => z.id === ch.zone).name) : 'Bloqueado'}</span>
              </div>
              <p className="mb-1.5 text-[13px] text-[#6b4a35]">{ch.summary}</p>
              <div className="space-y-1">
                {ch.lessons.map((id) => row(id, false))}
                {ch.exam.drills.map((id) => row(id, true))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
