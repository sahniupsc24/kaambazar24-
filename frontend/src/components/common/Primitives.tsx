import React, { ReactNode, useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

/* ============================================
   TOAST SYSTEM
   ============================================ */
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const ICONS: Record<ToastType, string> = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{ICONS[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16, lineHeight: 1, opacity: 0.7 }}
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

/* ============================================
   DARK MODE HOOK + TOGGLE
   ============================================ */
export function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('kb-theme') === 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('kb-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function DarkModeToggle({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: 18,
        lineHeight: 1,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s ease',
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

/* ============================================
   STATUS BADGE
   ============================================ */
const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  OPEN: { bg: '#dcfce7', color: '#15803d', label: 'Open' },
  DRAFT: { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
  CLOSED: { bg: '#fee2e2', color: '#b91c1c', label: 'Closed' },
  FILLED: { bg: '#e0e7ff', color: '#4338ca', label: 'Filled' },
  SUBMITTED: { bg: '#dbeafe', color: '#1d4ed8', label: 'Submitted' },
  UNDER_REVIEW: { bg: '#fef3c7', color: '#b45309', label: 'Under Review' },
  ACCEPTED: { bg: '#dcfce7', color: '#15803d', label: 'Accepted' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
  WITHDRAWN: { bg: '#f1f5f9', color: '#64748b', label: 'Withdrawn' },
  SENT: { bg: '#e0e7ff', color: '#4338ca', label: 'Sent' },
  ACTIVE: { bg: '#dcfce7', color: '#15803d', label: 'Active' },
  COMPLETED: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  TERMINATED: { bg: '#fee2e2', color: '#b91c1c', label: 'Terminated' },
  APPROVED: { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
  CORRECTING: { bg: '#ffedd5', color: '#c2410c', label: 'Needs Correction' },
  PENDING: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  PROCESSING: { bg: '#dbeafe', color: '#1d4ed8', label: 'Processing' },
  PAID: { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
  FAILED: { bg: '#fee2e2', color: '#b91c1c', label: 'Failed' },
  BANNED: { bg: '#fee2e2', color: '#b91c1c', label: 'Banned' },
  SUSPENDED: { bg: '#ffedd5', color: '#c2410c', label: 'Suspended' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

/* ============================================
   SKELETON LOADER
   ============================================ */
export function SkeletonLine({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4 }} />;
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'grid', gap: 8 }}>
        <SkeletonLine width="40%" height={14} />
        <SkeletonLine width="60%" height={24} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrapper">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
        <SkeletonLine width={200} height={14} />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, padding: '14px 16px', borderBottom: r < rows - 1 ? '1px solid var(--border)' : 'none' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${50 + Math.random() * 40}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 14, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

/* ============================================
   EMPTY / ERROR STATES
   ============================================ */
export function EmptyState({ label, sublabel, action }: { label: string; sublabel?: string; action?: ReactNode }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', margin: '16px 0' }}>
      <div style={{ fontSize: 42, marginBottom: 8, opacity: 0.7 }}>🔍</div>
      <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 4px 0' }}>{label}</h4>
      {sublabel && <p style={{ fontSize: 13, margin: '0 0 16px 0' }}>{sublabel}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: '12px 16px', color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>⚠️</span><span>{message}</span>
    </div>
  );
}

/* ============================================
   CARD
   ============================================ */
export function Card({ children, style, hoverable = false }: { children: ReactNode; style?: React.CSSProperties; hoverable?: boolean }) {
  return (
    <div
      style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: hoverable ? 'pointer' : 'default', ...style }}
      {...(hoverable ? { onMouseEnter: (e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }, onMouseLeave: (e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; } } : {})}
    >
      {children}
    </div>
  );
}

/* ============================================
   STAT CARD
   ============================================ */
export function StatCard({ title, value, icon, color = '#0d9488', subtitle, trend }: { title: string; value: string | number; icon: string | React.ReactNode; color?: string; subtitle?: string; trend?: { value: number; label: string } }) {
  return (
    <div className="stat-card">
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 2px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</p>
        <h3 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-main)', lineHeight: 1 }}>{value}</h3>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-light)', margin: '3px 0 0 0' }}>{subtitle}</p>}
        {trend && <p style={{ fontSize: 11, margin: '3px 0 0 0', color: trend.value >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}</p>}
      </div>
    </div>
  );
}

/* ============================================
   BUTTONS
   ============================================ */
export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #0d9488, #0f766e))', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: props.disabled ? 'not-allowed' : 'pointer', opacity: props.disabled ? 0.65 : 1, boxShadow: '0 2px 6px rgba(13,148,136,0.25)', transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap', ...props.style }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ background: 'var(--bg-card)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: props.disabled ? 'not-allowed' : 'pointer', opacity: props.disabled ? 0.65 : 1, transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap', ...props.style }}>
      {children}
    </button>
  );
}

export function DangerButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: props.disabled ? 'not-allowed' : 'pointer', opacity: props.disabled ? 0.65 : 1, boxShadow: '0 2px 6px rgba(220,38,38,0.25)', transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap', ...props.style }}>
      {children}
    </button>
  );
}

export function IconButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease', ...props.style }}>
      {children}
    </button>
  );
}

/* ============================================
   AVATAR
   ============================================ */
export function Avatar({ name, role, size = 38 }: { name: string; role?: string; size?: number }) {
  const initials = name.split(/[\s@]/).map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const roleBg = role === 'ADMIN' || role === 'SUPER_ADMIN' ? '#6366f1' : role === 'EMPLOYER' ? '#0284c7' : '#0d9488';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: roleBg, color: '#fff', fontWeight: 700, fontSize: size * 0.36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.12)', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

/* ============================================
   MODAL
   ============================================ */
export function Modal({ isOpen, onClose, title, children, maxWidth = 540 }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: number }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', maxWidth, width: '100%', padding: 24, boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================
   CONFIRM DIALOG
   ============================================ */
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={420}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        {danger
          ? <DangerButton onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</DangerButton>
          : <PrimaryButton onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</PrimaryButton>
        }
      </div>
    </Modal>
  );
}

/* ============================================
   DATA TABLE
   ============================================ */
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: number | string;
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyLabel?: string;
  pageSize?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  actions?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns, data, loading, emptyLabel = 'No records found.', pageSize = 25, searchable = true, searchKeys, actions, onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = data.filter((row) => {
    if (!query) return true;
    const keys = searchKeys ?? (columns.map((c) => c.key) as (keyof T)[]);
    return keys.some((k) => String((row as any)[k] ?? '').toLowerCase().includes(query.toLowerCase()));
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = String((a as any)[sortKey] ?? '');
    const bv = String((b as any)[sortKey] ?? '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  if (loading) return <SkeletonTable rows={6} cols={columns.length} />;

  return (
    <div>
      {searchable && (
        <div className="filter-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input form-input"
              placeholder="Search..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className="table-wrapper" style={{ borderRadius: searchable ? '0 0 var(--radius-lg) var(--radius-lg)' : undefined, border: searchable ? 'none' : undefined }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={sortKey === col.key ? 'sorted' : ''} style={{ width: col.width }} onClick={() => col.sortable !== false && toggleSort(col.key)}>
                  {col.label} {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              {actions && <th style={{ width: 120 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>{emptyLabel}</td></tr>
            ) : paginated.map((row, i) => (
              <tr key={(row.id as string | number | undefined) ?? i} style={{ cursor: onRowClick ? 'pointer' : 'default' }} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}</td>
                ))}
                {actions && <td onClick={(e) => e.stopPropagation()}>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <span>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
            <div className="pagination-buttons">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                return pg <= totalPages ? <button key={pg} className={`pg-btn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button> : null;
              })}
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   BREADCRUMB
   ============================================ */
export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
          {item.href ? (
            <a href={item.href} style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>{item.label}</a>
          ) : (
            <span style={{ color: i === items.length - 1 ? 'var(--text-main)' : 'inherit', fontWeight: i === items.length - 1 ? 600 : 400 }}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ============================================
   TABS
   ============================================ */
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; icon?: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-hover)', padding: 4, borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: active === t.key ? 'var(--bg-card)' : 'transparent',
            color: active === t.key ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: active === t.key ? 700 : 500,
            fontSize: 13.5,
            cursor: 'pointer',
            boxShadow: active === t.key ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {t.icon && <span>{t.icon}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ============================================
   INPUT / FORM HELPERS
   ============================================ */
export function FormGroup({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label className="form-label">{label}{required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}</label>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="form-input" style={{ ...props.style }} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="form-input" style={{ ...props.style }}>
      {children}
    </select>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="form-input" style={{ resize: 'vertical', minHeight: 80, ...props.style }} />;
}

/* ============================================
   SECTION HEADER
   ============================================ */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
