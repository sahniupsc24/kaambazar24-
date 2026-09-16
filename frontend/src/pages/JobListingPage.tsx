import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Job, Category, Location } from '../types';
import { LoadingState, EmptyState, SecondaryButton } from '../components/common/Primitives';
import { JobCard } from '../components/JobCard';
import { SEOHead } from '../components/SEOHead';
import { BreadcrumbSchema } from '../components/SchemaJsonLd';

const SAMPLE_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Experienced Plumber Needed for Commercial Site',
    description: 'Looking for a certified plumber with 3+ years experience in pipe fitting, leak repair, and drainage layout for a commercial building project in Connaught Place, New Delhi.',
    requirements: 'Must have own basic tools, PVC/GI pipe fitting knowledge, and safety boots.',
    workType: 'FULL_TIME',
    compensationType: 'DAILY',
    compensationRate: '950',
    status: 'OPEN',
    category: { id: 'cat-plumbing', name: 'Plumbing', slug: 'plumbing' },
    location: { id: 'loc-delhi', name: 'New Delhi (Delhi)', level: 'city', slug: 'delhi' },
    employerProfile: { id: 'emp-1', businessName: 'BuildCon Infrastructure', isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-2',
    title: 'Electrician Required for Residential Wiring',
    description: 'Urgent requirement for an electrician to complete 3BHK flat internal wiring, DB box installation, and LED panel fitting in Sector 62, Noida.',
    requirements: 'Single & three-phase wiring expertise, circuit testing knowledge.',
    workType: 'CONTRACT',
    compensationType: 'FIXED',
    compensationRate: '4500',
    status: 'OPEN',
    category: { id: 'cat-electrical', name: 'Electrical Work', slug: 'electrical-work' },
    location: { id: 'loc-noida', name: 'Noida (UP)', level: 'city', slug: 'noida' },
    employerProfile: { id: 'emp-2', businessName: 'Apex Interior Solutions', isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-3',
    title: 'Daily Construction Masons & Helpers (10 Openings)',
    description: 'Requirement for 5 skilled Masons (Rajmistri) and 5 Labour Helpers for brickwork and plastering work at residential site in Gurgaon Sector 56.',
    requirements: 'Punctuality, daily wage payment guaranteed at 6:00 PM.',
    workType: 'CONTRACT',
    compensationType: 'DAILY',
    compensationRate: '850',
    status: 'OPEN',
    category: { id: 'cat-construction', name: 'Construction', slug: 'construction-building' },
    location: { id: 'loc-gurgaon', name: 'Gurgaon (Haryana)', level: 'city', slug: 'gurgaon' },
    employerProfile: { id: 'emp-3', businessName: 'Shree Ram Builders', isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-4',
    title: 'Full House Wall Painter & Texture Specialist',
    description: 'Needed 2 painters for 2BHK Asian Paints Royale finish painting and living room texture wall work in Whitefield, Bangalore.',
    requirements: 'Roller painting, wall putty smoothing, texture spray.',
    workType: 'CONTRACT',
    compensationType: 'DAILY',
    compensationRate: '900',
    status: 'OPEN',
    category: { id: 'cat-painting', name: 'Painting', slug: 'painting-decorating' },
    location: { id: 'loc-blr', name: 'Bangalore (Karnataka)', level: 'city', slug: 'bangalore' },
    employerProfile: { id: 'emp-4', businessName: 'Colors & Homes', isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-5',
    title: 'Personal / Office Driver (Full Time)',
    description: 'Looking for a polite, non-drinker driver with valid LMV driving license to drive Swift Dzire and Creta for corporate office executive.',
    requirements: '5+ years driving experience, clean driving record, DL verification required.',
    workType: 'FULL_TIME',
    compensationType: 'MONTHLY',
    compensationRate: '18500',
    status: 'OPEN',
    category: { id: 'cat-driving', name: 'Driving', slug: 'driving' },
    location: { id: 'loc-mumbai', name: 'Mumbai (Maharashtra)', level: 'city', slug: 'mumbai' },
    employerProfile: { id: 'emp-5', businessName: 'Reliance Transport Logistics', isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'job-6',
    title: 'Welder for Gate & Grill Fabrication',
    description: 'ARC welding specialist needed for MS pipe structure, window grills, and sliding gate fabrication at workshop in Okhla Phase 3, Delhi.',
    requirements: 'Safety mask, ARC & MIG welding proficiency.',
    workType: 'FULL_TIME',
    compensationType: 'MONTHLY',
    compensationRate: '21000',
    status: 'OPEN',
    category: { id: 'cat-welding', name: 'Welding', slug: 'welding-fabrication' },
    location: { id: 'loc-delhi', name: 'New Delhi (Delhi)', level: 'city', slug: 'delhi' },
    employerProfile: { id: 'emp-6', businessName: 'National Steel Fabricators', isVerified: true },
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_CATEGORIES: Category[] = [
  { id: 'cat-construction', name: 'Construction (निर्माण)', slug: 'construction-building' },
  { id: 'cat-plumbing', name: 'Plumbing (प्लंबिंग)', slug: 'plumbing' },
  { id: 'cat-electrical', name: 'Electrical Work (इलेक्ट्रिकल)', slug: 'electrical-work' },
  { id: 'cat-painting', name: 'Painting (पेंटिंग)', slug: 'painting-decorating' },
  { id: 'cat-carpentry', name: 'Carpentry (बढ़ईगीरी)', slug: 'carpentry-woodwork' },
  { id: 'cat-welding', name: 'Welding (वेल्डिंग)', slug: 'welding-fabrication' },
  { id: 'cat-driving', name: 'Driving (ड्राइवर)', slug: 'driving' },
  { id: 'cat-domestic', name: 'Domestic Help (घरेलू सहायक)', slug: 'domestic-help-maid' },
];

const SAMPLE_LOCATIONS: Location[] = [
  { id: 'loc-delhi', name: 'Delhi NCR', level: 'city', slug: 'delhi' },
  { id: 'loc-noida', name: 'Noida', level: 'city', slug: 'noida' },
  { id: 'loc-gurgaon', name: 'Gurgaon', level: 'city', slug: 'gurgaon' },
  { id: 'loc-mumbai', name: 'Mumbai', level: 'city', slug: 'mumbai' },
  { id: 'loc-blr', name: 'Bangalore', level: 'city', slug: 'bangalore' },
  { id: 'loc-hyd', name: 'Hyderabad', level: 'city', slug: 'hyderabad' },
];

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

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
        if (catData && catData.length > 0) {
          setCategories(catData.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
        } else {
          setCategories(SAMPLE_CATEGORIES);
        }
      } catch {
        setCategories(SAMPLE_CATEGORIES);
      }

      try {
        const { data: locData } = await supabase.from('locations').select('*').eq('is_active', true);
        if (locData && locData.length > 0) {
          setLocations(locData.map(l => ({ id: l.id, name: l.name, level: 'city', slug: l.city?.toLowerCase() })));
        } else {
          setLocations(SAMPLE_LOCATIONS);
        }
      } catch {
        setLocations(SAMPLE_LOCATIONS);
      }
    }
    fetchMetadata();
  }, []);

  useEffect(() => {
    setIsLoading(true);

    async function loadJobs() {
      let resultJobs: Job[] = [];

      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            category:categories(id, name, slug),
            location:locations(id, name, city, state),
            employer:employer_profiles(id, company_name, contact_person)
          `)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          resultJobs = data.map((j: any) => ({
            id: j.id,
            title: j.title,
            description: j.description,
            requirements: j.requirements,
            workType: j.work_type,
            compensationType: j.compensation_type,
            compensationRate: String(j.compensation_rate),
            status: j.status,
            category: j.category ? { id: j.category.id, name: j.category.name, slug: j.category.slug } : { id: 'cat-gen', name: 'General', slug: 'general' },
            location: j.location ? { id: j.location.id, name: j.location.name, level: 'city', slug: j.location.city } : { id: 'loc-gen', name: 'India', level: 'country' },
            employerProfile: j.employer ? { id: j.employer.id, businessName: j.employer.company_name, isVerified: true } : undefined,
            createdAt: j.created_at,
          }));
        } else {
          resultJobs = SAMPLE_JOBS;
        }
      } catch {
        resultJobs = SAMPLE_JOBS;
      }

      // Filter logic
      let filtered = [...resultJobs];
      if (categoryId) {
        filtered = filtered.filter(j => 
          j.category?.id === categoryId || 
          j.category?.slug === categoryId ||
          j.category?.name.toLowerCase().includes(categoryId.toLowerCase())
        );
      }
      if (locationId) {
        filtered = filtered.filter(j => 
          j.location?.id === locationId || 
          j.location?.slug?.toLowerCase() === locationId.toLowerCase() ||
          j.location?.name.toLowerCase().includes(locationId.toLowerCase())
        );
      }
      if (q) {
        const queryLower = q.toLowerCase();
        filtered = filtered.filter(j => 
          j.title.toLowerCase().includes(queryLower) || 
          j.description.toLowerCase().includes(queryLower) ||
          j.category?.name.toLowerCase().includes(queryLower)
        );
      }
      if (workType) {
        filtered = filtered.filter(j => j.workType === workType);
      }

      setJobs(filtered);
      setIsLoading(false);
    }

    loadJobs();
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
              <option key={c.id} value={c.slug || c.id}>
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
      {!isLoading && jobs.length === 0 && (
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
