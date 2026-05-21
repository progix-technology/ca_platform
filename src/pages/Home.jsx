import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Star, Zap, Shield, Clock, DollarSign, ChevronRight, Award, Users, FileCheck } from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import ServiceCard from '../components/ServiceCard';
import Button from '../components/Button';
import { SERVICES } from '../services/mockData';
import { serviceAPI } from '../services/api';
import { normalizeService } from '../services/serviceMapper';

const features = [
  { icon: Zap, title: 'Fast Processing', desc: 'Most services completed within 2-5 business days with real-time status updates.', tone: 'amber' },
  { icon: Award, title: 'Expert CA Support', desc: 'Dedicated Chartered Accountants with 10+ years of experience handle your case.', tone: 'blue' },
  { icon: Shield, title: 'Secure Documents', desc: 'Bank-grade 256-bit encryption protects all your sensitive financial documents.', tone: 'emerald' },
  { icon: DollarSign, title: 'Affordable Pricing', desc: 'Transparent, flat-fee pricing with no hidden charges - ever.', tone: 'purple' },
];

const testimonials = [
  { name: 'Rahul Sharma', role: 'Founder, TechStartup', avatar: 'RS', rating: 5, text: 'TaxEasePro handled our company registration and GST setup seamlessly. The team was professional, responsive, and completed everything in record time. Highly recommended!' },
  { name: 'Priya Mehta', role: 'Freelance Designer', avatar: 'PM', rating: 5, text: 'Filing my ITR used to be a nightmare. Now with TaxEasePro, I just upload my documents and they do the rest. Saved me hours of stress and got me a bigger refund!' },
  { name: 'Amit Verma', role: 'Restaurant Owner', avatar: 'AV', rating: 5, text: 'Monthly GST filing is now completely off my plate. Their team catches errors I would have missed and always files before the deadline. Worth every rupee.' },
];

const stats = [
  { value: '15+', label: 'Happy Clients' },
  { value: '₹2Cr+', label: 'Tax Saved' },
  { value: '1+', label: 'Years Experience' },
  { value: '99.8%', label: 'On-Time Filing' },
];

export default function Home() {
  const navigate = useNavigate();
  const [previewServices, setPreviewServices] = useState(SERVICES.slice(0, 6));

  useEffect(() => {
    const fetchPreviewServices = async () => {
      try {
        const response = await serviceAPI.getAll({ page: 1, limit: 6 });
        const items = response.data?.data?.items || [];

        if (items.length > 0) {
          setPreviewServices(items.map(normalizeService));
        }
      } catch {
        // Fallback to static demo services when API is unavailable.
      }
    };

    fetchPreviewServices();
  }, []);

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero */}
      <section className="home-hero">
        {/* Background blobs */}
        <div className="home-hero__background">
          <div className="home-hero__blob home-hero__blob--one" />
          <div className="home-hero__blob home-hero__blob--two" />
          <div className="home-hero__blob home-hero__blob--three" />
          {/* Grid pattern */}
          <div className="home-hero__grid" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="home-hero__inner">
          <div className="home-hero__layout">
            <div className="home-hero__content animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
              <div className="home-hero__pill">
                <span className="home-hero__pill-dot" />
                Trusted by 50,000+ businesses across India
              </div>
              <h1 className="home-hero__title">
                Simplify Your Taxes &<br />
                <span>Business Compliance</span>
              </h1>
              <p className="home-hero__subtitle">
                Expert CA services at your fingertips. From ITR filing to company registration - we handle the complexity so you can focus on growth.
              </p>
              <div className="home-hero__cta-row">
                <Button variant="primary" size="lg" className="home-hero__cta home-hero__cta--primary" onClick={() => navigate('/register')}>
                  Get Started Free <ArrowRight size={18} />
                </Button>
                <Button variant="outline" size="lg" className="home-hero__cta home-hero__cta--outline" onClick={() => navigate('/services')}>
                  View Services
                </Button>
              </div>
              <div className="home-hero__highlights">
                {['No hidden charges', 'Expert CA support', 'Secure & confidential'].map((item) => (
                  <div key={item} className="home-hero__highlight-item">
                    <CheckCircle2 size={16} className="home-hero__highlight-icon" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Card */}
            <div className="home-hero__card-wrap home-hero__card-wrap--reveal animate-fade-in-up animate-delay-300" style={{ animationFillMode: 'forwards' }}>
              <div className="home-hero__card-stack">
                <div className="animate-float">
                  <div className="home-hero__card">
                    <div className="home-hero__card-head">
                      <span className="home-hero__card-label">Active Services</span>
                      <span className="home-hero__card-live">● Live</span>
                    </div>
                    {[
                      { name: 'ITR Filing 2025-26', status: 'Completed', tone: 'emerald' },
                      { name: 'GST Return - Dec', status: 'In Progress', tone: 'amber' },
                      { name: 'Tax Audit FY25', status: 'Pending', tone: 'blue' },
                    ].map((item) => (
                      <div key={item.name} className="home-hero__card-row">
                        <div className="home-hero__card-row-left">
                          <FileCheck size={16} className="home-hero__card-row-icon" />
                          <span className="home-hero__card-row-name">{item.name}</span>
                        </div>
                        <span className={`home-hero__card-status home-hero__card-status--${item.tone}`}>{item.status}</span>
                      </div>
                    ))}
                    <div className="home-hero__card-metric">
                      <p className="home-hero__card-metric-label">Total Tax Saved This Year</p>
                      <p className="home-hero__card-metric-value">₹1,24,500</p>
                      <p className="home-hero__card-metric-trend">↑ 18% more than last year</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="home-hero__wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="home-stats">
        <div className="home-container">
          <div className="home-stats__grid">
            {stats.map(({ value, label }) => (
              <div key={label} className="home-stats__item">
                <p className="home-stats__value">{value}</p>
                <p className="home-stats__label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="home-services">
        <div className="home-container">
          <div className="home-section-head">
            <div>
              <p className="home-section-eyebrow">What We Offer</p>
              <h2 className="home-section-title">Expert CA Services<br />for Every Need</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/services')}>
              View All Services <ChevronRight size={16} />
            </Button>
          </div>
          <div className="home-services__grid">
            {previewServices.map((service) => (
              <ServiceCard key={service.id || service._id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="home-about">
        <div className="home-container">
          <div className="home-about__layout">
            <div>
              <p className="home-section-eyebrow">About TaxEasePro</p>
              <h2 className="home-section-title home-about__title">India's Most Trusted<br />CA Services Platform</h2>
              <p className="home-about__copy">
                Founded in 2025, TaxEasePro has been helping thousands of individuals, startups, and enterprises navigate the complex world of taxation and business compliance. Our team of 20+ qualified Chartered Accountants brings expertise, precision, and personal attention to every engagement.
              </p>
              <p className="home-about__copy home-about__copy--spaced">
                We combine technology with human expertise to deliver fast, accurate, and affordable CA services - completely online, without the hassle of physical visits.
              </p>
              <div className="home-about__bullet-list">
                {['ICAI registered Chartered Accountants', 'ISO 27001 certified data security', 'Pan-India service delivery', 'Dedicated relationship manager for every client'].map((item) => (
                  <div key={item} className="home-about__bullet-item">
                    <div className="home-about__bullet-icon-wrap">
                      <CheckCircle2 size={12} className="home-about__bullet-icon" />
                    </div>
                    <span className="home-about__bullet-text">{item}</span>
                  </div>
                ))}
              </div>
              <div className="home-about__cta-row">
                <Button variant="primary" onClick={() => navigate('/about')}>
                  About Us
                </Button>
              </div>
            </div>
            <div className="home-about__card-wrap">
              <div className="home-about__card">
                <div className="home-about__stats-grid">
                  {[
                    { icon: '🏆', value: '1+', label: 'Years of Excellence' },
                    { icon: '👨‍💼', value: '20+', label: 'Expert CAs' },
                    { icon: '🌍', value: '29+', label: 'States Covered' },
                    { icon: '⭐', value: '4.9/5', label: 'Client Rating' },
                  ].map(({ icon, value, label }) => (
                    <div key={label} className="home-about__stats-card">
                      <div className="home-about__stats-icon">{icon}</div>
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

      {/* Features */}
      <section className="home-features">
        <div className="home-container">
          <div className="home-section-head home-section-head--centered">
            <p className="home-section-eyebrow">Why Choose Us</p>
            <h2 className="home-section-title">Built for Speed, Trust & Value</h2>
            <p className="home-section-subtitle">Everything you need to stay compliant, save taxes, and grow your business.</p>
          </div>
          <div className="home-features__grid">
            {features.map(({ icon: Icon, title, desc, tone }) => (
              <div key={title} className="home-features__card">
                <div className={`home-features__icon-box home-features__icon-box--${tone}`}>
                  <Icon size={24} />
                </div>
                <h3 className="home-features__card-title">{title}</h3>
                <p className="home-features__card-copy">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="home-testimonials">
        <div className="home-container">
          <div className="home-section-head home-section-head--centered">
            <p className="home-section-eyebrow">Client Stories</p>
            <h2 className="home-section-title">Loved by Thousands</h2>
            <p className="home-section-subtitle">Don't take our word for it - here's what our clients say.</p>
          </div>
          <div className="home-testimonials__grid">
            {testimonials.map(({ name, role, avatar, rating, text }) => (
              <div key={name} className="home-testimonials__card">
                <div className="home-testimonials__stars">
                  {[...Array(rating)].map((_, i) => <Star key={i} size={16} className="home-testimonials__star" />)}
                </div>
                <p className="home-testimonials__quote">"{text}"</p>
                <div className="home-testimonials__author-row">
                  <div className="home-testimonials__avatar">{avatar}</div>
                  <div>
                    <p className="home-testimonials__author-name">{name}</p>
                    <p className="home-testimonials__author-role">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-cta__grid" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="home-cta__inner">
          <h2 className="home-cta__title">
            Ready to Simplify Your<br />Tax & Compliance?
          </h2>
          <p className="home-cta__subtitle">
            Join 50,000+ satisfied clients. Get started today with a free consultation.
          </p>
          <div className="home-cta__actions">
            <Button size="lg" className="home-cta__btn home-cta__btn--primary" onClick={() => navigate('/register')}>
              Get Started Free <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" className="home-cta__btn home-cta__btn--outline" onClick={() => navigate('/services')}>
              Explore Services
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
