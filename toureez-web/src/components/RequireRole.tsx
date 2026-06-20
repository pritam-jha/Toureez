import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

const ROLE_HOME: Record<UserRole, string> = {
  traveler: '/app',
  company_owner: '/vendor',
  admin: '/admin',
};

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirect}`} replace />;
  }
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;

  return <>{children}</>;
}
