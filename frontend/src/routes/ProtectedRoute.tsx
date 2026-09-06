import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface Props {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

// Client-side gating only improves UX (avoid flashing the wrong dashboard).
// It is NOT a security boundary — every API endpoint independently
// enforces authentication + RBAC + ownership server-side.
export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
