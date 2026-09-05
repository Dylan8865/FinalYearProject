import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimerSession {
  subject_id: string;
  topic_name: string;
  notes?: string;
}

export type TimerMode = 'work' | 'break';

interface TimerState {
  isActive: boolean;
  timeLeft: number;
  mode: TimerMode;
  cyclesCompleted: number;
  totalWorkSeconds: number;
  session: TimerSession | null;
  lastTickTime: number | null;
  initialMinutes: number;
  breakMinutes: number;

  startSession: (session: TimerSession, initialMinutes?: number, breakMinutes?: number) => void;
  toggleTimer: () => void;
  cancelSession: () => void;
  tick: () => void;
  finishCycle: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      isActive: false,
      timeLeft: 25 * 60,
      mode: 'work',
      cyclesCompleted: 0,
      totalWorkSeconds: 0,
      session: null,
      lastTickTime: null,
      initialMinutes: 25,
      breakMinutes: 5,

      startSession: (session, initialMinutes = 25, breakMinutes = 5) => set({
        isActive: true,
        timeLeft: initialMinutes * 60,
        mode: 'work',
        cyclesCompleted: 0,
        totalWorkSeconds: 0,
        session,
        lastTickTime: Date.now(),
        initialMinutes,
        breakMinutes,
      }),

      toggleTimer: () => set((state) => ({
        isActive: !state.isActive,
        lastTickTime: !state.isActive ? Date.now() : state.lastTickTime,
      })),

      cancelSession: () => set({
        isActive: false,
        session: null,
        lastTickTime: null,
      }),

      finishCycle: () => set((state) => {
        if (state.mode === 'work') {
          return {
            cyclesCompleted: state.cyclesCompleted + 1,
            mode: 'break',
            timeLeft: state.breakMinutes * 60,
            isActive: true,
            lastTickTime: Date.now(),
          };
        } else {
          return {
            mode: 'work',
            timeLeft: state.initialMinutes * 60,
            isActive: true,
            lastTickTime: Date.now(),
          };
        }
      }),

      tick: () => set((state) => {
        if (!state.isActive || !state.lastTickTime) return state;

        const now = Date.now();
        const elapsedSeconds = Math.floor((now - state.lastTickTime) / 1000);

        if (elapsedSeconds < 1) return state;

        let newTimeLeft = state.timeLeft - elapsedSeconds;
        let newWorkSeconds = state.totalWorkSeconds;

        if (state.mode === 'work') {
          newWorkSeconds += elapsedSeconds;
        }

        if (newTimeLeft <= 0) {
          if (state.mode === 'work') {
            return {
              cyclesCompleted: state.cyclesCompleted + 1,
              mode: 'break',
              timeLeft: (state.breakMinutes * 60) + newTimeLeft,
              totalWorkSeconds: newWorkSeconds,
              lastTickTime: now,
            };
          } else {
            return {
              mode: 'work',
              timeLeft: (state.initialMinutes * 60) + newTimeLeft,
              totalWorkSeconds: newWorkSeconds,
              lastTickTime: now,
            };
          }
        }

        return {
          timeLeft: newTimeLeft,
          totalWorkSeconds: newWorkSeconds,
          lastTickTime: now,
        };
      }),

      resetTimer: () => set({
        isActive: false,
        timeLeft: 25 * 60,
        mode: 'work',
        cyclesCompleted: 0,
        totalWorkSeconds: 0,
        session: null,
        lastTickTime: null,
      }),
    }),
    {
      name: 'qubo-timer-store',
    }
  )
);
