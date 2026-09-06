import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ErrorState, PrimaryButton } from '../components/common/Primitives';
import { Briefcase, Building2 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole.WORKER | UserRole.EMPLOYER>(UserRole.WORKER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register({ email, password, phone: phone || undefined, role, fullNameOrBusinessName: name });
      navigate(role === UserRole.WORKER ? '/worker/dashboard' : '/employer/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
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

        <div style={{ marginBottom: 20 }}>
          <GoogleSignInButton role={role} label={`Sign up as ${role === UserRole.WORKER ? 'Worker' : 'Employer'} with Google`} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 12px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>OR WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="form-label">{role === UserRole.WORKER ? 'Full Name (पूरा नाम)' : 'Business / Contact Name'}</label>
            <input
              className="form-input"
              placeholder={role === UserRole.WORKER ? 'e.g. Ramesh Kumar' : 'e.g. ABC Construction'}
              required value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Email Address (ईमेल)</label>
            <input className="form-input" type="email" placeholder="e.g. ramesh@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Phone Number (फ़ोन नंबर)</label>
            <input className="form-input" placeholder="e.g. 9876543210 (Optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Password (पासवर्ड)</label>
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
