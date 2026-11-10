import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TopBar, { MobileNav } from './components/TopBar.jsx';
import Intro from './components/Intro.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import WorldHub from './components/WorldHub.jsx';
import EngineMap from './components/EngineMap.jsx';
import Profile from './components/Profile.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import { RewardOverlay, RankUpOverlay, AchievementToasts } from './components/Overlays.jsx';
import { ProgressContext, reducer, loadState, saveState, mergeProgress, playerStats, rankOf, moduleUnlocked, isDone, worldXp } from './core/progress.js';
import { configureSound } from './core/sound.js';
import { useBackHandler, BACK, appReady } from './core/native.js';
import { byId, MODULES } from './curriculum/index.js';
import { watchSession, loadCloudProgress, saveCloudProgress, logout, deleteAccount, backend } from './services/accounts.js';

// La arena (editor, Forge VM, escenas y lecciones) es la parte más pesada: se descarga aparte
// para que la portada y los mapas aparezcan antes. Se precarga en segundo plano tras entrar.
const loadArena = () => import('./components/Arena.jsx');
const Arena = lazy(loadArena);
const Loading = () => <div className="flex min-h-[40vh] items-center justify-center text-slate-400"><Loader2 className="mr-2 animate-spin" size={18} /> Cargando…</div>;

const INTRO_KEY = 'codeforge.intro.v1';
const introSeen = () => { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } };

/** Sesión: intro → registro/acceso → partida del jugador. */
export default function App() {
  const [account, setAccount] = useState(undefined); // undefined = comprobando sesión
  const [intro, setIntro] = useState(introSeen);
  const [startWorld, setStartWorld] = useState(null);

  useEffect(() => { appReady(); }, []);
  // Precarga la arena cuando el navegador está libre: abrir una misión es instantáneo
  // (y queda guardada para jugar sin conexión).
  useEffect(() => {
    const id = setTimeout(() => { loadArena().catch(() => {}); }, 1500);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => watchSession((acc) => setAccount((prev) => (prev && acc && prev.uid === acc.uid && !acc.incomplete ? { ...prev, ...acc } : acc))), []);

  let screen;
  if (account === undefined) {
    screen = <div className="flex min-h-full items-center justify-center text-slate-400"><Loader2 className="mr-2 animate-spin" size={18} /> Conectando con el motor…</div>;
  } else if (!account && !intro) {
    screen = <Intro onStart={() => { try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* sin almacenamiento */ } setIntro(true); }} />;
  } else if (!account) {
    screen = <AuthScreen onAccount={(acc, world) => { setStartWorld(world); setAccount(acc); }} />;
  } else {
    return <Game key={account.uid} account={account} onAccountChange={setAccount} startWorld={startWorld} />;
  }
  return <div className="cyber-bg scanlines min-h-full">{screen}</div>;
}

/** La partida de un jugador: su progreso, sus mundos y su sincronización. */
function Game({ account, onAccountChange, startWorld }) {
  const [state, dispatch] = useReducer(reducer, account.uid, (uid) => {
    const s = loadState(uid);
    // Recién registrado: entra directamente en el mundo que eligió.
    return startWorld && !s.lang ? { ...s, lang: startWorld } : s;
  });
  const [view, setView] = useState('map');
  // «Atrás» en Android: desde cualquier sección vuelve a las misiones (o a la galaxia).
  useBackHandler(() => setView(state.lang ? 'map' : 'worlds'), state.lang ? view !== 'map' : view === 'ranking' || view === 'profile', BACK.screen);
  const [active, setActive] = useState(null);
  const [reward, setReward] = useState(null);
  const [rankUp, setRankUp] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sync, setSync] = useState(backend === 'firebase' ? 'loading' : 'local'); // loading | saving | saved | error | local
  const prev = useRef(state);
  const ready = useRef(backend !== 'firebase');
  const latest = useRef(state);
  latest.current = state;

  // Recién registrado: entra en el mundo elegido (puede llegar justo después de activarse la sesión).
  useEffect(() => {
    if (startWorld && !latest.current.lang) dispatch({ type: 'setLang', lang: startWorld });
  }, [startWorld]);

  // Al entrar: une el progreso de este navegador con el de la nube.
  useEffect(() => {
    if (backend !== 'firebase') return;
    let alive = true;
    loadCloudProgress(account)
      .then((remote) => {
        if (!alive) return;
        if (remote) dispatch({ type: 'load', state: mergeProgress(latest.current, remote) });
        ready.current = true;
        setSync('saved');
      })
      .catch(() => { ready.current = true; if (alive) setSync('error'); });
    return () => { alive = false; };
  }, [account]);

  // Guardado local inmediato y sincronización con la nube (con debounce).
  useEffect(() => {
    const t = setTimeout(() => saveState(state, account.uid), 250);
    return () => clearTimeout(t);
  }, [state, account.uid]);

  const pushCloud = useCallback(async () => {
    if (!ready.current) return;
    if (backend === 'firebase') setSync('saving');
    try {
      await saveCloudProgress(account, { ...latest.current, savedAt: Date.now() }, playerStats(latest.current));
      if (backend === 'firebase') setSync('saved');
    } catch {
      if (backend === 'firebase') setSync('error');
    }
  }, [account]);

  useEffect(() => {
    const t = setTimeout(pushCloud, backend === 'firebase' ? 2500 : 600);
    return () => clearTimeout(t);
  }, [state.completed, state.xp, state.drafts, state.achievements, state.lessonsSeen, state.lang, pushCloud]);

  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') pushCloud(); };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [pushCloud]);

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
    if (fresh.length && before.achievements.length + fresh.length === state.achievements.length && fresh.length < 4) setToasts((t) => [...t, ...fresh]);
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

  const signOut = useCallback(async () => {
    await pushCloud();
    await logout();
    onAccountChange(null);
  }, [pushCloud, onAccountChange]);

  // Borrado definitivo de la cuenta y de todo su progreso (en la nube y en este dispositivo).
  const removeAccount = useCallback(async (password) => {
    const wasReady = ready.current;
    ready.current = false; // no volver a subir nada a la nube mientras se borra
    try {
      await deleteAccount(account, password);
    } catch (e) {
      ready.current = wasReady;
      throw e;
    }
    onAccountChange(null);
  }, [account, onAccountChange]);

  const ctx = useMemo(() => ({ state, dispatch, account, setAccount: onAccountChange, signOut, removeAccount, sync }), [state, account, onAccountChange, signOut, removeAccount, sync]);
  const clearToasts = useCallback(() => setToasts([]), []);
  const ch = active ? byId(active) : null;

  const nextChallenge = useMemo(() => {
    if (!reward) return null;
    const flat = MODULES.flatMap((m) => m.challenges.map((c) => ({ c, m })));
    const i = flat.findIndex(({ c }) => c.id === reward.id);
    const n = flat.slice(i + 1).find(({ c, m }) => moduleUnlocked(state, m.id) && !isDone(state, c.id)) || flat[i + 1];
    return n && moduleUnlocked(state, n.m.id) ? n.c : null;
  }, [reward, state]);

  const inHub = !state.lang || view === 'worlds';
  const current = inHub ? 'worlds' : view;

  return (
    <ProgressContext.Provider value={ctx}>
      <MotionConfig reducedMotion="user">
        <div className="cyber-bg scanlines flex min-h-full flex-col">
          <TopBar view={current} onMap={() => setView('map')} onProfile={() => setView('profile')} onWorlds={() => setView('worlds')} onRanking={() => setView('ranking')} />
          <main className={`flex-1 pt-3 ${current === 'arena' ? 'lg:h-[calc(100vh-58px)] lg:min-h-[640px]' : 'pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0'}`}>
            <Suspense fallback={<Loading />}>
            {current === 'worlds' && view !== 'ranking' && view !== 'profile' && <WorldHub onEnter={enterWorld} intro={!state.lang} />}
            {view === 'ranking' && <Leaderboard account={account} refreshKey={state.completed} />}
            {view === 'profile' && state.lang && <Profile onOpen={open} />}
            {!inHub && view === 'map' && <EngineMap onOpen={open} />}
            {!inHub && view === 'arena' && ch && <Arena key={`${ch.id}-${state.lang}`} ch={ch} onBack={() => setView('map')} />}
            </Suspense>
          </main>
          {current !== 'arena' && <MobileNav view={current} onMap={() => setView('map')} onProfile={() => setView('profile')} onWorlds={() => setView('worlds')} onRanking={() => setView('ranking')} />}
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
