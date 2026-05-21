import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Tag, FileText, Send, Loader2 } from 'lucide-react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import Button from '../components/Button';
import { SERVICES } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { requestAPI, serviceAPI, userAPI } from '../services/api';
import { normalizeService } from '../services/serviceMapper';
import DynamicForm from '../components/DynamicForm';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loadingService, setLoadingService] = useState(true);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', message: '' });
  // Dynamic form state
  const [dynamicFormData, setDynamicFormData] = useState({});
  const [dynamicFormError, setDynamicFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [selectedSavedDocuments, setSelectedSavedDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [showSavedDocuments, setShowSavedDocuments] = useState(false);
  const [loadingSavedDocuments, setLoadingSavedDocuments] = useState(false);

  useEffect(() => {
    const fetchServiceData = async () => {
      setLoadingService(true);

      try {
        const serviceResponse = await serviceAPI.getById(id);
        const fetchedService = normalizeService(serviceResponse.data?.data?.service);
        setService(fetchedService);

        const relatedResponse = await serviceAPI.getAll({
          category: fetchedService.category,
          page: 1,
          limit: 20,
        });

        const relatedItems = (relatedResponse.data?.data?.items || [])
          .map(normalizeService)
          .filter((item) => item.id !== fetchedService.id)
          .slice(0, 2);

        setRelatedServices(relatedItems);
      } catch (_error) {
        const fallback = SERVICES.find((item) => item.id === id);

        if (fallback) {
          setService(normalizeService(fallback));
          setRelatedServices(
            SERVICES
              .filter((item) => item.category === fallback.category && item.id !== fallback.id)
              .map(normalizeService)
              .slice(0, 2),
          );
        } else {
          setService(null);
          setRelatedServices([]);
        }
      } finally {
        setLoadingService(false);
      }
    };

    fetchServiceData();
  }, [id]);

  useEffect(() => {
    const fetchSavedDocuments = async () => {
      if (!user) {
        setSavedDocuments([]);
        setSelectedSavedDocuments([]);
        return;
      }

      setLoadingSavedDocuments(true);

      try {
        const response = await userAPI.getMyDocuments();
        setSavedDocuments(response.data?.data?.items || []);
      } catch {
        setSavedDocuments([]);
      } finally {
        setLoadingSavedDocuments(false);
      }
    };

    fetchSavedDocuments();
  }, [user]);

  const toggleSavedDocument = (url) => {
    setSelectedSavedDocuments((prev) => (
      prev.includes(url)
        ? prev.filter((item) => item !== url)
        : [...prev, url]
    ));
  };

  const handleNewDocumentPick = (e) => {
    const picked = Array.from(e.target.files || []);
    setNewDocuments((prev) => [...prev, ...picked]);
    e.target.value = '';
  };

  if (loadingService) {
    return (
      <div className="service-detail-page service-detail-page--loading">
        <Navbar />
        <div className="service-detail-status-wrap">
          <div className="service-detail-status-row">
            <Loader2 size={20} className="service-detail-status-row__spinner" />
            <span>Loading service details...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-detail-page service-detail-page--not-found">
        <Navbar />
        <div className="service-detail-status-wrap">
          <div className="service-detail-not-found">
            <div className="service-detail-not-found__emoji">😕</div>
            <h2 className="service-detail-not-found__title">Service Not Found</h2>
            <p className="service-detail-not-found__copy">This service doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/services')}>Back to Services</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);

    // Validate dynamic form if schema exists
    if (service.formSchema && Array.isArray(service.formSchema.fields)) {
      for (const field of service.formSchema.fields) {
        if (field.required && (dynamicFormData[field.name] === undefined || dynamicFormData[field.name] === '' || dynamicFormData[field.name] == null)) {
          setDynamicFormError(`Please fill out the required field: ${field.label}`);
          setSubmitting(false);
          return;
        }
      }
    }
    setDynamicFormError('');

    try {
      const payload = new FormData();
      payload.append('serviceId', service._id || service.id);
      payload.append('serviceTitle', service.title);
      payload.append('serviceCategory', service.category);
      payload.append('servicePrice', String(service.price));
      payload.append('serviceDescription', service.fullDescription || service.description);
      // Merge basic and dynamic form data
      payload.append('details', JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        ...dynamicFormData,
      }));
      payload.append('selectedSavedDocuments', JSON.stringify(selectedSavedDocuments));

      newDocuments.forEach((file) => {
        payload.append('documents', file);
      });

      // Attach files from dynamic form fields
      if (service.formSchema && Array.isArray(service.formSchema.fields)) {
        for (const field of service.formSchema.fields) {
          if (field.type === 'file' && dynamicFormData[field.name]) {
            payload.append('dynamicDocuments', dynamicFormData[field.name]);
          }
        }
      }

      await requestAPI.create(payload);

      setSubmitted(true);
      setSelectedSavedDocuments([]);
      setNewDocuments([]);
      setDynamicFormData({});
      toast.success('Application submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not submit request. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="service-detail-page">
      <Navbar />
      <div className="service-detail-main">
        {/* Breadcrumb */}
        <div className="service-detail-breadcrumb-wrap">
          <nav className="service-detail-breadcrumb">
            <Link to="/" className="service-detail-breadcrumb__link">Home</Link>
            <span>/</span>
            <Link to="/services" className="service-detail-breadcrumb__link">Services</Link>
            <span>/</span>
            <span className="service-detail-breadcrumb__current">{service.title}</span>
          </nav>
        </div>

        <div className="service-detail-container">
          <div className="service-detail-layout">
            {/* Main content */}
            <div className="service-detail-content">
              <button onClick={() => navigate('/services')} className="service-detail-back-btn">
                <ArrowLeft size={16} /> Back to Services
              </button>

              {/* Header card */}
              <div className="service-detail-card service-detail-card--hero">
                <div className="service-detail-hero__head">
                  <div className="service-detail-hero__icon">{service.icon}</div>
                  <div className="service-detail-hero__title-wrap">
                    <div className="service-detail-hero__tags">
                      <span className="service-detail-tag service-detail-tag--category">{service.category}</span>
                      {service.popular && <span className="service-detail-tag service-detail-tag--popular">⭐ Popular</span>}
                    </div>
                    <h1 className="service-detail-hero__title">{service.title}</h1>
                  </div>
                </div>

                <div className="service-detail-meta">
                  <div className="service-detail-meta__item">
                    <Clock size={16} className="service-detail-meta__icon" />
                    <span className="service-detail-meta__text">Processing: <strong>{service.duration}</strong></span>
                  </div>
                  <div className="service-detail-meta__item">
                    <Tag size={16} className="service-detail-meta__icon" />
                    <span className="service-detail-meta__text">Category: <strong>{service.category}</strong></span>
                  </div>
                </div>

                <p className="service-detail-hero__description">{service.fullDescription}</p>
              </div>

              {/* Documents required */}
              <div className="service-detail-card">
                <div className="service-detail-section-head">
                  <div className="service-detail-section-icon">
                    <FileText size={16} className="service-detail-section-icon__svg" />
                  </div>
                  <h2 className="service-detail-section-title">Documents Required</h2>
                </div>
                <div className="service-detail-doc-grid">
                  {service.documents.length > 0 ? (
                    service.documents.map((doc) => (
                      <div key={doc} className="service-detail-doc-item">
                        <CheckCircle2 size={16} className="service-detail-doc-item__icon" />
                        <span className="service-detail-doc-item__text">{doc}</span>
                      </div>
                    ))
                  ) : (
                    <p className="service-detail-doc-empty">Document list will be shared after initial consultation.</p>
                  )}
                </div>
                <div className="service-detail-note">
                  <p className="service-detail-note__text">📌 Don't worry if you don't have all documents ready. Our team will guide you through the process and help you gather what's needed.</p>
                </div>
              </div>

              {/* Process */}
              <div className="service-detail-card">
                <h2 className="service-detail-section-title service-detail-section-title--spaced">How It Works</h2>
                <div className="service-detail-process-list">
                  {['Submit your application & documents', 'CA reviews and processes your request', 'Track real-time status on your dashboard', 'Receive confirmation and final documents'].map((step, i) => (
                    <div key={step} className="service-detail-process-item">
                      <div className="service-detail-process-item__index">{i + 1}</div>
                      <div className="service-detail-process-item__body">
                        <p className="service-detail-process-item__text">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="service-detail-sidebar">
              {/* Pricing + Apply */}
              <div className="service-detail-card service-detail-card--sticky">
                <div className="service-detail-pricing">
                  <p className="service-detail-pricing__label">Starting at</p>
                  <p className="service-detail-pricing__value">₹{service.price.toLocaleString('en-IN')}</p>
                  <p className="service-detail-pricing__hint">All inclusive · No hidden charges</p>
                </div>

                {submitted ? (
                  <div className="service-detail-submitted">
                    <div className="service-detail-submitted__icon-wrap">
                      <CheckCircle2 size={32} className="service-detail-submitted__icon" />
                    </div>
                    <h3 className="service-detail-submitted__title">Application Submitted!</h3>
                    <p className="service-detail-submitted__copy">Our CA team will contact you within 24 hours.</p>
                    <Link to="/dashboard" className="service-detail-submitted__link">View Dashboard →</Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="service-detail-form">

                    <div className="service-detail-form__field">
                      <label className="service-detail-form__label">Full Name</label>
                      <input className="service-detail-form__input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="service-detail-form__field">
                      <label className="service-detail-form__label">Email</label>
                      <input type="email" className="service-detail-form__input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="service-detail-form__field">
                      <label className="service-detail-form__label">Phone Number</label>
                      <input type="tel" className="service-detail-form__input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                    </div>
                    <div className="service-detail-form__field">
                      <label className="service-detail-form__label">Additional Notes</label>
                      <textarea className="service-detail-form__input service-detail-form__input--textarea" rows={3} placeholder="Any specific requirements..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                    </div>

                    {/* Dynamic Form Fields */}
                    {service.formSchema && Array.isArray(service.formSchema.fields) && (
                      <div className="service-detail-form__field">
                        <label className="service-detail-form__label">Additional Information</label>
                        <DynamicForm
                          schema={service.formSchema}
                          value={dynamicFormData}
                          onChange={setDynamicFormData}
                          hideSubmit
                        />
                        {dynamicFormError && <p className="service-detail-form__error">{dynamicFormError}</p>}
                      </div>
                    )}

                    <div className="service-detail-form__field">
                      <label className="service-detail-form__label">Attach Documents</label>

                      <div className="service-detail-form__doc-actions">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowSavedDocuments((prev) => !prev)}
                        >
                          Use Saved Documents
                        </Button>

                        <label className="service-detail-form__doc-upload">
                          Upload New Doc
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleNewDocumentPick}
                          />
                        </label>
                      </div>

                      {showSavedDocuments && (
                        <div className="service-detail-form__saved-docs">
                          {loadingSavedDocuments ? (
                            <p>Loading saved documents...</p>
                          ) : savedDocuments.length === 0 ? (
                            <p>No saved documents in profile.</p>
                          ) : (
                            savedDocuments.map((doc) => (
                              <label key={doc.id} className="service-detail-form__saved-doc-item">
                                <input
                                  type="checkbox"
                                  checked={selectedSavedDocuments.includes(doc.url)}
                                  onChange={() => toggleSavedDocument(doc.url)}
                                />
                                <span>{doc.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}

                      {selectedSavedDocuments.length > 0 && (
                        <p className="service-detail-form__doc-count">
                          Saved selected: {selectedSavedDocuments.length}
                        </p>
                      )}

                      {newDocuments.length > 0 && (
                        <div className="service-detail-form__new-doc-list">
                          {newDocuments.map((file, index) => (
                            <p key={`${file.name}-${index}`} className="service-detail-form__new-doc-item">
                              {file.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button type="submit" variant="primary" className="service-detail-form__submit" loading={submitting}>
                      <Send size={16} /> {user ? 'Submit Application' : 'Sign In to Apply'}
                    </Button>
                  </form>
                )}

                <div className="service-detail-guarantees">
                  {['Free initial consultation', '100% satisfaction guarantee', 'Refund policy available'].map((t) => (
                    <div key={t} className="service-detail-guarantee-item">
                      <CheckCircle2 size={12} className="service-detail-guarantee-item__icon" /> {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related */}
              {relatedServices.length > 0 && (
                <div className="service-detail-related">
                  <h3 className="service-detail-related__title">Related Services</h3>
                  {relatedServices.map((s) => (
                    <Link key={s.id || s._id} to={`/service/${s.id || s._id}`} className="service-detail-related__card">
                      <div className="service-detail-related__card-row">
                        <span className="service-detail-related__icon">{s.icon}</span>
                        <div>
                          <p className="service-detail-related__name">{s.title}</p>
                          <p className="service-detail-related__price">₹{s.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
