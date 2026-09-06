import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorState, PrimaryButton } from '../../components/common/Primitives';

// Deliberately a separate page/route from the Worker/Employer login. Admin
// accounts never use OTP — username-or-email + password only, and the
// backend's /auth/admin-login endpoint rejects non-admin roles outright.
export function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await adminLogin(identifier, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid admin credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: '64px auto', padding: 24 }}>
      <h1>Admin Login</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Restricted to platform administrators.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <input placeholder="Username or email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
        {error && <ErrorState message={error} />}
        <PrimaryButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log In'}</PrimaryButton>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}><Link to="/login">Worker / Employer login</Link></p>
    </div>
  );
}
