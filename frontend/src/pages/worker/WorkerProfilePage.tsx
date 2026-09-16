import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { WORKER_NAV_LINKS } from './WorkerDashboardPage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
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
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { toast } = useToast();

  async function loadProfile() {
    if (!user?.id) return;
    try {
      // Load from profiles table (email, phone, avatar_url)
      const { data: baseProfile } = await supabase
        .from('profiles')
        .select('email, phone, avatar_url')
        .eq('id', user.id)
        .single();

      // Load from worker_profiles table
      const { data: wp, error: wpErr } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (wpErr && wpErr.code !== 'PGRST116') {
        // PGRST116 = not found (first time user, worker_profile row doesn't exist yet)
        throw wpErr;
      }

      // Merge data into one object that matches what the UI expects
      setProfile({
        id: wp?.id || null,
        userId: user.id,
        fullName: wp?.full_name || '',
        email: baseProfile?.email || user.email || '',
        phone: baseProfile?.phone || user.phone || '',
        avatarUrl: baseProfile?.avatar_url || null,
        bio: wp?.bio || '',
        yearsOfExperience: wp?.experience_years || 0,
        hourlyRate: '', // not in schema — stored as free text
        skills: Array.isArray(wp?.skills) ? wp.skills : (wp?.skills ? [] : []),
        isAvailable: wp?.is_available !== false,
        aadhaarStatus: wp?.aadhaar_status || 'UNSUBMITTED',
        aadhaarNumber: wp?.aadhaar_number || '',
        aadhaarFrontUrl: null,
        aadhaarBackUrl: null,
      });
    } catch (e: any) {
      console.error('Worker profile load error:', e);
      setError('Could not load your profile. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [user?.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaveState('saving');
    try {
      const skillsArray = typeof profile.skills === 'string'
        ? profile.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(profile.skills) ? profile.skills : []);

      // Update base profile (avatar, phone)
      await supabase.from('profiles').update({
        avatar_url: profile.avatarUrl || null,
        phone: profile.phone || null,
      }).eq('id', user.id);

      // Upsert worker_profile row
      const workerData: any = {
        user_id: user.id,
        full_name: profile.fullName || 'Worker',
        bio: profile.bio || null,
        experience_years: Number(profile.yearsOfExperience) || 0,
        skills: skillsArray,
        is_available: profile.isAvailable !== false,
      };

      if (profile.id) {
        await supabase.from('worker_profiles').update(workerData).eq('id', profile.id);
      } else {
        const { data: inserted } = await supabase.from('worker_profiles').insert([workerData]).select().single();
        if (inserted) setProfile((p: any) => ({ ...p, id: inserted.id }));
      }

      await refreshUser();
      setSaveState('saved');
      toast('Profile updated successfully!', 'success');
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveState('error');
      toast('Failed to save profile: ' + (err?.message || 'Unknown error'), 'error');
    }
  }

  if (isLoading) return <DashboardLayout links={WORKER_NAV_LINKS}><LoadingState /></DashboardLayout>;
  if (error) return (
    <DashboardLayout links={WORKER_NAV_LINKS}>
      <ErrorState message={error} />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <PrimaryButton onClick={() => { setError(null); setIsLoading(true); loadProfile(); }}>
          🔄 Retry
        </PrimaryButton>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout links={WORKER_NAV_LINKS} breadcrumbs={[{ label: 'Worker', href: '/worker/dashboard' }, { label: 'My Profile' }]}>
      <SectionHeader title="Worker Profile Settings" subtitle="Keep your skills, experience, and availability up to date to get more job offers." />

      <div style={{ maxWidth: 680 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName || 'Worker'} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
                  {(profile.fullName?.[0] ?? 'W').toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{profile.fullName || 'Worker Profile'}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.email || profile.phone || 'Verified Worker'}</div>
              </div>
            </div>
            <StatusBadge status={profile.isAvailable !== false ? 'ACTIVE' : 'INACTIVE'} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {/* Profile Avatar */}
            <FormGroup label="Profile Photo / Avatar (प्रोफाइल फोटो)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
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
                    } catch { toast('Failed to process image file', 'error'); }
                  }}
                  style={{ fontSize: 13 }}
                />
                {profile.avatarUrl && (
                  <button type="button" onClick={() => setProfile({ ...profile, avatarUrl: null })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                    ✕ Remove
                  </button>
                )}
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
              <FormGroup label="Mobile Number (मोबाइल नंबर)">
                <Input
                  type="tel"
                  value={profile.phone ?? ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="e.g. 9876543210"
                />
              </FormGroup>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <FormGroup label="Experience (Years)">
                <Input
                  type="number"
                  min={0}
                  value={profile.yearsOfExperience ?? 0}
                  onChange={(e) => setProfile({ ...profile, yearsOfExperience: Number(e.target.value) })}
                />
              </FormGroup>
              <FormGroup label="Skills (comma-separated)">
                <Input
                  value={Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills ?? '')}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  placeholder="e.g. Plumbing, Carpentry, Welding"
                />
              </FormGroup>
            </div>

            <FormGroup label="About Yourself (Bio)">
              <textarea
                rows={3}
                value={profile.bio ?? ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Describe your work experience and specializations..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' }}
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

        {/* Aadhaar Verification Card */}
        <Card style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🆔 Aadhaar Identity Verification
            </h3>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
              backgroundColor: profile.aadhaarStatus === 'VERIFIED' ? '#dcfce7' : profile.aadhaarStatus === 'PENDING' ? '#fef3c7' : profile.aadhaarStatus === 'REJECTED' ? '#fee2e2' : 'var(--bg-hover)',
              color: profile.aadhaarStatus === 'VERIFIED' ? '#15803d' : profile.aadhaarStatus === 'PENDING' ? '#b45309' : profile.aadhaarStatus === 'REJECTED' ? '#b91c1c' : 'var(--text-muted)',
            }}>
              {profile.aadhaarStatus === 'VERIFIED' ? '✓ VERIFIED' : profile.aadhaarStatus === 'PENDING' ? '⏳ PENDING REVIEW' : profile.aadhaarStatus === 'REJECTED' ? '✕ REJECTED' : 'NOT SUBMITTED'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Workers with verified Aadhaar badges receive up to <strong>3x more direct job calls</strong> from contractors.
          </p>
          <AadhaarUploadForm
            workerId={profile.id}
            userId={user?.id || ''}
            aadhaarNumber={profile.aadhaarNumber}
            aadhaarStatus={profile.aadhaarStatus}
            onSuccess={() => {
              loadProfile();
              toast('Aadhaar submitted for verification!', 'success');
            }}
          />
        </Card>

        {/* Account Password Card */}
        <WorkerProfilePasswordCard />
      </div>
    </DashboardLayout>
  );
}

function AadhaarUploadForm({ workerId, userId, aadhaarNumber, aadhaarStatus, onSuccess }: {
  workerId: string | null;
  userId: string;
  aadhaarNumber: string;
  aadhaarStatus: string;
  onSuccess: () => void;
}) {
  const [aadhaarNum, setAadhaarNum] = useState(aadhaarNumber || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadhaarNum || aadhaarNum.replace(/\s/g, '').length < 12) {
      alert('Please enter a valid 12-digit Aadhaar Number');
      return;
    }
    setSubmitting(true);
    try {
      if (workerId) {
        await supabase.from('worker_profiles').update({
          aadhaar_number: aadhaarNum.replace(/\s/g, ''),
          aadhaar_status: 'PENDING',
        }).eq('id', workerId);
      } else {
        await supabase.from('worker_profiles').insert([{
          user_id: userId,
          full_name: 'Worker',
          aadhaar_number: aadhaarNum.replace(/\s/g, ''),
          aadhaar_status: 'PENDING',
        }]);
      }
      onSuccess();
    } catch (err: any) {
      alert('Failed to submit Aadhaar: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (aadhaarStatus === 'VERIFIED') {
    return <div style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#dcfce7', color: '#15803d', fontSize: 13, fontWeight: 600 }}>✓ Your Aadhaar has been verified. No further action needed.</div>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
      <FormGroup label="12-Digit Aadhaar Number" required>
        <Input
          placeholder="e.g. 1234 5678 9012"
          maxLength={14}
          value={aadhaarNum}
          onChange={(e) => setAadhaarNum(e.target.value)}
          disabled={aadhaarStatus === 'VERIFIED'}
        />
      </FormGroup>
      {aadhaarStatus !== 'VERIFIED' && (
        <PrimaryButton type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : '📤 Submit Aadhaar Number for Verification'}
        </PrimaryButton>
      )}
    </form>
  );
}

function WorkerProfilePasswordCard() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) { setMsg({ type: 'error', text: 'Password minimum 6 characters ka hona chahiye.' }); return; }
    if (password !== confirmPassword) { setMsg({ type: 'error', text: 'Passwords match nahi kar rahe hain.' }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ type: 'success', text: '🎉 Password successfully set! Ab aap Email + Password se bhi login kar sakte hain.' });
      setPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Password update nahi ho paya.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        🔑 Account Password (पासवर्ड बनाएं / बदलें)
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Agar aapne Google se sign up kiya hai ya password badalna chahte hain, toh yahan naya password set karein.
      </p>
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>
          {msg.text}
        </div>
      )}
      <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 14 }}>
        <div className="grid-2" style={{ gap: 16 }}>
          <FormGroup label="New Password (नया पासवर्ड)" required>
            <Input type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormGroup>
          <FormGroup label="Confirm Password" required>
            <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </FormGroup>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryButton type="submit" disabled={loading}>{loading ? 'Saving...' : '🔒 Save Password'}</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
