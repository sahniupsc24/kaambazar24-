import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorState, PrimaryButton } from '../../components/common/Primitives';

export function AdminLoginPage() {
  const { adminLogin, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const u = await adminLogin(identifier, password);
      if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. This account does not have admin privileges.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid admin credentials. Please check email and password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAdmin() {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Google redirects to /auth/callback which then checks role and redirects to /admin/dashboard
    } catch (err: any) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
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
      padding: 16,
      background: 'var(--bg-page)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: '32px 28px',
        background: 'var(--bg-card)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 12px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
            Admin Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            Restricted to platform administrators only
          </p>
        </div>

        {/* Google Sign In (for Google-only admin accounts) */}
        <button
          type="button"
          onClick={handleGoogleAdmin}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '12px 16px', marginBottom: 16,
            borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-main)',
            fontSize: 14, fontWeight: 700, cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)',
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
          {googleLoading ? 'Redirecting to Google...' : 'Sign in with Google (Admin)'}
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR Email + Password</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Email + Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@kaambazar.com"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && <ErrorState message={error} />}

          <PrimaryButton type="submit" disabled={isSubmitting} style={{ marginTop: 4 }}>
            {isSubmitting ? 'Logging in...' : '🛡️ Admin Login'}
          </PrimaryButton>
        </form>

        <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
            💡 <strong>Tip:</strong> Agar aapne Google se admin account banaya hai, toh "Sign in with Google" use karein. Password se login ke liye pehle password set karein.
          </p>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>← Worker / Employer Login</Link>
        </p>
      </div>
    </div>
  );
}
