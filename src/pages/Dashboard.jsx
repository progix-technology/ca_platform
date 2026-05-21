import { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Menu, Bell, FileText, Upload, CheckCircle2, Clock, Loader2, ArrowRight, Plus, AlertCircle, MessageSquare, X, Trash2, Archive, RefreshCcw, Download, Pencil, Shield, DollarSign } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../services/mockData';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { notificationAPI, requestAPI, serviceAPI, userAPI } from '../services/api';
import CompletedList from './CompletedList';
import { normalizeService } from '../services/serviceMapper';
import { downloadInvoice } from '../services/api';

const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/\s+/g, '');

const normalizeWorkflowStatus = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === 'submitted' || normalized === 'pending') {
    return 'submitted';
  }

  if (normalized === 'inreview' || normalized === 'inprogress') {
    return 'inreview';
  }

  if (normalized === 'actionneeded' || normalized === 'needmoreinfo') {
    return 'actionneeded';
  }

  if (normalized === 'approved') {
    return 'approved';
  }

  if (normalized === 'paid') {
    return 'paid';
  }

  if (normalized === 'filed') {
    return 'filed';
  }

  if (normalized === 'completed') {
    return 'completed';
  }

  if (normalized === 'renewed') {
    return 'renewed';
  }

  if (normalized === 'servicerenewing') {
    return 'servicerenewing';
  }

  return 'submitted';
};

const isActuallyCompletedRequest = (request) => {
  if (!request) return false;

  const statusKey = normalizeWorkflowStatus(request.status);
  if (statusKey === 'filed') return false;
  if (statusKey === 'completed') return true;

  return Array.isArray(request.statusTimeline)
    && request.statusTimeline.some((item) => normalizeWorkflowStatus(item.status) === 'completed');
};

const formatRequestCode = (requestId) => {
  if (!requestId) {
    return 'REQ-NA';
  }

  return requestId.startsWith('REQ-')
    ? requestId
    : `REQ-${requestId.slice(-6).toUpperCase()}`;
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read image file'));
  reader.readAsDataURL(file);
});

function StatusBadge({ status }) {
  const normalizedStatus = normalizeWorkflowStatus(status);

  const map = {
    submitted: <span className="badge-pending"><Clock size={10} /> Submitted</span>,
    inreview: <span className="badge-inprogress"><Loader2 size={10} className="dashboard-status-spinner" /> In Review</span>,
    actionneeded: <span className="badge bg-amber-100 text-amber-700">Action Needed</span>,
    paid: <span className="badge bg-blue-100 text-blue-700"><DollarSign size={10} /> Paid</span>,
    filed: <span className="badge bg-fuchsia-100 text-fuchsia-700"><FileText size={10} /> Filed</span>,
    rejected: <span className="badge bg-rose-100 text-rose-700">Rejected</span>,
    approved: <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> Approved</span>,
    completed: <span className="badge-completed"><CheckCircle2 size={10} /> Completed</span>,
  };

  return map[normalizedStatus] || <span className="dashboard-status-fallback">{status}</span>;
}

function Overview({ requests, loadingRequests, onOpenRequest }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const fallbackPopularServices = useMemo(() => SERVICES.filter((service) => service.popular), []);
  const fallbackQuickServices = fallbackPopularServices.length > 0 ? fallbackPopularServices : SERVICES;
  const [quickServices, setQuickServices] = useState(() => fallbackQuickServices.slice(0, 4));
  const [hasMoreQuickServices, setHasMoreQuickServices] = useState(() => fallbackQuickServices.length > 4);

  const requestRows = useMemo(() => (
    requests.map((req) => {
      const requestId = req._id || req.id || '';
      const serviceTitle = req.service?.title || req.service || 'N/A';
      const statusKey = normalizeWorkflowStatus(req.status);
      const completed = isActuallyCompletedRequest(req);

      return {
        requestId,
        requestCode: formatRequestCode(requestId),
        serviceTitle,
        status: req.status,
        statusKey,
        completed,
        createdAt: req.createdAt || req.date,
        amount: Number(req.service?.price || req.amount || 0),
      };
    })
  ), [requests]);

  // Hide completed requests from main dashboard list unless the completed filter is active
  const filteredRequests = useMemo(() => (
    requestRows
      .filter((row) => (filter === 'completed' ? row.completed : !row.completed))
      .filter((row) => row.serviceTitle.toLowerCase().includes(search.toLowerCase().trim()))
      .filter((row) => (filter === 'all' ? true : row.statusKey === filter))
  ), [requestRows, search, filter]);

  const completedRequests = useMemo(() => requestRows.filter((row) => row.completed).length, [requestRows]);
  const totalRequests = requestRows.length;
  const progressPercent = totalRequests === 0 ? 0 : Math.round((completedRequests / totalRequests) * 100);

  const pendingPaymentRequests = useMemo(() => (
    requests.filter((req) => normalizeWorkflowStatus(req.status) === 'approved' && !req.payment?.paidAt)
  ), [requests]);

  const stats = useMemo(() => ([
    {
      label: 'Submitted',
      value: requestRows.filter((row) => row.statusKey === 'submitted' && !row.completed).length,
      icon: Clock,
      tone: 'pending',
      type: 'submitted',
    },
    {
      label: 'In Review',
      value: requestRows.filter((row) => row.statusKey === 'inreview' && !row.completed).length,
      icon: Loader2,
      tone: 'progress',
      type: 'inreview',
    },
    {
      label: 'Action Needed',
      value: requestRows.filter((row) => row.statusKey === 'actionneeded' && !row.completed).length,
      icon: AlertCircle,
      tone: 'progress',
      type: 'actionneeded',
    },
    {
      label: 'Approved',
      value: requestRows.filter((row) => row.statusKey === 'approved' && !row.completed).length,
      icon: CheckCircle2,
      tone: 'completed',
      type: 'approved',
    },
    {
      label: 'Filed',
      value: requestRows.filter((row) => row.statusKey === 'filed' && !row.completed).length,
      icon: FileText,
      tone: 'progress',
      type: 'filed',
    },
    {
      label: 'Completed',
      value: requestRows.filter((row) => row.completed).length,
      icon: CheckCircle2,
      tone: 'completed',
      type: 'completed',
    },
  ]), [requestRows]);

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'In Review', value: 'inreview' },
    { label: 'Action Needed', value: 'actionneeded' },
    { label: 'Approved', value: 'approved' },
    { label: 'Filed', value: 'filed' },
    { label: 'Completed', value: 'completed' },
  ];

  useEffect(() => {
    const fetchQuickServices = async () => {
      try {
        const response = await serviceAPI.getAll({ page: 1, limit: 50 });
        const normalized = (response.data?.data?.items || []).map(normalizeService);
        const popularServices = normalized.filter((service) => service.popular);
        const source = popularServices.length > 0 ? popularServices : normalized;

        if (source.length > 0) {
          setQuickServices(source.slice(0, 4));
          setHasMoreQuickServices(source.length > 4);
        }
      } catch {
        // Keep fallback mock services when API is unavailable.
      }
    };

    fetchQuickServices();
  }, []);

  const handleCopy = async (value) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied!');
    } catch {
      toast.error('Could not copy the request ID.');
    }
  };

  const handleOpenRequest = (requestId) => {
    if (!requestId) {
      toast.error('Request details are not available.');
      return;
    }

    onOpenRequest(requestId);
  };

  const savedAddress = [
    user?.address?.street,
    user?.address?.city,
    user?.address?.zipCode,
    user?.address?.country,
  ].filter(Boolean).join(', ');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 16) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  return (
    <div className="dashboard-overview">
      <div className="dashboard-overview__welcome">
        <div className="dashboard-overview__welcome-head">
          <div>
            <p className="dashboard-overview__welcome-greet">{getGreeting()},</p>
            <h2 className="dashboard-overview__welcome-name">
              {user?.name || 'User'} <span className="wave">👋</span>
            </h2>
            <p className="dashboard-overview__welcome-address">{savedAddress || 'No saved address yet.'}</p>
            <p className="dashboard-overview__welcome-copy">Here's an overview of your account activity.</p>
          </div>

          <div className="dashboard-overview__welcome-meta flex flex-col lg:flex-row items-stretch gap-4">
            <div className="dashboard-overview__progress-card flex-1">
              <div className="dashboard-overview__progress-top">
                <p className="dashboard-overview__progress-title">Overall Progress</p>
                <span className="dashboard-overview__progress-value">{progressPercent}%</span>
              </div>
              <div className="dashboard-overview__progress-track">
                <div className="dashboard-overview__progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <Button variant="secondary" size="sm" className="mt-auto" onClick={() => navigate('/dashboard/profile')}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-overview__insights-layout">
        <div className="dashboard-overview__insights-left">
          <div className="dashboard-overview__quick-section">
            <div className="dashboard-overview__quick-head">
              <h3 className="dashboard-overview__quick-title">Popular Services</h3>
              {hasMoreQuickServices ? (
                <button
                  type="button"
                  className="dashboard-overview__quick-view-all"
                  onClick={() => navigate('/services')}
                >
                  View All <ArrowRight size={14} />
                </button>
              ) : null}
            </div>
            <div className="dashboard-overview__quick-grid dashboard-overview__quick-grid--compact">
              {quickServices.map((s) => (
                <div key={s.id || s._id} className="dashboard-quick-card" onClick={() => navigate(`/service/${s.id || s._id}`)}>
                  <span className="dashboard-quick-card__icon">{s.icon}</span>
                  <div className="dashboard-quick-card__body">
                    <p className="dashboard-quick-card__name">{s.title}</p>
                    <p className="dashboard-quick-card__price">₹{Number(s.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <ArrowRight size={16} className="dashboard-quick-card__arrow" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-overview__insights-right">
          <div className="dashboard-overview__stats-grid">
            {stats.map(({ label, value, icon: Icon, tone, type }) => (
              <button
                type="button"
                key={label}
                className={`dashboard-stat-card dashboard-stat-card--${tone} ${filter === type ? 'is-active' : ''}`}
                onClick={() => setFilter(type)}
              >
                <div className={`dashboard-stat-card__icon dashboard-stat-card__icon--${tone}`}>
                  <Icon size={20} />
                </div>
                <div className="dashboard-stat-card__body">
                  <p className="dashboard-stat-card__value">{value}</p>
                  <p className="dashboard-stat-card__label">{label}</p>
                </div>
              </button>
            ))}
          </div>

          {pendingPaymentRequests.length > 0 && (
            <div className="dashboard-approved-pending-section">
              <div className="dashboard-approved-pending-header">
                <div>
                  <p className="dashboard-approved-pending-title">Pending Payment</p>
                  <p className="dashboard-approved-pending-copy">Approved services waiting for payment.</p>
                </div>
              </div>
              <div className="dashboard-approved-pending-grid">
                {pendingPaymentRequests.map((req) => (
                  <button
                    key={req._id || req.id}
                    type="button"
                    className="dashboard-approved-pending-card"
                    onClick={() => handleOpenRequest(req._id || req.id)}
                  >
                    <div className="dashboard-approved-pending-card__icon">📄</div>
                    <div className="dashboard-approved-pending-card__body">
                      <p className="dashboard-approved-pending-card__title">{req.service?.title || 'Service'}</p>
                      <p className="dashboard-approved-pending-card__subtitle">for {req.user?.name || req.details?.name || 'your business'}</p>
                      <p className="dashboard-approved-pending-card__status">Payment pending</p>
                    </div>
                    <div className="dashboard-approved-pending-card__amount">₹{Number(req.service?.price || req.amount || 0).toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-overview__controls-shell">
        <div className="dashboard-search">
          <input
            className="dashboard-search__input"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="dashboard-filters">
          {filterOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`dashboard-filter-btn ${filter === option.value ? 'is-active' : ''}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loadingRequests ? (
        <div className="skeleton-loader">Loading applications...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">No services found</div>
      ) : (
        <div className="dashboard-table-panel">
          <div className="dashboard-table-panel__head">
            <h3 className="dashboard-table-panel__title">Recent Applications</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/services')}>
              View all <ArrowRight size={14} />
            </Button>
          </div>

          <div className="dashboard-table-panel__table-wrap">
            <table className="dashboard-table">
              <thead className="dashboard-table__head">
                <tr>
                  <th className="dashboard-table__head-cell">ID</th>
                  <th className="dashboard-table__head-cell">Service</th>
                  <th className="dashboard-table__head-cell">Status</th>
                  <th className="dashboard-table__head-cell">Date</th>
                  <th className="dashboard-table__head-cell">Amount</th>
                </tr>
              </thead>

              <tbody className="dashboard-table__body">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.requestCode}
                    className="dashboard-table__row dashboard-table__row--clickable"
                    onClick={() => handleOpenRequest(req.requestId)}
                  >
                    <td className="dashboard-table__cell dashboard-table__cell--mono dashboard-table__cell--muted">
                      <button
                        type="button"
                        className="dashboard-table__copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(req.requestCode);
                        }}
                      >
                        {req.requestCode}
                      </button>
                    </td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">{req.serviceTitle}</td>
                    <td className="dashboard-table__cell"><StatusBadge status={req.status} /></td>
                    <td className="dashboard-table__cell">{req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="dashboard-table__cell dashboard-table__cell--strong">₹{req.amount.toLocaleString('en-IN')}</td>
                    {/* Archive icon button for completed services */}
                    {/* Removed Add to Completed List (archive) button */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function MyServices({ requests, loadingRequests, onOpenRequest, fetchMyRequests }) {
  const navigate = useNavigate();
  const visibleRequests = requests.filter((req) => !isActuallyCompletedRequest(req));

  return (
    <div className="dashboard-services-page">
      <div className="dashboard-services-page__head">
        <h2 className="dashboard-services-page__title">My Applications</h2>
      </div>
      <div className="dashboard-table-panel">
        {loadingRequests ? (
          <div className="dashboard-services-page__empty-state">
            <p>Loading applications...</p>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="dashboard-services-page__empty-state">
            <div className="dashboard-services-page__empty-box">
              <h3>Apply for a new service</h3>
              <p>There are no active applications yet. Browse services and apply for the one you need.</p>
              <Button variant="primary" onClick={() => navigate('/services')}>
                Browse Services
              </Button>
            </div>
          </div>
        ) : (
          <div className="dashboard-table-panel__table-wrap">
            <table className="dashboard-table">
              <thead className="dashboard-table__head">
                <tr>
                  <th className="dashboard-table__head-cell">Request ID</th>
                  <th className="dashboard-table__head-cell">Service</th>
                  <th className="dashboard-table__head-cell">Date Applied</th>
                  <th className="dashboard-table__head-cell">Amount</th>
                  <th className="dashboard-table__head-cell">Status</th>
                  <th className="dashboard-table__head-cell">Action</th>
                </tr>
              </thead>
              <tbody className="dashboard-table__body">
                {visibleRequests.map((req) => {
                  const requestId = req._id || req.id;
                  const appliedDate = req.createdAt || req.date;
                  const serviceTitle = req.service?.title || req.service || 'N/A';
                  const amount = Number(req.service?.price || req.amount || 0);

                  return (
                    <tr
                      key={requestId}
                      className="dashboard-table__row dashboard-table__row--clickable"
                      onClick={() => onOpenRequest && onOpenRequest(requestId)}
                    >
                      <td className="dashboard-table__cell dashboard-table__cell--mono dashboard-table__cell--muted">{formatRequestCode(requestId)}</td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">{serviceTitle}</td>
                      <td className="dashboard-table__cell">{appliedDate ? new Date(appliedDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">₹{amount.toLocaleString('en-IN')}</td>
                      <td className="dashboard-table__cell"><StatusBadge status={req.status} /></td>
                      <td className="dashboard-table__cell">
                        <button
                          type="button"
                          className="dashboard-table__delete-btn"
                          title="Delete Service"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
                              try {
                                await requestAPI.delete(requestId);
                                toast.success('Service deleted successfully');
                                // Auto-refresh the list from backend
                                await fetchMyRequests();
                                onOpenRequest && onOpenRequest('');
                              } catch (err) {
                                toast.error('Failed to delete service');
                              }
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RenewedServices({ requests, loadingRequests, onOpenRequest }) {
  const renewedRequests = requests.filter((req) => {
    const statusKey = normalizeWorkflowStatus(req.status);
    return statusKey === 'renewed'
      || statusKey === 'servicerenewing'
      || (req.renewalRequested === true && statusKey === 'completed');
  });

  return (
    <div className="dashboard-services-page">
      <div className="dashboard-services-page__head">
        <h2 className="dashboard-services-page__title">Renewed Services</h2>
        <p className="dashboard-services-page__subtitle">Shows services already renewed or currently in the renewal workflow.</p>
      </div>

      <div className="dashboard-table-panel">
        {loadingRequests ? (
          <div className="dashboard-services-page__empty-state">
            <p>Loading renewed services...</p>
          </div>
        ) : renewedRequests.length === 0 ? (
          <div className="dashboard-services-page__empty-state">
            <div className="dashboard-services-page__empty-box">
              <h3>No renewed services found</h3>
              <p>Renewed or renewal-requested services will appear here once available.</p>
            </div>
          </div>
        ) : (
          <div className="dashboard-table-panel__table-wrap">
            <table className="dashboard-table">
              <thead className="dashboard-table__head">
                <tr>
                  <th className="dashboard-table__head-cell">Request ID</th>
                  <th className="dashboard-table__head-cell">Service</th>
                  <th className="dashboard-table__head-cell">Renewal Status</th>
                  <th className="dashboard-table__head-cell">Amount</th>
                  <th className="dashboard-table__head-cell">Action</th>
                </tr>
              </thead>
              <tbody className="dashboard-table__body">
                {renewedRequests.map((req) => {
                  const requestId = req._id || req.id;
                  const serviceTitle = req.service?.title || req.service || 'N/A';
                  const amount = Number(req.service?.price || req.amount || 0);

                  return (
                    <tr
                      key={requestId}
                      className="dashboard-table__row dashboard-table__row--clickable"
                      onClick={() => onOpenRequest && onOpenRequest(requestId)}
                    >
                      <td className="dashboard-table__cell dashboard-table__cell--mono dashboard-table__cell--muted">{formatRequestCode(requestId)}</td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">{serviceTitle}</td>
                      <td className="dashboard-table__cell"><StatusBadge status={req.status} /></td>
                      <td className="dashboard-table__cell dashboard-table__cell--strong">₹{amount.toLocaleString('en-IN')}</td>
                      <td className="dashboard-table__cell">
                        <button
                          type="button"
                          className="dashboard-table__delete-btn"
                          title="View details"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRequest && onOpenRequest(requestId);
                          }}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestTimelineModal({
  isOpen,
  request,
  currentUser,
  loading,
  commentDraft,
  onCommentDraftChange,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  submittingComment,
  updatingCommentId,
  deletingCommentId,
  onPayNow,
  processingPayment,
  onClose,
}) {
  const timeline = Array.isArray(request?.statusTimeline)
    ? [...request.statusTimeline].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const comments = Array.isArray(request?.comments)
    ? [...request.comments]
      .filter((comment) => !comment.isInternal)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  const requestId = request?._id || request?.id;
  const requestCode = formatRequestCode(requestId || '');
  const workflowStatus = normalizeWorkflowStatus(request?.status);
  const requestAmount = Number(request?.service?.price || request?.amount || 0);
  const currentUserId = String(currentUser?._id || currentUser?.id || '');
  const lastApprovedTimelineIndex = timeline.reduce(
    (acc, item, index) => (normalizeWorkflowStatus(item.status) === 'approved' ? index : acc),
    -1,
  );
  const lastCompletedTimelineIndex = timeline.reduce(
    (acc, item, index) => (normalizeWorkflowStatus(item.status) === 'completed' ? index : acc),
    -1,
  );
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [cardPaymentDetails, setCardPaymentDetails] = useState({
    holderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [upiPaymentDetails, setUpiPaymentDetails] = useState({
    upiId: '',
  });
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [archivingCompleted, setArchivingCompleted] = useState(false);
  const [isArchived, setIsArchived] = useState(request?.isArchivedCompleted || false);
  // Archive completed request handler
  const handleArchiveCompleted = async () => {
    if (!requestId) return;
    setArchivingCompleted(true);
    try {
      await requestAPI.archiveCompleted(requestId);
      setIsArchived(true);
      toast.success('Added to Completed List!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save to completed list.');
    } finally {
      setArchivingCompleted(false);
    }
  };
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    setShowPaymentMethods(false);
    setSelectedPaymentMethod('');
    setCardPaymentDetails({
      holderName: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
    });
    setUpiPaymentDetails({
      upiId: '',
    });
    setPaymentSuccessData(null);
    setEditingCommentId('');
    setEditingCommentText('');
  }, [isOpen, requestId]);

  if (!isOpen) {
    return null;
  }

  const getCommentAuthorLabel = (comment) => {
    const role = String(comment?.author?.role || '').toLowerCase();
    const authorId = String(comment?.author?._id || comment?.author || '');

    if (role === 'admin') {
      return comment?.author?.name ? `${comment.author.name} (Admin)` : 'Admin';
    }

    if (authorId && currentUserId && authorId === currentUserId) {
      return comment?.author?.name ? `${comment.author.name} (You)` : 'You';
    }

    return comment?.author?.name || 'Team';
  };

  const canManageComment = (comment) => {
    const authorId = String(comment?.author?._id || comment?.author || '');
    return Boolean(authorId && currentUserId && authorId === currentUserId);
  };

  const handleStartEditComment = (comment) => {
    const commentId = String(comment?._id || '');
    if (!commentId || !canManageComment(comment)) {
      return;
    }

    setEditingCommentId(commentId);
    setEditingCommentText(String(comment?.text || ''));
  };

  const handleCancelEditComment = () => {
    setEditingCommentId('');
    setEditingCommentText('');
  };

  const handleSaveEditedComment = async () => {
    const commentId = editingCommentId;
    const text = editingCommentText.trim();

    if (!commentId) {
      return;
    }

    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }

    const success = await onUpdateComment(commentId, text);
    if (success) {
      setEditingCommentId('');
      setEditingCommentText('');
    }
  };

  const handleDeleteComment = async (comment) => {
    const commentId = String(comment?._id || '');
    if (!commentId || !canManageComment(comment)) {
      return;
    }

    const shouldDelete = window.confirm('Delete this comment? This action cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    const success = await onDeleteComment(commentId);
    if (success && editingCommentId === commentId) {
      setEditingCommentId('');
      setEditingCommentText('');
    }
  };

  const handleTogglePaymentMethods = () => {
    setShowPaymentMethods((prev) => !prev);
  };

  const handleCardDetailChange = (field, value) => {
    if (field === 'cardNumber') {
      const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 16);
      const grouped = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      setCardPaymentDetails((prev) => ({ ...prev, cardNumber: grouped }));
      return;
    }

    if (field === 'expiry') {
      const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 4);
      const formatted = digitsOnly.length > 2
        ? `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`
        : digitsOnly;

      setCardPaymentDetails((prev) => ({ ...prev, expiry: formatted }));
      return;
    }

    if (field === 'cvv') {
      const digitsOnly = String(value || '').replace(/\D/g, '').slice(0, 4);
      setCardPaymentDetails((prev) => ({ ...prev, cvv: digitsOnly }));
      return;
    }

    setCardPaymentDetails((prev) => ({ ...prev, [field]: value }));
  };

  const getDownloadFileName = (dispositionHeader, fallbackName) => {
    if (!dispositionHeader) {
      return fallbackName;
    }

    const utfMatch = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
    if (utfMatch?.[1]) {
      return decodeURIComponent(utfMatch[1]);
    }

    const basicMatch = dispositionHeader.match(/filename="?([^";]+)"?/i);
    if (basicMatch?.[1]) {
      return basicMatch[1];
    }

    return fallbackName;
  };

  const handleDownloadPaymentData = async () => {
    try {
      if (!requestId) {
        toast.error('Request details are not available for export.');
        return;
      }

      // Call the new invoice download API
      const response = await downloadInvoice(requestId);
      if (!response || response.status !== 200) {
        toast.error('Could not download invoice. Please try again.');
        return;
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const filename = getDownloadFileName(response.headers['content-disposition'], `${requestCode || 'invoice'}.pdf`);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success('Invoice download started');
    } catch {
      toast.error('Could not download data. Please try again.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method.');
      return;
    }

    let paymentPayload = {
      method: selectedPaymentMethod,
      details: {},
    };

    if (selectedPaymentMethod === 'card') {
      const holderName = cardPaymentDetails.holderName.trim();
      const cardDigits = cardPaymentDetails.cardNumber.replace(/\s+/g, '');
      const expiry = cardPaymentDetails.expiry.trim();
      const cvv = cardPaymentDetails.cvv.trim();

      if (holderName.length < 2) {
        toast.error('Please enter card holder name.');
        return;
      }

      if (!/^\d{16}$/.test(cardDigits)) {
        toast.error('Please enter a valid 16-digit card number.');
        return;
      }

      if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
        toast.error('Please enter a valid expiry in MM/YY format.');
        return;
      }

      if (!/^\d{3,4}$/.test(cvv)) {
        toast.error('Please enter a valid CVV.');
        return;
      }

      paymentPayload = {
        method: 'card',
        details: {
          holderName,
          cardNumberMasked: `**** **** **** ${cardDigits.slice(-4)}`,
          expiry,
        },
      };
    }

    if (selectedPaymentMethod === 'upi') {
      const upiId = upiPaymentDetails.upiId.trim();
      if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        toast.error('Please enter a valid UPI ID.');
        return;
      }

      paymentPayload = {
        method: 'upi',
        details: {
          upiId,
        },
      };
    }

    const result = await onPayNow(paymentPayload);

    if (result?.success) {
      setPaymentSuccessData({
        method: paymentPayload.method,
        details: paymentPayload.details,
        request: result.request || request,
        paidAt: new Date().toISOString(),
      });
      setShowPaymentMethods(false);
      setSelectedPaymentMethod('');
    }
  };

  const renderApprovedPaymentBox = () => {
    if (paymentSuccessData) {
      return (
        <div className="dashboard-request-modal__section dashboard-request-modal__payment dashboard-request-modal__payment-inline">
          <div className="dashboard-request-modal__payment-success">
            <p className="dashboard-request-modal__success-title">Payment Success</p>
            <p className="dashboard-request-modal__success-copy">
              Your payment was successful. You can now download your submitted service information, documents, and payment details.
            </p>
          </div>
        </div>
      );
    }

    // Only show Pay Now if status is approved and payment is not done
    if (workflowStatus !== 'approved' || request?.payment?.paidAt) {
      return null;
    }

    return (
      <div className="dashboard-request-modal__section dashboard-request-modal__payment dashboard-request-modal__payment-inline">
        <h4 className="dashboard-request-modal__section-title">Payment Pending</h4>
        <p className="dashboard-request-modal__payment-copy">
          Your request is approved. Complete payment to move this request to Completed.
        </p>
        <div className="dashboard-request-modal__payment-row">
          <p className="dashboard-request-modal__payment-amount">Amount: ₹{requestAmount.toLocaleString('en-IN')}</p>
          <Button
            variant={showPaymentMethods ? 'outline' : 'primary'}
            loading={processingPayment}
            onClick={handleTogglePaymentMethods}
            disabled={processingPayment}
          >
            {showPaymentMethods ? 'Hide Options' : 'Pay Now'}
          </Button>
        </div>

        {showPaymentMethods && (
          <>
            <div className="dashboard-request-modal__payment-methods">
              <button
                type="button"
                className={`dashboard-request-modal__payment-method ${selectedPaymentMethod === 'card' ? 'is-active' : ''}`}
                onClick={() => setSelectedPaymentMethod('card')}
              >
                <p className="dashboard-request-modal__payment-method-title">Card Payment</p>
                <p className="dashboard-request-modal__payment-method-copy">Credit / Debit / RuPay cards</p>
              </button>

              <button
                type="button"
                className={`dashboard-request-modal__payment-method ${selectedPaymentMethod === 'upi' ? 'is-active' : ''}`}
                onClick={() => setSelectedPaymentMethod('upi')}
              >
                <p className="dashboard-request-modal__payment-method-title">UPI Payment</p>
                <p className="dashboard-request-modal__payment-method-copy">Google Pay, PhonePe, BHIM and more</p>
              </button>
            </div>

            {selectedPaymentMethod === 'card' && (
              <div className="dashboard-request-modal__payment-details">
                <p className="dashboard-request-modal__payment-details-title">Enter card details</p>
                <div className="dashboard-request-modal__payment-form-grid">
                  <label className="dashboard-request-modal__payment-field dashboard-request-modal__payment-field--full">
                    <span className="dashboard-request-modal__payment-label">Card Holder Name</span>
                    <input
                      type="text"
                      className="dashboard-request-modal__payment-input"
                      placeholder="Name on card"
                      value={cardPaymentDetails.holderName}
                      onChange={(event) => handleCardDetailChange('holderName', event.target.value)}
                    />
                  </label>

                  <label className="dashboard-request-modal__payment-field dashboard-request-modal__payment-field--full">
                    <span className="dashboard-request-modal__payment-label">Card Number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="dashboard-request-modal__payment-input"
                      placeholder="1234 5678 9012 3456"
                      value={cardPaymentDetails.cardNumber}
                      onChange={(event) => handleCardDetailChange('cardNumber', event.target.value)}
                    />
                  </label>

                  <label className="dashboard-request-modal__payment-field">
                    <span className="dashboard-request-modal__payment-label">Expiry (MM/YY)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="dashboard-request-modal__payment-input"
                      placeholder="08/29"
                      value={cardPaymentDetails.expiry}
                      onChange={(event) => handleCardDetailChange('expiry', event.target.value)}
                    />
                  </label>

                  <label className="dashboard-request-modal__payment-field">
                    <span className="dashboard-request-modal__payment-label">CVV</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      className="dashboard-request-modal__payment-input"
                      placeholder="123"
                      value={cardPaymentDetails.cvv}
                      onChange={(event) => handleCardDetailChange('cvv', event.target.value)}
                    />
                  </label>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'upi' && (
              <div className="dashboard-request-modal__payment-details">
                <p className="dashboard-request-modal__payment-details-title">Enter UPI details</p>
                <label className="dashboard-request-modal__payment-field dashboard-request-modal__payment-field--full">
                  <span className="dashboard-request-modal__payment-label">UPI ID</span>
                  <input
                    type="text"
                    className="dashboard-request-modal__payment-input"
                    placeholder="name@bank"
                    value={upiPaymentDetails.upiId}
                    onChange={(event) => setUpiPaymentDetails({ upiId: event.target.value })}
                  />
                </label>
              </div>
            )}

            <div className="dashboard-request-modal__payment-actions">
              <Button
                variant="primary"
                loading={processingPayment}
                onClick={handleConfirmPayment}
                disabled={!selectedPaymentMethod}
              >
                {selectedPaymentMethod === 'card'
                  ? 'Pay via Card'
                  : selectedPaymentMethod === 'upi'
                    ? 'Pay via UPI'
                    : 'Select a payment method'}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-request-modal" role="dialog" aria-modal="true">
      <div className="dashboard-request-modal__backdrop" onClick={onClose} />
      <div className="dashboard-request-modal__panel">
        <div className="dashboard-request-modal__head">
          <div>
            <p className="dashboard-request-modal__subtitle">Request Timeline</p>
            <h3 className="dashboard-request-modal__title">{requestCode}</h3>
          </div>
          <button type="button" className="dashboard-request-modal__close" onClick={onClose} aria-label="Close request details">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="dashboard-request-modal__state">Loading request details...</div>
        ) : !request ? (
          <div className="dashboard-request-modal__state">Could not load this request.</div>
        ) : (
          <div className="dashboard-request-modal__body">
            <div className="dashboard-request-modal__summary">
              <div>
                <p className="dashboard-request-modal__label">Service</p>
                <p className="dashboard-request-modal__value">{request.service?.title || 'N/A'}</p>
              </div>
              <div>
                <p className="dashboard-request-modal__label">Current Status</p>
                <StatusBadge status={request.status} />
              </div>
              <div>
                <p className="dashboard-request-modal__label">Applied On</p>
                <p className="dashboard-request-modal__value">{request.createdAt ? new Date(request.createdAt).toLocaleString('en-IN') : '-'}</p>
              </div>
            </div>

            <div className="dashboard-request-modal__section">
              <h4 className="dashboard-request-modal__section-title">Status Timeline</h4>
              {timeline.length === 0 ? (
                <p className="dashboard-request-modal__empty">Timeline updates will appear here.</p>
              ) : (
                <div className="dashboard-request-modal__timeline">
                  {timeline.map((item, index) => (
                    <div key={`${item.status}-${item.createdAt || index}`} className="dashboard-request-modal__timeline-item">
                      <div className="dashboard-request-modal__timeline-dot" />
                      <div>
                        <p className="dashboard-request-modal__timeline-status">{item.status}</p>
                        <p className="dashboard-request-modal__timeline-meta">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '-'}
                        </p>
                        {(index === lastCompletedTimelineIndex
                          && normalizeWorkflowStatus(item.status) === 'completed'
                          && workflowStatus === 'completed') && (
                            <button
                              type="button"
                              className="dashboard-request-modal__approved-download"
                              onClick={handleDownloadPaymentData}
                            >
                              Download Your Data
                            </button>
                          )}
                        {item.note && <p className="dashboard-request-modal__timeline-note">{item.note}</p>}
                        {index === lastApprovedTimelineIndex
                          && normalizeWorkflowStatus(item.status) === 'approved'
                          && (workflowStatus === 'approved' || Boolean(paymentSuccessData))
                          && renderApprovedPaymentBox()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-request-modal__section">
              <h4 className="dashboard-request-modal__section-title">Comments</h4>
              {comments.length === 0 ? (
                <p className="dashboard-request-modal__empty">No comments yet.</p>
              ) : (
                <div className="dashboard-request-modal__comments">
                  {comments.map((comment) => {
                    const commentId = String(comment?._id || '');
                    const isOwner = canManageComment(comment);
                    const isEditing = commentId && editingCommentId === commentId;
                    const isUpdating = commentId && updatingCommentId === commentId;
                    const isDeleting = commentId && deletingCommentId === commentId;

                    return (
                      <div key={comment._id || `${comment.createdAt}-${comment.text}`} className="dashboard-request-modal__comment-item">
                        <div className="dashboard-request-modal__comment-head">
                          <p className="dashboard-request-modal__comment-author">{getCommentAuthorLabel(comment)}</p>
                          <div className="dashboard-request-modal__comment-head-right">
                            <p className="dashboard-request-modal__comment-time">{comment.createdAt ? new Date(comment.createdAt).toLocaleString('en-IN') : '-'}</p>
                            {isOwner && (
                              <div className="dashboard-request-modal__comment-tools">
                                {!isEditing && (
                                  <button
                                    type="button"
                                    className="dashboard-request-modal__comment-tool"
                                    onClick={() => handleStartEditComment(comment)}
                                    disabled={Boolean(updatingCommentId || deletingCommentId)}
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="dashboard-request-modal__comment-tool dashboard-request-modal__comment-tool--danger"
                                  onClick={() => handleDeleteComment(comment)}
                                  disabled={Boolean(updatingCommentId || deletingCommentId)}
                                >
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <>
                            <textarea
                              className="dashboard-request-modal__comment-edit-input"
                              rows={3}
                              value={editingCommentText}
                              onChange={(event) => setEditingCommentText(event.target.value)}
                              disabled={isUpdating}
                            />
                            <div className="dashboard-request-modal__comment-edit-actions">
                              <Button variant="outline" size="sm" onClick={handleCancelEditComment} disabled={isUpdating}>
                                Cancel
                              </Button>
                              <Button variant="primary" size="sm" onClick={handleSaveEditedComment} loading={isUpdating}>
                                Save
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="dashboard-request-modal__comment-text">{comment.text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dashboard-request-modal__section">
              <label className="dashboard-request-modal__comment-label">
                <MessageSquare size={14} /> Add Comment
              </label>
              <textarea
                className="dashboard-request-modal__comment-input"
                rows={3}
                placeholder="Share additional details with the review team"
                value={commentDraft}
                onChange={(event) => onCommentDraftChange(event.target.value)}
              />
              <div className="dashboard-request-modal__comment-actions">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button variant="primary" loading={submittingComment} onClick={onSubmitComment}>Post Comment</Button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function Documents() {
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [activeRequiredDoc, setActiveRequiredDoc] = useState('');
  const [manualDocName, setManualDocName] = useState('');
  const [manualDocFile, setManualDocFile] = useState(null);
  const [activeDocFilter, setActiveDocFilter] = useState('all');
  const [showCustomUploadModal, setShowCustomUploadModal] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const fileInputRef = useRef(null);
  const activeRequiredDocRef = useRef('');

  const requiredDocumentTypes = [
    { key: 'PAN Card', description: 'PAN card copy or scanned image' },
    { key: 'Aadhaar Card', description: 'Aadhaar front/back copy' },
    { key: 'GST Certificate', description: 'GST registration proof' },
    { key: 'Bank Statement', description: 'Recent bank statement (last 3 months)' },
  ];

  const normalizeDocName = (name) => String(name || '').trim().toLowerCase();
  const findSavedDocument = (label) => savedDocuments.find((doc) => {
    const normalizedName = normalizeDocName(doc.name);
    const normalizedLabel = normalizeDocName(label);
    return normalizedName.includes(normalizedLabel) || normalizedLabel.includes(normalizedName);
  });

  const customDocumentTypes = useMemo(() => savedDocuments
    .filter((doc) => !requiredDocumentTypes.some((docType) => {
      const savedLabel = normalizeDocName(doc.name);
      const typeLabel = normalizeDocName(docType.key);
      return savedLabel.includes(typeLabel) || typeLabel.includes(savedLabel);
    }))
    .map((doc) => ({
      key: doc.name,
      description: 'Custom uploaded document',
      url: doc.url,
      savedDoc: doc,
    })), [savedDocuments, requiredDocumentTypes]);

  const requiredUploadedCount = requiredDocumentTypes.filter((docType) => Boolean(findSavedDocument(docType.key))).length;

  const totalDocuments = savedDocuments.length;
  const recentDocuments = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return savedDocuments.filter((doc) => doc.uploadedAt && new Date(doc.uploadedAt) >= cutoff);
  }, [savedDocuments]);
  const verifiedDocuments = savedDocuments;
  const pendingReviewCount = Math.max(requiredDocumentTypes.length - requiredUploadedCount, 0);

  const filteredRequiredDocumentTypes = requiredDocumentTypes.filter((docType) => {
    const savedDoc = findSavedDocument(docType.key);

    if (activeDocFilter === 'verified') {
      return Boolean(savedDoc);
    }

    if (activeDocFilter === 'pending') {
      return !savedDoc;
    }

    if (activeDocFilter === 'recent') {
      return Boolean(savedDoc && recentDocuments.some((recent) => recent.id === savedDoc.id || recent.url === savedDoc.url));
    }

    return true;
  });

  const filteredCustomDocs = customDocumentTypes.filter((customDoc) => {
    if (activeDocFilter === 'pending') {
      return false;
    }

    if (activeDocFilter === 'verified') {
      return true;
    }

    if (activeDocFilter === 'recent') {
      return recentDocuments.some((recent) => recent.id === customDoc.savedDoc.id || recent.url === customDoc.savedDoc.url);
    }

    return true;
  });

  const fetchSavedDocuments = async () => {
    setLoadingDocs(true);

    try {
      const response = await userAPI.getMyDocuments();
      setSavedDocuments(response.data?.data?.items || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not load saved documents.';
      toast.error(message);
      setSavedDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchSavedDocuments();
  }, []);

  const uploadFilesDirectly = async (selectedFiles) => {
    const selectedDocLabel = activeRequiredDocRef.current || activeRequiredDoc;
    if (!selectedDocLabel) {
      toast.error('Please select a document card first.');
      return;
    }

    const items = Array.from(selectedFiles).map((file, index) => {
      if (index === 0) {
        return { file, name: selectedDocLabel };
      }
      return file;
    });

    setUploadingDocs(true);

    try {
      const response = await userAPI.uploadMyDocuments(items);
      setSavedDocuments(response.data?.data?.items || []);
      toast.success(`${items.length} document(s) uploaded successfully!`);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not upload documents.';
      toast.error(message);
    } finally {
      setUploadingDocs(false);
      activeRequiredDocRef.current = '';
      setActiveRequiredDoc('');
    }
  };

  const handleInput = (e) => {
    const selected = e.target.files || [];
    if (selected.length > 0) {
      uploadFilesDirectly(selected);
    }
    e.target.value = '';
  };

  const handleSelectRequiredDoc = (label) => {
    activeRequiredDocRef.current = label;
    setActiveRequiredDoc(label);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 10);
    }
  };

  const handleManualFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setManualDocFile(file);
    event.target.value = '';
  };

  const openCustomUploadModal = () => {
    setManualDocName('');
    setManualDocFile(null);
    setShowCustomUploadModal(true);
  };

  const closeCustomUploadModal = () => {
    setShowCustomUploadModal(false);
  };

  const handleDeleteDocument = (doc) => {
    setConfirmDeleteDoc(doc);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteDoc?.id) {
      setConfirmDeleteDoc(null);
      return;
    }

    setUploadingDocs(true);

    try {
      const response = await userAPI.deleteMyDocument(confirmDeleteDoc.id);
      setSavedDocuments(response.data?.data?.items || []);
      toast.success('Document deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not delete document.';
      toast.error(message);
    } finally {
      setUploadingDocs(false);
      setConfirmDeleteDoc(null);
    }
  };

  const uploadManualDocument = async () => {
    if (!manualDocName.trim()) {
      toast.error('Please enter a field name for the document.');
      return;
    }

    if (!manualDocFile) {
      toast.error('Please choose a document to upload.');
      return;
    }

    setUploadingDocs(true);

    try {
      await userAPI.uploadMyDocuments([{ file: manualDocFile, name: manualDocName.trim() }]);
      const response = await userAPI.getMyDocuments();
      setSavedDocuments(response.data?.data?.items || []);
      setManualDocName('');
      setManualDocFile(null);
      toast.success('Document uploaded successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not upload document.';
      toast.error(message);
    } finally {
      setUploadingDocs(false);
    }
    setShowCustomUploadModal(false);
  };

  return (
    <div className="dashboard-documents-page">
      <h2 className="dashboard-documents-page__title">Document Upload Portal</h2>

      <div className="dashboard-documents-summary">
        {[
          { key: 'all', label: 'Total Documents', value: totalDocuments, icon: FileText },
          { key: 'verified', label: 'Verified', value: verifiedDocuments.length, icon: CheckCircle2 },
          { key: 'pending', label: 'Pending Review', value: pendingReviewCount, icon: Clock },
          { key: 'recent', label: 'Recently Uploaded', value: recentDocuments.length, icon: Download },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              className={`dashboard-documents-summary__card ${activeDocFilter === card.key ? 'is-active' : ''}`}
              onClick={() => setActiveDocFilter(card.key)}
            >
              <div className="dashboard-documents-summary__icon-wrap">
                <Icon size={22} />
              </div>
              <span className="dashboard-documents-summary__label">{card.label}</span>
              <span className="dashboard-documents-summary__value">{card.value}</span>
            </button>
          );
        })}
      </div>

      <div className="dashboard-required-documents">
        <div className="dashboard-required-documents__header">
          <div>
            <h3 className="dashboard-required-documents__title">Upload essential documents</h3>
            <p className="dashboard-required-documents__copy">Upload PAN, Aadhaar, GST and Bank Statement files so your request processing stays fast.</p>
          </div>
          <div className="dashboard-required-documents__status-summary">
            <span className="dashboard-required-documents__status-chip">{requiredUploadedCount}/{requiredDocumentTypes.length} uploaded</span>
          </div>
        </div>

        <div className="dashboard-required-documents__progress">
          <div className="dashboard-required-documents__progress-track">
            <div
              className="dashboard-required-documents__progress-fill"
              style={{ width: `${(requiredUploadedCount / requiredDocumentTypes.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="dashboard-required-documents__grid">
          <button
            type="button"
            className="dashboard-required-documents__card dashboard-required-documents__add-card"
            onClick={openCustomUploadModal}
          >
            <div className="dashboard-required-documents__card-meta">
              <div>
                <p className="dashboard-required-documents__card-label">Add more documents</p>
                <p className="dashboard-required-documents__card-description">Upload a custom document</p>
              </div>
              <span className="dashboard-required-documents__plus-icon">
                <Plus size={18} />
              </span>
            </div>
          </button>

          {filteredRequiredDocumentTypes.map((docType) => {
            const savedDoc = findSavedDocument(docType.key);
            const isActive = activeRequiredDoc === docType.key;

            return (
              <button
                type="button"
                key={docType.key}
                className={`dashboard-required-documents__card ${isActive ? 'is-active' : ''}`}
                onClick={() => !savedDoc && handleSelectRequiredDoc(docType.key)}
              >
                <div className="dashboard-required-documents__card-meta">
                  <div>
                    <p className="dashboard-required-documents__card-label">{docType.key}</p>
                    <p className="dashboard-required-documents__card-description">{docType.description}</p>
                  </div>
                  <span className={`dashboard-required-documents__status ${savedDoc ? 'is-saved' : 'is-missing'}`}>
                    {savedDoc ? 'Uploaded' : 'Missing'}
                  </span>
                </div>

                <div className="dashboard-required-documents__actions">
                  {savedDoc ? (
                    <>
                      <a
                        className="dashboard-required-documents__view-link"
                        href={savedDoc.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View file
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteDocument({
                            id: savedDoc.id,
                            name: savedDoc.name,
                            label: docType.key,
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  ) : (
                    <p className="dashboard-required-documents__upload-hint">
                      {isActive ? 'Now pick a file to upload' : 'Click card, then Browse Files below'}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          {filteredCustomDocs.map((customDoc) => (
            <div key={customDoc.key} className="dashboard-required-documents__card">
              <div className="dashboard-required-documents__card-meta">
                <div>
                  <p className="dashboard-required-documents__card-label">{customDoc.key}</p>
                  <p className="dashboard-required-documents__card-description">{customDoc.description}</p>
                </div>
                <span className="dashboard-required-documents__status is-saved">Uploaded</span>
              </div>
              <div className="dashboard-required-documents__actions">
                <a
                  className="dashboard-required-documents__view-link"
                  href={customDoc.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View file
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDocument({ id: customDoc.savedDoc.id, name: customDoc.key, label: customDoc.key })}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {showCustomUploadModal && (
        <div className="dashboard-custom-upload-modal">
          <div className="dashboard-custom-upload-modal__backdrop" onClick={closeCustomUploadModal} />
          <div className="dashboard-custom-upload-modal__panel">
            <div className="dashboard-custom-upload-modal__header">
              <div>
                <h3 className="dashboard-custom-upload-modal__title">Upload custom document</h3>
                <p className="dashboard-custom-upload-modal__subtitle">Enter the field name above, then select a file below.</p>
              </div>
              <button type="button" className="dashboard-custom-upload-modal__close" onClick={closeCustomUploadModal}>
                <X size={18} />
              </button>
            </div>
            <div className="dashboard-required-documents__manual-card-form">
              <input
                type="text"
                className="dashboard-required-documents__new-card-input"
                value={manualDocName}
                onChange={(e) => setManualDocName(e.target.value)}
                placeholder="Document field name (e.g. Rental Agreement)"
              />
              <label className="dashboard-required-documents__upload-btn dashboard-required-documents__manual-browse">
                Browse documents
                <input
                  type="file"
                  hidden
                  onChange={handleManualFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
              {manualDocFile && (
                <p className="dashboard-required-documents__new-file-name">Selected file: {manualDocFile.name}</p>
              )}
              <Button
                variant="primary"
                onClick={uploadManualDocument}
                loading={uploadingDocs}
                disabled={uploadingDocs}
              >
                Upload document
              </Button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleInput}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleInput}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {confirmDeleteDoc && (
        <div className="dashboard-delete-modal">
          <div className="dashboard-delete-modal__content">
            <p className="dashboard-delete-modal__title">Can you delete your document?</p>
            <p className="dashboard-delete-modal__message">This will remove <strong>{confirmDeleteDoc.name}</strong> permanently.</p>
            <div className="dashboard-delete-modal__actions">
              <Button variant="outline" onClick={() => setConfirmDeleteDoc(null)}>
                No
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirmed} loading={uploadingDocs}>
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Profile({ onOpenRequest }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const buildForm = (sourceUser) => ({
    name: sourceUser?.name || '',
    email: sourceUser?.email || '',
    phone: sourceUser?.phone || '',
    pan: sourceUser?.pan || '',
    street: sourceUser?.address?.street || '',
    city: sourceUser?.address?.city || '',
    country: sourceUser?.address?.country || 'India',
    zipCode: sourceUser?.address?.zipCode || '',
    companyName: sourceUser?.companyName || '',
    nicCode: sourceUser?.nicCode || '',
    paidUpCapital: sourceUser?.paidUpCapital || '',
    authorizedCapital: sourceUser?.authorizedCapital || '',
    incorporationDate: sourceUser?.incorporationDate || '',
    registrationNumber: sourceUser?.registrationNumber || '',
  });

  const [form, setForm] = useState(buildForm(user));
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user?.profileImage || '');
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled !== false);
  const [myRequests, setMyRequests] = useState([]);

  const profileFields = {
    personal: [
      { label: 'Full Name', field: 'name', type: 'text', placeholder: 'Rahul Sharma' },
      { label: 'Email', field: 'email', type: 'email', placeholder: 'you@example.com' },
      { label: 'Phone', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
      { label: 'PAN Number', field: 'pan', type: 'text', placeholder: 'ABCDE1234F' },
    ],
    address: [
      { label: 'Street Address', field: 'street', type: 'text', placeholder: '221B Baker Street' },
      { label: 'City', field: 'city', type: 'text', placeholder: 'New Delhi' },
      { label: 'Country', field: 'country', type: 'text', placeholder: 'India' },
      { label: 'ZIP Code', field: 'zipCode', type: 'text', placeholder: '110001' },
    ],
    registration: [
      { label: 'Proposed Company Name', field: 'companyName', type: 'text', placeholder: 'Example Pvt Ltd' },
      { label: 'NIC Code', field: 'nicCode', type: 'text', placeholder: '12345' },
      { label: 'Paid Up Share Capital', field: 'paidUpCapital', type: 'text', placeholder: '₹10,00,000' },
      { label: 'Authorized Share Capital', field: 'authorizedCapital', type: 'text', placeholder: '₹15,00,000' },
      { label: 'Incorporation Date', field: 'incorporationDate', type: 'date', placeholder: 'YYYY-MM-DD' },
      { label: 'Registration Number', field: 'registrationNumber', type: 'text', placeholder: 'U12345DL2024PTC012345' },
    ],
    compliance: [
      { label: 'PAN', field: 'panCompliance', type: 'text', placeholder: 'ABCFG1234J' },
      { label: 'CIN', field: 'cin', type: 'text', placeholder: 'U12345DL2024PTC012345' },
      { label: 'GSTIN', field: 'gstin', type: 'text', placeholder: '07ABCDE1234F1Z5' },
      { label: 'TAN', field: 'tan', type: 'text', placeholder: 'DELZ12345A' },
      { label: 'PF Registration', field: 'pfRegistration', type: 'text', placeholder: 'DL/12345/6789' },
      { label: 'ESI Registration', field: 'esiRegistration', type: 'text', placeholder: '123456789012' },
      { label: 'ROC Filing Status', field: 'rocFilingStatus', type: 'text', placeholder: 'Pending / Filed' },
      { label: 'Audit Status', field: 'auditStatus', type: 'text', placeholder: 'Not specified' },
      { label: 'Annual Return Status', field: 'annualReturnStatus', type: 'text', placeholder: 'Not specified' },
    ],
  };

  const completedFields = Object.values({
    ...profileFields.personal.reduce((acc, item) => ({ ...acc, [item.field]: form[item.field] }), {}),
    ...profileFields.address.reduce((acc, item) => ({ ...acc, [item.field]: form[item.field] }), {}),
    ...profileFields.registration.reduce((acc, item) => ({ ...acc, [item.field]: form[item.field] }), {}),
    ...profileFields.compliance.reduce((acc, item) => ({ ...acc, [item.field]: form[item.field] }), {}),
  }).filter((value) => String(value).trim()).length;
  const totalFields = Object.values(profileFields).reduce((sum, section) => sum + section.length, 0);
  const profileCompletion = Math.round((completedFields / totalFields) * 100);

  const incompleteRequests = useMemo(() => myRequests.filter((request) => {
    const status = normalizeStatus(request.status);
    return status === 'approved' || status === 'inprogress';
  }), [myRequests]);

  useEffect(() => {
    const fetchMyProfile = async () => {
      setLoadingProfile(true);

      try {
        const response = await userAPI.getMe();
        const profileUser = response.data?.data?.user;

        if (profileUser) {
          setForm(buildForm(profileUser));
          setProfileImagePreview(profileUser.profileImage || '');
          setNotificationsEnabled(profileUser.notificationsEnabled !== false);
          updateUser(profileUser);
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Could not fetch your profile details.';
        toast.error(message);
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchMyRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await requestAPI.getMy();
        setMyRequests(response.data?.data?.items || []);
      } catch (error) {
        setMyRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchMyProfile();
    fetchMyRequests();
  }, []);

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be under 5MB.');
      return;
    }

    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(previewUrl);
    setRemoveProfileImage(false);
  };

  const handlePhotoRemove = () => {
    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(null);
    setProfileImagePreview('');
    setRemoveProfileImage(true);
  };

  const handleToggleNotifications = async () => {
    const nextValue = !notificationsEnabled;
    setNotificationsEnabled(nextValue);

    try {
      const response = await userAPI.updateMe({ notificationsEnabled: nextValue });
      const updatedUser = response.data?.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      }
    } catch (error) {
      setNotificationsEnabled(!nextValue);
      const message = error.response?.data?.message || error.message || 'Could not update notification settings.';
      toast.error(message);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    handleReset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);

    try {
      const safeString = (value) => String(value || '').trim();
      const payload = {
        name: safeString(form.name),
        email: safeString(form.email).toLowerCase(),
        phone: safeString(form.phone),
        pan: safeString(form.pan).toUpperCase(),
        address: {
          street: safeString(form.street),
          city: safeString(form.city),
          country: safeString(form.country),
          zipCode: safeString(form.zipCode),
        },
        companyName: safeString(form.companyName),
        nicCode: safeString(form.nicCode),
        paidUpCapital: safeString(form.paidUpCapital),
        authorizedCapital: safeString(form.authorizedCapital),
        incorporationDate: safeString(form.incorporationDate),
        registrationNumber: safeString(form.registrationNumber),
        panCompliance: safeString(form.panCompliance),
        cin: safeString(form.cin),
        gstin: safeString(form.gstin),
        tan: safeString(form.tan),
        pfRegistration: safeString(form.pfRegistration),
        esiRegistration: safeString(form.esiRegistration),
        rocFilingStatus: safeString(form.rocFilingStatus),
        auditStatus: safeString(form.auditStatus),
        annualReturnStatus: safeString(form.annualReturnStatus),
      };

      if (profileImageFile) {
        payload.profileImage = await fileToDataUrl(profileImageFile);
      } else if (removeProfileImage) {
        payload.profileImage = '';
      }

      const response = await userAPI.updateMe(payload);
      const updatedUser = response.data?.data?.user;

      if (updatedUser) {
        setForm(buildForm(updatedUser));
        setProfileImagePreview(updatedUser.profileImage || '');
        setProfileImageFile(null);
        setRemoveProfileImage(false);
        updateUser(updatedUser);
      }

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Could not update profile.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(buildForm(user));
    setProfileImagePreview(user?.profileImage || '');
    setProfileImageFile(null);
    setRemoveProfileImage(false);
    setActiveSection('personal');
  };

  return (
    <div className="dashboard-profile-page">
      <h2 className="dashboard-profile-page__title">Profile Settings</h2>

      {loadingProfile && <p className="dashboard-profile-page__loading">Loading profile details...</p>}

      <div className="dashboard-profile-summary">
        <div className="dashboard-profile-summary__card">
          <p className="dashboard-profile-summary__label">Profile completion</p>
          <div className="dashboard-profile-summary__score">{profileCompletion}%</div>
          <div className="dashboard-profile-summary__meter">
            <div className="dashboard-profile-summary__meter-fill" style={{ width: `${profileCompletion}%` }} />
          </div>
          <p className="dashboard-profile-summary__notice">Complete your profile to access faster onboarding and approvals.</p>
        </div>
        <div className="dashboard-profile-summary__card">
          <p className="dashboard-profile-summary__label">Account status</p>
          <strong className="dashboard-profile-summary__badge">Verified</strong>
          <p className="dashboard-profile-summary__info">Your account is active and ready to use.</p>
        </div>
        <div className="dashboard-profile-summary__card dashboard-profile-summary__card--action">
          <p className="dashboard-profile-summary__label">Notifications</p>
          <button
            type="button"
            className={`dashboard-profile-toggle ${notificationsEnabled ? 'is-on' : ''}`}
            onClick={handleToggleNotifications}
          >
            <span className="dashboard-profile-toggle__slider" />
          </button>
          <p className="dashboard-profile-summary__info">
            {notificationsEnabled ? 'Email updates enabled' : 'Email updates disabled'}
          </p>
        </div>
      </div>

      <div className="dashboard-profile-layout">
        <div className="dashboard-profile-left-column">
          <div className="dashboard-profile-card">
            <div className="dashboard-profile-card__identity-row">
              <div className="dashboard-profile-card__avatar">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="dashboard-profile-card__avatar-image" />
                ) : (
                  <span>{(form.name || user?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="dashboard-profile-card__identity-meta">
                <h3 className="dashboard-profile-card__name">{form.name || '-'}</h3>
                <p className="dashboard-profile-card__email">{form.email || '-'}</p>
                <div className="dashboard-profile-card__meta-tags">
                  <span className="dashboard-profile-card__tag">Premium Member</span>
                  <span className="dashboard-profile-card__tag">Secure login</span>
                </div>
              </div>
              <div className="dashboard-profile-card__photo-actions">
                {isEditing && (
                  <>
                    <label className="dashboard-profile-card__photo-btn">
                      Upload Photo
                      <input type="file" accept="image/*" className="dashboard-profile-card__photo-input" onChange={handlePhotoChange} />
                    </label>
                    {profileImagePreview && (
                      <button type="button" className="dashboard-profile-card__photo-clear" onClick={handlePhotoRemove}>
                        Remove
                      </button>
                    )}
                    <p className="dashboard-profile-card__photo-help">JPG, PNG, max 5MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="dashboard-profile-card__section-tabs">
              <button
                type="button"
                className={`dashboard-profile-tab ${activeSection === 'personal' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('personal')}
              >
                Personal Info
              </button>
              <button
                type="button"
                className={`dashboard-profile-tab ${activeSection === 'address' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('address')}
              >
                Address
              </button>
              <button
                type="button"
                className={`dashboard-profile-tab ${activeSection === 'registration' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('registration')}
              >
                Registration Details
              </button>
              <button
                type="button"
                className={`dashboard-profile-tab ${activeSection === 'compliance' ? 'is-active' : ''}`}
                onClick={() => setActiveSection('compliance')}
              >
                Compliance Details
              </button>
            </div>

            <div className="dashboard-profile-card__form-grid">
              {profileFields[activeSection].map(({ label, field, type, placeholder }) => (
                <div key={field} className="dashboard-profile-card__field">
                  <label className="dashboard-profile-card__label">{label}</label>
                  <input
                    type={type}
                    className="dashboard-profile-card__input"
                    placeholder={placeholder}
                    value={form[field]}
                    disabled={!isEditing}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <div className="dashboard-profile-card__actions">
              {isEditing ? (
                <>
                  <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </>
              ) : (
                <Button variant="ghost" onClick={handleStartEditing}>
                  <Pencil size={16} /> Edit profile
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-profile-right-panel">
          <div className="dashboard-profile-right-panel__header">
            <h3>Incomplete Services</h3>
            <p>Open applications still awaiting completion.</p>
          </div>
          {loadingRequests ? (
            <div className="dashboard-profile-right-panel__empty">Loading services...</div>
          ) : incompleteRequests.length === 0 ? (
            <div className="dashboard-profile-right-panel__empty">
              <p>Great job! There are no pending service updates at the moment.</p>
            </div>
          ) : (
            <ul className="dashboard-profile-right-panel__list">
              {incompleteRequests.slice(0, 4).map((request) => {
                const requestId = request._id || request.id || request.requestId;
                const title = request.service?.title || request.service || 'Service application';
                const status = request.status || 'Pending';
                return (
                  <li key={requestId} className="dashboard-profile-right-panel__item">
                    <div>
                      <p className="dashboard-profile-right-panel__item-title">{title}</p>
                      <p className="dashboard-profile-right-panel__item-status">{normalizeStatus(status)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onOpenRequest && onOpenRequest(requestId)}>
                      View
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="dashboard-profile-right-panel__footer">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/services')}>
              View all applications
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [deletingNotificationId, setDeletingNotificationId] = useState('');
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const notificationPanelRef = useRef(null);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [activeRequest, setActiveRequest] = useState(null);
  const [loadingRequestDetail, setLoadingRequestDetail] = useState(false);
  const [requestCommentDraft, setRequestCommentDraft] = useState('');
  const [submittingRequestComment, setSubmittingRequestComment] = useState(false);
  const [updatingRequestCommentId, setUpdatingRequestCommentId] = useState('');
  const [deletingRequestCommentId, setDeletingRequestCommentId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Move fetchMyRequests to top-level so it's always in scope
  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await requestAPI.getMy();
      setRequests(response.data?.data?.items || []);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not fetch your applications.';
      toast.error(message);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  useEffect(() => {
    const fetchMyNotifications = async () => {
      setLoadingNotifications(true);

      try {
        const response = await notificationAPI.getMy({ limit: 20 });
        setNotifications(response.data?.data?.items || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchMyNotifications();
  }, []);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) {
      return;
    }

    let isMounted = true;

    const syncCurrentUserProfile = async () => {
      try {
        const response = await userAPI.getMe();
        const profileUser = response.data?.data?.user;

        if (isMounted && profileUser) {
          updateUser({
            ...user,
            ...profileUser,
            id: profileUser.id || profileUser._id || user.id,
          });
        }
      } catch {
        // Ignore profile sync errors to keep dashboard responsive.
      }
    };

    syncCurrentUserProfile();

    return () => {
      isMounted = false;
    };
  }, [user?._id, user?.id]);

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [user?.profileImage]);

  const syncRequestSummary = (request) => {
    if (!request?._id && !request?.id) {
      return;
    }

    const requestId = request._id || request.id;
    setRequests((prev) => prev.map((item) => (
      String(item._id || item.id) === String(requestId)
        ? {
          ...item,
          status: request.status,
          reviewMessage: request.reviewMessage,
        }
        : item
    )));
  };

  const handleOpenRequest = async (requestId) => {
    if (!requestId) {
      return;
    }

    setSelectedRequestId(requestId);
    setActiveRequest(null);
    setRequestCommentDraft('');
    setUpdatingRequestCommentId('');
    setDeletingRequestCommentId('');
    setLoadingRequestDetail(true);

    try {
      const response = await requestAPI.getById(requestId);
      const request = response.data?.data?.request || null;

      setActiveRequest(request);
      syncRequestSummary(request);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not load request details.';
      toast.error(message);
      setActiveRequest(null);
    } finally {
      setLoadingRequestDetail(false);
    }
  };

  const handleCloseRequest = () => {
    setSelectedRequestId('');
    setActiveRequest(null);
    setRequestCommentDraft('');
    setUpdatingRequestCommentId('');
    setDeletingRequestCommentId('');
  };

  const handleSubmitRequestComment = async () => {
    const text = requestCommentDraft.trim();

    if (!selectedRequestId || !text) {
      toast.error('Please write a comment before posting.');
      return;
    }

    setSubmittingRequestComment(true);

    try {
      const response = await requestAPI.addComment(selectedRequestId, {
        text,
        isInternal: false,
      });

      const updatedRequest = response.data?.data?.request || null;
      setActiveRequest(updatedRequest);
      setRequestCommentDraft('');
      syncRequestSummary(updatedRequest);
      toast.success('Comment posted');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not post your comment.';
      toast.error(message);
    } finally {
      setSubmittingRequestComment(false);
    }
  };

  const handleUpdateRequestComment = async (commentId, text) => {
    if (!selectedRequestId || !commentId) {
      return false;
    }

    setUpdatingRequestCommentId(String(commentId));

    try {
      const response = await requestAPI.updateComment(selectedRequestId, commentId, { text });
      const updatedRequest = response.data?.data?.request || null;

      setActiveRequest(updatedRequest);
      syncRequestSummary(updatedRequest);
      toast.success('Comment updated');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Could not update comment.';
      toast.error(message);
      return false;
    } finally {
      setUpdatingRequestCommentId('');
    }
  };

  const handleDeleteRequestComment = async (commentId) => {
    if (!selectedRequestId || !commentId) {
      return false;
    }

    setDeletingRequestCommentId(String(commentId));

    try {
      const response = await requestAPI.deleteComment(selectedRequestId, commentId);
      const updatedRequest = response.data?.data?.request || null;

      setActiveRequest(updatedRequest);
      syncRequestSummary(updatedRequest);
      toast.success('Comment deleted');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Could not delete comment.';
      toast.error(message);
      return false;
    } finally {
      setDeletingRequestCommentId('');
    }
  };

  const handleCompletePayment = async (paymentPayload = null) => {
    if (!selectedRequestId) {
      return { success: false };
    }

    const paymentMethod = typeof paymentPayload === 'string'
      ? paymentPayload
      : paymentPayload?.method || '';

    setProcessingPayment(true);

    try {
      const response = await requestAPI.completePayment(selectedRequestId, {
        paymentMethod: paymentMethod || undefined,
        paymentDetails: paymentPayload?.details || {},
      });
      const updatedRequest = response.data?.data?.request || null;

      setActiveRequest(updatedRequest);
      syncRequestSummary(updatedRequest);
      toast.success(
        paymentMethod
          ? `Payment successful via ${paymentMethod === 'card' ? 'Card' : 'UPI'}. Request marked as completed.`
          : 'Payment successful. Request marked as completed.',
      );
      return { success: true, request: updatedRequest };
    } catch (error) {
      const message = error.response?.data?.message || 'Payment failed. Please try again.';
      toast.error(message);
      return { success: false };
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOpenNotifications = async () => {
    if (showNotificationPanel) {
      setShowNotificationPanel(false);
      return;
    }

    setShowNotificationPanel(true);

    if (unreadCount > 0) {
      try {
        await notificationAPI.markAllRead();
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      } catch {
        // Ignore read marker failure to avoid blocking the dropdown.
      }
    }
  };

  useEffect(() => {
    if (!showNotificationPanel) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const panelRoot = notificationPanelRef.current;
      if (panelRoot && !panelRoot.contains(event.target)) {
        setShowNotificationPanel(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showNotificationPanel]);

  const getInternalNavigateUrl = (url) => {
    if (!url) return url;
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Ignore invalid absolute URL and treat as path.
    }
    return url;
  };

  const handleNotificationClick = async (notification) => {
    const notificationId = notification._id || notification.id;

    if (notificationId && !notification.read) {
      try {
        await notificationAPI.markRead(notificationId);
      } catch {
        // Keep navigation behavior even if marking as read fails.
      }

      setNotifications((prev) => prev.map((item) => (
        (item._id || item.id) === notificationId
          ? { ...item, read: true }
          : item
      )));
    }

    setShowNotificationPanel(false);

    const renewUrl = notification.meta?.renewUrl;
    const requestId = notification.request?._id || notification.request?.id;
    if (renewUrl) {
      if (renewUrl.includes('/dashboard/renew-service')) {
        if (requestId) {
          try {
            await requestAPI.renew(requestId);
            toast.success('Renewal request submitted to admin.');
          } catch (err) {
            const message = err.response?.data?.message || 'Could not submit renewal request.';
            toast.error(message);
          }
        } else {
          navigate('/dashboard/completed-list');
        }
        return;
      }

      navigate(getInternalNavigateUrl(renewUrl));
      return;
    }

    if (requestId) {
      await handleOpenRequest(requestId);
      return;
    }

    const serviceId = notification.request?.service?._id;
    if (serviceId) {
      navigate(`/service/${serviceId}`);
    }
  };

  const handleDeleteNotification = async (notification, event) => {
    event.stopPropagation();

    const notificationId = String(notification?._id || notification?.id || '');
    if (!notificationId) {
      return;
    }

    setDeletingNotificationId(notificationId);

    try {
      await notificationAPI.remove(notificationId);
      setNotifications((prev) => prev.filter((item) => String(item._id || item.id) !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      const message = error.response?.data?.message || 'Could not delete notification.';
      toast.error(message);
    } finally {
      setDeletingNotificationId('');
    }
  };

  const handleOpenProfilePage = () => {
    setShowNotificationPanel(false);
    navigate('/dashboard/profile');
  };

  const avatarText = user?.name?.charAt(0)?.toUpperCase() || 'U';
  const avatarImage = !avatarImageFailed ? String(user?.profileImage || '').trim() : '';

  return (
    <div className="dashboard-page">
      {/* Sidebar - desktop */}
      <div className="dashboard-page__desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="dashboard-page__mobile-overlay">
          <div className="dashboard-page__mobile-sidebar-panel">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="dashboard-page__mobile-backdrop" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="dashboard-page__main-shell">
        {/* Topbar */}
        <header className="dashboard-page__topbar">
          <div className="dashboard-page__topbar-left">
            <button onClick={() => setSidebarOpen(true)} className="dashboard-page__menu-btn">
              <Menu size={20} />
            </button>
            <h1 className="dashboard-page__title">My Dashboard</h1>
          </div>
          <div className="dashboard-page__topbar-actions">
            <div className="dashboard-page__notify-wrap" ref={notificationPanelRef}>
              <button
                type="button"
                className="dashboard-page__notify-btn"
                onClick={handleOpenNotifications}
                aria-label="Open notifications"
              >
                <Bell size={20} className="dashboard-page__notify-icon" />
                {unreadCount > 0 && <span className="dashboard-page__notify-dot" />}
              </button>

              {showNotificationPanel && (
                <div className="dashboard-page__notif-dropdown">
                  <div className="dashboard-page__notif-head">
                    <p className="dashboard-page__notif-title">Notifications</p>
                    <span className="dashboard-page__notif-count">{notifications.length}</span>
                  </div>

                  <div className="dashboard-page__notif-list">
                    {loadingNotifications ? (
                      <p className="dashboard-page__notif-empty">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                      <p className="dashboard-page__notif-empty">No notifications yet.</p>
                    ) : (
                      notifications.map((notification) => {
                        const notificationId = String(notification._id || notification.id || '');
                        const isDeleting = deletingNotificationId === notificationId;

                        return (
                          <div
                            key={notification._id || notification.id}
                            className={`dashboard-page__notif-item ${notification.read ? '' : 'is-unread'}`}
                          >
                            <button
                              type="button"
                              className="dashboard-page__notif-item-main"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <p className="dashboard-page__notif-item-title">{notification.title || 'Update'}</p>
                              <p className="dashboard-page__notif-item-copy">{notification.message}</p>
                            </button>

                            {notification.meta?.renewUrl && (
                              <button
                                type="button"
                                className="dashboard-page__notif-renew-btn"
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  const requestId = notification.request?._id || notification.request?.id;
                                  if (notification.meta.renewUrl.includes('/dashboard/renew-service')) {
                                    if (requestId) {
                                      try {
                                        await requestAPI.renew(requestId);
                                        toast.success('Renewal request submitted to admin.');
                                      } catch (err) {
                                        const message = err.response?.data?.message || 'Could not submit renewal request.';
                                        toast.error(message);
                                      }
                                    } else {
                                      navigate('/dashboard/completed-list');
                                    }
                                    return;
                                  }
                                  navigate(getInternalNavigateUrl(notification.meta.renewUrl));
                                }}
                              >
                                Renew Service
                              </button>
                            )}

                            <button
                              type="button"
                              className="dashboard-page__notif-delete-btn"
                              onClick={(event) => handleDeleteNotification(notification, event)}
                              disabled={Boolean(deletingNotificationId)}
                              aria-label="Delete notification"
                            >
                              {isDeleting ? '...' : <Trash2 size={14} />}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="dashboard-page__user-avatar"
              onClick={handleOpenProfilePage}
              aria-label="Open profile page"
              title="Open profile"
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={user?.name ? `${user.name} profile` : 'Profile'}
                  className="dashboard-page__user-avatar-image"
                  onError={() => setAvatarImageFailed(true)}
                />
              ) : (
                avatarText
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard-page__content">
          <Routes>
            <Route index element={<Overview requests={requests} loadingRequests={loadingRequests} onOpenRequest={handleOpenRequest} />} />
            <Route path="services" element={<MyServices requests={requests} loadingRequests={loadingRequests} onOpenRequest={handleOpenRequest} fetchMyRequests={fetchMyRequests} />} />
            <Route path="renewed-services" element={<RenewedServices requests={requests} loadingRequests={loadingRequests} onOpenRequest={handleOpenRequest} />} />
            <Route path="completed-list" element={<CompletedList />} />
            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile onOpenRequest={handleOpenRequest} />} />
          </Routes>
        </main>
      </div>

      <RequestTimelineModal
        isOpen={Boolean(selectedRequestId)}
        request={activeRequest}
        currentUser={user}
        loading={loadingRequestDetail}
        commentDraft={requestCommentDraft}
        onCommentDraftChange={setRequestCommentDraft}
        onSubmitComment={handleSubmitRequestComment}
        onUpdateComment={handleUpdateRequestComment}
        onDeleteComment={handleDeleteRequestComment}
        submittingComment={submittingRequestComment}
        updatingCommentId={updatingRequestCommentId}
        deletingCommentId={deletingRequestCommentId}
        onPayNow={handleCompletePayment}
        processingPayment={processingPayment}
        onClose={handleCloseRequest}
      />
    </div>
  );
}
