import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge } from '../../components/common/Primitives';

export function WorkerPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      try {
        // Get worker_profile id
        const { data: wp } = await supabase
          .from('worker_profiles')
          .select('id')
          .eq('user_id', user!.id)
          .single();

        if (!wp?.id) {
          setPayments([]);
          return;
        }

        // Payments via contracts linked to this worker
        const { data: ctrs } = await supabase
          .from('work_contracts')
          .select('id')
          .eq('worker_profile_id', wp.id);

        const contractIds = (ctrs || []).map((c: any) => c.id);
        if (contractIds.length === 0) {
          setPayments([]);
          return;
        }

        // No payments table in schema — show empty for now
        // When payments table is added, query it here
        setPayments([]);
      } catch (e: any) {
        console.error('Payments load error:', e);
        setError('Could not load payments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <DashboardLayout links={WORKER_NAV_LINKS} breadcrumbs={[{ label: 'Worker', href: '/worker/dashboard' }, { label: 'Payments History' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>💰 Payments History</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && payments.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h3 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>No Payment Records Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Payments will appear here once your employer processes your wages through the platform.
          </p>
        </div>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {payments.map((p: any) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>₹{p.amount}</p>
                <p style={{ color: '#6b7280', margin: '4px 0', fontSize: 13 }}>
                  {new Date(p.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
