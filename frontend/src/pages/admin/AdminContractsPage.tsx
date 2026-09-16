import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
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
      const { data, error } = await supabase
        .from('work_contracts')
        .select('id, status, agreed_rate, compensation_type, start_date, end_date, created_at, jobs(title), worker_profiles(full_name), employer_profiles(company_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts((data || []).map((c: any) => ({
        id: c.id,
        status: c.status,
        agreementRate: c.agreed_rate,
        compensationType: c.compensation_type,
        startDate: c.start_date,
        endDate: c.end_date,
        createdAt: c.created_at,
        jobTitle: c.jobs?.title || '—',
        workerName: c.worker_profiles?.full_name || '—',
        employerName: c.employer_profiles?.company_name || '—',
      })));
    } catch (e: any) {
      toast('Failed to load contracts: ' + (e?.message || 'Unknown'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tab === 'ALL' ? contracts : contracts.filter((c) => c.status === tab);

  const columns: Column<any>[] = [
    { key: 'id', label: 'Contract ID', render: (r) => <code style={{ fontSize: 12 }}>{r.id?.slice(0, 8)}…</code> },
    { key: 'jobTitle', label: 'Job', render: (r) => r.jobTitle },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'workerName', label: 'Worker', render: (r) => r.workerName },
    { key: 'employerName', label: 'Employer', render: (r) => r.employerName },
    { key: 'agreementRate', label: 'Rate', render: (r) => r.agreementRate ? `₹${r.agreementRate} / ${r.compensationType?.toLowerCase()}` : '—' },
    { key: 'startDate', label: 'Started', render: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '—' },
    { key: 'endDate', label: 'Ended', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : 'Ongoing' },
    { key: 'createdAt', label: 'Created', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—' },
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
            { key: 'CANCELLED', label: 'Cancelled', icon: '🚫' },
            { key: 'PENDING', label: 'Pending', icon: '⏳' },
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
          emptyLabel="No contracts found."
        />
      </div>
    </DashboardLayout>
  );
}
