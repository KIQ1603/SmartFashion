import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
