import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SectionHeader } from '../../components/common/Primitives';

// We need the ADMIN_LINKS from AdminDashboardPage or redefine them
import { LayoutDashboard, Users, Briefcase, FileSignature, Wallet, Star, Tags, MapPin, ShieldCheck, FileText, Settings, AlertTriangle, Download } from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { to: '/admin/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
  { to: '/admin/contracts', label: 'Contracts', icon: <FileSignature size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <Wallet size={18} /> },
  { to: '/admin/disputes', label: 'Disputes', icon: <AlertTriangle size={18} /> },
  { to: '/admin/exports', label: 'Data Export', icon: <Download size={18} /> },
];

export function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    api.get('/disputes')
      .then((res) => setDisputes(res.data.data))
      .catch(() => setError('Failed to load disputes'))
      .finally(() => setIsLoading(false));
  }
  
  useEffect(load, []);

  async function resolveDispute(id: string, status: string) {
    const notes = prompt(`Enter resolution notes for ${status}:`);
    if (notes === null) return;
    try {
      await api.post(`/disputes/${id}/resolve`, { resolutionStatus: status, notes });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Could not resolve dispute.');
    }
  }

  return (
    <DashboardLayout links={ADMIN_LINKS} title="Dispute Resolution Desk">
      <SectionHeader title="Disputes" subtitle="Manage and resolve user disputes" />
      
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && disputes.length === 0 && <EmptyState label="No disputes found." />}
      
      <div style={{ display: 'grid', gap: 16 }}>
        {disputes.map((d) => (
          <Card key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0' }}>Contract ID: {d.contractId.slice(0, 8)}</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                  Raised by: {d.raisedByUser?.email} against {d.againstUser?.email}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
                  <strong>Reason:</strong> {d.reason}
                </p>
                {d.resolutionNotes && (
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, background: '#fef3c7', padding: 8, borderRadius: 4, color: '#92400e' }}>
                    <strong>Resolution Note:</strong> {d.resolutionNotes}
                  </p>
                )}
              </div>
              <StatusBadge status={d.status} />
            </div>
            
            {d.status === 'OPEN' && (
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <PrimaryButton onClick={() => resolveDispute(d.id, 'RESOLVED_FAVOR_WORKER')}>Resolve (Favor Worker)</PrimaryButton>
                <PrimaryButton onClick={() => resolveDispute(d.id, 'RESOLVED_FAVOR_EMPLOYER')} style={{ background: '#f97316' }}>Resolve (Favor Employer)</PrimaryButton>
                <PrimaryButton onClick={() => resolveDispute(d.id, 'DISMISSED')} style={{ background: '#64748b' }}>Dismiss</PrimaryButton>
              </div>
            )}
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
