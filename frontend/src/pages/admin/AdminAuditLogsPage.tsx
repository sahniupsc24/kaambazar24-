import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/admin/audit-logs?pageSize=500')
      .then((r) => setLogs(r.data.data?.items ?? r.data.data ?? []))
      .catch(() => toast('Failed to load audit logs', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const header = 'Timestamp,Admin,Action,Entity Type,Entity ID\n';
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.performedBy?.email ?? l.adminUserId ?? '—',
      l.action,
      l.entityType ?? '—',
      l.entityId ?? '—',
    ].map((v) => `"${v}"`).join(','));
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported audit logs as CSV', 'success');
  }

  const columns: Column<any>[] = [
    { key: 'createdAt', label: 'Timestamp', render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{new Date(r.createdAt).toLocaleString('en-IN')}</span>, sortable: true },
    {
      key: 'action',
      label: 'Action',
      render: (r) => {
        const colors: Record<string, string> = { CREATE: '#16a34a', UPDATE: '#0284c7', DELETE: '#dc2626', LOGIN: '#6366f1', BAN: '#d97706' };
        const color = Object.entries(colors).find(([k]) => r.action?.includes(k))?.[1] ?? 'var(--text-main)';
        return <strong style={{ color }}>{r.action}</strong>;
      },
    },
    { key: 'entityType', label: 'Entity', render: (r) => r.entityType ? <code style={{ fontSize: 12 }}>{r.entityType}</code> : '—' },
    { key: 'entityId', label: 'Entity ID', render: (r) => r.entityId ? <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.entityId?.slice(0, 8)}…</code> : '—' },
    { key: 'admin', label: 'Performed By', render: (r) => r.performedBy?.email ?? r.adminUserId ?? '—' },
    { key: 'ipAddress', label: 'IP Address', render: (r) => <code style={{ fontSize: 12 }}>{r.ipAddress ?? '—'}</code> },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Audit Logs' }]}>
      <SectionHeader
        title="Audit Logs"
        subtitle="Read-only log of all admin actions on the platform"
        action={
          <button
            onClick={exportCSV}
            style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ⬇ Export CSV
          </button>
        }
      />

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          pageSize={50}
          searchKeys={['action', 'entityType']}
          emptyLabel="No audit logs found."
        />
      </div>
    </DashboardLayout>
  );
}
