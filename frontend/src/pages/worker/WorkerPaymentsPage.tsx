import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge } from '../../components/common/Primitives';
import { Payment } from '../../types';

export function WorkerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/payments/worker/mine')
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Could not load your payments.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout links={WORKER_NAV_LINKS}>
      <h1>My Payments</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && payments.length === 0 && <EmptyState label="No payments found." />}
      <div style={{ display: 'grid', gap: 12 }}>
        {payments.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>₹{p.amount}</p>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
