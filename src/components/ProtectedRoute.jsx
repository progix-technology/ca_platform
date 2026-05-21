import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="protected-route-loader">
        <Loader2 className="protected-route-loader__icon is-spinning" size={40} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (superAdminOnly && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;



  if (adminOnly) {
    if (user.role === 'superadmin') {
      return children;
    }
    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
