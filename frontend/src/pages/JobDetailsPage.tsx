import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Job, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState, ErrorState, StatusBadge, PrimaryButton, SecondaryButton, Card, Modal } from '../components/common/Primitives';
import { SEOHead } from '../components/SEOHead';
import { JobPostingSchema, BreadcrumbSchema } from '../components/SchemaJsonLd';

function ContactUnlockBlock({ targetUserId }: { targetUserId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'unlocked' | 'needsPlan'>('idle');
  const [mobile, setMobile] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [limitInfo, setLimitInfo] = useState<{ limit: number, enforced: boolean } | null>(null);

  useEffect(() => {
    api.get('/settings/limits').then((res) => {
      setLimitInfo({ limit: res.data.data.workerFreeContactLimit, enforced: res.data.data.contactLimitEnforcement });
    }).catch(() => {});
  }, []);

  async function tryUnlock() {
    setState('loading');
    setError('');
    try {
      const res = await api.post('/contacts/unlock', { targetUserId });
      if (res.data.data.unlocked) {
        setMobile(res.data.data.mobile);
        setState('unlocked');
      } else {
        const plansRes = await api.get('/plans?audience=WORKER');
        setPlans(plansRes.data.data);
        setState('needsPlan');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not unlock contact.');
      setState('idle');
    }
  }

  async function buyAndUnlock(planId: string) {
    try {
      await api.post(`/plans/${planId}/purchase`);
      await tryUnlock();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Purchase failed.');
    }
  }

  if (state === 'unlocked') {
    return (
      <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: 12, borderRadius: 10, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: '#0f766e', fontWeight: 600, display: 'block' }}>Verified Phone Number</span>
        <a href={`tel:${mobile}`} style={{ fontSize: 18, color: '#0d9488', fontWeight: 800, textDecoration: 'none' }}>
          📞 {mobile}
        </a>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {state !== 'needsPlan' && (
        <>
          {limitInfo?.enforced && (
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px 0', textAlign: 'center' }}>
              You get {limitInfo.limit} free contact unlocks. Unlocking consumes 1 credit if you have run out of free unlocks.
            </p>
          )}
          <SecondaryButton onClick={tryUnlock} disabled={state === 'loading'} style={{ width: '100%' }}>
            {state === 'loading' ? 'Checking unlock credits...' : '🔓 Unlock Contact Mobile Number'}
          </SecondaryButton>
        </>
      )}
      {state === 'needsPlan' && (
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: 14, borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: '#c2410c', fontWeight: 600, margin: '0 0 10px 0' }}>
            No free unlocks remaining. Choose a contact pack:
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => buyAndUnlock(p.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #ea580c',
                  background: '#ffffff',
                  color: '#ea580c',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{p.name}</span>
                <span>₹{p.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <ErrorState message={error} />}
    </div>
  );
}

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyState, setApplyState] = useState<'idle' | 'applying' | 'applied' | 'error' | 'needsAadhaar'>('idle');
  const [applyError, setApplyError] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data.data))
      .catch(() => setError('This job could not be found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleApply(aadhaarNumber?: string) {
    if (!id) return;
    setApplyState('applying');
    setApplyError('');
    try {
      await api.post('/applications', { jobId: id, coverNote, aadhaarNumber });
      setApplyState('applied');
      setShowApplyModal(false);
    } catch (err: any) {
      if (err?.response?.data?.details?.requiresAadhaar) {
        setApplyState('needsAadhaar');
      } else {
        setApplyState('error');
        setApplyError(err?.response?.data?.message ?? 'Could not submit application.');
      }
    }
  }

  if (isLoading) return <LoadingState label="Loading job details..." />;
  if (error || !job) return <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}><ErrorState message={error ?? 'Job not found.'} /></div>;

  const shareText = `Check out this job on Kaam Bazar: ${job.title} - Pay: ₹${job.compensationRate}/${job.compensationType}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <SEOHead
        title={`${job.title} — Job in ${job.location?.name || 'India'} | Kaam Bazar`}
        description={`${job.title} at ${job.employerProfile?.businessName || 'Verified Employer'}. Pay: ₹${job.compensationRate}/${job.compensationType.toLowerCase()}. Apply now on Kaam Bazar.`}
        ogType="job"
      />
      <JobPostingSchema
        job={{
          id: job.id,
          title: job.title,
          description: job.description,
          createdAt: job.createdAt,
          workType: job.workType,
          compensationType: job.compensationType,
          compensationRate: job.compensationRate,
          locationName: job.location?.name,
          businessName: job.employerProfile?.businessName,
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: window.location.origin },
          { name: 'Jobs', url: `${window.location.origin}/jobs` },
          { name: job.title, url: window.location.href },
        ]}
      />
      {/* Top Header Card */}
      <Card style={{ marginBottom: 24, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: '#ccfbf1', color: '#0f766e' }}>
                {job.category?.name || 'General'}
              </span>
              <StatusBadge status={job.status} />
              {job.aadhaarRequired && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: '#fef3c7', color: '#b45309' }}>
                  🪪 Aadhaar Required
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>{job.title}</h1>
            
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>🏢 <strong>{job.employerProfile?.businessName || 'Verified Employer'}</strong></span>
              <span>📍 {job.location?.name || 'Pan India'}</span>
              <span>💼 {job.workType}</span>
              <span>📅 Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </p>
          </div>

          <div style={{ textAlign: 'right', background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Pay Compensation</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#0d9488' }}>
              ₹{job.compensationRate} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>/ {job.compensationType.toLowerCase()}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Main 2-Column Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column: Job Details */}
        <div style={{ display: 'grid', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Job Description</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155', fontSize: 15 }}>
              {job.description}
            </div>
          </Card>

          {job.requirements && (
            <Card>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Requirements & Skills</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#334155', fontSize: 15 }}>
                {job.requirements}
              </div>
            </Card>
          )}

          {/* Employer Box */}
          <Card style={{ background: '#f8fafc' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>About the Employer</h4>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 12px 0' }}>
              {job.employerProfile?.businessName || 'Kaam Bazar Employer'}
            </p>
            {job.employerProfile?.isVerified && (
              <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600, background: '#dcfce7', padding: '3px 8px', borderRadius: 6 }}>
                ✓ Verified Business
              </span>
            )}
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div style={{ display: 'grid', gap: 20, alignContent: 'start' }}>
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Apply for this Position</h3>

            {!user && (
              <div style={{ textAlign: 'center', padding: 12 }}>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>You must be logged in as a worker to apply.</p>
                <Link to="/login">
                  <PrimaryButton style={{ width: '100%' }}>Log In to Apply</PrimaryButton>
                </Link>
              </div>
            )}

            {user?.role === UserRole.WORKER && (
              <div>
                {applyState === 'applied' ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                    <span style={{ fontSize: 24 }}>🎉</span>
                    <h4 style={{ color: '#15803d', margin: '4px 0 2px 0' }}>Application Submitted!</h4>
                    <p style={{ fontSize: 13, color: '#166534', margin: 0 }}>The employer will review your profile and contact you.</p>
                    <Link to="/worker/applications">
                      <SecondaryButton style={{ marginTop: 12, width: '100%' }}>Track My Applications</SecondaryButton>
                    </Link>
                  </div>
                ) : (
                  <div>
                    <PrimaryButton onClick={() => setShowApplyModal(true)} style={{ width: '100%', fontSize: 16, padding: 14 }}>
                      ⚡ Apply Now
                    </PrimaryButton>
                  </div>
                )}
              </div>
            )}

            {user && user.role !== UserRole.WORKER && (
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Logged in as <strong>{user.role}</strong>. Only Worker accounts can submit applications.
              </p>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 16, paddingTop: 16 }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                📲 Share on WhatsApp
              </a>
            </div>
          </Card>

          {/* Contact Unlock Card */}
          {user?.role === UserRole.WORKER && (job as any).employerProfile?.userId && (
            <Card>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Direct Employer Phone</h4>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Want to call the employer directly instead of waiting?</p>
              <ContactUnlockBlock targetUserId={(job as any).employerProfile.userId} />
            </Card>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title={`Apply: ${job.title}`}>
        <div style={{ display: 'grid', gap: 16 }}>
          {applyState === 'needsAadhaar' ? (
            <div>
              <p style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
                ⚠️ This job requires Aadhaar verification. Please enter your 12-digit Aadhaar number:
              </p>
              <input
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                maxLength={12}
                placeholder="12-digit Aadhaar Number"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, marginTop: 6 }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Message / Cover Note to Employer (Optional)
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                rows={4}
                placeholder="Explain why you are right for this job, your experience, or when you can start..."
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          )}

          {applyError && <ErrorState message={applyError} />}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <SecondaryButton onClick={() => setShowApplyModal(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              onClick={() => handleApply(applyState === 'needsAadhaar' ? aadhaarInput : undefined)}
              disabled={applyState === 'applying'}
            >
              {applyState === 'applying' ? 'Submitting Application...' : 'Submit Application'}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
