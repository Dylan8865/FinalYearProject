import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'qubo-theme';

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
};

const initialTheme: ThemeMode = 'light';
applyTheme(initialTheme);

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const initializeTheme = () => {
  // Theme choice is intentionally temporary. Remove values saved by older
  // versions so reopening or refreshing the app always starts in light mode.
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  }
  applyTheme(initialTheme);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const appliedTheme = document.documentElement.classList.contains('dark') ? 'dark' : get().theme;
    const nextTheme = appliedTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
