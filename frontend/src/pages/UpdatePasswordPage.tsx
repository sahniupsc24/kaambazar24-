import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PrimaryButton, ErrorState } from '../components/common/Primitives';
import { SEOHead } from '../components/SEOHead';

export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'var(--bg-page)',
    }}>
      <SEOHead title="Set New Password — Kaam Bazar" />
      <div style={{
        width: '100%',
        maxWidth: 440,
        padding: 28,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-main)', textAlign: 'center' }}>
          🔒 Set New Password (नया पासवर्ड बनाएं)
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
          Apne Kaam Bazar account ke liye naya password set karein.
        </p>

        {success ? (
          <div style={{ padding: 16, borderRadius: 12, background: '#dcfce7', color: '#166534', textAlign: 'center', fontWeight: 600 }}>
            🎉 Password successfully updated! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                New Password (नया पासवर्ड) *
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Confirm New Password (पासवर्ड दोबारा लिखें) *
              </label>
              <input
                type="password"
                placeholder="Repeat new password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            {error && <ErrorState message={error} />}

            <PrimaryButton type="submit" disabled={loading} style={{ padding: 13, fontSize: 15 }}>
              {loading ? 'Saving Password...' : '🔒 Save Password & Continue'}
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
}
