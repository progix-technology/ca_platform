import { Building2, CalendarDays, Globe2, ShieldCheck, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import logoImage from '../assets/logo.jpg';
import Button from '../components/Button';

const companyFacts = [
  { icon: CalendarDays, label: 'Established', value: '2026' },
  { icon: Users, label: 'Founder', value: 'CA Your Name' },
  { icon: Building2, label: 'Head Office', value: 'Lucknow, India' },
  { icon: Globe2, label: 'Service Reach', value: 'Pan India' },
];

const milestones = [
  { year: '2026', title: 'Company Founded', copy: 'TaxEasePro started with the mission to make tax and compliance services simple for every Indian business.', tone: 'blue' },
  { year: '2027', title: 'Digital Practice Launched', copy: 'Introduced online document collection and remote CA consultation for faster service delivery.', tone: 'amber' },
  { year: '2028', title: 'National Expansion', copy: 'Scaled to multi-city operations and built a dedicated team of domain specialists.', tone: 'emerald' },
  { year: '2029', title: 'Trusted at Scale', copy: 'Crossed 50,000+ clients served with high on-time filing performance and client retention.', tone: 'purple' },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      <main>
        <section className="home-hero">
          <div className="home-hero__background">
            <div className="home-hero__blob home-hero__blob--one" />
            <div className="home-hero__blob home-hero__blob--two" />
            <div className="home-hero__blob home-hero__blob--three" />
            <div
              className="home-hero__grid"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="home-hero__inner">
            <div className="home-section-head home-section-head--centered about-page__hero-content">
              <div className="about-page__logo-wrap">
                <img src={logoImage} alt="TaxEasePro logo" className="about-page__logo-image" />
              </div>
              <p className="home-section-eyebrow">About TaxEasePro</p>
              <h1 className="home-hero__title about-page__hero-title">
                Built On Trust, Driven By <span>Compliance Excellence</span>
              </h1>
              <p className="home-hero__subtitle about-page__hero-subtitle">
                India's trusted digital CA services platform, helping individuals and businesses stay compliant with confidence since 2026.
              </p>
              <div className="home-hero__highlights about-page__hero-highlights">
                {['Founder-led CA expertise', 'Secure digital process', 'Pan-India service delivery'].map((item) => (
                  <div key={item} className="home-hero__highlight-item">{item}</div>
                ))}
              </div>
              <div className="home-hero__cta-row about-page__hero-cta">
                <Button variant="primary" size="lg" onClick={() => navigate('/services')}>
                  Explore Services
                </Button>
              </div>
            </div>
          </div>

          <div className="home-hero__wave">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="white" />
            </svg>
          </div>
        </section>

        <section className="home-stats">
          <div className="home-container">
            <div className="home-stats__grid">
              {companyFacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="home-stats__item">
                  <p className="home-stats__value">{value}</p>
                  <p className="home-stats__label">{label}</p>
                  <div className="home-about__bullet-icon-wrap about-page__stats-icon-wrap">
                    <Icon size={12} className="home-about__bullet-icon" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-about">
          <div className="home-container">
            <div className="home-about__layout">
              <div>
                <p className="home-section-eyebrow">Our Story</p>
                <h2 className="home-section-title home-about__title">How We Started & What We Believe</h2>
                <p className="home-about__copy">
                  TaxEasePro was established in 2026 by <strong>CA Your Name</strong> with one goal: simplify tax filing and business compliance for everyone.
                  We combine strong CA expertise with easy-to-use digital workflows so clients can focus on growth while we handle regulatory complexity.
                </p>
                <p className="home-about__copy home-about__copy--spaced">
                  From ITR filing and GST compliance to business registrations and audits, our team works with accuracy, transparency, and speed.
                  Today, we support startups, professionals, and enterprises across India.
                </p>
                <ul className="home-about__bullet-list">
                  <li className="home-about__bullet-item">
                    <div className="home-about__bullet-icon-wrap"><Target size={12} className="home-about__bullet-icon" /></div>
                    <span className="home-about__bullet-text"><strong>Vision:</strong> Make compliance stress-free for every Indian business.</span>
                  </li>
                  <li className="home-about__bullet-item">
                    <div className="home-about__bullet-icon-wrap"><ShieldCheck size={12} className="home-about__bullet-icon" /></div>
                    <span className="home-about__bullet-text"><strong>Trust:</strong> Confidential handling of every financial document and client record.</span>
                  </li>
                  <li className="home-about__bullet-item">
                    <div className="home-about__bullet-icon-wrap"><Users size={12} className="home-about__bullet-icon" /></div>
                    <span className="home-about__bullet-text"><strong>Client First:</strong> Dedicated support with clear communication at every step.</span>
                  </li>
                </ul>
              </div>

              <div className="home-about__card-wrap">
                <div className="home-about__card">
                  <div className="home-about__stats-grid">
                    {companyFacts.map(({ label, value }) => (
                      <div key={label} className="home-about__stats-card">
                        <div className="home-about__stats-value">{value}</div>
                        <div className="home-about__stats-label">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="home-about__shape home-about__shape--one" />
                <div className="home-about__shape home-about__shape--two" />
              </div>
            </div>
          </div>
        </section>

        <section className="home-features">
          <div className="home-container">
            <div className="home-section-head home-section-head--centered">
              <p className="home-section-eyebrow">Journey</p>
              <h2 className="home-section-title">Growth Timeline</h2>
            </div>

            <div className="home-features__grid">
              {milestones.map((item) => (
                <div key={item.year} className="home-features__card">
                  <div className={`home-features__icon-box home-features__icon-box--${item.tone}`}>
                    <CalendarDays size={20} />
                  </div>
                  <h3 className="home-features__card-title">{item.year} - {item.title}</h3>
                  <p className="home-features__card-copy">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}