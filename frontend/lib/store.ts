import { create } from 'zustand';
import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  account_id: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isInitialized: true, isLoading: false });
    } catch (error) {
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },
  setUser: (user) => set({ user }),
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));
