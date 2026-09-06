import { useEffect } from 'react';
import { FiPause, FiPlay, FiX, FiCheck } from 'react-icons/fi';
import { useTimerStore } from '@/contexts/timerStore';

interface PomodoroTimerProps {
  onFinish: (durationMinutes: number, completedCycles: number) => void;
  onCancel: () => void;
}

export default function PomodoroTimer({
  onFinish,
  onCancel,
}: PomodoroTimerProps) {
  const {
    isActive,
    timeLeft,
    mode,
    cyclesCompleted,
    totalWorkSeconds,
    initialMinutes,
    breakMinutes,
    toggleTimer,
    tick,
  } = useTimerStore();

  const totalTime = mode === 'work' ? initialMinutes * 60 : breakMinutes * 60;

  useEffect(() => {
    // Tick immediately to catch up time in case we navigated away
    tick();

    const intervalId = window.setInterval(() => {
      tick();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [tick]);

  const handleFinishEarly = () => {
    const elapsedMinutes = Math.max(1, Math.floor(totalWorkSeconds / 60));
    onFinish(elapsedMinutes, cyclesCompleted);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercentage) / 100;

  return (
    <div className="flex flex-col items-center justify-center rounded-[30px] bg-slate-950 p-8 text-white shadow-2xl w-full max-w-sm">
      <div className="mb-6 flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${mode === 'work' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {mode === 'work' ? 'Focus Time' : 'Break Time'}
          </span>
          <span className="text-sm font-semibold text-slate-400">
            Cycles: {cyclesCompleted}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          title="Cancel Session"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
        <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={mode === 'work' ? '#3b82f6' : '#10b981'}
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              strokeDasharray,
              strokeDashoffset,
              transition: 'stroke-dashoffset 1s linear',
            }}
          />
        </svg>

        <div className="z-10 text-center">
          <div className="text-5xl font-extrabold tracking-tighter text-white font-mono">
            {formatTime(timeLeft)}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-400">
            {mode === 'work' ? 'Stay focused' : 'Take a breather'}
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-xs items-center justify-center gap-4">
        <button
          onClick={toggleTimer}
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 transition hover:scale-105 active:scale-95"
        >
          {isActive ? <FiPause className="h-6 w-6" /> : <FiPlay className="h-6 w-6 translate-x-0.5" />}
        </button>
        
        <button
          onClick={handleFinishEarly}
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
          title="Finish and Save Session"
        >
          <FiCheck className="h-6 w-6" />
        </button>
      </div>
      
      <p className="mt-6 text-xs text-slate-500 text-center max-w-[200px]">
        You can pause at any time, or click the checkmark to save early.
      </p>
    </div>
  );
}
