import { SEOHead } from '../../components/SEOHead';

export function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px', color: 'var(--text-main)', minHeight: 'calc(100vh - 120px)' }}>
      <SEOHead
        title="Privacy Policy (गोपनीयता नीति) — Kaam Bazar (काम बाज़ार)"
        description="Privacy Policy for Kaam Bazar detailing how user data, phone numbers, and Aadhaar document verification details are protected."
      />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)', marginBottom: 20 }}>
        Privacy Policy (गोपनीयता नीति)
      </h1>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, lineHeight: 1.8, fontSize: 15, color: 'var(--text-main)' }}>
        <p style={{ marginTop: 0 }}>
          At <strong>Kaam Bazar (काम बाज़ार)</strong>, we take the privacy of our workers (कामगार) and employers seriously. This privacy policy explains what data we collect, how it is stored securely, and how it is used.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 24, marginBottom: 8 }}>1. Data We Collect</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          - <strong>Account Details:</strong> Full name, mobile phone number, email address, role (Worker / Employer), and location.<br />
          - <strong>Identity Verification:</strong> Aadhaar number and front/back card images submitted voluntarily by workers for identity verification.<br />
          - <strong>Payment Records:</strong> Transaction IDs and subscription plan details processed securely via Razorpay.
        </p>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginTop: 24, marginBottom: 8 }}>2. How We Protection Your Data</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          - Phone numbers are masked by default and only revealed when an authorized employer unlocks a contact.<br />
          - Aadhaar documents are accessible exclusively by platform administrators for verification.<br />
          - We comply with India's Digital Personal Data Protection (DPDP) Act, 2023.
        </p>
      </div>
    </div>
  );
}
