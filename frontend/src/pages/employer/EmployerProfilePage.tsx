import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { api } from '../../api/client';
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

export function EmployerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    api.get('/profiles/employer/me')
      .then((res) => setProfile(res.data.data))
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveState('saving');
    try {
      const res = await api.put('/profiles/employer/me', {
        businessName: profile.businessName,
        email: profile.email || profile.user?.email,
        avatarUrl: profile.avatarUrl !== undefined ? profile.avatarUrl : profile.user?.avatarUrl,
        businessDescription: profile.businessDescription,
        contactPersonName: profile.contactPersonName,
        contactPhone: profile.contactPhone,
        address: profile.address,
        gstin: profile.gstin,
      });
      setProfile(res.data.data);
      await refreshUser();
      setSaveState('saved');
      toast('Employer business profile updated successfully!', 'success');
    } catch {
      setSaveState('error');
      toast('Failed to save business profile changes.', 'error');
    }
  }

  if (isLoading) return <DashboardLayout links={EMPLOYER_NAV_LINKS}><LoadingState /></DashboardLayout>;
  if (error) return <DashboardLayout links={EMPLOYER_NAV_LINKS}><ErrorState message={error} /></DashboardLayout>;

  const currentAvatar = profile.avatarUrl || profile.user?.avatarUrl;

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS} breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Business Profile' }]}>
      <SectionHeader title="Employer Business Profile" subtitle="Manage your company information, contact person, and GST details." />

      <div style={{ maxWidth: 680 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profile.businessName || 'Employer'}
                  style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: 50, height: 50, borderRadius: 12, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>
                  {(profile.businessName?.[0] ?? '🏢').toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{profile.businessName || 'Business Profile'}</h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.user?.email ?? profile.user?.phone ?? 'Employer Account'}</div>
              </div>
            </div>
            {profile.isVerified && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>✓ Verified Employer</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {/* Profile Avatar Photo Selector */}
            <FormGroup label="Company Logo / Avatar Photo">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Logo"
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--border)' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 }}>
                    {(profile.businessName?.[0] ?? '🏢').toUpperCase()}
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
              <FormGroup label="Business / Organization Name" required>
                <Input
                  value={profile.businessName ?? ''}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  placeholder="e.g. Om Logistics Pvt Ltd"
                />
              </FormGroup>

              <FormGroup label="Email ID (ईमेल आई डी)">
                <Input
                  type="email"
                  value={profile.email ?? profile.user?.email ?? ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="e.g. employer@example.com"
                />
              </FormGroup>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <FormGroup label="Contact Person Name">
                <Input
                  placeholder="e.g. Vikram Sharma"
                  value={profile.contactPersonName ?? ''}
                  onChange={(e) => setProfile({ ...profile, contactPersonName: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Contact Phone Number">
                <Input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={profile.contactPhone ?? ''}
                  onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
                />
              </FormGroup>
            </div>

            <div className="grid-2" style={{ gap: 16 }}>
              <FormGroup label="Office / Facility Address">
                <Input
                  placeholder="e.g. Plot 42, Sector 18, Gurugram"
                  value={profile.address ?? ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="GSTIN Number (Optional)">
                <Input
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  value={profile.gstin ?? ''}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                />
              </FormGroup>
            </div>

            <FormGroup label="Business Description">
              <textarea
                rows={3}
                value={profile.businessDescription ?? ''}
                onChange={(e) => setProfile({ ...profile, businessDescription: e.target.value })}
                placeholder="Provide details about your business and hiring needs..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14 }}
              />
            </FormGroup>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <PrimaryButton type="submit" disabled={saveState === 'saving'}>
                {saveState === 'saving' ? 'Saving Profile...' : 'Save Profile Settings'}
              </PrimaryButton>
            </div>
          </form>
        </Card>

        {/* Account Password Card for Google/Email users */}
        <EmployerProfilePasswordCard />
      </div>
    </DashboardLayout>
  );
}

function EmployerProfilePasswordCard() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Password minimum 6 characters ka hona chahiye.' });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords match nahi kar rahe hain.' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ type: 'success', text: '🎉 Password successfully set! Ab aap Email + Password se bhi login kar sakte hain.' });
      setPassword('');
      setConfirmPassword('');
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
        Agar aapne Google se sign up kiya hai ya password badalna chahte hain, toh yahan naya password set karein. Iske baad aap direct Email + Password se bhi login kar sakenge.
      </p>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14,
          backgroundColor: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#b91c1c',
        }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ display: 'grid', gap: 14 }}>
        <div className="grid-2" style={{ gap: 16 }}>
          <FormGroup label="New Password (नया पासवर्ड)" required>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Confirm Password (पासवर्ड दोबारा लिखें)" required>
            <Input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormGroup>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Saving Password...' : '🔒 Save Password'}
          </PrimaryButton>
        </div>
      </form>
    </Card>
  );
}
