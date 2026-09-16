import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton } from '../../components/common/Primitives';

export function EmployerContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user?.id) return;
    setIsLoading(true); setError(null);
    try {
      const { data: ep } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!ep?.id) { setContracts([]); return; }

      const { data, error: err } = await supabase
        .from('work_contracts')
        .select('id, status, agreed_rate, compensation_type, start_date, end_date, created_at, jobs(title), worker_profiles(full_name)')
        .eq('employer_profile_id', ep.id)
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
        workerName: c.worker_profiles?.full_name || 'Worker',
      })));
    } catch (e: any) {
      setError('Could not load contracts: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.id]);

  async function updateContractStatus(contractId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('work_contracts')
        .update({ status: newStatus })
        .eq('id', contractId);
      if (error) throw error;
      load();
    } catch (e: any) {
      setError('Could not update contract: ' + (e?.message || 'Unknown error'));
    }
  }

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS} breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Contracts' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📋 Work Contracts</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && contracts.length === 0 && (
        <EmptyState label="No contracts yet. Accept an application and create a contract to get started." />
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {contracts.map((c) => (
          <Card key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {c.jobTitle || 'Contract'}
                  <code style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>#{c.id.slice(0, 8)}</code>
                </h3>
                <p style={{ color: '#0d9488', margin: '4px 0 0', fontWeight: 600, fontSize: 14 }}>
                  ₹{c.agreementRate} / {c.compensationType?.toLowerCase()} · Worker: {c.workerName}
                </p>
                {c.startDate && (
                  <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 13 }}>
                    {new Date(c.startDate).toLocaleDateString('en-IN')}
                    {c.endDate ? ` → ${new Date(c.endDate).toLocaleDateString('en-IN')}` : ' (ongoing)'}
                  </p>
                )}
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {c.status === 'PENDING' && (
                <PrimaryButton onClick={() => updateContractStatus(c.id, 'ACTIVE')}>✓ Activate Contract</PrimaryButton>
              )}
              {c.status === 'ACTIVE' && (
                <>
                  <PrimaryButton onClick={() => updateContractStatus(c.id, 'COMPLETED')}>✓ Mark Completed</PrimaryButton>
                  <button
                    onClick={() => updateContractStatus(c.id, 'CANCELLED')}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    Terminate
                  </button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
