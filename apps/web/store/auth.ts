import { create } from 'zustand';
import { api, setAuthToken } from '../lib/api';

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  displayName: string;
  role: UserRole;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  otpEmail?: string;
  otpExpiresAt?: number;
  loading: boolean;
  error?: string;
  requestEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  loginWithLine: (payload: { lineSub: string; email?: string; displayName?: string }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'thai-escrow-auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  requestEmailOtp: async (email: string) => {
    set({ loading: true, error: undefined });
    try {
      const res = await api.post('/auth/email/request', { email });
      set({
        otpEmail: email,
        otpExpiresAt: res.data.expiresAt,
        loading: false,
      });
      if (res.data.debugCode) {
        console.info('OTP code (dev only):', res.data.debugCode);
      }
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message ?? 'ไม่สามารถส่งรหัสได้' });
    }
  },
  verifyEmailOtp: async (email: string, code: string) => {
    set({ loading: true, error: undefined });
    try {
      const res = await api.post('/auth/email/verify', { email, code });
      const { token, user } = res.data;
      setAuthToken(token);
      set({ user, token, loading: false });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      }
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message ?? 'รหัสไม่ถูกต้อง' });
    }
  },
  loginWithLine: async (payload) => {
    set({ loading: true, error: undefined });
    try {
      const res = await api.post('/auth/line/callback', {
        code: 'mock',
        ...payload,
      });
      const { token, user } = res.data;
      setAuthToken(token);
      set({ user, token, loading: false });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      }
    } catch (error: any) {
      set({ loading: false, error: error?.response?.data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ' });
    }
  },
  logout: () => {
    setAuthToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ user: null, token: null });
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      setAuthToken(parsed.token);
      set({ user: parsed.user, token: parsed.token });
    } catch (error) {
      console.error('Failed to parse auth storage', error);
    }
  },
}));
