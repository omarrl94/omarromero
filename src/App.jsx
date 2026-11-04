import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Intro from './components/Intro.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import TeamSelect from './components/TeamSelect.jsx';
import TopBar from './components/TopBar.jsx';
import CampaignMap from './components/CampaignMap.jsx';
import MissionView from './components/MissionView.jsx';
import Profile from './components/Profile.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Arsenal from './components/Arsenal.jsx';
import { CyberBackground } from './components/fx.jsx';
import { watchSession, logout, loadCloudProgress, saveCloudProgress } from './services/accounts.js';
import { loadProgress, saveProgress, recordMission, publicStatsOf, completedCount, moduleUnlocked } from './core/progress.js';
import { missionById, missionsFor, MODULES } from './campaign/index.js';
import { TEAMS } from './core/teams.js';

/** Elige el progreso más avanzado entre el local y el de la nube. */
function merge(local, cloud) {
  if (!cloud) return local;
  const score = (p) => ['red', 'blue', 'purple'].reduce((s, t) => s + completedCount(p, t), 0);
  return score(cloud) >= score(local) ? { ...local, ...cloud } : local;
}

export default function App() {
  const [account, setAccount] = useState(undefined);
  const [progress, setProgress] = useState(null);
  const [view, setView] = useState('map');
  const [missionId, setMissionId] = useState(null);
  const [changingTeam, setChangingTeam] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [view, missionId, changingTeam, showAuth]);

  useEffect(() => watchSession(async (acc) => {
    setAccount(acc);
    if (!acc) { setProgress(null); return; }
    const local = loadProgress(acc.uid);
    setProgress(local);
    try {
      const cloud = await loadCloudProgress(acc);
      setProgress((p) => merge(p || local, cloud));
    } catch { /* sin conexión: seguimos con lo local */ }
  }), []);

  // Guardado local inmediato y en la nube con un pequeño retardo.
  useEffect(() => {
    if (!account || !progress) return;
    saveProgress(account.uid, progress);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveCloudProgress(account, progress, publicStatsOf(progress)).catch(() => {});
    }, 1200);
  }, [account, progress]);

  const team = progress?.team;
  const color = team ? TEAMS[team].color : '#2bff88';

  const chooseTeam = (t) => {
    setProgress((p) => ({ ...p, team: t, oath: true }));
    setChangingTeam(false);
    setView('map');
  };

  const complete = useCallback((stars, score) => {
    setProgress((p) => recordMission(p, p.team, missionId, stars, score));
  }, [missionId]);

  const nextMission = () => {
    const list = missionsFor(team);
    const idx = list.findIndex((m) => m.id === missionId);
    const next = list.slice(idx + 1).find((m) => !progress.teams[team]?.[m.id]) || list[idx + 1];
    if (!next) return null;
    const modIdx = MODULES.findIndex((m) => m.id === next.module);
    return moduleUnlocked(progress, team, modIdx) ? next : null;
  };

  let content;
  if (account === undefined) {
    content = <div className="flex h-full items-center justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;
  } else if (!account) {
    content = showAuth ? <div className="relative z-10 min-h-full"><AuthScreen onAccount={(a) => setAccount(a)} /></div> : <Intro onStart={() => setShowAuth(true)} />;
  } else if (!progress) {
    content = null;
  } else if (!team || changingTeam) {
    content = <TeamSelect current={changingTeam ? team : null} onChoose={chooseTeam} onCancel={changingTeam ? () => setChangingTeam(false) : null} />;
  } else {
    const mission = missionId && missionById(missionId);
    const next = view === 'mission' ? nextMission() : null;
    content = (
      <>
        <TopBar account={account} progress={progress} view={view} onNav={(v) => { setView(v); setMissionId(null); }} onLogout={() => logout()} />
        {view === 'mission' && mission ? (
          <MissionView key={mission.id} mission={mission} team={team} account={account} progress={progress} previous={progress.teams[team]?.[mission.id]}
            onExit={() => { setView('map'); setMissionId(null); }} onComplete={complete}
            onNext={next ? () => setMissionId(next.id) : null} />
        ) : view === 'profile' ? (
          <Profile account={account} progress={progress} onAccount={setAccount} onSwitchTeam={() => setChangingTeam(true)} />
        ) : view === 'arsenal' ? (
          <Arsenal progress={progress} />
        ) : view === 'ranking' ? (
          <Leaderboard account={account} />
        ) : (
          <CampaignMap progress={progress} account={account} onPlay={(id) => { setMissionId(id); setView('mission'); window.scrollTo({ top: 0 }); }} />
        )}
        <footer className="relative z-10 px-4 py-8 text-center text-[11px] text-slate-600">
          CyberOps: Operación Otero · Laboratorio 100 % simulado con fines formativos. Empresas, dominios e IPs ficticios.
        </footer>
      </>
    );
  }

  return (
    <div className="cyber-bg scanlines relative min-h-full" style={{ '--team': color }}>
      <CyberBackground color={color} />
      {content}
    </div>
  );
}
