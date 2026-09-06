import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, PrimaryButton, Card, SectionHeader, FormGroup, Input, StatusBadge, useToast } from '../../components/common/Primitives';

function compressImage(file: File, maxWidth = 300, maxHeight = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function WorkerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    api.get('/profiles/worker/me')
      .then((res) => setProfile(res.data.data))
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveState('saving');
    try {
      const skillsArray = typeof profile.skills === 'string'
        ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : profile.skills;

      const res = await api.put('/profiles/worker/me', {
        fullName: profile.fullName,
        email: profile.email || profile.user?.email,
        avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : profile.user?.avatarUrl,
        bio: profile.bio,
        yearsOfExperience: Number(profile.yearsOfExperience ?? profile.experienceYears) || 0,
        hourlyRate: profile.hourlyRate,
        skills: skillsArray,
        isAvailable: profile.isAvailable,
      });
      setProfile(res.data.data);
      await refreshUser();
      setSaveState('saved');
      toast('Worker profile updated successfully!', 'success');
    } catch {
      setSaveState('error');
      toast('Failed to save profile changes.', 'error');
    }
  }

  if (isLoading) return <DashboardLayout links={WORKER_NAV_LINKS}><LoadingState /></DashboardLayout>;
  if (error) return <DashboardLayout links={WORKER_NAV_LINKS}><ErrorState message={error} /></DashboardLayout>;

  const currentAvatar = profile.avatarUrl || profile.user?.avatarUrl;

  return (
    <DashboardLayout links={WORKER_NAV_LINKS} breadcrumbs={[{ label: 'Worker', href: '/worker/dashboard' }, { label: 'My Profile' }]}>
      <SectionHeader title="Worker Profile Settings" subtitle="Keep your skills, experience, and availability up to date to get more job offers." />

      <div style={{ maxWidth: 680 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profile.fullName || 'Worker'}
                  style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
                  {(profile.fullName?.[0] ?? 'W').toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{profile.fullName || 'Worker Profile'}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.user?.email ?? profile.user?.phone ?? 'Verified Worker'}</div>
              </div>
            </div>
            <StatusBadge status={profile.isAvailable !== false ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {/* Profile Avatar Photo Selector */}
            <FormGroup label="Profile Photo / Avatar (प्रोफाइल फोटो)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 }}>
                    {(profile.fullName?.[0] ?? 'W').toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const compressed = await compressImage(file);
                      setProfile({ ...profile, avatarUrl: compressed });
                    } catch {
                      toast('Failed to process image file', 'error');
                    }
                  }}
                  style={{ fontSize: 13 }}
                />
              </div>
            </FormGroup>

            <div className="grid-2" style={{ gap: 16 }}>
              <FormGroup label="Full Name (नाम)" required>
                <Input
                  value={profile.fullName ?? ''}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                />
              </FormGroup>

              <FormGroup label="Email ID (ईमेल आई डी)">
                <Input
                  type="email"
                  value={profile.email ?? profile.user?.email ?? ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="e.g. worker@example.com"
                />
              </FormGroup>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <FormGroup label="Experience (Years)">
                <Input
                  type="number"
                  min={0}
                  value={profile.yearsOfExperience ?? profile.experienceYears ?? 0}
                  onChange={(e) => setProfile({ ...profile, yearsOfExperience: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Hourly Rate (₹)">
                <Input
                  placeholder="e.g. 150"
                  value={profile.hourlyRate ?? ''}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup label="Skills (comma-separated)">
              <Input
                value={Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills ?? '')}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="e.g. Plumbing, Pipe Fitting, Water Pump Repair"
              />
            </FormGroup>

            <FormGroup label="About Yourself (Bio)">
              <textarea
                rows={3}
                value={profile.bio ?? ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Describe your work experience and specializations..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
              />
            </FormGroup>

            <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={profile.isAvailable !== false}
                  onChange={(e) => setProfile({ ...profile, isAvailable: e.target.checked })}
                />
                Available for new job contracts & shift calls
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <PrimaryButton type="submit" disabled={saveState === 'saving'}>
                {saveState === 'saving' ? 'Saving Profile...' : 'Save Profile Settings'}
              </PrimaryButton>
            </div>
          </form>
        </Card>

        {/* Aadhaar Identity Verification Card */}
        <Card style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🆔 Aadhaar Identity Verification
            </h3>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 12,
                backgroundColor:
                  profile.aadhaarStatus === 'VERIFIED'
                    ? '#dcfce7'
                    : profile.aadhaarStatus === 'PENDING'
                    ? '#fef3c7'
                    : profile.aadhaarStatus === 'REJECTED'
                    ? '#fee2e2'
                    : 'var(--bg-hover)',
                color:
                  profile.aadhaarStatus === 'VERIFIED'
                    ? '#15803d'
                    : profile.aadhaarStatus === 'PENDING'
                    ? '#b45309'
                    : profile.aadhaarStatus === 'REJECTED'
                    ? '#b91c1c'
                    : 'var(--text-muted)',
              }}
            >
              {profile.aadhaarStatus === 'VERIFIED'
                ? '✓ VERIFIED'
                : profile.aadhaarStatus === 'PENDING'
                ? '⏳ PENDING REVIEW'
                : profile.aadhaarStatus === 'REJECTED'
                ? '✕ REJECTED'
                : 'NOT SUBMITTED'}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Workers with verified Aadhaar badges receive up to <strong>3x more direct job calls</strong> from contractors.
          </p>

          {profile.aadhaarStatus === 'REJECTED' && profile.verificationNote && (
            <div style={{ padding: '12px 14px', borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
              <strong>Verification Rejected:</strong> {profile.verificationNote}. Please re-upload clear photos of your original Aadhaar card.
            </div>
          )}

          <AadhaarUploadForm
            currentProfile={profile}
            onSuccess={(updated) => {
              setProfile(updated);
              toast('Aadhaar submitted for verification!', 'success');
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AadhaarUploadForm({ currentProfile, onSuccess }: { currentProfile: any; onSuccess: (p: any) => void }) {
  const [aadhaarNum, setAadhaarNum] = useState(currentProfile.aadhaarNumber || '');
  const [frontUrl, setFrontUrl] = useState<string | null>(currentProfile.aadhaarFrontUrl || null);
  const [backUrl, setBackUrl] = useState<string | null>(currentProfile.aadhaarBackUrl || null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') setFrontUrl(reader.result as string);
      else setBackUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarNum || aadhaarNum.length < 12) {
      alert('Please enter a valid 12-digit Aadhaar Number');
      return;
    }
    if (!frontUrl || !backUrl) {
      alert('Please upload both Front and Back photos of your Aadhaar card');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.put('/profiles/worker/aadhaar', {
        aadhaarNumber: aadhaarNum,
        aadhaarFrontUrl: frontUrl,
        aadhaarBackUrl: backUrl,
      });
      onSuccess(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit Aadhaar verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <FormGroup label="12-Digit Aadhaar Number" required>
        <Input
          placeholder="e.g. 1234 5678 9012"
          maxLength={14}
          value={aadhaarNum}
          onChange={(e) => setAadhaarNum(e.target.value)}
          disabled={currentProfile.aadhaarStatus === 'VERIFIED'}
        />
      </FormGroup>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Aadhaar Card Front Photo *
          </label>
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: 12,
              textAlign: 'center',
              backgroundColor: 'var(--bg-input)',
              position: 'relative',
            }}
          >
            {frontUrl ? (
              <img src={frontUrl} alt="Aadhaar Front" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
                📁 Upload Front Photo
              </div>
            )}
            {currentProfile.aadhaarStatus !== 'VERIFIED' && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, 'front')}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            Aadhaar Card Back Photo *
          </label>
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: 12,
              textAlign: 'center',
              backgroundColor: 'var(--bg-input)',
              position: 'relative',
            }}
          >
            {backUrl ? (
              <img src={backUrl} alt="Aadhaar Back" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
                📁 Upload Back Photo
              </div>
            )}
            {currentProfile.aadhaarStatus !== 'VERIFIED' && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e, 'back')}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
            )}
          </div>
        </div>
      </div>

      {currentProfile.aadhaarStatus !== 'VERIFIED' && (
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? 'Submitting Documents...' : '📤 Submit Aadhaar Documents'}
        </PrimaryButton>
      )}
    </form>
  );
}
