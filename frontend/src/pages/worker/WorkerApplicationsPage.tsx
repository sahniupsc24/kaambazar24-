import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, SecondaryButton } from '../../components/common/Primitives';
import { Application } from '../../types';

export function WorkerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api.get('/applications/mine')
      .then((res) => setApplications(res.data.data))
      .catch(() => setError('Could not load your applications.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function withdraw(id: string) {
    try {
      await api.post(`/applications/${id}/withdraw`);
      load();
    } catch {
      setError('Could not withdraw this application.');
    }
  }

  return (
    <DashboardLayout links={WORKER_NAV_LINKS}>
      <h1>My Applications</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && applications.length === 0 && <EmptyState label="No applications found." />}
      <div style={{ display: 'grid', gap: 12 }}>
        {applications.map((a) => (
          <Card key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{a.job?.title}</h3>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>Applied {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={a.status} />
                {(a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW') && (
                  <SecondaryButton onClick={() => withdraw(a.id)}>Withdraw</SecondaryButton>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
