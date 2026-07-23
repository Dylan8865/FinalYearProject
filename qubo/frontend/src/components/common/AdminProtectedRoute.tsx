import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthInitialized } = useAuthStore();
  if (!isAuthInitialized || isLoading) return <div className="min-h-screen bg-slate-50" />;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
