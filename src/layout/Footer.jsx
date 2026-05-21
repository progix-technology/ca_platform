import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Share2, Rss, Globe } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          {/* Brand */}
          <div className="site-footer__brand-col">
            <div className="site-footer__brand-row">
              <div className="site-footer__brand-box">
                <img src={logoImage} alt="TaxEasePro logo" className="site-footer__brand-image" /> 
              </div>
              <span className="site-footer__brand-text">TaxEase<span>Pro</span></span>
            </div>
            <p className="site-footer__brand-copy">
              India's most trusted CA services platform. Expert financial guidance for individuals and businesses.
            </p>
            <div className="site-footer__social-row">
              {[Share2, Rss, Globe].map((Icon, i) => (
                <a key={i} href="#" className="site-footer__social-link">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="site-footer__col">
            <h4>
              <Link to="/services" className="site-footer__heading site-footer__heading-link">Categories</Link>
            </h4>
            <ul className="site-footer__list">
              {[
                'All',
                'Company Incorporation',
                'Compliance Services',
                'Business Services',
                'Accounting Services',
                'Consulting',
                'Licenses & Registration',
              ].map((label) => (
                <li key={label}>
                  <Link
                    to={`/services?category=${encodeURIComponent(label)}`}
                    className="site-footer__link"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="site-footer__col">
            <h4>
              <Link to="/about" className="site-footer__heading site-footer__heading-link">Company</Link>
            </h4>
            <ul className="site-footer__list">
              {[['About Us', '/about'], ['Services', '/services'], ['Login', '/login'], ['Register', '/register']].map(([label, to]) => (
                <li key={label}><Link to={to} className="site-footer__link">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="site-footer__col">
            <h4>
              <a href="mailto:hello@taxeasepro.in" className="site-footer__heading site-footer__heading-link">Contact</a>
            </h4>
            <ul className="site-footer__contact-list">
              <li className="site-footer__contact-item site-footer__contact-item--start">
                <MapPin size={16} className="site-footer__contact-icon" />
                <span>Ahemamau, Lucknow, Uttar Pradesh</span>
              </li>
              <li className="site-footer__contact-item">
                <Phone size={16} className="site-footer__contact-icon" />
                <span>+91 98765 43210</span>
              </li>
              <li className="site-footer__contact-item">
                <Mail size={16} className="site-footer__contact-icon" />
                <span>hello@taxeasepro.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">© 2025 TaxEasePro. All rights reserved.</p>
          <div className="site-footer__bottom-links">
            <a href="#" className="site-footer__link">Privacy Policy</a>
            <a href="#" className="site-footer__link">Terms of Service</a>
            <a href="#" className="site-footer__link">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
