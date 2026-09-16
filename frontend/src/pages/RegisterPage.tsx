import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ErrorState, PrimaryButton } from '../components/common/Primitives';
import { Briefcase, Building2 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole.WORKER | UserRole.EMPLOYER>(UserRole.WORKER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        phone: cleanPhone,
        email: email.trim() || undefined,
        password,
        role,
        fullNameOrBusinessName: name,
      });
      navigate(role === UserRole.WORKER ? '/worker/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message;
      const details = err?.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        const detailMsgs = details.map((d: any) => `${d.path || d.param || 'field'}: ${d.msg}`).join(' | ');
        setError(`Validation error (${detailMsgs})`);
      } else {
        setError(msg ?? 'Registration failed. Please try again.');
      }
    } finally {

      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: 'var(--bg-page)' }}>
      <SEOHead title="Create Account — Kaam Bazar" />
      
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Join Kaam Bazar and start your journey today.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setRole(UserRole.WORKER)}
            style={{ 
              flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)', 
              border: role === UserRole.WORKER ? '2px solid var(--primary)' : '1px solid var(--border)', 
              background: role === UserRole.WORKER ? 'var(--primary-light)' : 'var(--bg-input)', 
              color: role === UserRole.WORKER ? 'var(--primary)' : 'var(--text-main)',
              cursor: 'pointer', fontWeight: 700, fontSize: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <Briefcase size={24} />
            I'm a Worker
          </button>
          <button
            type="button"
            onClick={() => setRole(UserRole.EMPLOYER)}
            style={{ 
              flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)', 
              border: role === UserRole.EMPLOYER ? '2px solid var(--secondary)' : '1px solid var(--border)', 
              background: role === UserRole.EMPLOYER ? 'var(--secondary-light)' : 'var(--bg-input)', 
              color: role === UserRole.EMPLOYER ? 'var(--secondary)' : 'var(--text-main)',
              cursor: 'pointer', fontWeight: 700, fontSize: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'all 0.2s ease'
            }}
          >
            <Building2 size={24} />
            I'm an Employer
          </button>
        </div>

        {/* Google Sign In Button */}
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
          {googleLoading ? 'Redirecting to Google...' : 'Sign up with Google'}
        </button>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR REGISTER WITH FORM</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="form-label">{role === UserRole.WORKER ? 'Full Name (पूरा नाम) *' : 'Business / Contact Name *'}</label>
            <input
              className="form-input"
              placeholder={role === UserRole.WORKER ? 'e.g. Ramesh Kumar' : 'e.g. ABC Construction'}
              required value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Phone Number (फ़ोन नंबर) <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              className="form-input"
              type="tel"
              placeholder="e.g. 9876543210 (Mandatory)"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </div>
          <div>
            <label className="form-label">Email Address (ईमेल) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional / वैकल्पिक)</span></label>
            <input className="form-input" type="email" placeholder="e.g. ramesh@example.com (Optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Password (पासवर्ड) *</label>
            <input className="form-input" type="password" placeholder="Min 8 characters" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          
          {error && <ErrorState message={error} />}
          
          <PrimaryButton type="submit" disabled={isSubmitting} style={{ marginTop: 8, padding: 14, fontSize: 16 }}>
            {isSubmitting ? 'Creating account...' : `Register as ${role === UserRole.WORKER ? 'Worker' : 'Employer'}`}
          </PrimaryButton>
        </form>
        
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
