import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError, clearToken, getToken, setToken } from '../lib/api';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ data: User }>('/me');
      setUser(res.data);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login: AuthState['login'] = async (loginValue, password) => {
    try {
      const res = await api.post<{ data: User; token: string }>('/login', { login: loginValue, password });
      setToken(res.token);
      setUser(res.data);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiError ? err.message : 'Gagal masuk.' };
    }
  };

  const register: AuthState['register'] = async (data) => {
    try {
      const res = await api.post<{ data: User; token: string }>('/register', data);
      setToken(res.token);
      setUser(res.data);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof ApiError ? err.message : 'Gagal mendaftar.' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // token mungkin sudah invalid — tetap lanjut bersihkan sisi klien
    }
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
