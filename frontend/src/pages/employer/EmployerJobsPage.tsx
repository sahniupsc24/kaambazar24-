import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { api } from '../../api/client';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';
import { EditJobModal } from '../../components/EditJobModal';

function CreateJobForm({ categories, locations, onCreated, jobCount, quota, quotaEnforced }: { categories: any[]; locations: any[]; onCreated: () => void; jobCount: number; quota: number; quotaEnforced: boolean }) {
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', categoryId: '', locationId: '',
    workType: 'GIG', compensationType: 'DAILY', compensationRate: '',
    aadhaarRequired: false, wantsFeatured: false, openings: 1,
  });
  const [featuredPrice, setFeaturedPrice] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/settings/featured-price').then((res) => setFeaturedPrice(res.data.data.price)).catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/jobs', { ...form, openings: Number(form.openings) });
      setForm({ ...form, title: '', description: '', requirements: '', compensationRate: '', aadhaarRequired: false, wantsFeatured: false, openings: 1 });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create job.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <h3>Post a New Job</h3>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <input placeholder="Job title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <textarea placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <textarea placeholder="Requirements (optional)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
            <option value="">Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
            <option value="">Location</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
            <option value="GIG">Gig</option><option value="PART_TIME">Part-time</option>
            <option value="FULL_TIME">Full-time</option><option value="CONTRACT">Contract</option>
          </select>
          <select value={form.compensationType} onChange={(e) => setForm({ ...form, compensationType: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
            <option value="HOURLY">Hourly</option><option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
          </select>
          <input type="number" placeholder="Rate (₹)" required value={form.compensationRate} onChange={(e) => setForm({ ...form, compensationRate: e.target.value })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 120 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#6b7280' }}>Openings:</label>
            <input type="number" required min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) || 1 })} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 80 }} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
          <input type="checkbox" checked={form.aadhaarRequired} onChange={(e) => setForm({ ...form, aadhaarRequired: e.target.checked })} style={{ width: 'auto' }} />
          Require Aadhaar verification for this job
          <span style={{ color: '#9ca3af', fontSize: 12 }}>(Admin can override this later)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
          <input type="checkbox" checked={form.wantsFeatured} onChange={(e) => setForm({ ...form, wantsFeatured: e.target.checked })} style={{ width: 'auto' }} />
          Feature this job at the top of search results{featuredPrice ? ` (₹${featuredPrice})` : ''}
        </label>
        {error && <ErrorState message={error} />}
        {quotaEnforced && jobCount >= quota ? (
          <div style={{ padding: 12, backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: 13 }}>
            <strong>Quota Reached:</strong> You have reached your free limit of {quota} jobs. Please upgrade to Premium to post more jobs.
          </div>
        ) : (
          <PrimaryButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Post Job'}</PrimaryButton>
        )}
      </form>
    </Card>
  );
}

export function EmployerJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [limits, setLimits] = useState({ quota: 2, enforced: false });

  function loadJobs() {
    setIsLoading(true);
    api.get('/jobs/mine/list')
      .then((res) => setJobs(res.data.data))
      .catch(() => setError('Could not load your jobs.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadJobs();
    api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {});
    api.get('/locations').then((r) => setLocations(r.data.data)).catch(() => {});
    api.get('/settings/limits').then((r) => {
      setLimits({ quota: r.data.data.freeJobQuota, enforced: r.data.data.jobQuotaEnforcement });
    }).catch(() => {});
  }, []);

  async function loadApplications(jobId: string) {
    const res = await api.get(`/applications/job/${jobId}`);
    setApplicationsByJob((prev) => ({ ...prev, [jobId]: res.data.data }));
  }

  async function acceptApplication(jobId: string, appId: string) {
    await api.post(`/applications/${appId}/accept`);
    loadApplications(jobId);
  }
  async function rejectApplication(jobId: string, appId: string) {
    await api.post(`/applications/${appId}/reject`);
    loadApplications(jobId);
  }
  async function closeJob(jobId: string) {
    await api.post(`/jobs/${jobId}/close`);
    loadJobs();
  }

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS}>
      <h1>My Jobs</h1>
      
      {limits.enforced && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#e0f2fe', color: '#0369a1', borderRadius: 8, fontSize: 13 }}>
          <strong>Plan Usage:</strong> You have used {jobs.length} of {limits.quota} free job postings.
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <CreateJobForm categories={categories} locations={locations} onCreated={loadJobs} jobCount={jobs.length} quota={limits.quota} quotaEnforced={limits.enforced} />
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && jobs.length === 0 && <EmptyState label="You haven't posted any jobs yet." />}

      <div style={{ display: 'grid', gap: 12 }}>
        {jobs.map((job) => (
          <Card key={job.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{job.title} <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginLeft: 8, background: '#f3f4f6', padding: '2px 6px', borderRadius: 12 }}>{job.openings} openings</span></h3>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>{job.category?.name} · {job.location?.name}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={job.status} />
                <SecondaryButton onClick={() => setEditingJob(job)}>✏️ Edit</SecondaryButton>
                {job.status === 'OPEN' && <SecondaryButton onClick={() => closeJob(job.id)}>Close</SecondaryButton>}
              </div>
            </div>
            <button
              onClick={() => loadApplications(job.id)}
              style={{ marginTop: 8, background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
            >
              View applications
            </button>
            {applicationsByJob[job.id] && (
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                {applicationsByJob[job.id].length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No applications yet.</p>}
                {applicationsByJob[job.id].map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                    <span>{a.workerProfile?.fullName ?? 'Applicant'}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge status={a.status} />
                      {(a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW') && (
                        <>
                          <PrimaryButton onClick={() => acceptApplication(job.id, a.id)}>Accept</PrimaryButton>
                          <SecondaryButton onClick={() => rejectApplication(job.id, a.id)}>Reject</SecondaryButton>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {editingJob && (
        <EditJobModal
          job={editingJob}
          isAdmin={false}
          onClose={() => setEditingJob(null)}
          onSaved={loadJobs}
        />
      )}
    </DashboardLayout>
  );
}
