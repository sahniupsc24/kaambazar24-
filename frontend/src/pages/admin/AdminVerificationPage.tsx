import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { api } from '../../api/client';
import { Card, LoadingState, ErrorState, EmptyState, PrimaryButton, SecondaryButton, StatusBadge, SectionHeader, Modal, FormGroup, Input, useToast } from '../../components/common/Primitives';
import { ADMIN_LINKS } from './adminLinks';

function WorkerVerificationCard({ worker, onRefresh }: { worker: any; onRefresh: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('');
  const [form, setForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  function loadDetail() {
    api.get(`/admin/verification/worker/${worker.id}`).then((res) => {
      setDetail(res.data.data);
      setForm(res.data.data.profile);
    }).catch(() => toast('Failed to load worker details', 'error'));
  }

  useEffect(() => { if (expanded) loadDetail(); }, [expanded]);

  async function approve() {
    try {
      await api.post(`/admin/verification/worker/${worker.id}/approve`);
      toast(`Verification approved for ${worker.fullName}`, 'success');
      onRefresh();
      if (expanded) loadDetail();
    } catch {
      toast('Failed to approve verification', 'error');
    }
  }

  async function handleRemoveVerification() {
    if (!removeReason.trim()) { toast('Please specify a reason for removing verification', 'error'); return; }
    try {
      await api.post(`/admin/verification/worker/${worker.id}/remove`, { reason: removeReason });
      toast(`Verification removed for ${worker.fullName}`, 'warning');
      setRemoveModal(false);
      setRemoveReason('');
      onRefresh();
      if (expanded) loadDetail();
    } catch {
      toast('Failed to remove verification', 'error');
    }
  }

  async function saveEdit() {
    setSubmitting(true);
    try {
      await api.put(`/admin/verification/worker/${worker.id}`, {
        fullName: form.fullName,
        experienceYears: Number(form.experienceYears),
        skills: typeof form.skills === 'string' ? form.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : form.skills,
      });
      toast('Worker details updated', 'success');
      setEditing(false);
      onRefresh();
      loadDetail();
    } catch {
      toast('Could not save worker details', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
            {(worker.fullName?.[0] ?? 'W').toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              {worker.fullName} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13 }}>(Worker)</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', margin: '3px 0 0 0', fontSize: 13 }}>
              {worker.primaryCategory?.name ?? 'General'} · {worker.location?.name ?? 'All India'}
            </p>
          </div>
        </div>
        <StatusBadge status={worker.isVerified ? 'VERIFIED' : 'PENDING'} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <SecondaryButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide Details' : 'View Stats & Profile'}</SecondaryButton>
        <SecondaryButton onClick={() => { if (!form) loadDetail(); setEditing(!editing); }}>{editing ? 'Close Edit' : '✏️ Quick Edit'}</SecondaryButton>
        {worker.isVerified ? (
          <button
            onClick={() => setRemoveModal(true)}
            style={{ background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 'var(--radius-md)', padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}
          >
            🚫 Revoke Verification
          </button>
        ) : (
          <PrimaryButton onClick={approve}>✓ Approve Verification</PrimaryButton>
        )}
      </div>

      {expanded && detail && !editing && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-main)', display: 'grid', gap: 8, background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Experience:</span> <strong>{detail.profile?.experienceYears ?? 0} years</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Skills:</span> <strong>{(detail.profile?.skills || []).join(', ') || '—'}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Applications Submitted:</span> <strong>{detail.stats?.applicationCount ?? 0}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Contracts (Active / Total):</span> <strong>{detail.stats?.activeContracts ?? 0} / {detail.stats?.contractCount ?? 0}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Times Contact Unlocked:</span> <strong>{detail.stats?.timesContacted ?? 0}</strong></div>

          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>🆔 Aadhaar Verification Status:</span>
              <span style={{ fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 10, backgroundColor: detail.profile?.aadhaarStatus === 'VERIFIED' ? '#dcfce7' : '#fef3c7', color: detail.profile?.aadhaarStatus === 'VERIFIED' ? '#166534' : '#b45309' }}>
                {detail.profile?.aadhaarStatus || 'UNSUBMITTED'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              Aadhaar Number: <strong>{detail.profile?.aadhaarNumber || 'Not provided'}</strong>
            </div>

            {(detail.profile?.aadhaarFrontUrl || detail.profile?.aadhaarBackUrl) ? (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {detail.profile?.aadhaarFrontUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Front Side</div>
                    <img
                      src={detail.profile.aadhaarFrontUrl}
                      alt="Front"
                      style={{ width: 120, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => window.open(detail.profile.aadhaarFrontUrl, '_blank')}
                    />
                  </div>
                )}
                {detail.profile?.aadhaarBackUrl && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Back Side</div>
                    <img
                      src={detail.profile.aadhaarBackUrl}
                      alt="Back"
                      style={{ width: 120, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => window.open(detail.profile.aadhaarBackUrl, '_blank')}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No Aadhaar document images uploaded yet.</div>
            )}
          </div>

          {detail.profile?.verificationNote && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#fffbe8', border: '1px solid #fef08a', color: '#854d0e', borderRadius: 6 }}>
              <strong>Last Note:</strong> "{detail.profile.verificationNote}"
            </div>
          )}
        </div>
      )}

      {editing && form && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gap: 10 }}>
          <FormGroup label="Full Name">
            <Input value={form.fullName ?? ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </FormGroup>          <FormGroup label="Years of Experience">
            <Input type="number" min={0} value={form.experienceYears ?? 0} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} />
          </FormGroup>          <FormGroup label="Skills (comma-separated)">
            <Input value={Array.isArray(form.skills) ? form.skills.join(', ') : (form.skills ?? '')} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </FormGroup>          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <SecondaryButton onClick={() => setEditing(false)}>Cancel</SecondaryButton>            <PrimaryButton onClick={saveEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Worker Profile'}</PrimaryButton>          </div>
        </div>
      )}

      {/* Revoke Modal */}
      <Modal isOpen={removeModal} onClose={() => setRemoveModal(false)} title="Revoke Verification">
        <div style={{ display: 'grid', gap: 14 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0 }}>
            Specify the reason for removing verification from <strong>{worker.fullName}</strong>.
          </p>
          <FormGroup label="Reason for Revocation" required>
            <textarea
              rows={3}
              placeholder="e.g. Disputed Aadhaar documents, customer complaint..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
            />
          </FormGroup>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <SecondaryButton onClick={() => setRemoveModal(false)}>Cancel</SecondaryButton>
            <button onClick={handleRemoveVerification} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
              Revoke Verification
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function EmployerVerificationCard({ buyer, onRefresh }: { buyer: any; onRefresh: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const [removeReason, setRemoveReason] = useState('');
  const [form, setForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  function loadDetail() {
    api.get(`/admin/verification/employer/${buyer.id}`).then((res) => {
      setDetail(res.data.data);
      setForm(res.data.data.profile);
    }).catch(() => toast('Failed to load employer details', 'error'));
  }

  useEffect(() => { if (expanded) loadDetail(); }, [expanded]);

  async function approve() {
    try {
      await api.post(`/admin/verification/employer/${buyer.id}/approve`);
      toast(`Employer verification approved for ${buyer.businessName}`, 'success');
      onRefresh();
      if (expanded) loadDetail();
    } catch {
      toast('Failed to approve employer verification', 'error');
    }
  }

  async function handleRemoveVerification() {
    if (!removeReason.trim()) { toast('Please specify a reason for removing verification', 'error'); return; }
    try {
      await api.post(`/admin/verification/employer/${buyer.id}/remove`, { reason: removeReason });
      toast(`Verification removed for ${buyer.businessName}`, 'warning');
      setRemoveModal(false);
      setRemoveReason('');
      onRefresh();
      if (expanded) loadDetail();
    } catch {
      toast('Failed to remove verification', 'error');
    }
  }

  async function saveEdit() {
    setSubmitting(true);
    try {
      await api.put(`/admin/verification/employer/${buyer.id}`, {
        businessName: form.businessName,
        contactPersonName: form.contactPersonName,
        contactPhone: form.contactPhone,
        address: form.address,
        gstin: form.gstin,
      });
      toast('Employer details updated', 'success');
      setEditing(false);
      onRefresh();
      loadDetail();
    } catch {
      toast('Could not save employer details', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
            🏢
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
              {buyer.businessName} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13 }}>(Employer)</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', margin: '3px 0 0 0', fontSize: 13 }}>
              {buyer.location?.name ?? 'All India'}
            </p>
          </div>
        </div>
        <StatusBadge status={buyer.isVerified ? 'VERIFIED' : 'PENDING'} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <SecondaryButton onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide Details' : 'View Stats & Profile'}</SecondaryButton>
        <SecondaryButton onClick={() => { if (!form) loadDetail(); setEditing(!editing); }}>{editing ? 'Close Edit' : '✏️ Quick Edit'}</SecondaryButton>
        {buyer.isVerified ? (
          <button
            onClick={() => setRemoveModal(true)}
            style={{ background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 'var(--radius-md)', padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}
          >
            🚫 Revoke Verification
          </button>
        ) : (
          <PrimaryButton onClick={approve}>✓ Approve Verification</PrimaryButton>
        )}
      </div>

      {expanded && detail && !editing && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-main)', display: 'grid', gap: 6, background: 'var(--bg-hover)', padding: 12, borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Contact Person:</span> <strong>{detail.profile?.contactPersonName ?? '—'}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>GSTIN:</span> <strong>{detail.profile?.gstin ?? '—'}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Jobs Posted:</span> <strong>{detail.stats?.jobsPostedCount ?? 0}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Featured Jobs:</span> <strong>{detail.stats?.featuredJobsCount ?? 0}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Total Spend:</span> <strong>₹{detail.stats?.totalSpend ?? '0.00'}</strong></div>
        </div>
      )}

      {editing && form && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'grid', gap: 10 }}>
          <FormGroup label="Business Name">
            <Input value={form.businessName ?? ''} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </FormGroup>
          <FormGroup label="Contact Person">
            <Input value={form.contactPersonName ?? ''} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} />
          </FormGroup>
          <FormGroup label="Contact Phone">
            <Input value={form.contactPhone ?? ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </FormGroup>
          <FormGroup label="GSTIN">
            <Input value={form.gstin ?? ''} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          </FormGroup>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <SecondaryButton onClick={() => setEditing(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={saveEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Employer Profile'}</PrimaryButton>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      <Modal isOpen={removeModal} onClose={() => setRemoveModal(false)} title="Revoke Employer Verification">
        <div style={{ display: 'grid', gap: 14 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: 0 }}>
            Specify the reason for removing verification from <strong>{buyer.businessName}</strong>.
          </p>
          <FormGroup label="Reason for Revocation" required>
            <textarea
              rows={3}
              placeholder="e.g. Unverified GST documents, employer dispute..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
            />
          </FormGroup>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <SecondaryButton onClick={() => setRemoveModal(false)}>Cancel</SecondaryButton>
            <button onClick={handleRemoveVerification} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>
              Revoke Verification
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export function AdminVerificationPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleTab, setRoleTab] = useState<'ALL' | 'WORKERS' | 'EMPLOYERS'>('ALL');
  const { toast } = useToast();

  function load() {
    setIsLoading(true);
    Promise.all([api.get('/admin/workers'), api.get('/admin/buyers')])
      .then(([w, b]) => {
        setWorkers(w.data.data.items ?? []);
        setBuyers(b.data.data.items ?? []);
      })
      .catch(() => {
        setError('Could not load verification queue.');
        toast('Failed to load verification queue', 'error');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch = (w.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (w.location?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && !w.isVerified) ||
      (statusFilter === 'VERIFIED' && w.isVerified);
    return matchesSearch && matchesStatus;
  });

  const filteredBuyers = buyers.filter((b) => {
    const matchesSearch = (b.businessName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (b.location?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && !b.isVerified) ||
      (statusFilter === 'VERIFIED' && b.isVerified);
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout links={ADMIN_LINKS} breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Verification Queue' }]}>
      <SectionHeader
        title="Verification Queue & Profile Approval"
        subtitle="Review, approve, edit, or revoke identity & Aadhaar verification for Workers and Employers"
      />

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input
          placeholder="🔍 Search worker name, employer, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Role Tab */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 99, padding: 3 }}>
            {(['ALL', 'WORKERS', 'EMPLOYERS'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRoleTab(t)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 99,
                  border: 'none',
                  background: roleTab === t ? 'var(--primary)' : 'transparent',
                  color: roleTab === t ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['ALL', 'PENDING', 'VERIFIED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: '1px solid var(--border)',
                  background: statusFilter === s ? 'var(--text-main)' : 'var(--bg-card)',
                  color: statusFilter === s ? 'var(--bg-card)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!isLoading && !error && (
        <div style={{ display: 'grid', gap: 24 }}>
          {(roleTab === 'ALL' || roleTab === 'WORKERS') && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                👷 Worker Profiles ({filteredWorkers.length})
              </h3>
              {filteredWorkers.length === 0 ? (
                <EmptyState label="No workers match the selected verification filter." />
              ) : (
                filteredWorkers.map((w) => <WorkerVerificationCard key={w.id} worker={w} onRefresh={load} />)
              )}
            </div>
          )}

          {(roleTab === 'ALL' || roleTab === 'EMPLOYERS') && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🏢 Employer / Buyer Profiles ({filteredBuyers.length})
              </h3>
              {filteredBuyers.length === 0 ? (
                <EmptyState label="No employers match the selected verification filter." />
              ) : (
                filteredBuyers.map((b) => <EmployerVerificationCard key={b.id} buyer={b} onRefresh={load} />)
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
