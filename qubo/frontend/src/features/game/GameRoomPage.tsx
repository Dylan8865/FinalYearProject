import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { GameHistoryEvent, GameMatch, UnityGameMessage } from '@/types/game';
import { useEffect, useRef, useState } from 'react';
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

export default function GameRoomPage() {
  const gameIframeRef = useRef<HTMLIFrameElement>(null);
  const activeMatchRef = useRef<ActiveMatch | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'starting' | 'recording' | 'saving' | 'saved' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('Start a ChemBattle match to save its result.');

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
          await authService.completeGameMatch(match.match_id, message.winner, message.turns_played);
          setSyncStatus('saved');
          setSyncMessage(`Saved ${message.winner}'s result with ${message.turns_played} turns.`);
        } catch {
          setSyncStatus('error');
          setSyncMessage('The match finished, but its result could not be saved.');
        }
      })();
    };

    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Game room</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">ChemBattle</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Put chemistry combinations into practice in the built GameDev experience.</p>

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
      </main>
    </div>
  );
}
