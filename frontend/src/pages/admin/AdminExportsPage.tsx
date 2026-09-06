import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card, PrimaryButton, SectionHeader } from '../../components/common/Primitives';
import { LayoutDashboard, Users, Briefcase, FileSignature, Wallet, Star, Tags, MapPin, ShieldCheck, FileText, Settings, AlertTriangle, Download } from 'lucide-react';
import { api } from '../../api/client';

// Use same ADMIN_LINKS as AdminDisputesPage for consistency
const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { to: '/admin/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
  { to: '/admin/contracts', label: 'Contracts', icon: <FileSignature size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <Wallet size={18} /> },
  { to: '/admin/disputes', label: 'Disputes', icon: <AlertTriangle size={18} /> },
  { to: '/admin/exports', label: 'Data Export', icon: <Download size={18} /> },
];

export function AdminExportsPage() {

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const response = await api.get(`/export/${endpoint}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(`Export failed for ${filename}`);
      console.error(error);
    }
  };

  return (
    <DashboardLayout links={ADMIN_LINKS} title="Data Export">
      <SectionHeader title="Exports" subtitle="Download platform data as CSV" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Users size={24} color="#0d9488" />
            <h3 style={{ margin: 0 }}>Users Data</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Export a complete list of users, including roles and active status.</p>
          <PrimaryButton onClick={() => handleExport('users', 'users_export.csv')} style={{ marginTop: 12 }}>
            Download CSV
          </PrimaryButton>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <FileText size={24} color="#6366f1" />
            <h3 style={{ margin: 0 }}>Audit Logs</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Export system audit logs for security and compliance review.</p>
          <PrimaryButton onClick={() => handleExport('audit-logs', 'audit_logs_export.csv')} style={{ marginTop: 12 }}>
            Download CSV
          </PrimaryButton>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Wallet size={24} color="#16a34a" />
            <h3 style={{ margin: 0 }}>Payments History</h3>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Export all payment transactions across the platform.</p>
          <PrimaryButton onClick={() => handleExport('payments', 'payments_export.csv')} style={{ marginTop: 12 }}>
            Download CSV
          </PrimaryButton>
        </Card>
      </div>
    </DashboardLayout>
  );
}
