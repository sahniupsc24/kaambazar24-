import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, LoadingState, StatusBadge, StatCard, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';
import { LayoutDashboard, User, Search, FileText, FileSignature, Wallet } from 'lucide-react';

const LINKS = [
  { to: '/worker/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/worker/profile', label: 'My Profile', icon: <User size={18} /> },
  { to: '/jobs', label: 'Browse Jobs', icon: <Search size={18} /> },
  { to: '/worker/applications', label: 'Applications', icon: <FileText size={18} /> },
  { to: '/worker/contracts', label: 'My Contracts', icon: <FileSignature size={18} /> },
  { to: '/worker/payments', label: 'Payments History', icon: <Wallet size={18} /> },
];

export function WorkerDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      try {
        // 1. Worker profile with id
        const { data: wp } = await supabase
          .from('worker_profiles')
          .select('id, full_name, is_available, is_profile_complete')
          .eq('user_id', user!.id)
          .single();
        setProfile(wp);

        if (wp?.id) {
          // 2. Applications
          const { data: apps } = await supabase
            .from('applications')
            .select('id, status, created_at, jobs(title)')
            .eq('worker_profile_id', wp.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setApplications((apps || []).map((a: any) => ({
            id: a.id, status: a.status, createdAt: a.created_at,
            job: { title: a.jobs?.title || 'Job' }
          })));

          // 3. Contracts
          const { data: ctrs } = await supabase
            .from('work_contracts')
            .select('id, status, agreed_rate, compensation_type')
            .eq('worker_profile_id', wp.id)
            .order('created_at', { ascending: false })
            .limit(10);
          setContracts((ctrs || []).map((c: any) => ({
            id: c.id, status: c.status,
            agreementRate: c.agreed_rate,
            compensationType: c.compensation_type,
          })));
        }
      } catch (e) {
        console.error('Worker dashboard error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const activeAppsCount = applications.filter((a) => ['PENDING', 'SHORTLISTED', 'ACCEPTED'].includes(a.status)).length;
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <DashboardLayout links={LINKS} title="Worker Dashboard (कामगार डैशबोर्ड)">
      {isLoading && <LoadingState label="Loading worker dashboard..." />}
      {!isLoading && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Welcome Banner */}
          <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)', color: '#ffffff', borderRadius: 20, padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 4px 12px rgba(13,148,136,0.25)' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
                Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Worker'}! 👋
              </h2>
              <p style={{ fontSize: 14, color: '#ccfbf1', margin: 0 }}>
                {profile ? 'Find jobs and track your applications here.' : 'Complete your profile to get hired faster!'}
              </p>
            </div>
            <Link to="/jobs">
              <button style={{ background: '#f97316', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                <Search size={16} /> Browse Available Jobs
              </button>
            </Link>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <StatCard title="Active Applications" value={activeAppsCount} icon={<FileText size={22} />} color="#0284c7" />
            <StatCard title="Active Contracts" value={activeContractsCount} icon={<FileSignature size={22} />} color="#0d9488" />
            <StatCard title="Total Applications" value={applications.length} icon={<FileText size={22} />} color="#6366f1" />
            <StatCard title="Profile Status" value={profile?.full_name ? 'Complete' : 'Incomplete'} icon={<User size={22} />} color="#f97316" />
          </div>

          {/* 2-Column Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {/* Recent Applications */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Recent Applications</h3>
                <Link to="/worker/applications" style={{ fontSize: 13, fontWeight: 600, color: '#0d9488' }}>View All →</Link>
              </div>
              {applications.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 24 }}>No applications yet. Browse jobs to apply!</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {applications.slice(0, 4).map((a) => (
                    <div key={a.id} style={{ padding: 12, borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>{a.job?.title || 'Job'}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Applied {new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Contracts */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>My Work Contracts</h3>
                <Link to="/worker/contracts" style={{ fontSize: 13, fontWeight: 600, color: '#0d9488' }}>View All →</Link>
              </div>
              {contracts.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 24 }}>No active work contracts right now.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {contracts.slice(0, 4).map((c) => (
                    <div key={c.id} style={{ padding: 12, borderRadius: 10, border: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>Rate: ₹{c.agreementRate} / {c.compensationType}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Status: {c.status}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export { LINKS as WORKER_NAV_LINKS };
