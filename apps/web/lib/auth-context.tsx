import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './apiClient';

interface AuthUser {
  id: string;
  role: 'buyer' | 'seller' | 'admin';
  displayName: string;
}

interface AuthContextShape {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  requestEmailOtp: (email: string) => Promise<{ expiresAt: string; otpPreview: string }>;
  verifyEmailOtp: (params: { email: string; code: string }) => Promise<void>;
  loginWithLineDemo: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

const STORAGE_KEY = 'socialtrust.auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as { user: AuthUser; token: string };
      setUser(parsed.user);
      setToken(parsed.token);
    }
    setLoading(false);
  }, []);

  const persist = (payload: { user: AuthUser; token: string }) => {
    setUser(payload.user);
    setToken(payload.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const requestEmailOtp = async (email: string) => {
    const response = await apiFetch<{ expiresAt: string; otpPreview: string }>(
      '/auth/email/request',
      {
        method: 'POST',
        body: { email }
      }
    );
    return response;
  };

  const verifyEmailOtp = async ({ email, code }: { email: string; code: string }) => {
    const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/email/verify', {
      method: 'POST',
      body: { email, code }
    });
    persist(response);
  };

  const loginWithLineDemo = async (code: string) => {
    const response = await apiFetch<{ token: string; user: AuthUser }>('/auth/line/callback', {
      method: 'POST',
      body: {
        code,
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/login' : ''
      }
    });
    persist(response);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      requestEmailOtp,
      verifyEmailOtp,
      loginWithLineDemo,
      logout
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
