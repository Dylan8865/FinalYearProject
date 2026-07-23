import { create } from 'zustand';
import { User, AuthTokens, UserRole } from '@/types/auth';
import { authService } from '@/lib/authService';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthInitialized: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthInitialized: (isAuthInitialized: boolean) => void;
  setError: (error: string | null) => void;
  
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (email: string, password: string, username: string, full_name: string, role: 'student' | 'educator') => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const getApiErrorMessage = (error: any, fallback: string) => {
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.';
  }

  if (!error.response) {
    return 'Cannot connect to backend. Please start the FastAPI server on http://127.0.0.1:8002';
  }

  const detail = error.response.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(', ');
  }

  return detail || fallback;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isLoading: false,
  isAuthInitialized: false,
  error: null,

  setUser: (user) => set({ user }),
  setTokens: (tokens) => set({ tokens }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthInitialized: (isAuthInitialized) => set({ isAuthInitialized }),
  setError: (error) => set({ error }),

  login: async (email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password, role });
      set({ 
        user: response.user, 
        tokens: response.tokens,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: getApiErrorMessage(error, 'Login failed'),
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
        error: getApiErrorMessage(error, 'Registration failed'),
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
        error: getApiErrorMessage(error, 'Failed to fetch profile'),
        isLoading: false 
      });
    }
  },
}));
