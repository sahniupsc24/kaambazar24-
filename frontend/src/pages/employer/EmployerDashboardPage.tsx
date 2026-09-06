import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../api/client';
import { Card, LoadingState, ErrorState, StatusBadge, StatCard, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';

import { LayoutDashboard, Building2, Briefcase, Search, FileSignature, Wallet, PlusCircle, FileText, ShieldCheck } from 'lucide-react';

const LINKS = [
  { to: '/employer/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/employer/profile', label: 'Business Profile', icon: <Building2 size={18} /> },
  { to: '/employer/jobs', label: 'My Posted Jobs', icon: <Briefcase size={18} /> },
  { to: '/employer/search-workers', label: 'Worker Search', icon: <Search size={18} /> },
  { to: '/employer/contracts', label: 'Contracts', icon: <FileSignature size={18} /> },
  { to: '/employer/payments', label: 'Payments History', icon: <Wallet size={18} /> },
];

export function EmployerDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/profiles/employer/me').catch(() => ({ data: { data: null } })),
      api.get('/jobs/mine/list').catch(() => ({ data: { data: [] } })),
      api.get('/contracts/mine').catch(() => ({ data: { data: [] } })),
    ])
      .then(([p, j, c]) => {
        setProfile(p.data?.data);
        setJobs(j.data?.data || []);
        setContracts(c.data?.data || []);
      })
      .catch(() => setError('Could not load your employer dashboard.'))
      .finally(() => setIsLoading(false));
  }, []);

  const openJobsCount = jobs.filter((j) => j.status === 'OPEN').length;
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <DashboardLayout links={LINKS} title="Employer Control Panel (नियोक्ता डैशबोर्ड)">
      {isLoading && <LoadingState label="Loading employer dashboard..." />}
      {error && <ErrorState message={error} />}

      {!isLoading && !error && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Welcome CTA Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              borderRadius: 20,
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            }}
          >
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                Welcome, {profile?.businessName || 'Employer'}! <Building2 size={24} />
              </h2>
              <p style={{ fontSize: 14, color: '#e0f2fe', margin: 0 }}>
                Manage your job postings, review applicants, and track active contracts.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/employer/jobs">
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
                  <PlusCircle size={16} /> Post New Job
                </button>
              </Link>
              <Link to="/employer/search-workers">
                <button
                  style={{
                    background: '#ffffff',
                    color: '#0369a1',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <Search size={16} /> Search Workers
                </button>
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <StatCard title="Open Jobs" value={openJobsCount} icon={<Briefcase size={22} />} color="#0284c7" />
            <StatCard title="Total Jobs Posted" value={jobs.length} icon={<FileText size={22} />} color="#0d9488" />
            <StatCard title="Active Contracts" value={activeContractsCount} icon={<FileSignature size={22} />} color="#6366f1" />
            <StatCard title="Verification Status" value={profile?.isVerified ? 'Verified' : 'Pending'} icon={<ShieldCheck size={22} />} color="#f97316" />
          </div>

          {/* Jobs & Applicants Table Overview */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>My Posted Jobs</h3>
              <Link to="/employer/jobs" style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>
                Manage All Jobs →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                <p style={{ margin: '0 0 16px 0' }}>You haven't posted any jobs yet.</p>
                <Link to="/employer/jobs">
                  <PrimaryButton>Post Your First Job Now</PrimaryButton>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {jobs.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 16, color: '#0f172a', display: 'block' }}>{job.title}</strong>
                      <span style={{ fontSize: 13, color: '#64748b' }}>
                        ₹{job.compensationRate} / {job.compensationType.toLowerCase()} · Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <StatusBadge status={job.status} />
                      <Link to={`/jobs/${job.id}`}>
                        <SecondaryButton style={{ padding: '6px 12px', fontSize: 12 }}>View Details</SecondaryButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

export { LINKS as EMPLOYER_NAV_LINKS };
