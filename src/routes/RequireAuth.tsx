import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';

export function RequireAuth() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
