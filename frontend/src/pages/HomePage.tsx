import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { PrimaryButton, SecondaryButton } from '../components/common/Primitives';
import { SEOHead } from '../components/SEOHead';
import { WebSiteSchema } from '../components/SchemaJsonLd';
import { 
  Search, HardHat, Droplets, Zap, Paintbrush, Hammer, 
  Flame, Broom, ChefHat, Car, Shield, Truck, Factory,
  User, FileText, CreditCard, Building2, Briefcase
} from 'lucide-react';

const SAMPLE_FEATURED_JOBS: Job[] = [
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
];

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            category:categories(id, name, slug),
            location:locations(id, name, city, state),
            employer:employer_profiles(id, company_name, contact_person)
          `)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          const mapped: Job[] = data.map((j: any) => ({
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
          setFeaturedJobs(mapped);
        } else {
          setFeaturedJobs(SAMPLE_FEATURED_JOBS);
        }
      } catch {
        setFeaturedJobs(SAMPLE_FEATURED_JOBS);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeatured();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  const TOP_CATEGORIES = [
    { title: 'Construction (निर्माण)', slug: 'construction-building', icon: <HardHat size={22} />, count: '1,200+ Jobs' },
    { title: 'Plumbing (प्लंबिंग)', slug: 'plumbing', icon: <Droplets size={22} />, count: '850+ Jobs' },
    { title: 'Electrical (इलेक्ट्रिकल)', slug: 'electrical-work', icon: <Zap size={22} />, count: '940+ Jobs' },
    { title: 'Painting (पेंटिंग)', slug: 'painting-decorating', icon: <Paintbrush size={22} />, count: '620+ Jobs' },
    { title: 'Carpentry (बढ़ईगीरी)', slug: 'carpentry-woodwork', icon: <Hammer size={22} />, count: '450+ Jobs' },
    { title: 'Welding (वेल्डिंग)', slug: 'welding-fabrication', icon: <Flame size={22} />, count: '380+ Jobs' },
    { title: 'Maid / Help (घरेलू सहायक)', slug: 'domestic-help-maid', icon: <Broom size={22} />, count: '1,500+ Jobs' },
    { title: 'Cook / Chef (रसोइया)', slug: 'cooking-chef', icon: <ChefHat size={22} />, count: '780+ Jobs' },
    { title: 'Driver (ड्राइवर)', slug: 'driving', icon: <Car size={22} />, count: '1,100+ Jobs' },
    { title: 'Security Guard (सिक्योरिटी)', slug: 'security-guard', icon: <Shield size={22} />, count: '690+ Jobs' },
    { title: 'Delivery (डिलीवरी)', slug: 'delivery-courier', icon: <Truck size={22} />, count: '2,100+ Jobs' },
    { title: 'Factory Worker (फैक्ट्री)', slug: 'factory-worker', icon: <Factory size={22} />, count: '1,400+ Jobs' },
  ];

  return (
    <div>
      <SEOHead
        title="Kaam Bazar (काम बाज़ार) — India's Blue-Collar Job & Labour Marketplace"
        description="Find verified blue-collar jobs near you or hire skilled workers like Plumbers, Electricians, Drivers, Masons, and Maids across India."
      />
      <WebSiteSchema />

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge">
            🇮🇳 India's #1 Blue-Collar &amp; Labour Marketplace
          </div>

          <h1 className="hero-title">
            सही काम, सही दाम —{' '}
            <span style={{ color: '#f97316' }}>कामगारों के लिए भरोसेमंद पोर्टल</span>
          </h1>

          <p className="hero-subtitle">
            Find verified blue-collar jobs near you or hire skilled workers like Plumbers,
            Electricians, Drivers, Masons, and Maids across India.
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleSearch} className="hero-search-form">
            <input
              placeholder="Search jobs e.g. Plumber, Electrician, Driver, Delhi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hero-search-input"
            />
            <PrimaryButton type="submit" className="hero-search-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={16} /> Search Jobs
            </PrimaryButton>
          </form>

          {/* Quick Tag Pills */}
          <div className="hero-tags">
            <span>Popular:</span>
            {['Plumber', 'Electrician', 'Painter', 'Driver', 'Security Guard'].map((cat) => (
              <Link
                key={cat}
                to={`/jobs?search=${encodeURIComponent(cat)}`}
                style={{
                  color: '#5eead4',
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 10px',
                  borderRadius: 999,
                }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '20px 16px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="stats-grid container"
          style={{ maxWidth: 1100, textAlign: 'center' }}
        >
          {[
            { val: '25+', label: 'Job Categories', color: 'var(--primary)' },
            { val: '60+', label: 'Indian Cities', color: 'var(--secondary)' },
            { val: '100%', label: 'Direct & Transparent', color: 'var(--primary)' },
            { val: 'Aadhaar', label: 'Verified Profiles', color: '#6366f1' },
          ].map((s) => (
            <div key={s.label}>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top Categories ── */}
      <section className="section-pad" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 className="section-title">Popular Job Categories (लोकप्रिय श्रेणियां)</h2>
        <p className="section-subtitle">Choose from over 25+ blue-collar skill categories across India</p>

        <div className="categories-grid">
          {TOP_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/jobs?category=${cat.slug}`}
              className="category-card card-hover-effect"
            >
              <div className="category-card-icon">
                {cat.icon}
              </div>
              <div className="category-card-content">
                <h4 className="category-card-title">
                  {cat.title}
                </h4>
                <span className="category-card-count">
                  {cat.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Jobs ── */}
      <section
        style={{
          background: 'var(--bg-hover)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
        className="section-pad"
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                Latest Job Listings (नवीनतम नौकरियां)
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Apply directly to active openings with verified employers
              </p>
            </div>
            <Link to="/jobs">
              <SecondaryButton>View All Jobs ({featuredJobs.length}+) →</SecondaryButton>
            </Link>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading jobs...
            </div>
          ) : featuredJobs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 40,
                background: 'var(--bg-card)',
                borderRadius: 16,
                border: '1px dashed var(--border)',
              }}
            >
              <p style={{ color: 'var(--text-muted)' }}>No jobs posted yet. Be the first to post a job!</p>
              <Link to="/register">
                <PrimaryButton style={{ marginTop: 12 }}>Post a Job Now</PrimaryButton>
              </Link>
            </div>
          ) : (
            <div className="jobs-grid">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section-pad" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 className="section-title">How Kaam Bazar Works (यह कैसे काम करता है)</h2>
        <p className="section-subtitle">Simple 3-step process for both Workers and Employers</p>

        <div className="steps-grid">
          {[
            {
              step: '1',
              title: 'Create Your Profile',
              desc: 'Workers add skills, Aadhaar, and mobile number. Employers add business details.',
              icon: <User size={28} strokeWidth={2.5} />,
              color: '#0d9488',
            },
            {
              step: '2',
              title: 'Post or Apply Jobs',
              desc: 'Employers post jobs with pay rate. Workers browse and apply in 1 tap.',
              icon: <FileText size={28} strokeWidth={2.5} />,
              color: '#f97316',
            },
            {
              step: '3',
              title: 'Work & Get Paid',
              desc: 'Log work hours, track contracts, receive payments, and build ratings.',
              icon: <CreditCard size={28} strokeWidth={2.5} />,
              color: '#6366f1',
            },
          ].map((s) => (
            <div
              key={s.step}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 28,
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${s.color}18`,
                  color: s.color,
                  fontSize: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                {s.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
          color: '#ffffff',
          padding: '52px 24px',
          textAlign: 'center',
          margin: '0 12px 32px 12px',
          borderRadius: 24,
          boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.3)',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, margin: '0 0 14px 0', color: '#ffffff' }}>
            Ready to Start Working or Hiring?
          </h2>
          <p style={{ fontSize: 15, color: '#ccfbf1', marginBottom: 24, lineHeight: 1.6 }}>
            Join thousands of skilled workers and employers on Kaam Bazar today. Free registration for everyone.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button
                style={{
                  background: '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  padding: '13px 24px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Briefcase size={18} /> Register as Worker
              </button>
            </Link>
            <Link to="/register">
              <button
                style={{
                  background: '#ffffff',
                  color: '#0f766e',
                  border: 'none',
                  padding: '13px 24px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Building2 size={18} /> Post a Job as Employer
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
