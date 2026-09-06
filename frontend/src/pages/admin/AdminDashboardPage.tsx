import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { StatCard, SkeletonCard, StatusBadge, SectionHeader } from '../../components/common/Primitives';
import { EditJobModal } from '../../components/EditJobModal';

import { 
  LayoutDashboard, Users, Briefcase, FileSignature, Wallet, 
  Star, Tags, MapPin, ShieldCheck, FileText, Settings, Edit2 
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { to: '/admin/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
  { to: '/admin/contracts', label: 'Contracts', icon: <FileSignature size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <Wallet size={18} /> },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: <Star size={18} /> },
  { to: '/admin/categories', label: 'Categories', icon: <Tags size={18} /> },
  { to: '/admin/locations', label: 'Locations', icon: <MapPin size={18} /> },
  { to: '/admin/verification', label: 'Verification', icon: <ShieldCheck size={18} /> },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <FileText size={18} /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

const MOCK_MONTHLY = [
  { month: 'Apr', users: 12, revenue: 4200, jobs: 8 },
  { month: 'May', users: 28, revenue: 8900, jobs: 15 },
  { month: 'Jun', users: 45, revenue: 13500, jobs: 24 },
  { month: 'Jul', users: 62, revenue: 19800, jobs: 38 },
  { month: 'Aug', users: 89, revenue: 28600, jobs: 52 },
  { month: 'Sep', users: 110, revenue: 35400, jobs: 71 },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<any>(null);
  const navigate = useNavigate();

  async function loadDashboardData() {
    try {
      const [statsRes, usersRes, jobsRes, paymentsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?pageSize=5'),
        api.get('/admin/jobs?pageSize=5'),
        api.get('/admin/payments?pageSize=5'),
      ]);
      setStats(statsRes.data.data);
      setRecentUsers(usersRes.data.data?.items ?? usersRes.data.data ?? []);
      setRecentJobs(jobsRes.data.data?.items ?? jobsRes.data.data ?? []);
      setRecentPayments(paymentsRes.data.data?.items ?? paymentsRes.data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <DashboardLayout
      links={ADMIN_LINKS}
      title="Admin Dashboard"
      breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
    >
      <SectionHeader title="Dashboard" subtitle="Platform overview and analytics" />

      {/* ── Stat Cards ── */}
      <div className="grid-auto" style={{ marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<Users size={22} />} color="#0d9488" trend={{ value: 12, label: 'vs last month' }} />
            <StatCard title="Workers" value={stats?.totalWorkers ?? 0} icon={<Users size={22} />} color="#0284c7" />
            <StatCard title="Employers" value={stats?.totalEmployers ?? 0} icon={<Briefcase size={22} />} color="#6366f1" />
            <StatCard title="Active Jobs" value={stats?.activeJobs ?? 0} icon={<Briefcase size={22} />} color="#f97316" />
            <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue ?? 0).toLocaleString()}`} icon={<Wallet size={22} />} color="#16a34a" trend={{ value: 8, label: 'vs last month' }} />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* User Growth Chart */}
        <div className="chart-card">
          <h3>📈 Monthly User Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="users" stroke="#0d9488" strokeWidth={2} fill="url(#userGradient)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>💰 Monthly Revenue (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_MONTHLY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any) => [`₹${(v ?? 0).toLocaleString()}`, 'Revenue']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue ₹" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid-3" style={{ gap: 20 }}>
        {/* Recent Users */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} /> Recent Signups</h3>
            <button onClick={() => navigate('/admin/users')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View All →</button>
          </div>
          {recentUsers.slice(0, 5).map((u: any) => (
            <div key={u.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {(u.email?.[0] ?? 'U').toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.role}</div>
              </div>
            </div>
          ))}
          {recentUsers.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No users yet</div>}
        </div>

        {/* Recent Jobs */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={16} /> Recent Jobs</h3>
            <button onClick={() => navigate('/admin/jobs')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View All →</button>
          </div>
          {recentJobs.slice(0, 5).map((j: any) => (
            <div key={j.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusBadge status={j.status} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.employerProfile?.businessName ?? '—'}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingJob(j)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--primary-light, #f0fdf4)', border: '1px solid var(--border)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Edit2 size={12} /> Edit
              </button>
            </div>
          ))}
          {recentJobs.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No jobs yet</div>}
        </div>

        {/* Recent Payments */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={16} /> Recent Payments</h3>
            <button onClick={() => navigate('/admin/payments')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View All →</button>
          </div>
          {recentPayments.slice(0, 5).map((p: any) => (
            <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>₹{p.amount}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {recentPayments.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No payments yet</div>}
        </div>
      </div>

      {/* Edit Job Modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          isAdmin={true}
          onClose={() => setEditingJob(null)}
          onSaved={loadDashboardData}
        />
      )}
    </DashboardLayout>
  );
}
