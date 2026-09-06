import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Avatar, DarkModeToggle, useDarkMode } from './common/Primitives';
import { Briefcase, Search, Gem, LogOut } from 'lucide-react';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide top global NavBar on dashboard routes where DashboardLayout is active
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/employer')
  ) {
    return null;
  }

  function dashboardPath() {
    if (user?.role === UserRole.WORKER) return '/worker/dashboard';
    if (user?.role === UserRole.EMPLOYER) return '/employer/dashboard';
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) return '/admin/dashboard';
    return '/';
  }

  function getRoleLabel() {
    if (user?.role === UserRole.WORKER) return 'Worker';
    if (user?.role === UserRole.EMPLOYER) return 'Employer';
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) return 'Admin';
    return '';
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        height: 64,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0d9488 0%, #f97316 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
              flexShrink: 0,
            }}
          >
            <Briefcase size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              Kaam Bazar <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>काम बाज़ार</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, display: 'var(--brand-sub-display, block)' }}>Blue-Collar Workforce Portal</div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="navbar-links">
          <Link to="/jobs" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>
            <Search size={16} /> Find Jobs
          </Link>
          <Link to="/pricing" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none' }}>
            <Gem size={16} /> Pricing
          </Link>
          <Link to="/about" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
            About
          </Link>
          <Link to="/contact" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Contact
          </Link>
        </nav>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Dark / Light Mode Toggle Button */}
        <DarkModeToggle dark={dark} toggle={toggle} />

        {/* Desktop Auth Controls */}
        <div className="navbar-links">
          {user ? (
            <>
              <Link
                to={dashboardPath()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <Avatar name={user.email} role={user.role} size={28} />
                <span>Dashboard</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#e0e7ff' : user.role === 'EMPLOYER' ? '#e0f2fe' : '#ccfbf1',
                    color: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#4338ca' : user.role === 'EMPLOYER' ? '#0369a1' : '#0f766e',
                    fontWeight: 700,
                  }}
                >
                  {getRoleLabel()}
                </span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                style={{
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  color: '#dc2626',
                  borderRadius: 8,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                }}
              >
                Register Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="navbar-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
          style={{
            padding: '8px 10px',
            fontSize: 20,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-hover)',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer Menu — fixed below sticky header */}
      {mobileMenuOpen && (
        <div
          className="navbar-mobile-menu open"
        >
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', padding: '6px 0' }}
          >
            <Search size={18} /> Find Jobs
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text-main)', textDecoration: 'none', padding: '6px 0' }}
          >
            <Gem size={18} /> Pricing Plans
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 0' }}
          >
            About
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', padding: '6px 0' }}
          >
            Contact
          </Link>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to={dashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={user.email} role={user.role} size={28} />
                  <span>Dashboard</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#e0e7ff' : user.role === 'EMPLOYER' ? '#e0f2fe' : '#ccfbf1',
                    color: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#4338ca' : user.role === 'EMPLOYER' ? '#0369a1' : '#0f766e',
                    fontWeight: 700,
                  }}
                >
                  {getRoleLabel()}
                </span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                style={{
                  width: '100%',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  padding: '10px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

