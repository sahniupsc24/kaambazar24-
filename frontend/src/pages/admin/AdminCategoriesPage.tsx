import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, PrimaryButton, SecondaryButton, Modal, FormGroup, Input, Select, ConfirmDialog, StatusBadge, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [deleteCat, setDeleteCat] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, slug, is_active')
        .order('name');
      if (error) throw error;
      setCategories((data || []).map((c: any) => ({ id: c.id, name: c.name, description: c.description, slug: c.slug, isActive: c.is_active })));
    } catch (e: any) {
      toast('Failed to load categories: ' + (e?.message || 'Unknown'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim()) { toast('Category name is required', 'error'); return; }
    setSubmitting(true);
    try {
      if (editCat) {
        const { error } = await supabase.from('categories').update({ name: form.name, description: form.description, is_active: form.isActive }).eq('id', editCat.id);
        if (error) throw error;
        toast('Category updated', 'success');
      } else {
        const { error } = await supabase.from('categories').insert([{ name: form.name, description: form.description, is_active: form.isActive, slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }]);
        if (error) throw error;
        toast('Category created', 'success');
      }
      setShowAdd(false); setEditCat(null);
      setForm({ name: '', description: '', isActive: true });
      load();
    } catch (e: any) {
      toast('Save failed: ' + (e?.message || 'Unknown'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(cat: any) {
    try {
      const { error } = await supabase.from('categories').update({ is_active: !cat.isActive }).eq('id', cat.id);
      if (error) throw error;
      toast(`Category ${cat.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch (e: any) {
      toast('Failed to update status: ' + (e?.message || ''), 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast('Category deleted', 'success');
      load();
    } catch (e: any) {
      toast('Delete failed — jobs may reference this category', 'error');
    }
  }

  function openEdit(cat: any) {
    setEditCat(cat);
    setForm({
      name: cat.name ?? '',
      description: cat.description ?? '',
      isActive: cat.isActive !== false,
    });
    setShowAdd(true);
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<any>[] = [
    { key: 'name', label: 'Category Name', render: (r) => <strong>{r.name}</strong> },
    { key: 'slug', label: 'Slug', render: (r) => <code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.slug}</code> },
    { key: 'description', label: 'Description', render: (r) => r.description ?? <span style={{ color: 'var(--text-light)' }}>—</span> },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Categories' }]}>
      <SectionHeader
        title="Job Categories"
        subtitle={`${categories.length} blue-collar job categories`}
        action={<PrimaryButton onClick={() => { setForm({ name: '', description: '', isActive: true }); setEditCat(null); setShowAdd(true); }}>+ Add Category</PrimaryButton>}
      />

      {/* Search Filter */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="🔍 Search category name, description, or slug..."
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
              <button onClick={() => setDeleteCat(r)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditCat(null); }} title={editCat ? 'Edit Category' : 'Add New Category'}>
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Category Name (Hindi + English)" required>
            <Input placeholder="e.g. Plumbing (प्लंबिंग)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormGroup>
          <FormGroup label="Description">
            <Input placeholder="Short description of this category..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormGroup>
          {editCat && (
            <FormGroup label="Status">
              <Select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormGroup>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => { setShowAdd(false); setEditCat(null); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={submitting}>{submitting ? 'Saving…' : editCat ? 'Update Category' : 'Add Category'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={() => { handleDelete(deleteCat.id); setDeleteCat(null); }}
        title="Delete Category"
        message={`Delete "${deleteCat?.name}"? Jobs in this category will lose their category reference.`}
        confirmLabel="Delete Category"
        danger
      />
    </DashboardLayout>
  );
}
