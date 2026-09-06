import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Job, Category, Location } from '../types';
import { LoadingState, EmptyState, ErrorState, SecondaryButton } from '../components/common/Primitives';
import { JobCard } from '../components/JobCard';
import { SEOHead } from '../components/SEOHead';
import { BreadcrumbSchema } from '../components/SchemaJsonLd';

export function JobListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const qParam = searchParams.get('search') || searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const locationParam = searchParams.get('location') || '';
  const workTypeParam = searchParams.get('workType') || '';

  const [q, setQ] = useState(qParam);
  const [categoryId, setCategoryId] = useState(categoryParam);
  const [locationId, setLocationId] = useState(locationParam);
  const [workType, setWorkType] = useState(workTypeParam);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
    api.get('/locations').then((res) => setLocations(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params: Record<string, string> = {};
    if (categoryId) params.categoryId = categoryId;
    if (locationId) params.locationId = locationId;
    if (q) params.q = q;
    if (workType) params.workType = workType;

    api
      .get('/jobs', { params })
      .then((res) => {
        const items = res.data.data?.items || res.data.data || [];
        setJobs(items);
      })
      .catch(() => setError('Could not load jobs. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [categoryId, locationId, q, workType]);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p: Record<string, string> = {};
    if (q) p.search = q;
    if (categoryId) p.category = categoryId;
    if (locationId) p.location = locationId;
    if (workType) p.workType = workType;
    setSearchParams(p);
  }

  function clearFilters() {
    setQ('');
    setCategoryId('');
    setLocationId('');
    setWorkType('');
    setSearchParams({});
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <SEOHead
        title="Find Blue-Collar Jobs & Daily Wage Work in India | Kaam Bazar"
        description="Search active job openings for Plumbers, Electricians, Drivers, Construction Workers, Painters, Masons, and domestic help across India."
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: window.location.origin },
          { name: 'Browse Jobs', url: `${window.location.origin}/jobs` },
        ]}
      />
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
          Find Jobs (नौकरियां खोजें)
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Browse verified blue-collar opportunities across India
        </p>
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleFilterSubmit}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            🔍 Search Keywords
          </label>
          <input
            placeholder="Plumber, Painter, Delhi..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            📂 Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id || c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            📍 Location
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
          >
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id || l.slug}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
            ⏱️ Work Type
          </label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' }}
          >
            <option value="">All Work Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract / Daily Wager</option>
            <option value="ONE_TIME">One Time Task</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <SecondaryButton type="button" onClick={clearFilters} style={{ flex: 1, padding: '10px 12px' }}>
            Reset
          </SecondaryButton>
        </div>
      </form>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          {isLoading ? 'Searching jobs...' : `${jobs.length} Jobs Found`}
        </h3>
      </div>

      {isLoading && <LoadingState label="Searching jobs in Kaam Bazar..." />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && jobs.length === 0 && (
        <EmptyState
          label="No jobs found matching your filter criteria"
          sublabel="Try clearing your filters or searching for different keywords"
          action={<SecondaryButton onClick={clearFilters}>Reset Filters</SecondaryButton>}
        />
      )}

      {/* Job Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
