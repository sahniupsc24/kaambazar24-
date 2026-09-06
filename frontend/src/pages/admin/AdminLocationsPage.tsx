import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, PrimaryButton, SecondaryButton, Modal, FormGroup, Input, Select, ConfirmDialog, StatusBadge, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editLoc, setEditLoc] = useState<any>(null);
  const [deleteLoc, setDeleteLoc] = useState<any>(null);
  const [form, setForm] = useState({ name: '', level: 'CITY', parentId: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/admin/locations');
      setLocations(res.data.data ?? []);
    } catch {
      toast('Failed to load locations', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/locations', { name: form.name, level: form.level, parentId: form.parentId || undefined });
      toast('Location added', 'success');
      setShowAdd(false);
      setForm({ name: '', level: 'CITY', parentId: '', isActive: true });
      load();
    } catch {
      toast('Failed to add location', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editLoc || !form.name.trim()) { toast('Name is required', 'error'); return; }
    setSubmitting(true);
    try {
      await api.put(`/admin/locations/${editLoc.id}`, {
        name: form.name,
        level: form.level,
        parentId: form.parentId || null,
        isActive: form.isActive,
      });
      toast('Location updated', 'success');
      setEditLoc(null);
      setForm({ name: '', level: 'CITY', parentId: '', isActive: true });
      load();
    } catch {
      toast('Failed to update location', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(loc: any) {
    try {
      await api.put(`/admin/locations/${loc.id}`, { isActive: !loc.isActive });
      toast(`Location ${loc.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch {
      toast('Failed to update status', 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/admin/locations/${id}`);
      toast('Location deleted', 'success');
      load();
    } catch {
      toast('Delete failed', 'error');
    }
  }

  function openEdit(loc: any) {
    setEditLoc(loc);
    setForm({
      name: loc.name ?? '',
      level: loc.level ?? 'CITY',
      parentId: loc.parent?.id ?? loc.parentId ?? '',
      isActive: loc.isActive ?? true,
    });
  }

  const LEVEL_COLOR: Record<string, { bg: string; color: string }> = {
    COUNTRY: { bg: '#fee2e2', color: '#b91c1c' },
    STATE: { bg: '#e0e7ff', color: '#6366f1' },
    CITY: { bg: '#ccfbf1', color: '#0d9488' },
  };

  const filtered = locations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.slug && l.slug.toLowerCase().includes(search.toLowerCase())) ||
    l.level.toLowerCase().includes(search.toLowerCase())
  );

  const parentOptions = locations.filter((l) => l.level === 'COUNTRY' || l.level === 'STATE');

  const columns: Column<any>[] = [
    { key: 'name', label: 'Location Name', render: (r) => <strong>{r.name}</strong> },
    {
      key: 'level',
      label: 'Level',
      render: (r) => {
        const cfg = LEVEL_COLOR[r.level] ?? { bg: '#f1f5f9', color: '#64748b' };
        return <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{r.level}</span>;
      },
    },
    { key: 'parent', label: 'Parent', render: (r) => r.parent?.name ?? '—' },
    { key: 'slug', label: 'Slug', render: (r) => <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.slug}</code> },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Locations' }]}>
      <SectionHeader
        title="Location Management"
        subtitle={`${locations.length} total locations (States, Cities, Regions)`}
        action={<PrimaryButton onClick={() => { setForm({ name: '', level: 'CITY', parentId: '', isActive: true }); setShowAdd(true); }}>+ Add Location</PrimaryButton>}
      />

      {/* Live search filter */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="🔍 Search location name, level, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          pageSize={25}
          actions={(r) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(r)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                ✏️ Edit
              </button>
              <button onClick={() => toggleActive(r)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: r.isActive !== false ? '#fef2f2' : '#f0fdfa', color: r.isActive !== false ? '#dc2626' : '#0d9488', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                {r.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => setDeleteLoc(r)} disabled={r.level === 'COUNTRY'} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: r.level === 'COUNTRY' ? 0.4 : 1 }}>
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Location">
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Location Name" required>
            <Input placeholder="e.g. Bengaluru" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormGroup>
          <FormGroup label="Level">
            <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="COUNTRY">Country</option>
              <option value="STATE">State</option>
              <option value="CITY">City</option>
            </Select>
          </FormGroup>
          {form.level !== 'COUNTRY' && (
            <FormGroup label="Parent Location">
              <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">— Select parent —</option>
                {parentOptions.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.level})</option>)}
              </Select>
            </FormGroup>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => setShowAdd(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleCreate} disabled={submitting}>{submitting ? 'Saving…' : 'Add Location'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editLoc} onClose={() => setEditLoc(null)} title="Edit Location">
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Location Name" required>
            <Input placeholder="e.g. Bengaluru" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormGroup>
          <FormGroup label="Level">
            <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="COUNTRY">Country</option>
              <option value="STATE">State</option>
              <option value="CITY">City</option>
            </Select>
          </FormGroup>
          {form.level !== 'COUNTRY' && (
            <FormGroup label="Parent Location">
              <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">— Select parent —</option>
                {parentOptions.filter((p) => p.id !== editLoc?.id).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.level})</option>)}
              </Select>
            </FormGroup>
          )}
          <FormGroup label="Status">
            <Select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormGroup>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => setEditLoc(null)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleUpdate} disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteLoc}
        onClose={() => setDeleteLoc(null)}
        onConfirm={() => { handleDelete(deleteLoc.id); setDeleteLoc(null); }}
        title="Delete Location"
        message={`Delete "${deleteLoc?.name}"? Jobs in this location will lose the reference.`}
        confirmLabel="Delete Location"
        danger
      />
    </DashboardLayout>
  );
}
