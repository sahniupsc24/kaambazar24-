import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../api/client';
import { Card, LoadingState, ErrorState, PrimaryButton, SecondaryButton, EmptyState } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

function MultiPaymentGatewayCard() {
  const [razorpaySettings, setRazorpaySettings] = useState<any>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);

  const [platformSettings, setPlatformSettings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'razorpay' | 'stripe' | 'paypal' | 'phonepe' | 'paytm'>('razorpay');
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    Promise.all([
      api.get('/admin/payment-gateway'),
      api.get('/admin/settings')
    ]).then(([pgRes, settingsRes]) => {
      setRazorpaySettings(pgRes.data.data);
      setRazorpayKeyId(pgRes.data.data.keyId ?? '');
      setRazorpayEnabled(pgRes.data.data.isEnabled);
      setPlatformSettings(settingsRes.data.data ?? {});
    });
  }

  useEffect(load, []);

  async function save() {
    setMsg('');
    setIsSaving(true);
    try {
      // Save Razorpay entity settings
      await api.put('/admin/payment-gateway', {
        keyId: razorpayKeyId,
        ...(razorpayKeySecret ? { keySecret: razorpayKeySecret } : {}),
        isEnabled: razorpayEnabled,
      });

      // Save additional gateways into PlatformSettings
      const keysToSave = [
        'STRIPE_KEY_ID', 'STRIPE_ENABLED',
        'PAYPAL_CLIENT_ID', 'PAYPAL_ENABLED',
        'PHONEPE_MERCHANT_ID', 'PHONEPE_ENABLED',
        'PAYTM_MID', 'PAYTM_ENABLED'
      ];

      for (const key of keysToSave) {
        if (platformSettings[key] !== undefined) {
          await api.put(`/admin/settings/${key}`, { value: platformSettings[key] });
        }
      }

      setRazorpayKeySecret('');
      setMsg('Payment gateway settings saved successfully.');
      load();
    } catch (err: any) {
      setMsg(err?.response?.data?.message ?? 'Could not save payment gateway settings.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!razorpaySettings) return <LoadingState />;

  return (
    <Card>
      <h3>💳 Payment Gateways Configuration</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
        Configure and enable payment processors for your marketplace.
      </p>

      {/* Gateway Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 16, paddingBottom: 8 }}>
        {[
          { id: 'razorpay', label: 'Razorpay 🇮🇳' },
          { id: 'stripe', label: 'Stripe 🌐' },
          { id: 'paypal', label: 'PayPal 💵' },
          { id: 'phonepe', label: 'PhonePe 📱' },
          { id: 'paytm', label: 'Paytm 📲' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: activeTab === tab.id ? 'var(--primary-light, #f0fdf4)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'razorpay' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Razorpay Key ID</label>
          <input
            value={razorpayKeyId}
            onChange={(e) => setRazorpayKeyId(e.target.value)}
            placeholder="rzp_live_xxxxxxxxxxxx"
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Razorpay Key Secret</label>
          <input
            type="password"
            value={razorpayKeySecret}
            onChange={(e) => setRazorpayKeySecret(e.target.value)}
            placeholder={razorpaySettings.hasSecret ? '•••••••• (Leave blank to keep existing secret)' : 'Enter secret'}
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={razorpayEnabled}
              onChange={(e) => setRazorpayEnabled(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Enable Razorpay Gateway
          </label>
        </div>
      )}

      {activeTab === 'stripe' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Stripe Publishable Key</label>
          <input
            value={platformSettings.STRIPE_KEY_ID ?? ''}
            onChange={(e) => setPlatformSettings({ ...platformSettings, STRIPE_KEY_ID: e.target.value })}
            placeholder="pk_live_xxxxxxxxxxxx"
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={platformSettings.STRIPE_ENABLED === 'true'}
              onChange={(e) => setPlatformSettings({ ...platformSettings, STRIPE_ENABLED: e.target.checked ? 'true' : 'false' })}
              style={{ width: 'auto' }}
            />
            Enable Stripe Gateway
          </label>
        </div>
      )}

      {activeTab === 'paypal' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>PayPal Client ID</label>
          <input
            value={platformSettings.PAYPAL_CLIENT_ID ?? ''}
            onChange={(e) => setPlatformSettings({ ...platformSettings, PAYPAL_CLIENT_ID: e.target.value })}
            placeholder="client_id_xxxxxxxxxxxx"
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={platformSettings.PAYPAL_ENABLED === 'true'}
              onChange={(e) => setPlatformSettings({ ...platformSettings, PAYPAL_ENABLED: e.target.checked ? 'true' : 'false' })}
              style={{ width: 'auto' }}
            />
            Enable PayPal Gateway
          </label>
        </div>
      )}

      {activeTab === 'phonepe' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>PhonePe Merchant ID</label>
          <input
            value={platformSettings.PHONEPE_MERCHANT_ID ?? ''}
            onChange={(e) => setPlatformSettings({ ...platformSettings, PHONEPE_MERCHANT_ID: e.target.value })}
            placeholder="MERCHANTUAT"
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={platformSettings.PHONEPE_ENABLED === 'true'}
              onChange={(e) => setPlatformSettings({ ...platformSettings, PHONEPE_ENABLED: e.target.checked ? 'true' : 'false' })}
              style={{ width: 'auto' }}
            />
            Enable PhonePe Gateway
          </label>
        </div>
      )}

      {activeTab === 'paytm' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Paytm Merchant ID (MID)</label>
          <input
            value={platformSettings.PAYTM_MID ?? ''}
            onChange={(e) => setPlatformSettings({ ...platformSettings, PAYTM_MID: e.target.value })}
            placeholder="YOUR_MID_HERE"
            style={{ padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={platformSettings.PAYTM_ENABLED === 'true'}
              onChange={(e) => setPlatformSettings({ ...platformSettings, PAYTM_ENABLED: e.target.checked ? 'true' : 'false' })}
              style={{ width: 'auto' }}
            />
            Enable Paytm Gateway
          </label>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <PrimaryButton onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Payment Settings'}
        </PrimaryButton>
        {msg && <span style={{ fontSize: 13, color: msg.includes('successfully') ? '#16a34a' : '#dc2626' }}>{msg}</span>}
      </div>
    </Card>
  );
}

function AnalyticsAndSeoCard() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      setSettings(res.data.data ?? {});
    });
  }, []);

  async function save() {
    setMsg('');
    setIsSaving(true);
    try {
      const keys = ['GA4_MEASUREMENT_ID', 'META_PIXEL_ID', 'GOOGLE_SITE_VERIFICATION', 'SITE_NAME', 'DEFAULT_META_DESCRIPTION'];
      for (const k of keys) {
        if (settings[k] !== undefined) {
          await api.put(`/admin/settings/${k}`, { value: settings[k] });
        }
      }
      setMsg('Analytics & SEO settings saved successfully.');
    } catch {
      setMsg('Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <h3>📊 Google Analytics (GA4) & AI-SEO Settings</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
        Manage tracking tags, Google Search Console verification, and SEO meta defaults.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Google Analytics 4 (GA4) Measurement ID
          </label>
          <input
            value={settings.GA4_MEASUREMENT_ID ?? ''}
            onChange={(e) => setSettings({ ...settings, GA4_MEASUREMENT_ID: e.target.value })}
            placeholder="G-XXXXXXXXXX"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Injected automatically into head tags on every page load</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Meta Pixel ID (Facebook)
          </label>
          <input
            value={settings.META_PIXEL_ID ?? ''}
            onChange={(e) => setSettings({ ...settings, META_PIXEL_ID: e.target.value })}
            placeholder="123456789012345"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Google Site Verification Meta Tag
          </label>
          <input
            value={settings.GOOGLE_SITE_VERIFICATION ?? ''}
            onChange={(e) => setSettings({ ...settings, GOOGLE_SITE_VERIFICATION: e.target.value })}
            placeholder="google-site-verification-hash"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Marketplace Name
          </label>
          <input
            value={settings.SITE_NAME ?? ''}
            onChange={(e) => setSettings({ ...settings, SITE_NAME: e.target.value })}
            placeholder="Kaam Bazar (काम बाज़ार)"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
            Default Meta Description (for Search & AI Crawlers)
          </label>
          <textarea
            value={settings.DEFAULT_META_DESCRIPTION ?? ''}
            onChange={(e) => setSettings({ ...settings, DEFAULT_META_DESCRIPTION: e.target.value })}
            rows={2}
            placeholder="India's premier blue-collar job marketplace..."
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <PrimaryButton onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Analytics & SEO'}
        </PrimaryButton>
        {msg && <span style={{ fontSize: 13, color: msg.includes('successfully') ? '#16a34a' : '#dc2626' }}>{msg}</span>}
      </div>
    </Card>
  );
}

function FeaturedPriceCard() {
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    api.get('/admin/settings').then((res) => {
      setPrice(res.data.data.FEATURED_LISTING_PRICE ?? '149');
      setDays(res.data.data.FEATURED_LISTING_DAYS ?? '7');
    });
  }
  useEffect(load, []);

  async function save() {
    setMsg('');
    try {
      await api.put('/admin/settings/FEATURED_LISTING_PRICE', { value: price });
      await api.put('/admin/settings/FEATURED_LISTING_DAYS', { value: days });
      setMsg('Saved.');
    } catch {
      setMsg('Could not save.');
    }
  }

  return (
    <Card>
      <h3>⭐ Featured Listing Pricing</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Price an employer pays to pin a job to the top of search results.</p>
      <div style={{ display: 'flex', gap: 8, maxWidth: 320, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)' }}>Price (₹)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)' }}>Duration (days)</label>
          <input type="number" value={days} onChange={(e) => setDays(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)' }} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={save}>Save Pricing</PrimaryButton>
        {msg && <span style={{ marginLeft: 10, fontSize: 13 }}>{msg}</span>}
      </div>
    </Card>
  );
}

function PlatformLimitsCard() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    api.get('/admin/settings').then((res) => {
      setSettings(res.data.data ?? {});
    });
  }
  useEffect(load, []);

  async function save() {
    setMsg('');
    setIsSaving(true);
    try {
      const keys = ['FREE_JOB_QUOTA', 'JOB_QUOTA_ENFORCEMENT', 'WORKER_FREE_CONTACT_LIMIT', 'CONTACT_LIMIT_ENFORCEMENT'];
      for (const k of keys) {
        if (settings[k] !== undefined) {
          await api.put(`/admin/settings/${k}`, { value: settings[k] });
        }
      }
      setMsg('Limits & quotas saved successfully.');
    } catch {
      setMsg('Could not save limits.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <h3>⚖️ Platform Limits & Quotas</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
        Configure free allowances for users before they are required to upgrade or pay.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Employer: Free Job Quota</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Number of Free Jobs
              </label>
              <input
                type="number"
                value={settings.FREE_JOB_QUOTA ?? ''}
                onChange={(e) => setSettings({ ...settings, FREE_JOB_QUOTA: e.target.value })}
                placeholder="2"
                style={{ width: '100%', maxWidth: 200, padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={settings.JOB_QUOTA_ENFORCEMENT === 'true'}
                onChange={(e) => setSettings({ ...settings, JOB_QUOTA_ENFORCEMENT: e.target.checked ? 'true' : 'false' })}
                style={{ width: 'auto' }}
              />
              Enforce Quota (Block job creation if exceeded)
            </label>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Worker: Free Employer Contact Views</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Number of Free Contact Unlocks
              </label>
              <input
                type="number"
                value={settings.WORKER_FREE_CONTACT_LIMIT ?? ''}
                onChange={(e) => setSettings({ ...settings, WORKER_FREE_CONTACT_LIMIT: e.target.value })}
                placeholder="3"
                style={{ width: '100%', maxWidth: 200, padding: 8, borderRadius: 6, border: '1px solid var(--border)' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <input
                type="checkbox"
                checked={settings.CONTACT_LIMIT_ENFORCEMENT === 'true'}
                onChange={(e) => setSettings({ ...settings, CONTACT_LIMIT_ENFORCEMENT: e.target.checked ? 'true' : 'false' })}
                style={{ width: 'auto' }}
              />
              Enforce Limit (Require credits/subscription if exceeded)
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <PrimaryButton onClick={save} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Limits'}
        </PrimaryButton>
        {msg && <span style={{ fontSize: 13, color: msg.includes('successfully') ? '#16a34a' : '#dc2626' }}>{msg}</span>}
      </div>
    </Card>
  );
}

function AadhaarOverridesCard() {
  const [jobs, setJobs] = useState<any[]>([]);

  function load() {
    api.get('/admin/jobs').then((res) => setJobs(res.data.data.items ?? []));
  }
  useEffect(load, []);

  async function setOverride(jobId: string, value: string) {
    await api.put(`/admin/jobs/${jobId}/aadhaar-override`, { override: value });
    load();
  }

  return (
    <Card>
      <h3>🛡️ Aadhaar Verification Requirements</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Employer sets a preference when posting. Admin can override any job to force Mandatory or Optional at any time.
      </p>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {jobs.length === 0 && <EmptyState label="No jobs posted yet." />}
        {jobs.map((j) => (
          <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5 }}>
              <strong>{j.title}</strong> — <span style={{ color: 'var(--text-muted)' }}>{j.employerProfile?.businessName ?? 'Employer'}</span>
              {' · Choice: '}{j.aadhaarBuyerPreference === 'REQUIRED' ? 'Required' : 'Not required'}
            </span>
            <select
              defaultValue={j.aadhaarAdminOverride ?? ''}
              onChange={(e) => setOverride(j.id, e.target.value)}
              style={{ padding: 6, borderRadius: 6, border: '1px solid var(--border)', maxWidth: 220 }}
            >
              <option value="">Use employer's choice</option>
              <option value="MANDATORY">Force Mandatory</option>
              <option value="OPTIONAL">Force Optional (Off)</option>
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AdminSettingsPage() {
  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px 0' }}>Settings & Configuration</h1>
      <div style={{ display: 'grid', gap: 16 }}>
        <MultiPaymentGatewayCard />
        <AnalyticsAndSeoCard />
        <FeaturedPriceCard />
        <PlatformLimitsCard />
        <AadhaarOverridesCard />
      </div>
    </DashboardLayout>
  );
}
