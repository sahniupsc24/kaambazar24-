import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton } from '../../components/common/Primitives';

export function WorkerContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      // Get worker_profile id
      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!wp?.id) {
        setContracts([]);
        return;
      }

      const { data, error: err } = await supabase
        .from('work_contracts')
        .select('id, status, agreed_rate, compensation_type, start_date, end_date, created_at, jobs(title)')
        .eq('worker_profile_id', wp.id)
        .order('created_at', { ascending: false });

      if (err) throw err;

      setContracts((data || []).map((c: any) => ({
        id: c.id,
        status: c.status,
        agreementRate: c.agreed_rate,
        compensationType: c.compensation_type,
        startDate: c.start_date,
        endDate: c.end_date,
        createdAt: c.created_at,
        jobTitle: c.jobs?.title || null,
      })));
    } catch (e: any) {
      console.error('Contracts load error:', e);
      setError('Could not load your contracts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.id]);

  async function acceptContract(contractId: string) {
    try {
      const { error } = await supabase
        .from('work_contracts')
        .update({ status: 'ACTIVE' })
        .eq('id', contractId);
      if (error) throw error;
      load();
    } catch (e: any) {
      setError('Could not accept contract: ' + (e?.message || 'Unknown error'));
    }
  }

  return (
    <DashboardLayout links={WORKER_NAV_LINKS} breadcrumbs={[{ label: 'Worker', href: '/worker/dashboard' }, { label: 'My Contracts' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>My Contracts</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && contracts.length === 0 && (
        <EmptyState label="No contracts yet. Apply for jobs to get your first work contract!" />
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {contracts.map((c) => (
          <Card key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {c.jobTitle || `Contract`}
                  <code style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>#{c.id.slice(0, 8)}</code>
                </h3>
                <p style={{ color: '#0d9488', margin: '4px 0 0', fontWeight: 600, fontSize: 14 }}>
                  ₹{c.agreementRate} / {c.compensationType?.toLowerCase()}
                </p>
                {c.startDate && (
                  <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>
                    Started: {new Date(c.startDate).toLocaleDateString('en-IN')}
                    {c.endDate ? ` • Ended: ${new Date(c.endDate).toLocaleDateString('en-IN')}` : ' • Ongoing'}
                  </p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>

            {c.status === 'PENDING' && (
              <div style={{ marginTop: 12 }}>
                <PrimaryButton onClick={() => acceptContract(c.id)}>✓ Accept Contract</PrimaryButton>
              </div>
            )}

            {c.status === 'ACTIVE' && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#0d9488', fontWeight: 600 }}>
                  🟢 Active Contract — Contact your employer to log work hours
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
