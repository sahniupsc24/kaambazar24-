import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, StatusBadge, StatCard, Tabs, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [contactUnlocks, setContactUnlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('payments');
  const { toast } = useToast();

  useEffect(() => {
    // Payments table not yet in schema — load empty
    // When a payments table is added to Supabase, replace this with:
    // const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments([]);
    setContactUnlocks([]);
    setLoading(false);
  }, []);

  const totalRevenue = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const pending = payments.filter((p) => p.status === 'PENDING').length;
  const failed = payments.filter((p) => p.status === 'FAILED').length;

  const paymentCols: Column<any>[] = [
    { key: 'id', label: 'Payment ID', render: (r) => <code style={{ fontSize: 12 }}>{r.id?.slice(0, 8)}…</code> },
    { key: 'amount', label: 'Amount', render: (r) => <strong>₹{r.amount}</strong> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'method', label: 'Method', render: (r) => r.paymentMethod ?? '—' },
    { key: 'paidBy', label: 'Paid By', render: (r) => r.payer?.email ?? '—' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  const unlockCols: Column<any>[] = [
    { key: 'employer', label: 'Employer', render: (r) => r.employer?.email ?? '—' },
    { key: 'worker', label: 'Worker Unlocked', render: (r) => r.worker?.email ?? '—' },
    { key: 'amount', label: 'Amount', render: (r) => r.amount ? `₹${r.amount}` : 'Free' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Payments' }]}>
      <SectionHeader title="Financial Management" subtitle="Payment logs and contact unlock transactions" />

      {/* Summary stat cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon="💰" color="#16a34a" />
        <StatCard title="Pending Payments" value={pending} icon="⏳" color="#d97706" />
        <StatCard title="Failed Payments" value={failed} icon="❌" color="#dc2626" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Tabs
          tabs={[
            { key: 'payments', label: 'Payment Logs', icon: '💳' },
            { key: 'unlocks', label: 'Contact Unlocks', icon: '🔓' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {tab === 'payments' ? (
          <DataTable columns={paymentCols} data={payments} loading={loading} pageSize={25} />
        ) : (
          <DataTable columns={unlockCols} data={contactUnlocks} loading={loading} pageSize={25} emptyLabel="No contact unlock records found." />
        )}
      </div>
    </DashboardLayout>
  );
}
