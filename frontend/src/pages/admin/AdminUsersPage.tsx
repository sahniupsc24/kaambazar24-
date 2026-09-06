import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, StatusBadge, PrimaryButton, DangerButton, SecondaryButton, ConfirmDialog, Modal, FormGroup, Input, Select, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [confirmUser, setConfirmUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    role: 'WORKER',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/admin/users?pageSize=200');
      setUsers(res.data.data?.items ?? res.data.data ?? []);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(user: any) {
    try {
      await api.post(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      toast(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch {
      toast('Action failed', 'error');
    }
  }

  async function handleDelete(user: any) {
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast('User deleted', 'success');
      load();
    } catch {
      toast('Delete failed — user may have linked records', 'error');
    }
  }

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    try {
      await api.post(`/admin/users/${resetUser.id}/reset-password`, { newPassword });
      toast('Password reset successfully', 'success');
      setResetUser(null);
      setNewPassword('');
    } catch {
      toast('Password reset failed', 'error');
    }
  }

  function openEditModal(user: any) {
    setEditUser(user);
    setEditForm({
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role ?? 'WORKER',
      isActive: user.isActive !== false,
    });
  }

  async function handleUpdateUser() {
    if (!editUser || (!editForm.email.trim() && !editForm.phone.trim())) { toast('Email or Phone is required', 'error'); return; }
    setSubmitting(true);
    try {
      await api.put(`/admin/users/${editUser.id}`, {
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        isActive: editForm.isActive,
      });
      toast('User updated successfully', 'success');
      setEditUser(null);
      load();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.toLowerCase().includes(search.toLowerCase())) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: Column<any>[] = [
    {
      key: 'email',
      label: 'User',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: r.role === 'EMPLOYER' ? '#e0f2fe' : r.role === 'ADMIN' || r.role === 'SUPER_ADMIN' ? '#e0e7ff' : '#ccfbf1', color: r.role === 'EMPLOYER' ? '#0284c7' : r.role === 'ADMIN' || r.role === 'SUPER_ADMIN' ? '#6366f1' : '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {((r.email || r.phone || 'U')[0]).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.email || r.phone || '—'}</div>
            {r.email && r.phone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.phone}</div>}
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (r) => <span style={{ fontWeight: 700, fontSize: 12, padding: '3px 10px', borderRadius: 99, background: r.role === 'EMPLOYER' ? '#e0f2fe' : r.role === 'ADMIN' || r.role === 'SUPER_ADMIN' ? '#e0e7ff' : '#ccfbf1', color: r.role === 'EMPLOYER' ? '#0284c7' : r.role === 'ADMIN' || r.role === 'SUPER_ADMIN' ? '#6366f1' : '#0d9488' }}>{r.role}</span> },
    { key: 'isActive', label: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'ACTIVE' : 'BANNED'} /> },
    { key: 'createdAt', label: 'Joined', render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users' }]}>
      <SectionHeader title="User Management" subtitle={`${users.length} total registered accounts`} />

      {/* Role filter chips & Live search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input
          placeholder="🔍 Search user email, phone, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'WORKER', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                padding: '5px 14px',
                borderRadius: 99,
                border: '1px solid var(--border)',
                background: roleFilter === role ? 'var(--primary)' : 'var(--bg-card)',
                color: roleFilter === role ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              {role}
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
          onRowClick={(r) => navigate(`/admin/users/${r.id}`)}
          actions={(r) => (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
              <button
                onClick={(e) => { e.stopPropagation(); openEditModal(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmUser(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: r.isActive ? '#fef2f2' : '#f0fdfa', color: r.isActive ? '#dc2626' : '#0d9488', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {r.isActive ? 'Ban' : 'Unban'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setResetUser(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Pwd
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteUser(r); }}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User Account">
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Email Address" required>
            <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </FormGroup>

          <FormGroup label="Phone Number">
            <Input type="tel" placeholder="+91 9876543210" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </FormGroup>

          <FormGroup label="Role">
            <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="WORKER">WORKER</option>
              <option value="EMPLOYER">EMPLOYER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </Select>
          </FormGroup>

          <FormGroup label="Account Status">
            <Select value={editForm.isActive ? 'active' : 'banned'} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}>
              <option value="active">ACTIVE</option>
              <option value="banned">BANNED / INACTIVE</option>
            </Select>
          </FormGroup>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
            <SecondaryButton onClick={() => setEditUser(null)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleUpdateUser} disabled={submitting}>{submitting ? 'Saving...' : 'Save User'}</PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Ban/Unban confirm */}
      <ConfirmDialog
        isOpen={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={() => { toggleStatus(confirmUser); setConfirmUser(null); }}
        title={confirmUser?.isActive ? 'Ban User' : 'Unban User'}
        message={`Are you sure you want to ${confirmUser?.isActive ? 'ban' : 'unban'} ${confirmUser?.email || confirmUser?.phone || 'this user'}?`}
        confirmLabel={confirmUser?.isActive ? 'Ban User' : 'Unban User'}
        danger={confirmUser?.isActive}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => { handleDelete(deleteUser); setDeleteUser(null); }}
        title="Delete User"
        message={`This will permanently delete ${deleteUser?.email || deleteUser?.phone || 'this user'} and all their data. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger
      />

      {/* Reset password modal */}
      <Modal isOpen={!!resetUser} onClose={() => setResetUser(null)} title="Reset Password">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Setting a new password for <strong>{resetUser?.email || resetUser?.phone || 'user'}</strong></p>
        <FormGroup label="New Password" required>
          <Input type="password" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </FormGroup>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <SecondaryButton onClick={() => setResetUser(null)}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleResetPassword}>Reset Password</PrimaryButton>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
