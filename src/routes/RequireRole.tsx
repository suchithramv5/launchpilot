import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';
import type { Role } from '@/types';

export function RequireRole({ roles }: { roles: Role[] }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!roles.includes(currentUser.role)) return <Navigate to="/launches" replace />;
  return <Outlet />;
}
