import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import logoImage from '../assets/logo.jpg';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenu(false);
  };

  return (
    <header className={`site-navbar ${scrolled ? 'site-navbar--scrolled' : ''}`}>
      <nav className="site-navbar__inner">
        {/* Logo */}
        <Link to="/" className="site-navbar__logo-link">
          <div className="site-navbar__logo-box">
            <img src={logoImage} alt="TaxEasePro logo" className="site-navbar__logo-image" />
          </div>
          <span className="site-navbar__logo-text">TaxEase<span>Pro</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="site-navbar__desktop-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `site-navbar__nav-link ${isActive ? 'is-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Auth area */}
        <div className="site-navbar__auth-area">
          {user ? (
            <div className="site-navbar__user-wrap">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="site-navbar__user-toggle"
              >
                <div className="site-navbar__avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="site-navbar__user-name">{user.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`site-navbar__user-chevron ${userMenu ? 'is-open' : ''}`} />
              </button>
              {userMenu && (
                <div className="site-navbar__user-menu">
                  <Link to="/dashboard" onClick={() => setUserMenu(false)} className="site-navbar__user-menu-item">
                    <LayoutDashboard size={16} /> My Dashboard
                  </Link>
                  {isSuperAdmin ? (
                    <Link to="/superadmin" onClick={() => setUserMenu(false)} className="site-navbar__user-menu-item">
                      <Shield size={16} /> Super Admin Panel
                    </Link>
                  ) : isAdmin ? (
                    <Link to="/admin" onClick={() => setUserMenu(false)} className="site-navbar__user-menu-item">
                      <Shield size={16} /> Admin Panel
                    </Link>
                  ) : null}
                  <hr className="site-navbar__menu-divider" />
                  <button onClick={handleLogout} className="site-navbar__user-menu-item site-navbar__user-menu-item--danger">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="site-navbar__signin-link">Sign In</Link>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="site-navbar__mobile-toggle">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="site-navbar__mobile-menu">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `site-navbar__mobile-link ${isActive ? 'is-active' : ''}`}>
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="site-navbar__mobile-link">Dashboard</Link>
              {isSuperAdmin ? (
                <Link to="/superadmin" onClick={() => setOpen(false)} className="site-navbar__mobile-link">Super Admin</Link>
              ) : isAdmin ? (
                <Link to="/admin" onClick={() => setOpen(false)} className="site-navbar__mobile-link">Admin</Link>
              ) : null}
              <button onClick={handleLogout} className="site-navbar__mobile-link site-navbar__mobile-link--danger">Sign Out</button>
            </>
          ) : (
            <div className="site-navbar__mobile-auth">
              <Link to="/login" onClick={() => setOpen(false)} className="site-navbar__mobile-auth-link">Sign In</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="site-navbar__mobile-auth-link site-navbar__mobile-auth-link--primary">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
