import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

const ROLE_HOME: Record<UserRole, string> = {
  traveler: '/app',
  company_owner: '/vendor',
  admin: '/admin',
};

export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;

  return <>{children}</>;
}
