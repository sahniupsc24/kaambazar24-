import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { EMPLOYER_NAV_LINKS } from './EmployerDashboardPage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge, PrimaryButton, SecondaryButton } from '../../components/common/Primitives';
import { EditJobModal } from '../../components/EditJobModal';

function CreateJobForm({ employerProfileId, categories, locations, onCreated }: {
  employerProfileId: string;
  categories: any[];
  locations: any[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', categoryId: '', locationId: '',
    workType: 'GIG', compensationType: 'DAILY', compensationRate: '', openings: 1,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.categoryId || !form.locationId || !form.compensationRate) {
      setError('Please fill all required fields.'); return;
    }
    setIsSubmitting(true); setError('');
    try {
      const { error: insertErr } = await supabase.from('jobs').insert([{
        employer_profile_id: employerProfileId,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        category_id: form.categoryId,
        location_id: form.locationId,
        work_type: form.workType,
        compensation_type: form.compensationType,
        compensation_rate: parseFloat(form.compensationRate),
        openings: Number(form.openings) || 1,
        status: 'OPEN',
      }]);
      if (insertErr) throw insertErr;
      setForm({ ...form, title: '', description: '', requirements: '', compensationRate: '', openings: 1 });
      onCreated();
    } catch (err: any) {
      setError(err?.message ?? 'Could not create job.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: 14, width: '100%', boxSizing: 'border-box' };

  return (
    <Card>
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>📝 Post a New Job</h3>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Job title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <textarea placeholder="Job description *" required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
        <textarea placeholder="Requirements (optional)" rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle}>
            <option value="">Category *</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select required value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} style={inputStyle}>
            <option value="">Location *</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}, {l.city}</option>)}
          </select>
          <select value={form.workType} onChange={(e) => setForm({ ...form, workType: e.target.value })} style={inputStyle}>
            <option value="GIG">Gig</option>
            <option value="PART_TIME">Part-time</option>
            <option value="FULL_TIME">Full-time</option>
            <option value="CONTRACT">Contract</option>
          </select>
          <select value={form.compensationType} onChange={(e) => setForm({ ...form, compensationType: e.target.value })} style={inputStyle}>
            <option value="HOURLY">Hourly</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          <input type="number" placeholder="Rate ₹ *" required value={form.compensationRate} onChange={(e) => setForm({ ...form, compensationRate: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="Openings" min={1} value={form.openings} onChange={(e) => setForm({ ...form, openings: parseInt(e.target.value) || 1 })} style={inputStyle} />
        </div>
        {error && <div style={{ color: '#b91c1c', fontSize: 13, padding: '8px 12px', background: '#fee2e2', borderRadius: 8 }}>{error}</div>}
        <PrimaryButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : '🚀 Post Job'}</PrimaryButton>
      </form>
    </Card>
  );
}

export function EmployerJobsPage() {
  const { user } = useAuth();
  const [employerProfileId, setEmployerProfileId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<any>(null);

  async function loadJobs(epId: string) {
    setIsLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('jobs')
        .select('id, title, description, status, compensation_rate, compensation_type, work_type, openings, created_at, categories(name), locations(name, city)')
        .eq('employer_profile_id', epId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setJobs((data || []).map((j: any) => ({
        id: j.id, title: j.title, description: j.description,
        status: j.status, compensationRate: j.compensation_rate,
        compensationType: j.compensation_type, workType: j.work_type,
        openings: j.openings, createdAt: j.created_at,
        category: { name: j.categories?.name },
        location: { name: j.locations ? `${j.locations.name}, ${j.locations.city}` : '' },
      })));
    } catch (e: any) {
      setError('Could not load your jobs: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    async function init() {
      // Load employer profile
      const { data: ep } = await supabase.from('employer_profiles').select('id').eq('user_id', user!.id).single();
      if (ep?.id) {
        setEmployerProfileId(ep.id);
        loadJobs(ep.id);
      } else {
        setIsLoading(false);
      }
      // Load categories & locations
      supabase.from('categories').select('id, name').eq('is_active', true).then(({ data }) => setCategories(data || []));
      supabase.from('locations').select('id, name, city, state').eq('is_active', true).then(({ data }) => setLocations(data || []));
    }
    init();
  }, [user?.id]);

  async function loadApplications(jobId: string) {
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, cover_note, worker_profiles(full_name)')
      .eq('job_id', jobId);
    setApplicationsByJob((prev) => ({
      ...prev,
      [jobId]: (data || []).map((a: any) => ({
        id: a.id, status: a.status, createdAt: a.created_at,
        workerProfile: { fullName: a.worker_profiles?.full_name || 'Applicant' },
      })),
    }));
  }

  async function updateApplicationStatus(jobId: string, appId: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', appId);
    loadApplications(jobId);
  }

  async function closeJob(jobId: string) {
    await supabase.from('jobs').update({ status: 'CANCELLED' }).eq('id', jobId);
    if (employerProfileId) loadJobs(employerProfileId);
  }

  return (
    <DashboardLayout links={EMPLOYER_NAV_LINKS} breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'My Jobs' }]}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>My Jobs</h1>

      {employerProfileId && (
        <div style={{ marginBottom: 24 }}>
          <CreateJobForm
            employerProfileId={employerProfileId}
            categories={categories}
            locations={locations}
            onCreated={() => loadJobs(employerProfileId)}
          />
        </div>
      )}

      {!employerProfileId && !isLoading && (
        <div style={{ padding: '20px', background: '#fef3c7', borderRadius: 10, marginBottom: 20, fontSize: 14, color: '#92400e' }}>
          ⚠️ Please complete your <a href="/employer/profile" style={{ color: '#b45309', fontWeight: 700 }}>Business Profile</a> first before posting jobs.
        </div>
      )}

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && jobs.length === 0 && <EmptyState label="You haven't posted any jobs yet." />}

      <div style={{ display: 'grid', gap: 12 }}>
        {jobs.map((job) => (
          <Card key={job.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {job.title}
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginLeft: 8, background: '#f3f4f6', padding: '2px 8px', borderRadius: 12 }}>
                    {job.openings} openings
                  </span>
                </h3>
                <p style={{ color: '#6b7280', margin: '4px 0', fontSize: 13 }}>
                  {job.category?.name} · {job.location?.name} · ₹{job.compensationRate}/{job.compensationType?.toLowerCase()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={job.status} />
                <SecondaryButton onClick={() => setEditingJob(job)}>✏️ Edit</SecondaryButton>
                {job.status === 'OPEN' && (
                  <SecondaryButton onClick={() => closeJob(job.id)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>Close</SecondaryButton>
                )}
              </div>
            </div>

            <button
              onClick={() => loadApplications(job.id)}
              style={{ marginTop: 10, background: 'none', border: 'none', color: '#0f766e', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
            >
              📋 View applications
            </button>

            {applicationsByJob[job.id] && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {applicationsByJob[job.id].length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>No applications yet.</p>
                )}
                {applicationsByJob[job.id].map((a: any) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{a.workerProfile?.fullName}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge status={a.status} />
                      {a.status === 'PENDING' && (
                        <>
                          <PrimaryButton onClick={() => updateApplicationStatus(job.id, a.id, 'ACCEPTED')} style={{ fontSize: 12, padding: '4px 10px' }}>Accept</PrimaryButton>
                          <SecondaryButton onClick={() => updateApplicationStatus(job.id, a.id, 'REJECTED')} style={{ fontSize: 12, padding: '4px 10px' }}>Reject</SecondaryButton>
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
          onSaved={() => { if (employerProfileId) loadJobs(employerProfileId); }}
        />
      )}
    </DashboardLayout>
  );
}
