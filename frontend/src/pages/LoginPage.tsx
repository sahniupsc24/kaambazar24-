import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { ErrorState, PrimaryButton, SecondaryButton } from '../components/common/Primitives';
import { SEOHead } from '../components/SEOHead';
import { supabase } from '../lib/supabase';


type Mode = 'password' | 'otp';

export function LoginPage() {
  const { loginWithPassword, loginWithGoogle, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleRoleRedirect(role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
    } else if (role === 'EMPLOYER') {
      navigate('/employer/dashboard');
    } else {
      navigate('/worker/dashboard');
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const u = await loginWithPassword(identifier, password);
      handleRoleRedirect(u.role);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Google redirects to /auth/callback — no navigate needed here
    } catch (err: any) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const u = await verifyOtp(phone, otp);
      handleRoleRedirect(u.role);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Incorrect OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-main)',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'var(--bg-page)',
    }}>
      <SEOHead title="Login — Kaam Bazar" />
      <div style={{
        width: '100%',
        maxWidth: 440,
        padding: '28px 24px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            margin: '0 auto 12px',
            boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
          }}>
            🧰
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            काम बाज़ार — India's Blue-Collar Marketplace
          </p>
        </div>

        {/* ✅ Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: 14,
            fontWeight: 700,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)',
            opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {!googleLoading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.14C3.25 21.32 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.26C.46 8.18 0 10.02 0 12s.46 3.82 1.26 5.41l4.02-3.14z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.26 6.59l4.02 3.14c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          background: 'var(--bg-hover)', padding: 4,
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); }}
            style={{
              flex: 1, padding: '9px 12px',
              borderRadius: 'var(--radius-sm)', border: 'none',
              background: mode === 'password' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'password' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              boxShadow: mode === 'password' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🔑 Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setError(''); }}
            style={{
              flex: 1, padding: '9px 12px',
              borderRadius: 'var(--radius-sm)', border: 'none',
              background: mode === 'otp' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: 700, fontSize: 13,
              boxShadow: mode === 'otp' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📱 Mobile OTP
          </button>
        </div>

        {/* ✅ Password Login — Email OR Phone number */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email or Mobile Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 or user@example.com"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                📱 Mobile number ya 📧 Email — dono se login hoga
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 16,
                    color: 'var(--text-muted)', padding: 4,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password? (पासवर्ड भूल गए?)
                </button>
              </div>
            </div>
            {error && <ErrorState message={error} />}
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : '🚀 Log In'}
            </PrimaryButton>
          </form>
        )}

        {/* OTP Step 1 */}
        {mode === 'otp' && !otpSent && (
          <form onSubmit={handleRequestOtp} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                10-Digit Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                style={inputStyle}
              />
            </div>
            {error && <ErrorState message={error} />}
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP...' : '📲 Send OTP'}
            </PrimaryButton>
          </form>
        )}

        {/* OTP Step 2 */}
        {mode === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
              OTP sent to <strong>{phone}</strong>. Check your SMS.
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...inputStyle, fontSize: 20, textAlign: 'center', letterSpacing: 8, fontWeight: 700 }}
            />
            {error && <ErrorState message={error} />}
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : '✅ Verify & Log In'}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => { setOtpSent(false); setOtp(''); }}>
              ← Change Phone Number
            </SecondaryButton>
          </form>
        )}

        {/* Register Link */}
        <div style={{
          marginTop: 18, paddingTop: 16,
          borderTop: '1px solid var(--border)',
          textAlign: 'center', fontSize: 14, color: 'var(--text-muted)',
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Register Now
          </Link>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [ident, setIdent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const cleanInput = ident.trim();
    const emailToUse = /^[6-9]\d{9}$/.test(cleanInput) ? `${cleanInput}@kaambazar.app` : cleanInput;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMsg({
        type: 'success',
        text: '📩 Password reset link sent to your email! Please check your inbox and click the link to reset your password.',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.message || 'Could not send reset link. Please check your email and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 16, backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)', width: '100%', maxWidth: 420,
          padding: 24, color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Reset Password (पासवर्ड रिसेट)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14,
            backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: msg.type === 'success' ? '#166534' : '#b91c1c',
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleRequestReset} style={{ display: 'grid', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Apna registered Email ya Mobile number enter karo. Reset link aapke email par bhej diya jayega.
          </p>
          <input
            type="text"
            placeholder="e.g. 9876543210 or user@example.com"
            required
            value={ident}
            onChange={(e) => setIdent(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
          />
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Sending Reset Link...' : '📩 Send Reset Link'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}

