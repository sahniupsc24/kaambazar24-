import { SEOHead } from '../../components/SEOHead';

export function TermsPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px', color: 'var(--text-main)', minHeight: 'calc(100vh - 120px)' }}>
      <SEOHead
        title="Terms & Conditions (नियम और शर्तें) — Kaam Bazar (काम बाज़ार)"
        description="Terms and Conditions for using Kaam Bazar platform for hiring blue-collar workers and finding job opportunities."
      />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>
        Terms & Conditions (नियम और शर्तें)
      </h1>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, lineHeight: 1.8, fontSize: 15, color: 'var(--text-main)' }}>
        <p style={{ marginTop: 0 }}>
          Welcome to <strong>Kaam Bazar (काम बाज़ार)</strong>. By using our website or mobile portal, you agree to follow these terms and conditions.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 24, marginBottom: 8 }}>1. User Accounts & Responsibilities</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          - Workers (कामगार) agree to provide accurate information regarding their skills, experience, and Aadhaar identity details.<br />
          - Employers agree to post real jobs with fair wage offers and treat workers with respect.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 24, marginBottom: 8 }}>2. Contact Unlocks & Subscriptions</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          - Subscription plans and contact unlock credits purchased via Razorpay are non-refundable once unlocked contacts are accessed.
        </p>
      </div>
    </div>
  );
}
