import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, SecondaryButton, PrimaryButton } from '../../components/common/Primitives';

function WorkerContact({ userId }: { userId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'unlocked' | 'needsPlan'>('idle');
  const [mobile, setMobile] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function tryUnlock() {
    setState('loading');
    setError('');
    try {
      const res = await api.post('/contacts/unlock', { targetUserId: userId });
      if (res.data.data.unlocked) {
        setMobile(res.data.data.mobile);
        setState('unlocked');
      } else {
        const plansRes = await api.get('/plans?audience=EMPLOYER');
        setPlans(plansRes.data.data);
        setState('needsPlan');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not unlock contact.');
      setState('idle');
    }
  }

  async function buyAndUnlock(planId: string) {
    try {
      await api.post(`/plans/${planId}/purchase`);
      await tryUnlock();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Purchase failed.');
    }
  }

  if (state === 'unlocked') {
    const cleanPhone = mobile.replace(/[^0-9]/g, '');
    return (
      <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(22, 163, 74, 0.08)', border: '1px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ color: '#166534', fontWeight: 800, fontSize: 15 }}>📞 +91 {mobile}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`tel:${mobile}`}
            style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
          >
            📞 Call Now
          </a>
          <a
            href={`https://wa.me/91${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#25d366', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {state !== 'needsPlan' && (
        <SecondaryButton onClick={tryUnlock} disabled={state === 'loading'}>
          {state === 'loading' ? 'Unlocking...' : '🔓 Unlock Contact Details'}
        </SecondaryButton>
      )}
      {state === 'needsPlan' && (
        <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px 0', fontWeight: 600 }}>
            ⚠️ Contact Credits Required to unlock this phone number.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => buyAndUnlock(p.id)}
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', backgroundColor: '#2563eb', color: '#ffffff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}
              >
                Buy {p.name} — ₹{p.price}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function EmployerWorkerSearchPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
    api.get('/locations').then((res) => setLocations(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (categoryId) params.categoryId = categoryId;
    if (locationId) params.locationId = locationId;
    api.get('/profiles/worker/search', { params })
      .then((res) => setResults(res.data.data.items))
      .catch(() => setError('Could not search workers.'))
      .finally(() => setIsLoading(false));
  }, [q, categoryId, locationId]);

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS}>
      <h1>Search Workers</h1>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>Find labor for your warehouse, factory, hotel, or shop.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Search by name or skill..." value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 200, padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}>
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && results.length === 0 && <EmptyState label="No workers found matching your search." />}

      <div style={{ display: 'grid', gap: 12 }}>
        {results.map((w) => (
          <Card key={w.id}>
            <h4 style={{ margin: 0 }}>{w.fullName}</h4>
            <p style={{ color: '#6b7280', margin: '4px 0' }}>
              {w.primaryCategory?.name} · {w.location?.name} · {w.experienceYears} yrs experience
            </p>
            {w.skills?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {w.skills.map((s: string) => (
                  <span key={s} style={{ background: '#e7edf0', color: '#1c3a4b', borderRadius: 999, padding: '2px 10px', fontSize: 12 }}>{s}</span>
                ))}
              </div>
            )}
            <WorkerContact userId={w.userId} />
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
