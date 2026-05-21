import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import ServiceCard from '../components/ServiceCard';
import { serviceAPI } from '../services/api';
import { normalizeService } from '../services/serviceMapper';
import { SERVICE_CATEGORIES, normalizeCategory } from '../constants/serviceCategories';

export default function Services() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const categoryCounts = services.reduce((counts, service) => {
    const category = normalizeCategory(service.category);
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  const categories = ['All', ...SERVICE_CATEGORIES.filter((category) => categoryCounts[category])];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategory = params.get('category');

    if (urlCategory && categories.includes(urlCategory)) {
      setActiveCategory(urlCategory);
    } else if (urlCategory) {
      setActiveCategory('All');
    }
  }, [location.search, categories]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      try {
        const response = await serviceAPI.getAll({ page: 1, limit: 200 });
        const items = response.data?.data?.items || [];
        setServices(items.map(normalizeService));
      } catch (_error) {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const filtered = services.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="services-page">
      <Navbar />

      {/* Hero */}
      <section className="services-page__hero">
        <div className="services-page__hero-grid" />
        <div className="services-page__hero-inner">
          <h1 className="services-page__title">
            All CA Services
          </h1>
          <p className="services-page__subtitle">
            Expert chartered accountant services for every financial and compliance need.
          </p>
          {/* Search */}
          <div className="services-page__search-wrap">
            <Search size={18} className="services-page__search-icon" />
            <input
              className="services-page__search-input"
              placeholder="Search services (e.g. GST, ITR, Company...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="services-page__hero-wave">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 30C480 60 240 0 0 30L0 60Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="services-page__body">
        <div className="services-page__body-inner">
          {/* Category filter */}
          <div className="services-page__categories">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`services-page__category-btn ${activeCategory === cat ? 'is-active' : ''}`}
              >
                {cat} {cat === 'All' ? `(${services.length})` : `(${categoryCounts[cat] || 0})`}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="services-page__result-count">
            {loadingServices ? 'Loading services...' : `${filtered.length} service${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          {/* Grid */}
          {loadingServices ? (
            <div className="services-page__loading">Fetching services...</div>
          ) : filtered.length > 0 ? (
            <div className="services-page__grid">
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="services-page__empty">
              <div className="services-page__empty-icon">🔍</div>
              <h3 className="services-page__empty-title">No services found</h3>
              <p className="services-page__empty-copy">Try a different search term or category.</p>
              <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="services-page__clear-btn">Clear filters</button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
