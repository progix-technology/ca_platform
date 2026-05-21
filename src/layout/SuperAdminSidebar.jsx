import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Users, Shield, Settings, LogOut, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo.jpg';

const superAdminLinks = [
  { to: '/superadmin', icon: BarChart3, label: 'Overview' },
  { to: '/superadmin/admins', icon: Users, label: 'Admin Management' },
  { to: '/superadmin/plans', icon: Zap, label: 'Plans' },
  { to: '/superadmin/all-users', icon: Shield, label: 'All Users' },
  { to: '/superadmin/settings', icon: Settings, label: 'Settings' },
];

export default function SuperAdminSidebar({ onClose = null }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-sidebar bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="app-sidebar__header border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <Link to="/" className="app-sidebar__brand-link flex-1">
          <div className="flex-shrink-0">
            <img src={logoImage} alt="CA Platform" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">CA Platform</div>
            <div className="text-xs text-emerald-600 font-semibold">Super Admin</div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
            type="button"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="app-sidebar__nav flex-1 px-3 py-4 space-y-1">
        {superAdminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600 pl-3.5'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-3 py-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
          type="button"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
