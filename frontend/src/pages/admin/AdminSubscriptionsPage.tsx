import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, PrimaryButton, SecondaryButton, Modal, FormGroup, Input, Select, ConfirmDialog, StatusBadge, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [deletePlan, setDeletePlan] = useState<any>(null);
  const [form, setForm] = useState({
    audience: 'WORKER',
    name: '',
    type: 'ONE_TIME',
    price: '',
    contactsIncluded: '',
    durationDays: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const [w, e] = await Promise.all([
        api.get('/plans?audience=WORKER'),
        api.get('/plans?audience=EMPLOYER'),
      ]);
      setPlans([...w.data.data, ...e.data.data]);
    } catch {
      toast('Failed to load subscription plans', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditPlan(null);
    setForm({ audience: 'WORKER', name: '', type: 'ONE_TIME', price: '', contactsIncluded: '', durationDays: '', isActive: true });
    setShowAdd(true);
  }

  function openEdit(plan: any) {
    setEditPlan(plan);
    setForm({
      audience: plan.audience ?? 'WORKER',
      name: plan.name ?? '',
      type: plan.type ?? 'ONE_TIME',
      price: plan.price ?? '',
      contactsIncluded: plan.contactsIncluded ?? '',
      durationDays: plan.durationDays ?? '',
      isActive: plan.isActive !== false,
    });
    setShowAdd(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) {
      toast('Plan name and price are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        audience: form.audience,
        name: form.name,
        type: form.type,
        price: form.price,
        contactsIncluded: form.type === 'ONE_TIME' ? Number(form.contactsIncluded) : undefined,
        durationDays: form.type === 'SUBSCRIPTION' ? Number(form.durationDays) : undefined,
        isActive: form.isActive,
      };

      if (editPlan) {
        await api.put(`/plans/${editPlan.id}`, payload);
        toast('Subscription plan updated', 'success');
      } else {
        await api.post('/plans', payload);
        toast('Subscription plan created', 'success');
      }
      setShowAdd(false);
      setEditPlan(null);
      load();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Failed to save plan', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(plan: any) {
    try {
      await api.put(`/plans/${plan.id}`, { isActive: !plan.isActive });
      toast(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch {
      toast('Failed to update plan status', 'error');
    }
  }

  async function deletePlanFn(id: string) {
    try {
      await api.delete(`/plans/${id}`);
      toast('Plan deactivated/removed', 'success');
      load();
    } catch {
      toast('Failed to remove plan', 'error');
    }
  }

  const filtered = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.audience.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    const matchesAudience = audienceFilter === 'ALL' || p.audience === audienceFilter;
    return matchesSearch && matchesAudience;
  });

  const columns: Column<any>[] = [
    { key: 'name', label: 'Plan Name', render: (r) => <strong>{r.name}</strong> },
    {
      key: 'audience',
      label: 'Target Audience',
      render: (r) => (
        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: r.audience === 'WORKER' ? '#ccfbf1' : '#e0f2fe', color: r.audience === 'WORKER' ? '#0d9488' : '#0284c7' }}>
          {r.audience}
        </span>
      ),
    },
    { key: 'type', label: 'Billing Type', render: (r) => r.type === 'ONE_TIME' ? 'One-time Pack' : 'Monthly Subscription' },
    { key: 'price', label: 'Price', render: (r) => <strong>₹{r.price}</strong> },
    {
      key: 'details',
      label: 'Includes',
      render: (r) => r.type === 'ONE_TIME' ? `${r.contactsIncluded ?? 0} contact(s)` : `${r.durationDays ?? 30} days unlimited`,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (r) => <StatusBadge status={r.isActive !== false ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Subscriptions' }]}>
      <SectionHeader
        title="Subscription & Pricing Plans"
        subtitle="Manage contact-unlock packs and subscription memberships for Workers and Employers"
        action={<PrimaryButton onClick={openCreate}>+ Add New Plan</PrimaryButton>}
      />

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input
          placeholder="🔍 Search plan name, audience, or billing type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'WORKER', 'EMPLOYER'].map((a) => (
            <button
              key={a}
              onClick={() => setAudienceFilter(a)}
              style={{
                padding: '5px 14px',
                borderRadius: 99,
                border: '1px solid var(--border)',
                background: audienceFilter === a ? 'var(--primary)' : 'var(--bg-card)',
                color: audienceFilter === a ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          pageSize={20}
          actions={(r) => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => openEdit(r)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => toggleActive(r)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: r.isActive !== false ? '#fef2f2' : '#f0fdfa', color: r.isActive !== false ? '#dc2626' : '#0d9488', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                {r.isActive !== false ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => setDeletePlan(r)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Remove
              </button>
            </div>
          )}
        />
      </div>

      {/* Add / Edit Plan Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}>
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Audience">
            <Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="WORKER">Worker</option>
              <option value="EMPLOYER">Employer</option>
            </Select>
          </FormGroup>
          <FormGroup label="Billing Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="ONE_TIME">One-time Pack</option>
              <option value="SUBSCRIPTION">Monthly Subscription</option>
            </Select>
          </FormGroup>
          <FormGroup label="Plan Name" required>
            <Input placeholder="e.g. 5 Contacts Pack" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormGroup>
          <FormGroup label="Price (₹)" required>
            <Input type="number" placeholder="e.g. 199" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </FormGroup>
          {form.type === 'ONE_TIME' ? (
            <FormGroup label="Contacts Included">
              <Input type="number" placeholder="e.g. 5" value={form.contactsIncluded} onChange={(e) => setForm({ ...form, contactsIncluded: e.target.value })} />
            </FormGroup>
          ) : (
            <FormGroup label="Duration (days)">
              <Input type="number" placeholder="e.g. 30" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
            </FormGroup>
          )}
          {editPlan && (
            <FormGroup label="Status">
              <Select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormGroup>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => setShowAdd(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={submitting}>{submitting ? 'Saving…' : editPlan ? 'Update Plan' : 'Create Plan'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Remove confirm */}
      <ConfirmDialog
        isOpen={!!deletePlan}
        onClose={() => setDeletePlan(null)}
        onConfirm={() => { deletePlanFn(deletePlan.id); setDeletePlan(null); }}
        title="Remove Plan"
        message={`Remove plan "${deletePlan?.name}"? Existing purchases will not be affected.`}
        confirmLabel="Remove Plan"
        danger
      />
    </DashboardLayout>
  );
}
