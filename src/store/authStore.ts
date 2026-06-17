import { create } from 'zustand';
import { api } from '@/utils/api';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  reputationScore: number;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  verifiedTicketCount: number;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('token', res.token);
    set({ token: res.token, user: res.user });
  },

  register: async (email, username, password) => {
    const res = await api.auth.register({ email, username, password });
    localStorage.setItem('token', res.token);
    set({ token: res.token, user: res.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }
    try {
      set({ loading: true });
      const res = await api.auth.me();
      set({ user: res.user, token, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },
}));
