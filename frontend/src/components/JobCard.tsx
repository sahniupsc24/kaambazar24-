import { Link } from 'react-router-dom';
import { Job } from '../types';
import { StatusBadge } from './common/Primitives';

export function JobCard({ job }: { job: Job }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="card-hover-effect"
    >
      {job.isFeatured && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderBottomLeftRadius: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          ⭐ Featured
        </div>
      )}

      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--primary-light)', color: 'var(--primary)' }}>
            {job.category?.name || 'General'}
          </span>
          <StatusBadge status={job.status} />
          {job.aadhaarRequired && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309' }}>
              🪪 Aadhaar Mandatory
            </span>
          )}
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
          <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {job.title}
          </Link>
        </h3>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {job.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📍</span>
            <span style={{ fontWeight: 500 }}>{job.location?.name || 'Pan India'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>💼</span>
            <span style={{ fontWeight: 500 }}>{job.workType}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>👥</span>
            <span style={{ fontWeight: 500 }}>{job.openings ?? 1} opening{(job.openings ?? 1) > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-light)', display: 'block' }}>Pay Rate</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
            ₹{job.compensationRate} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {job.compensationType.toLowerCase()}</span>
          </span>
        </div>

        <Link
          to={`/jobs/${job.id}`}
          style={{
            background: 'var(--primary)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
          }}
        >
          View & Apply →
        </Link>
      </div>
    </div>
  );
}

