import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, StatusBadge, Tabs, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const { toast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/admin/contracts?pageSize=200');
      setContracts(res.data.data?.items ?? res.data.data ?? []);
    } catch {
      toast('Failed to load contracts', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === 'ALL' ? contracts : contracts.filter((c) => c.status === tab);

  const columns: Column<any>[] = [
    { key: 'id', label: 'Contract ID', render: (r) => <code style={{ fontSize: 12 }}>{r.id?.slice(0, 8)}…</code> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'worker', label: 'Worker', render: (r) => r.workerProfile?.fullName ?? '—' },
    { key: 'employer', label: 'Employer', render: (r) => r.employerProfile?.businessName ?? r.job?.employerProfile?.businessName ?? '—' },
    { key: 'agreementRate', label: 'Rate', render: (r) => r.agreementRate ? `₹${r.agreementRate}` : '—' },
    { key: 'startDate', label: 'Started', render: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '—' },
    { key: 'endDate', label: 'Ended', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : 'Ongoing' },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Contracts' }]}>
      <SectionHeader title="Contract Monitoring" subtitle={`${contracts.length} total contracts`} />

      <div style={{ marginBottom: 16 }}>
        <Tabs
          tabs={[
            { key: 'ALL', label: 'All' },
            { key: 'ACTIVE', label: 'Active', icon: '🟢' },
            { key: 'COMPLETED', label: 'Completed', icon: '✓' },
            { key: 'TERMINATED', label: 'Terminated', icon: '🚫' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          pageSize={25}
          emptyLabel="No contracts found for this status."
        />
      </div>
    </DashboardLayout>
  );
}
