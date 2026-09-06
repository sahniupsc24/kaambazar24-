import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card, StatusBadge, PrimaryButton, DangerButton, SecondaryButton, LoadingState, ErrorState, useToast, ConfirmDialog, Modal, FormGroup, Input, Select } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banConfirm, setBanConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({ email: '', phone: '', role: 'WORKER', isActive: true });
  const [workerForm, setWorkerForm] = useState({ fullName: '', bio: '', yearsOfExperience: 0, hourlyRate: '', skills: '', isAvailable: true });
  const [employerForm, setEmployerForm] = useState({ businessName: '', businessDescription: '', contactPersonName: '', contactPhone: '', address: '', gstin: '' });

  async function load() {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setUser(res.data.data);
    } catch {
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  function openEditModal() {
    if (!user) return;
    setUserForm({
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role ?? 'WORKER',
      isActive: user.isActive !== false,
    });
    if (user.workerProfile) {
      setWorkerForm({
        fullName: user.workerProfile.fullName ?? '',
        bio: user.workerProfile.bio ?? '',
        yearsOfExperience: user.workerProfile.yearsOfExperience ?? 0,
        hourlyRate: user.workerProfile.hourlyRate ?? '',
        skills: Array.isArray(user.workerProfile.skills) ? user.workerProfile.skills.join(', ') : (user.workerProfile.skills ?? ''),
        isAvailable: user.workerProfile.isAvailable !== false,
      });
    }
    if (user.employerProfile) {
      setEmployerForm({
        businessName: user.employerProfile.businessName ?? '',
        businessDescription: user.employerProfile.businessDescription ?? '',
        contactPersonName: user.employerProfile.contactPersonName ?? '',
        contactPhone: user.employerProfile.contactPhone ?? '',
        address: user.employerProfile.address ?? '',
        gstin: user.employerProfile.gstin ?? '',
      });
    }
    setShowEdit(true);
  }

  async function handleSaveEdit() {
    setSubmitting(true);
    try {
      const payload: any = {
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive,
      };

      if (user.workerProfile) {
        payload.workerProfile = {
          fullName: workerForm.fullName,
          bio: workerForm.bio,
          yearsOfExperience: Number(workerForm.yearsOfExperience) || 0,
          hourlyRate: workerForm.hourlyRate,
          skills: workerForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
          isAvailable: workerForm.isAvailable,
        };
      }

      if (user.employerProfile) {
        payload.employerProfile = {
          businessName: employerForm.businessName,
          businessDescription: employerForm.businessDescription,
          contactPersonName: employerForm.contactPersonName,
          contactPhone: employerForm.contactPhone,
          address: employerForm.address,
          gstin: employerForm.gstin,
        };
      }

      await api.put(`/admin/users/${id}`, payload);
      toast('User & profile updated successfully', 'success');
      setShowEdit(false);
      load();
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus() {
    try {
      await api.post(`/admin/users/${id}/status`, { isActive: !user.isActive });
      toast(`User ${user.isActive ? 'banned' : 'unbanned'}`, 'success');
      load();
    } catch {
      toast('Action failed', 'error');
    }
  }

  if (loading) return <DashboardLayout links={ADMIN_LINKS}><LoadingState /></DashboardLayout>;
  if (error || !user) return <DashboardLayout links={ADMIN_LINKS}><ErrorState message={error || 'User not found'} /></DashboardLayout>;

  const profile = user.workerProfile ?? user.employerProfile;
  const isWorker = user.role === 'WORKER';

  return (
    <DashboardLayout
      links={ADMIN_LINKS}
      breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: user.email }]}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{user.email}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={user.isActive ? 'ACTIVE' : 'BANNED'} />
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#e0e7ff', color: '#6366f1' }}>{user.role}</span>
            {profile?.isVerified && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>✓ Verified</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryButton onClick={() => navigate('/admin/users')}>← Back</SecondaryButton>
          <PrimaryButton onClick={openEditModal}>✏️ Edit User & Profile</PrimaryButton>
          {user.isActive
            ? <DangerButton onClick={() => setBanConfirm(true)}>🚫 Ban</DangerButton>
            : <PrimaryButton onClick={() => setBanConfirm(true)}>✓ Unban</PrimaryButton>}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Account info */}
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: 'var(--text-main)' }}>Account Info</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Email', user.email],
              ['Phone', user.phone ?? '—'],
              ['Role', user.role],
              ['Status', user.isActive ? 'Active' : 'Banned'],
              ['Joined', new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Profile details */}
        {profile && (
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{isWorker ? 'Worker Profile' : 'Employer Profile'}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {(isWorker ? [
                ['Full Name', profile.fullName ?? '—'],
                ['Skills', Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills ?? '—')],
                ['Experience', profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : '—'],
                ['Hourly Rate', profile.hourlyRate ? `₹${profile.hourlyRate}` : '—'],
                ['Availability', profile.isAvailable !== false ? 'Available' : 'Unavailable'],
                ['Bio', profile.bio ?? '—'],
              ] : [
                ['Business Name', profile.businessName ?? '—'],
                ['Contact Person', profile.contactPersonName ?? '—'],
                ['Contact Phone', profile.contactPhone ?? '—'],
                ['Address', profile.address ?? '—'],
                ['GSTIN', profile.gstin ?? '—'],
                ['Description', profile.businessDescription ?? '—'],
              ]).map(([label, value]: any) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Ban Confirm */}
      <ConfirmDialog
        isOpen={banConfirm}
        onClose={() => setBanConfirm(false)}
        onConfirm={() => { toggleStatus(); setBanConfirm(false); }}
        title={user.isActive ? 'Ban User' : 'Unban User'}
        message={`Are you sure you want to ${user.isActive ? 'ban' : 'unban'} ${user.email}?`}
        confirmLabel={user.isActive ? 'Ban User' : 'Unban User'}
        danger={user.isActive}
      />

      {/* Edit User & Profile Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit User & Profile">
        <div style={{ display: 'grid', gap: 14, maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>Account Details</h4>
          <FormGroup label="Email Address">
            <Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          </FormGroup>
          <FormGroup label="Phone">
            <Input type="tel" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
          </FormGroup>
          <FormGroup label="Role">
            <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="WORKER">WORKER</option>
              <option value="EMPLOYER">EMPLOYER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </Select>
          </FormGroup>

          {user.workerProfile && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginTop: 10 }}>Worker Profile</h4>
              <FormGroup label="Full Name">
                <Input value={workerForm.fullName} onChange={(e) => setWorkerForm({ ...workerForm, fullName: e.target.value })} />
              </FormGroup>
              <FormGroup label="Bio">
                <Input value={workerForm.bio} onChange={(e) => setWorkerForm({ ...workerForm, bio: e.target.value })} />
              </FormGroup>
              <FormGroup label="Experience (Years)">
                <Input type="number" min={0} value={workerForm.yearsOfExperience} onChange={(e) => setWorkerForm({ ...workerForm, yearsOfExperience: Number(e.target.value) })} />
              </FormGroup>
              <FormGroup label="Hourly Rate (₹)">
                <Input value={workerForm.hourlyRate} onChange={(e) => setWorkerForm({ ...workerForm, hourlyRate: e.target.value })} />
              </FormGroup>
              <FormGroup label="Skills (comma-separated)">
                <Input value={workerForm.skills} onChange={(e) => setWorkerForm({ ...workerForm, skills: e.target.value })} />
              </FormGroup>
            </>
          )}

          {user.employerProfile && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginTop: 10 }}>Employer Profile</h4>
              <FormGroup label="Business Name">
                <Input value={employerForm.businessName} onChange={(e) => setEmployerForm({ ...employerForm, businessName: e.target.value })} />
              </FormGroup>
              <FormGroup label="Contact Person">
                <Input value={employerForm.contactPersonName} onChange={(e) => setEmployerForm({ ...employerForm, contactPersonName: e.target.value })} />
              </FormGroup>
              <FormGroup label="Contact Phone">
                <Input value={employerForm.contactPhone} onChange={(e) => setEmployerForm({ ...employerForm, contactPhone: e.target.value })} />
              </FormGroup>
              <FormGroup label="Address">
                <Input value={employerForm.address} onChange={(e) => setEmployerForm({ ...employerForm, address: e.target.value })} />
              </FormGroup>
              <FormGroup label="GSTIN">
                <Input value={employerForm.gstin} onChange={(e) => setEmployerForm({ ...employerForm, gstin: e.target.value })} />
              </FormGroup>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
            <SecondaryButton onClick={() => setShowEdit(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSaveEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</PrimaryButton>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
