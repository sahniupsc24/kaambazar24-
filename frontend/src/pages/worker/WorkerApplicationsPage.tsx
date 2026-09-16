import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, SecondaryButton } from '../../components/common/Primitives';

export function WorkerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      // First get worker_profile id
      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!wp?.id) {
        // No worker profile yet = no applications
        setApplications([]);
        return;
      }

      const { data, error: err } = await supabase
        .from('applications')
        .select('id, status, created_at, cover_note, jobs(id, title, compensation_type, compensation_rate, status)')
        .eq('worker_profile_id', wp.id)
        .order('created_at', { ascending: false });

      if (err) throw err;

      setApplications((data || []).map((a: any) => ({
        id: a.id,
        status: a.status,
        createdAt: a.created_at,
        coverNote: a.cover_note,
        job: a.jobs ? {
          id: a.jobs.id,
          title: a.jobs.title,
          compensationType: a.jobs.compensation_type,
          compensationRate: a.jobs.compensation_rate,
          status: a.jobs.status,
        } : null,
      })));
    } catch (e: any) {
      console.error('Applications load error:', e);
      setError('Could not load your applications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, [user?.id]);

  async function withdraw(id: string) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'WITHDRAWN' })
        .eq('id', id);
      if (error) throw error;
      load();
    } catch (e: any) {
      setError('Could not withdraw: ' + (e?.message || 'Unknown error'));
    }
  }

  return (
    <DashboardLayout links={WORKER_NAV_LINKS} breadcrumbs={[{ label: 'Worker', href: '/worker/dashboard' }, { label: 'Applications' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>My Applications</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && applications.length === 0 && (
        <EmptyState label="No applications found. Browse jobs and apply to get started!" />
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {applications.map((a) => (
          <Card key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{a.job?.title || 'Job Application'}</h3>
                {a.job?.compensationRate && (
                  <p style={{ color: '#0d9488', fontSize: 13, margin: '4px 0 0 0', fontWeight: 600 }}>
                    ₹{a.job.compensationRate} / {a.job.compensationType?.toLowerCase()}
                  </p>
                )}
                <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: 13 }}>
                  Applied {new Date(a.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={a.status} />
                {(a.status === 'PENDING' || a.status === 'SHORTLISTED') && (
                  <SecondaryButton onClick={() => withdraw(a.id)} style={{ fontSize: 12, padding: '5px 12px' }}>
                    Withdraw
                  </SecondaryButton>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
