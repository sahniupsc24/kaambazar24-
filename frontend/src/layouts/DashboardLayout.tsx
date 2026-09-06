import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, Breadcrumb, DarkModeToggle, useDarkMode } from '../components/common/Primitives';
import { Briefcase, LogOut } from 'lucide-react';

interface LinkItem {
  to: string;
  label: string;
  icon?: string | ReactNode;
}

interface Props {
  children: ReactNode;
  links: LinkItem[];
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, links, title, breadcrumbs }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const roleAccent =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '#6366f1'
    : user?.role === 'EMPLOYER' ? '#0284c7'
    : '#0d9488';
  const roleBg =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '#e0e7ff'
    : user?.role === 'EMPLOYER' ? '#e0f2fe'
    : '#ccfbf1';

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, []);

  const dashboardHome =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin/dashboard'
    : user?.role === 'EMPLOYER' ? '/employer/dashboard'
    : '/worker/dashboard';

  return (
    <div className="dashboard-shell" style={{ position: 'relative' }}>
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 98, backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`dashboard-sidebar${sidebarOpen ? ' open-mobile' : ''}`}
        style={{
          position: 'relative',
          zIndex: 99,
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }}>
              <Briefcase size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>Kaam Bazar</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: roleAccent, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Control Panel' : `${user?.role} Portal`}
              </div>
            </div>
          </NavLink>
        </div>

        {/* User Card */}
        {user && (
          <div style={{ padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)' }}>
            <Avatar name={user.email} role={user.role} size={34} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: roleBg, color: roleAccent, display: 'inline-block', marginTop: 2 }}>{user.role}</span>
            </div>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === dashboardHome}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: isActive ? roleAccent : 'var(--text-muted)',
                background: isActive ? `${roleAccent}18` : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                borderLeft: isActive ? `3.5 solid ${roleAccent}` : '3.5px solid transparent',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
              })}
              onClick={() => setSidebarOpen(false)}
            >
              {l.icon && <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{l.icon}</span>}
              <span style={{ flex: 1 }}>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '12px 0 0', borderTop: '1px solid var(--border)', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', display: 'flex', justifyContent: 'center' }}><LogOut size={16} /></span>
            Logout
          </button>
        </div>
      </aside>


      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header bar */}
        <div style={{ height: 56, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 12, position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-sm)' }}>
          {/* Breadcrumbs / title */}
          <div style={{ flex: 1 }}>
            {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : title ? <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>{title}</span> : null}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DarkModeToggle dark={dark} toggle={toggleDark} />

            {/* Avatar dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 'var(--radius-md)', transition: 'background 0.15s' }}
              >
                {user && <Avatar name={user.email} role={user.role} size={32} />}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>▾</span>
              </button>
              {/* Profile Menu Dropdown */}
              {profileMenuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', minWidth: 200, padding: 8, zIndex: 100 }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>{user?.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Logged in as {user?.role}</div>
                  </div>
                  <button
                    onClick={() => { setProfileMenuOpen(false); logout(); navigate('/login'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', padding: '8px 12px', textAlign: 'left', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 13, borderRadius: 'var(--radius-sm)' }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger on the RIGHT */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              style={{ display: 'none', background: 'var(--bg-hover)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 20, color: 'var(--text-main)', padding: '6px 8px', borderRadius: 8, lineHeight: 1 }}
              className="dash-hamburger"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: 24, overflowX: 'hidden' }}>
          {title && !breadcrumbs && (
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 20px 0' }}>{title}</h1>
          )}
          {children}
        </div>
      </main>

      {/* Inline style for mobile hamburger visibility */}
      <style>{`
        @media (max-width: 768px) {
          .dash-hamburger { display: flex !important; }
          .dashboard-sidebar {
            position: fixed !important;
            top: 0; right: 0;
            height: 100vh;
            width: 260px;
            transform: translateX(100%);
            transition: transform 0.25s ease;
            z-index: 99 !important;
            box-shadow: var(--shadow-xl);
          }
          .dashboard-sidebar.open-mobile { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
}
