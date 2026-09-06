import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card, StatusBadge, PrimaryButton, SecondaryButton, LoadingState, ErrorState, DataTable, Modal, FormGroup, Input, Select, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    compensationRate: '',
    status: 'OPEN',
    isFeatured: false,
  });

  async function load() {
    try {
      const r = await api.get(`/admin/jobs/${id}`);
      setJob(r.data.data);
    } catch {
      setError('Could not load job details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  function openEditModal() {
    if (!job) return;
    setEditForm({
      title: job.title ?? '',
      description: job.description ?? '',
      compensationRate: job.compensationRate ?? job.budgetMax ?? '',
      status: job.status ?? 'OPEN',
      isFeatured: !!job.isFeatured,
    });
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    if (!editForm.title.trim()) { toast('Title is required', 'error'); return; }
    setSubmitting(true);
    try {
      await api.put(`/admin/jobs/${id}`, {
        title: editForm.title,
        description: editForm.description,
        compensationRate: editForm.compensationRate,
        status: editForm.status,
        isFeatured: editForm.isFeatured,
      });
      toast('Job updated successfully', 'success');
      setShowEdit(false);
      load();
    } catch {
      toast('Failed to update job', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <DashboardLayout links={ADMIN_LINKS}><LoadingState /></DashboardLayout>;
  if (error || !job) return <DashboardLayout links={ADMIN_LINKS}><ErrorState message={error || 'Job not found'} /></DashboardLayout>;

  const appCols = [
    { key: 'workerProfile', label: 'Worker', render: (r: any) => r.workerProfile?.fullName ?? '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: 'Applied', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Jobs', href: '/admin/jobs' }, { label: job.title }]}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{job.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={job.status} />
            {job.category && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: '#e0e7ff', color: '#6366f1', fontWeight: 600 }}>{job.category.name}</span>}
            {job.isFeatured && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>⭐ Featured</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryButton onClick={() => navigate('/admin/jobs')}>← Back</SecondaryButton>
          <PrimaryButton onClick={openEditModal}>✏️ Edit Job</PrimaryButton>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Job Details</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Employer', job.employerProfile?.businessName ?? '—'],
              ['Location', job.location?.name ?? '—'],
              ['Budget / Rate', job.compensationRate ? `₹${job.compensationRate}` : job.budgetMin ? `₹${job.budgetMin} – ₹${job.budgetMax}` : `₹${job.budgetMax}`],
              ['Aadhaar Required', job.aadhaarBuyerPreference === 'REQUIRED' ? 'Yes' : 'No'],
              ['Posted', new Date(job.createdAt).toLocaleDateString('en-IN')],
            ].map(([l, v]) => (
              <div key={String(l)} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Description</h3>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{job.description ?? 'No description.'}</p>
          {job.requiredSkills?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {job.requiredSkills.map((s: string) => (
                <span key={s} style={{ padding: '3px 10px', borderRadius: 99, background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Applications */}
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Applications ({job.applications?.length ?? 0})</h3>
        <DataTable columns={appCols} data={job.applications ?? []} searchable={false} pageSize={10} />
      </Card>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Job Details">
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Job Title" required>
            <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </FormGroup>

          <FormGroup label="Status">
            <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="OPEN">OPEN</option>
              <option value="IN_SELECTION">IN_SELECTION</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="CLOSED">CLOSED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </FormGroup>

          <FormGroup label="Rate / Budget (₹)">
            <Input value={editForm.compensationRate} onChange={(e) => setEditForm({ ...editForm, compensationRate: e.target.value })} />
          </FormGroup>

          <FormGroup label="Description">
            <textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
            />
          </FormGroup>

          <FormGroup label="Featured Badge">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={editForm.isFeatured} onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })} />
              Highlight as Featured Job Post
            </label>
          </FormGroup>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => setShowEdit(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Job Post'}</PrimaryButton>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
