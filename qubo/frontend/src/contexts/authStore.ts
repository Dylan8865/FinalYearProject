import { create } from 'zustand';
import { User, AuthTokens } from '@/types/auth';
import { authService } from '@/lib/authService';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, full_name: string, role: 'student' | 'educator') => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setTokens: (tokens) => set({ tokens }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      set({ 
        user: response.user, 
        tokens: response.tokens,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (email, password, username, full_name, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({
        email,
        password,
        username,
        full_name,
        role,
      });
      set({ 
        user: response.user, 
        tokens: response.tokens,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, tokens: null, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch profile',
        isLoading: false 
      });
    }
  },
}));
