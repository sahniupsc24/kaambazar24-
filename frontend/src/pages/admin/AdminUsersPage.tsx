import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { DataTable, Column, SectionHeader, StatusBadge, PrimaryButton, SecondaryButton, ConfirmDialog, Modal, FormGroup, Input, Select, useToast } from '../../components/common/Primitives';
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
  const [resetMsg, setResetMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [editForm, setEditForm] = useState({ email: '', phone: '', role: 'WORKER', isActive: true });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      // Load from Supabase profiles table directly
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, phone, role, is_active, created_at, avatar_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Normalize to expected shape
      const normalized = (data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        avatarUrl: u.avatar_url,
      }));
      setUsers(normalized);
    } catch (e: any) {
      console.error('Load users error:', e);
      toast('Failed to load users: ' + (e?.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleStatus(user: any) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.isActive })
        .eq('id', user.id);
      if (error) throw error;
      toast(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch (e: any) {
      toast('Action failed: ' + (e?.message || 'Unknown error'), 'error');
    }
  }

  async function handleDelete(user: any) {
    try {
      // Delete from profiles (auth.users cascade will clean auth)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      if (error) throw error;
      toast('User profile deleted', 'success');
      load();
    } catch (e: any) {
      toast('Delete failed: ' + (e?.message || 'May have linked records. Use Supabase Dashboard to delete from auth.users.'), 'error');
    }
  }

  async function handleResetPassword() {
    if (!resetUser) return;
    setResetMsg(null);

    // If admin set a specific new password
    if (newPassword && newPassword.length >= 6) {
      // We can only send a reset email from client-side (no service_role key)
      // So we'll send a reset email to the user's email
    }

    const email = resetUser.email;
    if (!email || email.includes('@kaambazar.app')) {
      setResetMsg({ type: 'error', text: 'This user has no real email (phone-only user). Cannot send reset link.' });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setResetMsg({ type: 'success', text: `✅ Password reset link sent to ${email}. User ko unke email check karne ko bolo.` });
      setNewPassword('');
    } catch (e: any) {
      setResetMsg({ type: 'error', text: e?.message || 'Failed to send reset email.' });
    }
  }

  function openEditModal(user: any) {
    setEditUser(user);
    setEditForm({ email: user.email ?? '', phone: user.phone ?? '', role: user.role ?? 'WORKER', isActive: user.isActive !== false });
  }

  async function handleUpdateUser() {
    if (!editUser) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: editForm.email || null,
          phone: editForm.phone || null,
          role: editForm.role,
          is_active: editForm.isActive,
        })
        .eq('id', editUser.id);
      if (error) throw error;
      toast('User updated successfully', 'success');
      setEditUser(null);
      load();
    } catch (e: any) {
      toast('Failed to update user: ' + (e?.message || 'Unknown error'), 'error');
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
    { key: 'createdAt', label: 'Joined', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—' },
  ];

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users' }]}>
      <SectionHeader title="User Management" subtitle={`${users.length} total registered accounts`} />

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
              style={{ padding: '5px 14px', borderRadius: 99, border: '1px solid var(--border)', background: roleFilter === role ? 'var(--primary)' : 'var(--bg-card)', color: roleFilter === role ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s ease' }}
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
              <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-main)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✏️ Edit</button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmUser(r); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: r.isActive ? '#fef2f2' : '#f0fdfa', color: r.isActive ? '#dc2626' : '#0d9488', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {r.isActive ? 'Ban' : 'Unban'}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setResetUser(r); setResetMsg(null); setNewPassword(''); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Pwd
              </button>
              <button onClick={(e) => { e.stopPropagation(); setDeleteUser(r); }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Edit User Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User Account">
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Email Address">
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
        message={`This will permanently delete ${deleteUser?.email || deleteUser?.phone || 'this user'}'s profile. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger
      />

      {/* Reset password modal — sends email link */}
      <Modal isOpen={!!resetUser} onClose={() => { setResetUser(null); setResetMsg(null); }} title="Reset User Password">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Sending a password reset link to <strong>{resetUser?.email || 'user'}</strong>. The user can click it to set a new password.
        </p>
        {resetMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, backgroundColor: resetMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: resetMsg.type === 'success' ? '#166534' : '#b91c1c' }}>
            {resetMsg.text}
          </div>
        )}
        {!resetMsg && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <SecondaryButton onClick={() => { setResetUser(null); setResetMsg(null); }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleResetPassword}>📩 Send Reset Email</PrimaryButton>
          </div>
        )}
        {resetMsg?.type === 'success' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <SecondaryButton onClick={() => { setResetUser(null); setResetMsg(null); }}>Close</SecondaryButton>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
