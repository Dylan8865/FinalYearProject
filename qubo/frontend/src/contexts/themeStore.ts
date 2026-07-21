import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'qubo-theme';

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Continue with the operating-system preference when storage is unavailable.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const saveTheme = (theme: ThemeMode) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Applying the theme should still work when storage is unavailable.
  }
};

const initialTheme: ThemeMode = getInitialTheme();
applyTheme(initialTheme);

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const initializeTheme = () => {
  applyTheme(initialTheme);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    saveTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const appliedTheme = document.documentElement.classList.contains('dark') ? 'dark' : get().theme;
    const nextTheme = appliedTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
