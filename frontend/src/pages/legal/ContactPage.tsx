import { SEOHead } from '../../components/SEOHead';

export function ContactPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px', color: 'var(--text-main)', minHeight: 'calc(100vh - 120px)' }}>
      <SEOHead
        title="Contact Us (संपर्क करें) — Kaam Bazar (काम बाज़ार)"
        description="Need help with job postings or worker verification? Contact Kaam Bazar support team via WhatsApp or phone."
      />

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
          Contact Us (हमसे संपर्क करें)
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>
          Have a question, need assistance with your subscription, or want to verify your Aadhaar documents? We are here to help!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>WhatsApp Support</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Instant resolution for workers (कामगार) & employers.</p>
          <a
            href="https://wa.me/919935173572"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, backgroundColor: '#25d366', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}
          >
            Chat on WhatsApp (+91 99351 73572)
          </a>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📧</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Email Helpline</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Send detailed queries or partnership requests.</p>
          <a
            href="mailto:support@kaambazar.com"
            style={{ color: '#2563eb', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            support@kaambazar.com
          </a>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⏰</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Working Hours</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Monday to Saturday: 9:00 AM – 8:00 PM IST<br />
            Sunday: Closed
          </p>
        </div>
      </div>
    </div>
  );
}
