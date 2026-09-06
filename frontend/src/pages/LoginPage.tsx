import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { ErrorState, PrimaryButton, SecondaryButton } from '../components/common/Primitives';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

type Mode = 'password' | 'otp';

export function LoginPage() {
  const { loginWithPassword, requestOtp, verifyOtp } = useAuth();
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


  function handleRoleRedirect(role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      navigate('/admin/dashboard');
    } else if (role === 'EMPLOYER') {
      navigate('/employer/dashboard');
    } else if (role === 'WORKER') {
      navigate('/worker/dashboard');
    } else {
      navigate('/');
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
      setError(err?.response?.data?.message ?? 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
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
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

        {/* Google Sign-In */}
        <div style={{ marginBottom: 18 }}>
          <GoogleSignInButton label="Sign in with Google" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </div>

        {/* Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 20,
          background: 'var(--bg-hover)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'password' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'password' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
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
              flex: 1,
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'otp' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: mode === 'otp' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📱 Mobile OTP
          </button>
        </div>

        {/* Password Login Form */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email / Phone / Username
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    padding: 4,
                    lineHeight: 1,
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

        {/* OTP — Step 1: Enter Phone */}
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
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </div>
            {error && <ErrorState message={error} />}
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP...' : '📲 Send OTP'}
            </PrimaryButton>
          </form>
        )}

        {/* OTP — Step 2: Verify */}
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
              onChange={(e) => setOtp(e.target.value)}
              style={{
                ...inputStyle,
                fontSize: 20,
                textAlign: 'center',
                letterSpacing: 8,
                fontWeight: 700,
              }}
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
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--text-muted)',
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
  const [step, setStep] = useState<1 | 2>(1);
  const [ident, setIdent] = useState('');
  const [code, setCode] = useState('');

  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/auth/forgot-password/request-otp', { identifier: ident });
      setStep(2);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Could not send OTP. Account not found.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.post('/auth/forgot-password/reset', { identifier: ident, code, newPassword: newPass });
      setMsg({ type: 'success', text: 'Password reset successfully! You can now log in.' });
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 16, backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          width: '100%', maxWidth: 420,
          padding: 24,
          color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Reset Password (पासवर्ड रिसेट)</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>
            {msg.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'grid', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Enter your registered Email or Mobile number to receive a reset OTP code.
            </p>
            <input
              type="text"
              placeholder="e.g. 9876543210 or user@example.com"
              required
              value={ident}
              onChange={(e) => setIdent(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
            />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Sending Code...' : '📩 Request Reset OTP'}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 14 }}>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 16, textAlign: 'center', letterSpacing: 4 }}
            />
            <input
              type="password"
              placeholder="Enter New Password (min 6 chars)"
              required
              minLength={6}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
            />
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? 'Updating Password...' : '🔒 Reset Password Now'}
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
}
