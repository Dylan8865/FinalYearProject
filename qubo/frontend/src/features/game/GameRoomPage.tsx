import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { GameHistoryEvent, GameMatch, GameMatchHistory, LevelOneLeaderboardEntry, UnityGameMessage } from '@/types/game';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiAlertCircle, FiAward, FiCheckCircle, FiExternalLink, FiMonitor } from 'react-icons/fi';

// Override this with VITE_GAME_URL when the WebGL build is hosted elsewhere.
const gameUrl = import.meta.env.VITE_GAME_URL || '/game/index.html';

type ActiveMatch = {
  createMatch: Promise<GameMatch>;
  events: GameHistoryEvent[];
  completed: boolean;
};

const isGameMessage = (value: unknown): value is UnityGameMessage => {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;

  const message = value as Record<string, unknown>;
  if (message.type === 'qubo:match-started') return true;
  if (message.type === 'qubo:match-event') {
    return Number.isInteger(message.turn_number)
      && typeof message.effect_type === 'string'
      && (!('effect_value' in message) || typeof message.effect_value === 'number');
  }
  return message.type === 'qubo:match-completed'
    && typeof message.winner === 'string'
    && Number.isInteger(message.turns_played);
};

const formatMatchDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
}).format(new Date(value));

const isPlayerVictory = (message: Extract<UnityGameMessage, { type: 'qubo:match-completed' }>) => {
  if (typeof message.is_victory === 'boolean') return message.is_victory;
  return /^(player|student|user)$/i.test(message.winner.trim());
};

const playerInitials = (username: string) => username.trim().slice(0, 2).toUpperCase() || 'QB';

const rankBadge = (rank: number) => {
  if (rank === 1) return { label: 'Champion', className: 'bg-amber-100 text-amber-700' };
  if (rank === 2) return { label: 'Runner-up', className: 'bg-slate-200 text-slate-700' };
  if (rank === 3) return { label: 'Top three', className: 'bg-orange-100 text-orange-700' };
  return { label: 'Challenger', className: 'bg-cyan-50 text-cyan-700' };
};

export default function GameRoomPage() {
  const gameIframeRef = useRef<HTMLIFrameElement>(null);
  const activeMatchRef = useRef<ActiveMatch | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'starting' | 'recording' | 'saving' | 'saved' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('Start a ChemBattle match to save its result.');
  const [matchHistory, setMatchHistory] = useState<GameMatchHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LevelOneLeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'lobby' | 'leaderboard'>('lobby');

  const refreshGameData = useCallback(async () => {
    const [historyResult, leaderboardResult] = await Promise.allSettled([
      authService.getGameMatchHistory(),
      authService.getLevelOneLeaderboard(),
    ]);
    if (historyResult.status === 'fulfilled') setMatchHistory(historyResult.value);
    if (leaderboardResult.status === 'fulfilled') setLeaderboard(leaderboardResult.value);
  }, []);

  const openUnityFullscreen = () => {
    try {
      gameIframeRef.current?.contentWindow?.document.querySelector<HTMLElement>('#unity-fullscreen-button')?.click();
    } catch {
      // This control requires the Unity build to be served from the same origin as Qubo.
    }
  };

  useEffect(() => {
    if (!gameUrl) return undefined;

    const expectedOrigin = new URL(gameUrl, window.location.origin).origin;

    const handleGameMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== expectedOrigin || event.source !== gameIframeRef.current?.contentWindow || !isGameMessage(event.data)) {
        return;
      }

      const message = event.data;
      if (message.type === 'qubo:match-started') {
        const activeMatch = activeMatchRef.current;
        if (activeMatch && !activeMatch.completed) return;

        activeMatchRef.current = {
          createMatch: authService.createGameMatch(),
          events: [],
          completed: false,
        };
        setSyncStatus('starting');
        setSyncMessage('Match started — preparing secure save.');
        activeMatchRef.current.createMatch
          .then(() => {
            setSyncStatus('recording');
            setSyncMessage('Match in progress — game actions are being recorded.');
          })
          .catch(() => {
            setSyncStatus('error');
            setSyncMessage('The match could not be prepared for saving.');
          });
        return;
      }

      const activeMatch = activeMatchRef.current;
      if (!activeMatch || activeMatch.completed) return;

      if (message.type === 'qubo:match-event') {
        activeMatch.events.push({
          turn_number: message.turn_number,
          effect_type: message.effect_type,
          effect_value: message.effect_value,
          corrupted_id: message.corrupted_id,
        });
        return;
      }

      activeMatch.completed = true;
      setSyncStatus('saving');
      setSyncMessage('Saving the completed match…');
      void (async () => {
        try {
          const match = await activeMatch.createMatch;
          if (activeMatch.events.length > 0) {
            await authService.saveGameMatchHistory(match.match_id, activeMatch.events);
          }
          const victory = isPlayerVictory(message);
          const wavesCleared = message.waves_cleared ?? (victory ? 6 : 0);
          await authService.completeGameMatch(match.match_id, message.winner, message.turns_played, wavesCleared, victory);
          setSyncStatus('saved');
          setSyncMessage(`Saved ${message.winner}'s result with ${message.turns_played} turns.`);
          await refreshGameData();
        } catch {
          setSyncStatus('error');
          setSyncMessage('The match finished, but its result could not be saved.');
        }
      })();
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [refreshGameData]);

  useEffect(() => {
    void refreshGameData();
  }, [refreshGameData]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Game room</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">ChemBattle Lobby</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Put chemistry combinations into practice in the built GameDev experience.</p>
        <nav className="mt-6 flex items-center gap-6 border-b border-slate-200" aria-label="ChemBattle pages">
          <button type="button" onClick={() => setActiveTab('lobby')} className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${activeTab === 'lobby' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Lobby</button>
          <button type="button" onClick={() => setActiveTab('leaderboard')} className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${activeTab === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>Leaderboard</button>
        </nav>

        {activeTab === 'lobby' ? <>
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              {gameUrl ? (
                <iframe ref={gameIframeRef} title="ChemBattle game" src={gameUrl} className="aspect-video w-full bg-slate-950" allow="fullscreen" allowFullScreen />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-blue-300"><FiMonitor className="h-8 w-8" /></div>
                  <h2 className="mt-5 text-2xl font-extrabold">Game build not linked yet</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">Set <code className="rounded bg-white/10 px-1.5 py-0.5 text-white">VITE_GAME_URL</code> in the frontend environment file to embed the GameDev build here.</p>
                </div>
              )}
            </section>
            {gameUrl && <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={openUnityFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#20b7dc] shadow-sm transition hover:bg-[#169fc2] focus:outline-none focus:ring-2 focus:ring-[#20b7dc] focus:ring-offset-2"
                aria-label="Play ChemBattle in full screen"
                title="Play ChemBattle in full screen"
              >
                <img src="/game/TemplateData/fullscreen-button.png" alt="" className="h-7 w-7" />
              </button>
            </div>}
          </div>
          <aside className="space-y-5">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><FiAward className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl font-extrabold">Match results</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{syncMessage}</p>
              {syncStatus === 'saved' && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600"><FiCheckCircle /> Saved to your Qubo match history</p>}
              {syncStatus === 'error' && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-600"><FiAlertCircle /> Saving needs an active Qubo login</p>}
            </section>
            {gameUrl && <a href={gameUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">Open game in a new tab <FiExternalLink /></a>}
          </aside>
        </div>
        <section className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-xl font-extrabold">Match history</h2><p className="mt-1 text-sm text-slate-500">Only you can see your completed ChemBattle matches.</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-primary">Recent 5</span></div>
          {matchHistory.length ? <div className="divide-y divide-slate-100">{matchHistory.map((match) => <div key={match.match_id} className="grid gap-2 px-6 py-4 text-sm sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_100px_70px] sm:items-center"><div><p className="font-bold text-slate-700">{formatMatchDate(match.match_date)}</p><p className="mt-1 text-xs font-semibold text-slate-400">Level {match.game_level} · {match.waves_cleared}/6 waves</p></div><p className="font-semibold text-slate-600">Winner: {match.winner}</p><p className="font-extrabold text-slate-700">{match.turns_played} turns</p><span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${match.result === 'Win' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{match.result}</span></div>)}</div> : <div className="px-6 py-10 text-center text-sm text-slate-500">Finish a ChemBattle match to see it here.</div>}
        </section>
        </> : <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 bg-gradient-to-r from-[#f4f8ff] via-white to-[#fff8e8] px-6 py-7 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm"><FiAward className="h-7 w-7" /></div><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Hall of fame</p><h2 className="mt-1 text-2xl font-extrabold text-slate-950">ChemBattle leaderboard</h2><p className="mt-1 text-sm text-slate-500">Fastest victorious players take the top spots.</p></div></div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ranked players</p><p className="mt-1 text-xl font-extrabold text-slate-800">{leaderboard.length}</p></div>
          </div>
          {leaderboard.length ? <><div className="grid grid-cols-[72px_minmax(0,1fr)_110px_120px] gap-3 border-y border-slate-100 bg-slate-50 px-6 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400 md:px-8"><span>Rank</span><span>Player</span><span className="text-right">Best score</span><span className="hidden text-center sm:block">Badge</span></div><div className="divide-y divide-slate-100">{leaderboard.map((entry) => { const badge = rankBadge(entry.rank); return <div key={`${entry.rank}-${entry.username}`} className="grid grid-cols-[72px_minmax(0,1fr)_110px_120px] items-center gap-3 px-6 py-4 transition hover:bg-blue-50/40 md:px-8"><div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-extrabold ${badge.className}`}>#{entry.rank}</div><div className="flex min-w-0 items-center gap-3">{entry.profile_picture_url ? <img src={entry.profile_picture_url} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" /> : <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-extrabold text-white shadow-sm">{playerInitials(entry.username)}</span>}<div className="min-w-0"><p className="truncate font-extrabold text-slate-800">{entry.username}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-400">Played {formatMatchDate(entry.played_at)}</p></div></div><p className="text-right text-base font-extrabold text-primary">{entry.turns_played}<span className="ml-1 text-xs text-slate-400">turns</span></p><div className="hidden justify-center sm:flex"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${badge.className}`}><FiAward className="h-3.5 w-3.5" />{badge.label}</span></div></div>})}</div></> : <div className="px-6 py-14 text-center text-sm text-slate-500">There are no student wins to rank yet.</div>}
        </section>}
      </main>
    </div>
  );
}
