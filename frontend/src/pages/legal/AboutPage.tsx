import { SEOHead } from '../../components/SEOHead';

export function AboutPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px', color: 'var(--text-main)', minHeight: 'calc(100vh - 120px)' }}>
      <SEOHead
        title="About Us (हमारे बारे में) — Kaam Bazar (काम बाज़ार)"
        description="Kaam Bazar is India's trusted workforce portal connecting skilled blue-collar workers (कामगार) with honest contractors and employers across India."
      />

      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20, backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'inline-block', marginBottom: 12 }}>
          🇮🇳 INDIA'S WORKFORCE PORTAL (भारत का अपना कामगार बाज़ार)
        </span>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          About Kaam Bazar (काम बाज़ार के बारे में)
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Empowering skilled skilled blue-collar workers (कामगार) and contractors with transparent, direct, and verified job opportunities.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 24, fontSize: 16, lineHeight: 1.8, color: 'var(--text-main)' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginTop: 0, marginBottom: 12 }}>
            🎯 Our Mission (हमारा लक्ष्य)
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            In India, millions of hardworking <strong>कामगार (Workers)</strong> — plumbers, electricians, masons, painters, drivers, site supervisors, and factory staff — struggle with middleman commissions, delayed payments, and unverified job posts.
          </p>
          <p style={{ marginTop: 12, marginBottom: 0, color: 'var(--text-muted)' }}>
            <strong>Kaam Bazar (काम बाज़ार)</strong> was created to eliminate the middleman. We connect contractors, homeowners, and factory owners directly with verified workers via instant phone calls and WhatsApp, ensuring fair daily wages, prompt payment, and total transparency.
          </p>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2563eb', marginTop: 0, marginBottom: 16 }}>
            🌟 Why Choose Kaam Bazar? (हमारी विशेषताएं)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>🆔 Aadhaar Verified Badges</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Every worker profile undergoes document verification to build trust with employers.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>📞 Direct Call & WhatsApp</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No middleman cut. Unlock contacts and speak directly with contractors or skilled workers.</p>
            </div>
            <div style={{ padding: 16, borderRadius: 12, backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>⚡ Instant OTP Access</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Quick login with phone number and OTP for easy registration on mobile screens.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
