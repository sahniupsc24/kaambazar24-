import { useState, useEffect, FormEvent } from 'react';
import { api } from '../api/client';
import { PrimaryButton, SecondaryButton, ErrorState } from './common/Primitives';

interface EditJobModalProps {
  job: any;
  isAdmin?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditJobModal({ job, isAdmin = false, onClose, onSaved }: EditJobModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: job.title || '',
    description: job.description || '',
    requirements: job.requirements || '',
    categoryId: job.categoryId || job.category?.id || '',
    locationId: job.locationId || job.location?.id || '',
    workType: job.workType || 'GIG',
    compensationType: job.compensationType || 'DAILY',
    compensationRate: job.compensationRate || '',
    status: job.status || 'OPEN',
    isFeatured: !!job.isFeatured,
    aadhaarRequired: job.aadhaarBuyerPreference === 'REQUIRED',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {});
    api.get('/locations').then((r) => setLocations(r.data.data)).catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = isAdmin ? `/admin/jobs/${job.id}` : `/jobs/${job.id}`;
      await api.put(endpoint, form);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update job posting.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {isAdmin ? '✏️ Admin Edit Job Posting' : '✏️ Edit Job Posting'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Job Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Requirements</label>
            <textarea
              rows={2}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Category</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Location</label>
              <select
                required
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Work Type</label>
              <select
                value={form.workType}
                onChange={(e) => setForm({ ...form, workType: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              >
                <option value="GIG">Gig</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="FULL_TIME">Full-Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Compensation Type</label>
              <select
                value={form.compensationType}
                onChange={(e) => setForm({ ...form, compensationType: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              >
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Rate (₹)</label>
              <input
                type="number"
                required
                value={form.compensationRate}
                onChange={(e) => setForm({ ...form, compensationRate: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border, #d1d5db)' }}
              >
                <option value="OPEN">Open</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
                <option value="FILLED">Filled</option>
              </select>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}>
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                />
                <label htmlFor="isFeatured" style={{ fontSize: 13, cursor: 'pointer' }}>Feature Job Badge ⭐</label>
              </div>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 4 }}>
            <input
              type="checkbox"
              checked={form.aadhaarRequired}
              onChange={(e) => setForm({ ...form, aadhaarRequired: e.target.checked })}
            />
            Require Aadhaar verification from applicants
          </label>

          {error && <ErrorState message={error} />}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
