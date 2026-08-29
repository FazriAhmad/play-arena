import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../lib/types';
import { useAuth } from '../store/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ role }: { role: Role | Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoading />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function FullscreenLoading() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat…</div>;
}
