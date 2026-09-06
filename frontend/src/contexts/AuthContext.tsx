import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';
import { AuthUser, UserRole } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthUser>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<AuthUser>;
  adminLogin: (identifier: string, password: string) => Promise<AuthUser>;
  register: (input: {
    phone: string;
    email?: string;
    password: string;
    role: UserRole.WORKER | UserRole.EMPLOYER;
    fullNameOrBusinessName: string;
  }) => Promise<void>;
  loginWithGoogle: (email: string, name: string, role?: UserRole.WORKER | UserRole.EMPLOYER, avatarUrl?: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applySession(data: { accessToken: string; refreshToken: string; user: AuthUser }, setUser: (u: AuthUser) => void) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  setUser(data.user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function loginWithPassword(identifier: string, password: string): Promise<AuthUser> {
    const res = await api.post('/auth/login', { identifier, password });
    applySession(res.data.data, setUser);
    return res.data.data.user;
  }

  async function requestOtp(phone: string) {
    await api.post('/auth/otp/request', { phone });
  }

  async function verifyOtp(phone: string, code: string): Promise<AuthUser> {
    const res = await api.post('/auth/otp/verify', { phone, code });
    applySession(res.data.data, setUser);
    return res.data.data.user;
  }

  async function adminLogin(identifier: string, password: string): Promise<AuthUser> {
    const res = await api.post('/auth/login', { identifier, password });
    applySession(res.data.data, setUser);
    return res.data.data.user;
  }

  async function register(input: {
    phone: string;
    email?: string;
    password: string;
    role: UserRole.WORKER | UserRole.EMPLOYER;
    fullNameOrBusinessName: string;
  }) {
    const res = await api.post('/auth/register', input);
    applySession(res.data.data, setUser);
  }

  async function loginWithGoogle(email: string, name: string, role?: UserRole.WORKER | UserRole.EMPLOYER, avatarUrl?: string): Promise<AuthUser> {
    const res = await api.post('/auth/google', { email, name, role, avatarUrl });
    applySession(res.data.data, setUser);
    return res.data.data.user;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, loginWithPassword, requestOtp, verifyOtp, adminLogin, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
