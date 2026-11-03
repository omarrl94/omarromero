import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import TopBar from './components/TopBar.jsx';
import Intro from './components/Intro.jsx';
import WorldHub from './components/WorldHub.jsx';
import EngineMap from './components/EngineMap.jsx';
import Profile from './components/Profile.jsx';
import Arena from './components/Arena.jsx';
import { RewardOverlay, RankUpOverlay, AchievementToasts } from './components/Overlays.jsx';
import { ProgressContext, reducer, loadState, saveState, rankOf, moduleUnlocked, isDone, worldXp } from './core/progress.js';
import { configureSound } from './core/sound.js';
import { byId, MODULES } from './curriculum/index.js';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [view, setView] = useState('map');
  const [active, setActive] = useState(null);
  const [reward, setReward] = useState(null);
  const [rankUp, setRankUp] = useState(null);
  const [toasts, setToasts] = useState([]);
  const prev = useRef(state);

  // Persistencia (con pequeño debounce para no escribir en cada tecla).
  useEffect(() => {
    const t = setTimeout(() => saveState(state), 250);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => { configureSound(state.settings); }, [state.settings]);

  // Recompensas, subidas de rango (del mundo actual) y logros.
  useEffect(() => {
    const before = prev.current;
    if (state.lastReward && state.lastReward !== before.lastReward) setReward(state.lastReward);
    if (state.lang && before.lang === state.lang) {
      const r0 = rankOf(worldXp(before));
      const r1 = rankOf(worldXp(state));
      if (r1.index > r0.index) setTimeout(() => setRankUp(r1), 1800);
    }
    const fresh = state.achievements.filter((a) => !before.achievements.includes(a));
    if (fresh.length) setToasts((t) => [...t, ...fresh]);
    prev.current = state;
  }, [state]);

  const open = useCallback((id) => {
    setActive(id);
    setView('arena');
    window.scrollTo({ top: 0 });
  }, []);

  const enterWorld = useCallback((lang) => {
    dispatch({ type: 'setLang', lang });
    setActive(null);
    setView('map');
    window.scrollTo({ top: 0 });
  }, []);

  const ctx = useMemo(() => ({ state, dispatch }), [state]);
  const clearToasts = useCallback(() => setToasts([]), []);
  const ch = active ? byId(active) : null;

  const nextChallenge = useMemo(() => {
    if (!reward) return null;
    const flat = MODULES.flatMap((m) => m.challenges.map((c) => ({ c, m })));
    const i = flat.findIndex(({ c }) => c.id === reward.id);
    const n = flat.slice(i + 1).find(({ c, m }) => moduleUnlocked(state, m.id) && !isDone(state, c.id)) || flat[i + 1];
    return n && moduleUnlocked(state, n.m.id) ? n.c : null;
  }, [reward, state]);

  if (!state.seenIntro) {
    return (
      <ProgressContext.Provider value={ctx}>
        <div className="cyber-bg scanlines min-h-full">
          <Intro onStart={() => dispatch({ type: 'intro' })} />
        </div>
      </ProgressContext.Provider>
    );
  }

  const inHub = !state.lang || view === 'worlds';

  return (
    <ProgressContext.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
        <div className="cyber-bg scanlines flex min-h-full flex-col">
          {state.lang && <TopBar view={inHub ? 'worlds' : view} onMap={() => setView('map')} onProfile={() => setView('profile')} onWorlds={() => setView('worlds')} />}
          <main className={`flex-1 pt-3 ${view === 'arena' && !inHub ? 'lg:h-[calc(100vh-58px)] lg:min-h-[640px]' : ''}`}>
            {inHub && <WorldHub onEnter={enterWorld} intro={!state.lang} />}
            {!inHub && view === 'map' && <EngineMap onOpen={open} />}
            {!inHub && view === 'profile' && <Profile onOpen={open} />}
            {!inHub && view === 'arena' && ch && <Arena key={`${ch.id}-${state.lang}`} ch={ch} onBack={() => setView('map')} />}
          </main>
          <RewardOverlay
            reward={reward}
            onClose={() => setReward(null)}
            nextTitle={nextChallenge ? nextChallenge.title : null}
            onNext={() => { const n = nextChallenge; setReward(null); if (n) open(n.id); }}
          />
          <RankUpOverlay rank={rankUp} onClose={() => setRankUp(null)} />
          <AchievementToasts items={toasts} onDone={clearToasts} />
        </div>
      </MotionConfig>
    </ProgressContext.Provider>
  );
}
