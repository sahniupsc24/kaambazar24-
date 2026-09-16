import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, StatusBadge, ConfirmDialog, Modal, FormGroup, Input, Select, PrimaryButton, SecondaryButton, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteJob, setDeleteJob] = useState<any>(null);
  const [editJob, setEditJob] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    compensationRate: '',
    status: 'OPEN',
    isFeatured: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, status, compensation_rate, compensation_type, is_featured, created_at, categories(name), locations(name), employer_profiles(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs((data || []).map((j: any) => ({
        id: j.id, title: j.title, description: j.description,
        status: j.status, compensationRate: j.compensation_rate,
        isFeatured: j.is_featured, createdAt: j.created_at,
        category: { name: j.categories?.name },
        location: { name: j.locations?.name },
        employerProfile: { businessName: j.employer_profiles?.company_name },
      })));
    } catch (e: any) {
      toast('Failed to load jobs: ' + (e?.message || 'Unknown'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(job: any) {
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', job.id);
      if (error) throw error;
      toast('Job deleted', 'success');
      load();
    } catch (e: any) {
      toast('Delete failed: ' + (e?.message || 'Unknown'), 'error');
    }
  }

  function openEdit(job: any) {
    setEditJob(job);
    setEditForm({
      title: job.title ?? '',
      description: job.description ?? '',
      compensationRate: job.compensationRate ?? job.budgetMax ?? '',
      status: job.status ?? 'OPEN',
      isFeatured: !!job.isFeatured,
    });
  }

  async function handleUpdateJob() {
    if (!editJob || !editForm.title.trim()) { toast('Job title is required', 'error'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('jobs').update({
        title: editForm.title,
        description: editForm.description,
        compensation_rate: editForm.compensationRate ? parseFloat(editForm.compensationRate) : null,
        status: editForm.status,
        is_featured: editForm.isFeatured,
      }).eq('id', editJob.id);
      if (error) throw error;
      toast('Job post updated successfully', 'success');
      setEditJob(null);
      load();
    } catch (e: any) {
      toast('Failed to update: ' + (e?.message || 'Unknown'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.category?.name && j.category.name.toLowerCase().includes(search.toLowerCase())) ||
      (j.employerProfile?.businessName && j.employerProfile.businessName.toLowerCase().includes(search.toLowerCase())) ||
      (j.location?.name && j.location.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      key: 'title',
      label: 'Job Title',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.title}
            {r.isFeatured && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#d97706' }}>⭐ Featured</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.category?.name ?? '—'}</div>
        </div>
      ),
    },
    { key: 'employer', label: 'Employer', render: (r) => r.employerProfile?.businessName ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'budget',
      label: 'Rate / Budget',
      render: (r) => r.compensationRate ? `₹${r.compensationRate}` : r.budgetMin ? `₹${r.budgetMin}–₹${r.budgetMax}` : r.budgetMax ? `₹${r.budgetMax}` : '—',
    },
    { key: 'location', label: 'Location', render: (r) => r.location?.name ?? '—' },
    { key: 'createdAt', label: 'Posted', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Jobs' }]}>
      <SectionHeader title="Job Management" subtitle={`${jobs.length} total jobs posted on the platform`} />

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input
          placeholder="🔍 Search job title, employer, category, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'IN_SELECTION', 'ACTIVE', 'CLOSED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px',
                borderRadius: 99,
                border: '1px solid var(--border)',
                background: statusFilter === s ? 'var(--primary)' : 'var(--bg-card)',
                color: statusFilter === s ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          pageSize={25}
          onRowClick={(r) => navigate(`/admin/jobs/${r.id}`)}
          actions={(r) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteJob(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Edit Job Modal */}
      <Modal isOpen={!!editJob} onClose={() => setEditJob(null)} title="Edit Job Post">
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
            <Input value={editForm.compensationRate} onChange={(e) => setEditForm({ ...editForm, compensationRate: e.target.value })} placeholder="e.g. 850" />
          </FormGroup>

          <FormGroup label="Job Description">
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
            <SecondaryButton onClick={() => setEditJob(null)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleUpdateJob} disabled={submitting}>{submitting ? 'Saving...' : 'Save Job Post'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Delete Job confirm */}
      <ConfirmDialog
        isOpen={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        onConfirm={() => { handleDelete(deleteJob); setDeleteJob(null); }}
        title="Delete Job"
        message={`Delete "${deleteJob?.title}"? This cannot be undone.`}
        confirmLabel="Delete Job"
        danger
      />
    </DashboardLayout>
  );
}
