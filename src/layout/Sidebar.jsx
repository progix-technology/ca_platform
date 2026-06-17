import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, User, Settings, LogOut, BarChart3, Users, Briefcase, Shield, Archive, RefreshCcw, X, DollarSign, CreditCard, ChevronDown, ChevronRight, Circle, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/logo.jpg';
import toast from 'react-hot-toast';

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
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/completed-list', icon: Archive, label: 'Completed Service List' },
  { to: '/admin/renewals', icon: RefreshCcw, label: 'Renewals' },
  { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/admin/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const superAdminLinks = [{ to: '/superadmin', icon: Shield, label: 'Super Admin' }];

export default function Sidebar({ isAdmin = false, onClose, renewCount = 0 }) {
  const { pathname, search } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'superadmin';
  const isPremium = user?.subscription?.planId?.hasAdvancedAnalytics || user?.subscription?.planName?.toLowerCase().includes('premium');
  const links = isAdmin ? (isSuperAdmin ? [...superAdminLinks, ...adminLinks] : adminLinks) : userLinks;

  const [openMenus, setOpenMenus] = useState(() => {
    return {
      '/admin/requests': pathname.startsWith('/admin/requests'),
    };
  });

  useEffect(() => {
    if (pathname.startsWith('/admin/requests')) {
      setOpenMenus(prev => ({ ...prev, '/admin/requests': true }));
    }
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSubmenu = (e, to) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus(prev => ({ ...prev, [to]: !prev[to] }));
  };

  const handleLinkClick = (e, to) => {
    if (to === '/admin/analytics' && !isPremium && !isSuperAdmin) {
      e.preventDefault();
      toast('This is only for premium CA', {
        icon: '🔒',
        style: {
          background: '#fff',
          color: '#e11d48',
          border: '1px solid #fda4af',
          fontWeight: 'bold'
        },
      });
      return;
    }
    if (onClose) onClose();
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
          const isOpen = openMenus[to];
          
          return (
            <div key={to} className="app-sidebar__link-group">
              <div className={isActive ? 'app-sidebar__link app-sidebar__link--active flex items-center justify-between' : 'app-sidebar__link flex items-center justify-between'}>
                <Link
                  to={to === '/admin/analytics' && !isPremium && !isSuperAdmin ? '#' : to}
                  onClick={(e) => handleLinkClick(e, to)}
                  className="flex items-center gap-3 flex-1"
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {to === '/admin/analytics' && (
                    <span className="ml-2 inline-flex h-5 items-center justify-center rounded bg-rose-500 px-2 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                      Premium
                    </span>
                  )}
                  {to === '/admin/renewals' && renewCount > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-semibold text-white">
                      {renewCount}
                    </span>
                  )}
                </Link>
                {hasSubLinks && (
                  <button onClick={(e) => toggleSubmenu(e, to)} className="p-1 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
              </div>
              {hasSubLinks && isOpen && (
                <div className="app-sidebar__sublinks pl-8 mt-1 space-y-1">
                  {requestSubLinks.map((subLink) => {
                    const isSubActive = `${pathname}${search}` === subLink.to;
                    return (
                      <Link
                        key={subLink.to}
                        to={subLink.to}
                        onClick={onClose}
                        className={isSubActive ? 'app-sidebar__sublink app-sidebar__sublink--active flex items-center gap-2 py-1.5' : 'app-sidebar__sublink flex items-center gap-2 py-1.5 text-slate-500 hover:text-slate-700'}
                      >
                        <Circle size={8} className={isSubActive ? 'fill-current text-blue-600' : 'text-slate-400'} />
                        <span className="text-sm">{subLink.label}</span>
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
