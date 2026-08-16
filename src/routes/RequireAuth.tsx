import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/state/AuthContext';

export function RequireAuth() {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.mustChangePassword && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }
  return <Outlet />;
}
