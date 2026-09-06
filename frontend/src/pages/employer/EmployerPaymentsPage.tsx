import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';

export function EmployerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api.get('/payments/employer/mine')
      .then((res) => setPayments(res.data.data))
      .catch(() => setError('Could not load payments.'))
      .finally(() => setIsLoading(false));
  }
  useEffect(load, []);

  async function markPaid(id: string) { await api.post(`/payments/${id}/process`, { outcome: 'PAID' }); load(); }
  async function markFailed(id: string) {
    const reason = window.prompt('Failure reason:') ?? 'Processing failed';
    await api.post(`/payments/${id}/process`, { outcome: 'FAILED', failureReason: reason });
    load();
  }
  async function retry(id: string) { await api.post(`/payments/${id}/retry`); load(); }

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS}>
      <h1>Payments</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && payments.length === 0 && <EmptyState label="No payments yet." />}
      <div style={{ display: 'grid', gap: 12 }}>
        {payments.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>₹{p.amount}</p>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={p.status} />
                {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                  <>
                    <PrimaryButton onClick={() => markPaid(p.id)}>Mark Paid</PrimaryButton>
                    <SecondaryButton onClick={() => markFailed(p.id)}>Mark Failed</SecondaryButton>
                  </>
                )}
                {p.status === 'FAILED' && <SecondaryButton onClick={() => retry(p.id)}>Retry</SecondaryButton>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
