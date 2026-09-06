import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../api/client';
import { Card, LoadingState, ErrorState, StatusBadge, StatCard, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';

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
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/profiles/worker/me').catch(() => ({ data: { data: null } })),
      api.get('/applications/mine').catch(() => ({ data: { data: [] } })),
      api.get('/contracts/mine').catch(() => ({ data: { data: [] } })),
      api.get('/payments/mine').catch(() => ({ data: { data: [] } })),
    ])
      .then(([p, a, c, pay]) => {
        setProfile(p.data?.data);
        setApplications(a.data?.data || []);
        setContracts(c.data?.data || []);
        setPayments(pay.data?.data || []);
      })
      .catch(() => setError('Could not load your worker dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  const totalEarnings = payments
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  const activeAppsCount = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'ACCEPTED').length;
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <DashboardLayout links={LINKS} title="Worker Dashboard (कामगार डैशबोर्ड)">
      {isLoading && <LoadingState label="Loading worker dashboard..." />}
      {error && <ErrorState message={error} />}

      {!isLoading && !error && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Welcome Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
              color: '#ffffff',
              borderRadius: 20,
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
                Welcome back, {profile?.fullName || 'Worker'}! 👋
              </h2>
              <p style={{ fontSize: 14, color: '#ccfbf1', margin: 0 }}>
                {profile?.isProfileComplete
                  ? 'Your profile is 100% complete and ready for employers to view.'
                  : 'Complete your profile details to get hired faster!'}
              </p>
            </div>
            <Link to="/jobs">
              <button
                style={{
                  background: '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <Search size={16} /> Browse Available Jobs
              </button>
            </Link>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <StatCard title="Active Applications" value={activeAppsCount} icon={<FileText size={22} />} color="#0284c7" />
            <StatCard title="Active Contracts" value={activeContractsCount} icon={<FileSignature size={22} />} color="#0d9488" />
            <StatCard title="Total Earnings" value={`₹${totalEarnings}`} icon={<Wallet size={22} />} color="#16a34a" />
            <StatCard title="Profile Status" value={profile?.isProfileComplete ? 'Complete' : 'Pending'} icon={<User size={22} />} color="#f97316" />
          </div>

          {/* 2-Column Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
            {/* Recent Applications */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Recent Applications</h3>
                <Link to="/worker/applications" style={{ fontSize: 13, fontWeight: 600, color: '#0d9488' }}>
                  View All →
                </Link>
              </div>

              {applications.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 24 }}>
                  No applications submitted yet. Browse jobs to apply!
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {applications.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                          {a.job?.title || 'Job Application'}
                        </strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          Applied {new Date(a.createdAt).toLocaleDateString()}
                        </span>
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
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>My Work Contracts</h3>
                <Link to="/worker/contracts" style={{ fontSize: 13, fontWeight: 600, color: '#0d9488' }}>
                  View All →
                </Link>
              </div>

              {contracts.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', padding: 24 }}>
                  No active work contracts right now.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {contracts.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: '1px solid #f1f5f9',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>
                          Contract Rate: ₹{c.agreementRate} / {c.compensationType}
                        </strong>
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
