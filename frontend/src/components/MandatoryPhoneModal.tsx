import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PrimaryButton, ErrorState } from './common/Primitives';

export function MandatoryPhoneModal() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a valid 10-digit Indian phone number
  const cleanPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
  const hasValidPhone = /^[6-9]\d{9}$/.test(cleanPhone);

  // Show modal ONLY if:
  // 1. User is logged in
  // 2. User is NOT Admin/Super Admin
  // 3. User does NOT have a valid mobile number (e.g. logged in via Google/Email without phone)
  const needsPhone = user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && !hasValidPhone;

  if (!needsPhone) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const inputPhone = phone.trim().replace(/\D/g, '');

    if (!/^[6-9]\d{9}$/.test(inputPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ phone: inputPhone })
          .eq('id', session.user.id);

        if (updateErr) throw updateErr;
      }
      await refreshUser();
    } catch (err: any) {
      setError(err?.message || 'Could not update mobile number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: 440,
          padding: '28px 24px',
          color: 'var(--text-main)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
          }}
        >
          📱
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0' }}>
          Mobile Number Required
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          काम बाज़ार पर नौकरी ढूंढने या जॉब पोस्ट करने के लिए 10-अंकों का मोबाइल नंबर दर्ज करना अनिवार्य है।
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              10-Digit Mobile Number (मोबाइल नंबर) *
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: 15,
                fontWeight: 600,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && <ErrorState message={error} />}

          <PrimaryButton type="submit" disabled={isSubmitting} style={{ padding: 13, fontSize: 15 }}>
            {isSubmitting ? 'Saving Number...' : '✅ Save & Continue'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
