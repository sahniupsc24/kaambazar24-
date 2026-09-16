import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../api/client';
import { AuthUser, UserRole } from '../types';

// ✅ Admin emails — auto SUPER_ADMIN role diya jayega
const ADMIN_EMAILS = ['satyamsahani293@gmail.com', 'examsform3@gmail.com', 'sahniupsc24@gmail.com'];


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
  loginWithGoogle: () => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile fetch from Supabase
  const fetchProfile = async (userId: string, email?: string): Promise<AuthUser> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return {
      id: userId,
      email: email || profile?.email || '',
      phone: profile?.phone || '',
      role: (profile?.role as UserRole) || UserRole.WORKER,
      isActive: profile?.is_active ?? true,
      isEmailVerified: true,
      isPhoneVerified: true,
      avatarUrl: profile?.avatar_url || null,
    } as AuthUser;
  };

  // ✅ Identifier ko email format mein convert karo
  // Phone: "9876543210" → "9876543210@kaambazar.app"
  // Email: unchanged
  const normalizeIdentifier = (identifier: string): string => {
    const clean = identifier.trim();
    if (/^[6-9]\d{9}$/.test(clean)) {
      return `${clean}@kaambazar.app`;
    }
    return clean;
  };

  const refreshUser = async () => {
    try {
      // 1. Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || '';
        // Auto-assign SUPER_ADMIN for admin emails
        if (ADMIN_EMAILS.includes(email)) {
          await supabase.from('profiles').upsert([{
            id: session.user.id,
            email,
            role: 'SUPER_ADMIN',
            is_active: true,
          }]);
        }
        const authUser = await fetchProfile(session.user.id, session.user.email);
        setUser(authUser);
        return;
      }
      // 2. Fallback: Backend JWT (phone OTP users)
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const u = res.data?.data;
          if (u) {
            setUser({
              id: u.id,
              email: u.email || '',
              phone: u.phone || '',
              role: u.role as UserRole,
              isActive: u.isActive ?? true,
              isEmailVerified: true,
              isPhoneVerified: true,
              avatarUrl: u.avatarUrl || null,
            });
            return;
          }
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/update-password';
        return;
      }

      if (session?.user) {
        const email = session.user.email || '';
        if (ADMIN_EMAILS.includes(email)) {
          await supabase.from('profiles').upsert([{
            id: session.user.id,
            email,
            role: 'SUPER_ADMIN',
            is_active: true,
          }]);
        }
        // Google login: create profile if not exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!existingProfile) {
          const role = ADMIN_EMAILS.includes(email) ? 'SUPER_ADMIN' : 'WORKER';
          await supabase.from('profiles').insert([{
            id: session.user.id,
            email,
            role,
            is_active: true,
          }]);
        }

        const authUser = await fetchProfile(session.user.id, session.user.email);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // ✅ Login: Phone ya Email + Password dono support
  async function loginWithPassword(identifier: string, password: string): Promise<AuthUser> {
    const emailToUse = normalizeIdentifier(identifier);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        throw new Error('Email/Phone ya Password galat hai. Pehle Register karein agar account nahi hai.');
      }
      throw new Error(error.message);
    }

    if (!data?.user) throw new Error('Login failed. Please try again.');

    // Admin: Always ensure SUPER_ADMIN role
    const email = data.user.email || '';
    if (ADMIN_EMAILS.includes(email)) {
      await supabase.from('profiles').upsert([{
        id: data.user.id,
        email,
        role: 'SUPER_ADMIN',
        is_active: true,
      }]);
    }

    const authUser = await fetchProfile(data.user.id, data.user.email);
    setUser(authUser);
    return authUser;
  }

  // ✅ Admin login (same as loginWithPassword but role check)
  async function adminLogin(identifier: string, password: string): Promise<AuthUser> {
    const authUser = await loginWithPassword(identifier, password);
    if (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      await supabase.auth.signOut();
      setUser(null);
      throw new Error('Access denied. Admin account required.');
    }
    return authUser;
  }

  // OTP (postponed — backend ready jab Fast2SMS key aaye)
  async function requestOtp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const res = await api.post('/auth/otp/request', { phone: cleanPhone });
    if (!res.data?.success) throw new Error('Could not send OTP. Please try again.');
  }

  async function verifyOtp(phone: string, code: string): Promise<AuthUser> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const res = await api.post('/auth/otp/verify', { phone: cleanPhone, code });
    const { accessToken, refreshToken, user: backendUser } = res.data?.data || {};
    if (!accessToken || !backendUser) throw new Error('OTP verification failed');
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    const authUser: AuthUser = {
      id: backendUser.id,
      email: backendUser.email || '',
      phone: backendUser.phone || '',
      role: backendUser.role as UserRole,
      isActive: backendUser.isActive ?? true,
      isEmailVerified: true,
      isPhoneVerified: true,
      avatarUrl: backendUser.avatarUrl || null,
    };
    setUser(authUser);
    return authUser;
  }

  // ✅ Register: Phone mandatory, Email optional
  async function register(input: {
    phone: string;
    email?: string;
    password: string;
    role: UserRole.WORKER | UserRole.EMPLOYER;
    fullNameOrBusinessName: string;
  }) {
    // Use provided email or create phone-based email
    const emailToUse = input.email?.trim() || `${input.phone.replace(/\D/g, '')}@kaambazar.app`;

    const { data, error } = await supabase.auth.signUp({
      email: emailToUse,
      password: input.password,
    });
    if (error) throw error;

    if (data.user) {
      // Create profile
      await supabase.from('profiles').insert([{
        id: data.user.id,
        email: emailToUse,
        phone: input.phone,
        role: input.role,
        is_active: true,
      }]);

      // Create role-specific profile
      if (input.role === UserRole.WORKER) {
        await supabase.from('worker_profiles').insert([{
          user_id: data.user.id,
          full_name: input.fullNameOrBusinessName,
        }]);
      } else {
        await supabase.from('employer_profiles').insert([{
          user_id: data.user.id,
          company_name: input.fullNameOrBusinessName,
          contact_person: input.fullNameOrBusinessName,
        }]);
      }

      const authUser = await fetchProfile(data.user.id, emailToUse);
      setUser(authUser);
    }
  }

  // ✅ Google OAuth — real Google account picker
  async function loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  }

  function logout() {
    supabase.auth.signOut();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, loginWithPassword, requestOtp, verifyOtp, adminLogin, register, loginWithGoogle, refreshUser, logout }}
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
