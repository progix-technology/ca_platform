import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, User, Settings, LogOut, BarChart3, Users, Briefcase, Shield, Archive, RefreshCcw, X, DollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo.jpg';

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/services', icon: FileText, label: 'My Services' },
  { to: '/dashboard/renewed-services', icon: RefreshCcw, label: 'Renewed Services' },
  { to: '/dashboard/completed-list', icon: Archive, label: 'Completed List' },
  { to: '/dashboard/documents', icon: Upload, label: 'Documents' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
];

const requestSubLinks = [
  { to: '/admin/requests?status=approved', label: 'Approved' },
  { to: '/admin/requests?status=pending', label: 'Pending' },
  { to: '/admin/requests?status=completed', label: 'Completed' },
  { to: '/admin/requests?status=rejected', label: 'Rejected' },
];

const adminLinks = [
  { to: '/admin', icon: BarChart3, label: 'Dashboard' },
  { to: '/admin/requests', icon: FileText, label: 'Requests', hasSubLinks: true },
  { to: '/admin/services', icon: Briefcase, label: 'Services' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/completed-list', icon: Archive, label: 'Completed Service List' },
  { to: '/admin/renewals', icon: RefreshCcw, label: 'Renewals' },
  { to: '/admin/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const superAdminLinks = [{ to: '/superadmin', icon: Shield, label: 'Super Admin' }];

export default function Sidebar({ isAdmin = false, onClose, renewCount = 0 }) {
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';
  const links = isAdmin ? (isSuperAdmin ? [...superAdminLinks, ...adminLinks] : adminLinks) : userLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-sidebar">
      {/* Header */}
      <div className="app-sidebar__header">
        <Link to="/" className="app-sidebar__brand-link">
          <div className="app-sidebar__brand-box">
            <img src={logoImage} alt="TaxEasePro logo" className="app-sidebar__brand-image" />
          </div>
          <span className="app-sidebar__brand-text">TaxEase<span>Pro</span></span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="app-sidebar__close">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="app-sidebar__role-wrap">
        <div className="app-sidebar__role-badge">
          {isAdmin ? <Shield size={14} className="app-sidebar__role-icon" /> : <User size={14} className="app-sidebar__role-icon" />}
          <span className="app-sidebar__role-text">
            {isSuperAdmin ? 'Super Admin Panel' : isAdmin ? 'Admin Panel' : 'User Portal'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="app-sidebar__nav">
        {links.map(({ to, icon: Icon, label, hasSubLinks }) => {
          const isActive = pathname === to || (hasSubLinks && pathname.startsWith('/admin/requests'));
          return (
            <div key={to} className="app-sidebar__link-group">
              <Link
                to={to}
                onClick={onClose}
                className={isActive ? 'app-sidebar__link app-sidebar__link--active' : 'app-sidebar__link'}
              >
                <Icon size={18} />
                <span>{label}</span>
                {to === '/admin/renewals' && renewCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-semibold text-white">
                    {renewCount}
                  </span>
                )}
              </Link>
              {hasSubLinks && pathname.startsWith('/admin/requests') && (
                <div className="app-sidebar__sublinks">
                  {requestSubLinks.map((subLink) => {
                    const isSubActive = `${pathname}${search}` === subLink.to;
                    return (
                      <Link
                        key={subLink.to}
                        to={subLink.to}
                        onClick={onClose}
                        className={isSubActive ? 'app-sidebar__sublink app-sidebar__sublink--active' : 'app-sidebar__sublink'}
                      >
                        <span>{subLink.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="app-sidebar__footer">
        <div className="app-sidebar__profile-row">
          <div className="app-sidebar__profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="app-sidebar__profile-meta">
            <p className="app-sidebar__profile-name">{user?.name}</p>
            <p className="app-sidebar__profile-email">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="app-sidebar__link app-sidebar__link--logout">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
