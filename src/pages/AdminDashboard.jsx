import { Fragment, useEffect, useRef, useState } from 'react';
import DynamicDocumentUpload from '../components/DynamicDocumentUpload';
import FormBuilder from '../components/FormBuilder';
import { useNavigate, Routes, Route, useSearchParams, Outlet } from 'react-router-dom';
import { Menu, Users, FileText, DollarSign, TrendingUp, CheckCircle2, Clock, Loader2, Pencil, Trash2, Plus, X, RefreshCcw, Bell } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import AdminRenewals from './AdminRenewals';
import AdminSettings from './AdminSettings';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { requestAPI, serviceAPI, userAPI, notificationAPI } from '../services/api';
import { normalizeService } from '../services/serviceMapper';
import { SERVICE_CATEGORIES } from '../constants/serviceCategories';
import Subscription from './Subscription';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

const toAbsoluteFileUrl = (filePath) => {
  if (!filePath) {
    return '#';
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  return `${uploadsBaseUrl}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/\s+/g, '');

const normalizeWorkflowStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'submitted' || normalized === 'pending') return 'submitted';
  if (normalized === 'paid') return 'paid';
  if (normalized === 'inprogress') return 'inprogress';
  if (normalized === 'filed') return 'filed';
  if (normalized === 'inreview') return 'inreview';
  if (normalized === 'actionneeded' || normalized === 'needmoreinfo') return 'actionneeded';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'approved') return 'approved';
  if (normalized === 'completed') return 'completed';
  return normalized;
};

const formatRequestCode = (requestId) => {
  const id = String(requestId || '');
  if (!id) {
    return 'REQ-NA';
  }

  return id.startsWith('REQ-') ? id : `REQ-${id.slice(-6).toUpperCase()}`;
};

function StatusBadge({ status }) {
  const normalizedStatus = normalizeWorkflowStatus(status);
  if (String(status).trim().toLowerCase() === 'rejected') {
    return <span className="badge bg-rose-100 text-rose-700">Rejected</span>;
  }
  const map = {
    submitted: <span className="badge-pending"><Clock size={10} /> Submitted</span>,
    paid: <span className="badge bg-blue-100 text-blue-700"><DollarSign size={10} /> Paid</span>,
    inprogress: <span className="badge bg-indigo-100 text-indigo-700"><Loader2 size={10} className="animate-spin" /> In Progress</span>,
    filed: <span className="badge bg-fuchsia-100 text-fuchsia-700"><FileText size={10} /> Filed</span>,
    inreview: <span className="badge-inprogress"><Loader2 size={10} className="animate-spin" /> In Review</span>,
    actionneeded: <span className="badge bg-amber-100 text-amber-700">Action Needed</span>,
    rejected: <span className="badge bg-rose-100 text-rose-700">Rejected</span>,
    approved: <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> Approved</span>,
    completed: <span className="badge-completed"><CheckCircle2 size={10} /> Completed</span>,
    servicerenewing: <span className="badge bg-blue-100 text-blue-700"><RefreshCcw size={10} /> Service Renewing</span>,
    renewed: <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={10} /> Renewed</span>,
  };
  return map[normalizedStatus] || <span className="badge bg-slate-100 text-slate-600">{status}</span>;
}

function AdminOverview({ requests, loading, totalUsersCount, loadingUsersCount }) {
  const navigate = useNavigate();
  const pendingCount = requests.filter((request) => {
    const workflowStatus = normalizeWorkflowStatus(request.status);
    return workflowStatus === 'submitted' || workflowStatus === 'actionneeded';
  }).length;

  const totalRequestsCount = requests.length;

  const stats = [
    {
      label: 'Total Users',
      value: loadingUsersCount ? '...' : Number(totalUsersCount || 0).toLocaleString('en-IN'),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      change: 'Live from backend',
      to: '/admin/users',
    },
    {
      label: 'Total Requests',
      value: loading ? '...' : Number(totalRequestsCount || 0).toLocaleString('en-IN'),
      icon: FileText,
      color: 'bg-purple-50 text-purple-600',
      change: 'Live from backend',
      to: '/admin/requests',
    },
    { label: 'Revenue (MTD)', value: '₹8.4L', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', change: '+23% vs last month', to: '/admin/requests' },
    { label: 'Pending Actions', value: String(pendingCount), icon: TrendingUp, color: 'bg-amber-50 text-amber-600', change: 'Needs review', to: '/admin/requests' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h2>
        <p className="text-slate-500">Overview of platform activity and performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, change, to }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className="stat-card text-left hover:cursor-pointer"
          >
            <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-emerald-600 text-xs mt-0.5">{change}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Recent requests */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-900">Recent Requests</h3>
            <p className="text-xs text-slate-400">Last 5 requests</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/requests')}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            View all
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">ID</th>
                <th className="table-head">Client</th>
                <th className="table-head">Service</th>
                <th className="table-head">Date</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">No requests found yet.</td>
                </tr>
              ) : (
                requests.slice(0, 5).map((req) => (
                  <tr
                    key={req._id}
                    onClick={() => navigate('/admin/requests')}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="table-cell font-mono text-xs text-slate-500">REQ-{req._id.slice(-6).toUpperCase()}</td>
                    <td className="table-cell font-medium text-slate-800">{req.user?.name || 'Unknown User'}</td>
                    <td className="table-cell text-slate-600">{req.service?.title || 'N/A'}</td>
                    <td className="table-cell">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-cell font-semibold">₹{Number(req.service?.price || 0).toLocaleString('en-IN')}</td>
                    <td className="table-cell"><StatusBadge status={req.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManageRequests({
  requests,
  loading,
  onUpdateStatus,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onSaveToCompletedList,
  updatingRequestId,
  savingCompletedRequestId,
  commentingRequestId,
  editingCommentKey,
  deletingCommentKey,
  currentUser,
}) {
  // Move deliverables/expiry state and handlers here (must be inside the function, not parameter list)
  // Remove old deliverables/files state, use new documents state
  const [documentsById, setDocumentsById] = useState({});
  const [expiryDraftById, setExpiryDraftById] = useState({});
  const [completedEditingRequestId, setCompletedEditingRequestId] = useState('');
  const [completedNewDocumentsById, setCompletedNewDocumentsById] = useState({});
  const [removedDeliverablesById, setRemovedDeliverablesById] = useState({});
  const [detailsRequest, setDetailsRequest] = useState(null);
  const [renewPopup, setRenewPopup] = useState({ open: false, request: null });
  const [renewNotes, setRenewNotes] = useState(['']);
  const [renewDocuments, setRenewDocuments] = useState([{ name: '', file: null }]);
  const [renewExpiryDate, setRenewExpiryDate] = useState('');
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const getDocumentKey = (doc) => {
    if (typeof doc === 'string') {
      return doc;
    }
    if (doc && typeof doc === 'object') {
      return doc.url || doc.name || '';
    }
    return '';
  };

  const openDetailsModal = (request) => {
    setDetailsRequest(request);
  };

  const closeDetailsModal = () => {
    setDetailsRequest(null);
  };

  const openRenewPopup = (request) => {
    setRenewPopup({ open: true, request });
    setRenewNotes(['']);
    setRenewDocuments([{ name: '', file: null }]);
    setRenewExpiryDate(request?.expiryDate ? new Date(request.expiryDate).toISOString().slice(0, 16) : '');
  };

  const closeRenewPopup = () => {
    setRenewPopup({ open: false, request: null });
    setRenewNotes(['']);
    setRenewDocuments([{ name: '', file: null }]);
    setRenewExpiryDate('');
  };

  const handleChangeRenewNote = (index, value) => {
    setRenewNotes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddRenewNote = () => {
    setRenewNotes((prev) => [...prev, '']);
  };

  const handleRemoveRenewNote = (index) => {
    setRenewNotes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRenewDocsChange = (docs) => {
    setRenewDocuments(docs);
  };

  const handleSubmitRenewProcess = async () => {
    const requestId = renewPopup.request?._id;
    if (!requestId) {
      return;
    }

    const noteText = renewNotes.map((note) => note.trim()).filter(Boolean);
    const files = renewDocuments.filter((doc) => doc.file && doc.name);

    if (!noteText.length && !files.length && !renewExpiryDate) {
      toast.error('Please add at least one note, document or expiry date to start renewal.');
      return;
    }

    setRenewSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('status', 'Renewed');
      formData.append('message', noteText.join('\n\n') || 'Service has been renewed.');
      if (renewExpiryDate) {
        formData.append('expiryDate', renewExpiryDate);
      }
      if (files.length) {
        formData.append('deliverables', JSON.stringify(files.map((doc) => doc.name)));
        files.forEach((doc) => {
          formData.append('files', doc.file, doc.name);
        });
      }

      const success = await onUpdateStatus(requestId, 'Renewed', noteText.join('\n\n'), files.map((doc) => doc.name), renewExpiryDate, formData);
      if (success) {
        toast.success('Service renewed successfully.');
        closeRenewPopup();
        if (detailsRequest?._id === requestId) {
          try {
            const response = await requestAPI.getById(requestId);
            setDetailsRequest(response.data?.data?.request || detailsRequest);
          } catch {
            // ignore refresh failure
          }
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Could not start renewal process.';
      toast.error(message);
    } finally {
      setRenewSubmitting(false);
    }
  };

  const toggleCompletedEditMode = (requestId) => {
    setCompletedEditingRequestId((prev) => (prev === requestId ? '' : requestId));
  };

  const handleMarkDocumentRemoved = (requestId, docKey) => {
    setRemovedDeliverablesById((prev) => ({
      ...prev,
      [requestId]: Array.from(new Set([...(prev[requestId] || []), docKey])),
    }));
  };

  const handleRestoreDocument = (requestId, docKey) => {
    setRemovedDeliverablesById((prev) => ({
      ...prev,
      [requestId]: (prev[requestId] || []).filter((key) => key !== docKey),
    }));
  };

  const handleSaveCompletedDeliverables = async (requestId) => {
    const newDocs = completedNewDocumentsById[requestId] || [];
    const removedDocs = removedDeliverablesById[requestId] || [];

    if (!newDocs.length && !removedDocs.length) {
      toast.error('No changes to save.');
      return;
    }

    if (newDocs.some((doc) => !doc.name || !doc.file)) {
      toast.error('Please enter a name and select a file for all new documents.');
      return;
    }

    const formData = new FormData();
    formData.append('status', 'Completed');

    if (newDocs.length) {
      formData.append('deliverables', JSON.stringify(newDocs.map((doc) => doc.name)));
      newDocs.forEach((doc) => {
        formData.append('files', doc.file, doc.name);
      });
    }

    if (removedDocs.length) {
      formData.append('removeDocuments', JSON.stringify(removedDocs));
    }

    const success = await onUpdateStatus(requestId, 'Completed', '', [], '', formData);

    if (success) {
      setCompletedEditingRequestId('');
      setCompletedNewDocumentsById((prev) => ({ ...prev, [requestId]: [] }));
      setRemovedDeliverablesById((prev) => ({ ...prev, [requestId]: [] }));
      toast.success('Deliverables updated successfully');
    }
  };

  const handleMoveToInProgress = async (requestId) => {
    await onUpdateStatus(requestId, 'In Progress');
  };

  const handleMoveToFiled = async (requestId) => {
    const docs = documentsById[requestId] || [];
    const expiryDate = expiryDraftById[requestId];
    if (!docs.length || docs.some(d => !d.name || !d.file)) {
      toast.error('Please enter document name and select file for all documents.');
      return;
    }
    if (!expiryDate) {
      toast.error('Please set expiry date and time.');
      return;
    }
    // Build FormData for file upload
    const formData = new FormData();
    formData.append('status', 'Filed');
    formData.append('expiryDate', expiryDate);
    formData.append('deliverables', JSON.stringify(docs.map(d => d.name)));
    docs.forEach((doc, i) => {
      formData.append('files', doc.file, doc.name);
    });
    await onUpdateStatus(requestId, 'Filed', '', docs.map(d => d.name), expiryDate, formData);
    setDocumentsById(prev => ({ ...prev, [requestId]: [] }));
    setExpiryDraftById(prev => ({ ...prev, [requestId]: '' }));
  };

  const handleMoveToCompleted = async (requestId) => {
    await onUpdateStatus(requestId, 'Completed');
  };
  const [expandedRequestId, setExpandedRequestId] = useState('');
  const [actionNeededDraftById, setActionNeededDraftById] = useState({});
  const [internalNoteDraftById, setInternalNoteDraftById] = useState({});
  const [publicCommentDraftById, setPublicCommentDraftById] = useState({});
  const [editingCommentState, setEditingCommentState] = useState({
    requestId: '',
    commentId: '',
    text: '',
  });
  // Reject modal state
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: '', message: '' });
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');

  const canManageComment = (comment) => {
    const authorId = String(comment?.author?._id || comment?.author || '');
    return Boolean(authorId && currentUserId && authorId === currentUserId);
  };

  const toggleReviewPanel = (requestId) => {
    setExpandedRequestId((prev) => (prev === requestId ? '' : requestId));
  };

  const handleStartReview = async (requestId) => {
    await onUpdateStatus(requestId, 'In Review');
  };

  const handleMoveToActionNeeded = async (requestId) => {
    const message = (actionNeededDraftById[requestId] || '').trim();

    if (!message) {
      toast.error('Please write what is needed from the client.');
      return;
    }

    const success = await onUpdateStatus(requestId, 'Action Needed', message);

    if (success) {
      setActionNeededDraftById((prev) => ({ ...prev, [requestId]: '' }));
    }
  };

  const handleResumeReview = async (requestId) => {
    await onUpdateStatus(requestId, 'In Review');
  };

  const handleApprove = async (requestId) => {
    await onUpdateStatus(requestId, 'Approved');
  };

  // Handle reject logic
  const handleOpenReject = (requestId) => {
    setRejectModal({ open: true, requestId, message: '' });
  };

  const handleCloseReject = () => {
    setRejectModal({ open: false, requestId: '', message: '' });
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    const { requestId, message } = rejectModal;
    if (!message.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    await onUpdateStatus(requestId, 'Rejected', message.trim());
    setRejectModal({ open: false, requestId: '', message: '' });
  };

  const handleAddInternalNote = async (requestId) => {
    const text = (internalNoteDraftById[requestId] || '').trim();

    if (!text) {
      toast.error('Internal note cannot be empty.');
      return;
    }

    const success = await onAddComment(requestId, text, true);
    if (success) {
      setInternalNoteDraftById((prev) => ({ ...prev, [requestId]: '' }));
    }
  };

  const handleAddPublicComment = async (requestId) => {
    const text = (publicCommentDraftById[requestId] || '').trim();

    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }

    const success = await onAddComment(requestId, text, false);
    if (success) {
      setPublicCommentDraftById((prev) => ({ ...prev, [requestId]: '' }));
    }
  };

  const handleStartEditComment = (requestId, comment) => {
    const commentId = String(comment?._id || '');
    if (!commentId || !canManageComment(comment)) {
      return;
    }

    setEditingCommentState({
      requestId,
      commentId,
      text: String(comment.text || ''),
    });
  };

  const handleCancelEditComment = () => {
    setEditingCommentState({
      requestId: '',
      commentId: '',
      text: '',
    });
  };

  const handleSaveCommentEdit = async () => {
    const requestId = editingCommentState.requestId;
    const commentId = editingCommentState.commentId;
    const text = editingCommentState.text.trim();

    if (!requestId || !commentId) {
      return;
    }

    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }

    const success = await onUpdateComment(requestId, commentId, text);
    if (success) {
      handleCancelEditComment();
    }
  };

  const handleDeleteComment = async (requestId, commentId) => {
    if (!requestId || !commentId) {
      return;
    }

    const shouldDelete = window.confirm('Delete this comment? This action cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    const success = await onDeleteComment(requestId, commentId);
    if (success && editingCommentState.commentId === commentId && editingCommentState.requestId === requestId) {
      handleCancelEditComment();
    }
  };


  // --- New Search State and Logic (copied from SettingsCompletedList) ---
  const [searchUser, setSearchUser] = useState("");
  const [searchService, setSearchService] = useState("");
  const [filteredRequests, setFilteredRequests] = useState(requests);
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status')?.toLowerCase() || '';
  const hasSearchTerms = searchUser.trim() !== '' || searchService.trim() !== '';

  const matchesStatusFilter = (req) => {
    if (!statusFilter) return true;
    const normalized = normalizeWorkflowStatus(req.status);
    if (statusFilter === 'pending') {
      return normalized === 'submitted' || normalized === 'actionneeded';
    }
    if (statusFilter === 'approved') return normalized === 'approved';
    if (statusFilter === 'completed') return normalized === 'completed';
    if (statusFilter === 'rejected') return normalized === 'rejected';
    return normalized === statusFilter;
  };

  useEffect(() => {
    setFilteredRequests(
      requests.filter((req) => {
        const userMatch = searchUser.trim() === "" || (req.user?.name || "").toLowerCase().includes(searchUser.trim().toLowerCase());
        const serviceMatch = searchService.trim() === "" || (req.service?.title || "").toLowerCase().includes(searchService.trim().toLowerCase());
        return userMatch && serviceMatch && matchesStatusFilter(req);
      })
    );
  }, [searchUser, searchService, requests, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilteredRequests(
      requests.filter((req) => {
        const userMatch = searchUser.trim() === "" || (req.user?.name || "").toLowerCase().includes(searchUser.trim().toLowerCase());
        const serviceMatch = searchService.trim() === "" || (req.service?.title || "").toLowerCase().includes(searchService.trim().toLowerCase());
        return userMatch && serviceMatch && matchesStatusFilter(req);
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Manage Requests</h2>
          <p className="text-slate-500 text-sm mt-1">Use the workflow Submitted → In Review → Approved → Completed. If details are missing, move to Action Needed.</p>
        </div>
        {/* Refresh Button */}
        <button
          className="btn btn-outline px-4 py-2 text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
          onClick={() => window.location.reload()}
          title="Reload latest requests"
        >
          Refresh
        </button>
      </div>

      {/* New blue-bordered dual-input search form */}
      <form className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100 items-start sm:items-center" onSubmit={handleSearch}>
        <input
          type="text"
          className="input w-full sm:w-56 border-2 border-blue-600 focus:border-blue-700 focus:ring-blue-700 rounded-md px-3 py-2 outline-none"
          placeholder="Enter user name"
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
        />
        <input
          type="text"
          className="input w-full sm:w-56 border-2 border-blue-600 focus:border-blue-700 focus:ring-blue-700 rounded-md px-3 py-2 outline-none"
          placeholder="Enter your service"
          value={searchService}
          onChange={e => setSearchService(e.target.value)}
        />
        <button type="submit" className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2">
          Search
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">ID</th>
                <th className="table-head">Client</th>
                <th className="table-head">Service</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Status</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">Loading requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">
                    {hasSearchTerms
                      ? 'No matching user or service found.'
                      : statusFilter === 'approved'
                        ? 'No approved requests found.'
                        : statusFilter === 'pending'
                          ? 'No pending requests found.'
                          : statusFilter === 'completed'
                            ? 'No completed requests found.'
                            : statusFilter === 'rejected'
                              ? 'No rejected requests found.'
                              : 'No requests found yet.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const details = req.details && typeof req.details === 'object' ? req.details : {};
                  const requestId = String(req._id || '');
                  const workflowStatus = normalizeWorkflowStatus(req.status);
                  const isExpanded = expandedRequestId === requestId;
                  const isUpdating = updatingRequestId === requestId;
                  const isSavingToCompletedList = savingCompletedRequestId === requestId;
                  const isCommenting = commentingRequestId === requestId;
                  const uploadedDocuments = Array.isArray(req.documents) ? req.documents : [];
                  const requiredDocuments = Array.isArray(req.service?.documentsRequired) ? req.service.documentsRequired : [];
                  const timeline = Array.isArray(req.statusTimeline)
                    ? [...req.statusTimeline].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    : [];
                  const comments = Array.isArray(req.comments)
                    ? [...req.comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    : [];

                  return (
                    <Fragment key={requestId}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="table-cell font-mono text-xs text-slate-500">REQ-{requestId.slice(-6).toUpperCase()}</td>
                        <td className="table-cell font-medium text-slate-800">{req.user?.name || 'Unknown User'}</td>
                        <td className="table-cell text-slate-600">{req.service?.title || 'N/A'}</td>
                        <td className="table-cell font-semibold">₹{Number(req.service?.price || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell"><StatusBadge status={req.status} /></td>
                        <td className="table-cell">
                          <div className="flex gap-1 flex-wrap items-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (workflowStatus === 'completed') {
                                  detailsRequest?._id === req._id ? closeDetailsModal() : openDetailsModal(req);
                                } else {
                                  toggleReviewPanel(requestId);
                                }
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                            >
                              {workflowStatus === 'completed'
                                ? (detailsRequest?._id === req._id ? 'Close' : 'Details')
                                : (isExpanded ? 'Close' : 'Review')}
                            </button>

                            {workflowStatus === 'completed' && req.renewalRequested && (
                              <button
                                type="button"
                                onClick={() => openRenewPopup(req)}
                                className="px-2.5 py-1 text-xs rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors font-medium"
                              >
                                Renew Process
                              </button>
                            )}

                            {workflowStatus === 'submitted' && (
                              <button
                                onClick={() => handleStartReview(requestId)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Start Review'}
                              </button>
                            )}

                            {workflowStatus === 'inreview' && (
                              <>
                                <button
                                  onClick={() => handleApprove(requestId)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? 'Updating...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleOpenReject(requestId)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? 'Updating...' : 'Reject'}
                                </button>
                              </>
                            )}

                            {/* Unreject button for rejected requests */}
                            {workflowStatus === 'rejected' && (
                              <button
                                onClick={() => onUpdateStatus(requestId, 'In Review')}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Unreject'}
                              </button>
                            )}

                            {workflowStatus === 'actionneeded' && (
                              <>
                                <button
                                  onClick={() => handleResumeReview(requestId)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? 'Updating...' : 'Resume Review'}
                                </button>
                                <button
                                  onClick={() => handleApprove(requestId)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isUpdating ? 'Updating...' : 'Approve'}
                                </button>
                              </>
                            )}


                            {workflowStatus === 'paid' && (
                              <button
                                onClick={() => handleMoveToInProgress(requestId)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Start Processing'}
                              </button>
                            )}

                            {workflowStatus === 'inprogress' && (
                              <button
                                onClick={() => handleMoveToFiled(requestId)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Mark as Filed'}
                              </button>
                            )}

                            {workflowStatus === 'filed' && (
                              <button
                                onClick={() => handleMoveToCompleted(requestId)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating ? 'Updating...' : 'Mark as Completed'}
                              </button>
                            )}

                            {workflowStatus === 'completed' && (
                              <button
                                type="button"
                                onClick={() => toggleCompletedEditMode(requestId)}
                                className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                              >
                                {completedEditingRequestId === requestId ? 'Cancel Edit' : 'Edit Deliverables'}
                              </button>
                            )}
                              {/* Filed step: deliverables and expiry date input */}
                              {workflowStatus === 'inprogress' && (
                                <div className="mt-4 p-3 border border-fuchsia-200 rounded-lg bg-fuchsia-50">
                                  <DynamicDocumentUpload
                                    onChange={docs => setDocumentsById(prev => ({ ...prev, [requestId]: docs }))}
                                  />
                                  <label className="label mt-2">Expiry Date & Time</label>
                                  <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={expiryDraftById[requestId] || ''}
                                    onChange={e => setExpiryDraftById(prev => ({ ...prev, [requestId]: e.target.value }))}
                                  />
                                  <button
                                    onClick={() => handleMoveToFiled(requestId)}
                                    disabled={isUpdating}
                                    className="mt-3 px-3 py-2 text-xs rounded-lg border border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isUpdating ? 'Saving...' : 'Save & Mark as Filed'}
                                  </button>
                                </div>
                              )}
                                  {/* Show expiry date and deliverables if present */}
                                  {req.expiryDate && (
                                    <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                                      <p className="text-xs font-semibold text-blue-800 mb-1">Expiry Date</p>
                                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{formatDateTime(req.expiryDate)}</p>
                                    </div>
                                  )}
                                  {Array.isArray(req.documents) && req.documents.length > 0 && (() => {
                                    const removedKeys = removedDeliverablesById[requestId] || [];
                                    const activeDocuments = req.documents.filter((doc) => !removedKeys.includes(getDocumentKey(doc)));

                                    return (
                                      <div className="mt-3 rounded-lg bg-fuchsia-50 border border-fuchsia-200 p-3">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                          <p className="text-xs font-semibold text-fuchsia-800">Deliverables</p>
                                          {workflowStatus === 'completed' && completedEditingRequestId === requestId && (
                                            <div className="text-xs text-slate-500">Removed {removedKeys.length} item(s)</div>
                                          )}
                                        </div>
                                        <ul className="list-disc list-inside text-sm text-fuchsia-900">
                                          {activeDocuments.map((doc, idx) => {
                                            const docKey = getDocumentKey(doc);
                                            const isUrl = typeof doc === 'string'
                                              ? doc.startsWith('http://') || doc.startsWith('https://')
                                              : Boolean(doc?.url);
                                            return (
                                              <li key={docKey || idx} className="flex items-center justify-between gap-2">
                                                <div>
                                                  {isUrl ? (
                                                    <a href={typeof doc === 'string' ? doc : doc.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">
                                                      {typeof doc === 'string' ? (doc.split('/').pop() || doc) : (doc.name || doc.url.split('/').pop() || 'Document')}
                                                    </a>
                                                  ) : (
                                                    <span>{typeof doc === 'string' ? doc : doc.name || 'Document'}</span>
                                                  )}
                                                </div>
                                                {workflowStatus === 'completed' && completedEditingRequestId === requestId && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleMarkDocumentRemoved(requestId, docKey)}
                                                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                                                  >
                                                    Remove
                                                  </button>
                                                )}
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      </div>
                                    );
                                  })()}

                                  {workflowStatus === 'completed' && completedEditingRequestId === requestId && (
                                    <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
                                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Add new deliverables</h4>
                                      <DynamicDocumentUpload
                                        onChange={(docs) => setCompletedNewDocumentsById((prev) => ({ ...prev, [requestId]: docs }))}
                                      />
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveCompletedDeliverables(requestId)}
                                          disabled={isUpdating}
                                          className="px-3 py-2 text-xs rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {isUpdating ? 'Saving...' : 'Save Deliverable Changes'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => toggleCompletedEditMode(requestId)}
                                          className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-100 transition-colors font-medium"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                            {/* Save to List button removed as per request */}
                          {/* Reject modal */}
                          {rejectModal.open && rejectModal.requestId === requestId && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                              <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-slate-200">
                                <h3 className="font-bold text-lg mb-2 text-rose-700">Reject Request</h3>
                                <form onSubmit={handleRejectSubmit}>
                                  <label className="block mb-2 text-sm font-medium text-slate-700">Reason for rejection</label>
                                  <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2 mb-4 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    value={rejectModal.message}
                                    onChange={e => setRejectModal(m => ({ ...m, message: e.target.value }))}
                                    placeholder="Enter reason..."
                                    required
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={handleCloseReject} className="px-4 py-1 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100">Cancel</button>
                                    <button type="submit" className="px-4 py-1 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold">Reject</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="p-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Request Details</h4>
                                  <div className="text-sm text-slate-600 space-y-1">
                                    <p><span className="font-medium text-slate-700">Name:</span> {details.name || req.user?.name || '-'}</p>
                                    <p><span className="font-medium text-slate-700">Email:</span> {details.email || req.user?.email || '-'}</p>
                                    <p><span className="font-medium text-slate-700">Phone:</span> {details.phone || '-'}</p>
                                    <p><span className="font-medium text-slate-700">Applied On:</span> {formatDateTime(req.createdAt)}</p>
                                  </div>

                                  <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
                                    <p className="text-xs font-semibold text-slate-700 mb-1">User Note</p>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{details.message || 'No additional note provided.'}</p>
                                  </div>

                                  {req.reviewMessage && (
                                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                      <p className="text-xs font-semibold text-amber-800 mb-1">Latest Workflow Note</p>
                                      <p className="text-sm text-amber-900 whitespace-pre-wrap">{req.reviewMessage}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Service Required Documents</h4>
                                    {requiredDocuments.length === 0 ? (
                                      <p className="text-sm text-slate-500">No predefined list for this service.</p>
                                    ) : (
                                      <ul className="space-y-1 text-sm text-slate-600 list-disc list-inside">
                                        {requiredDocuments.map((docName) => (
                                          <li key={docName}>{docName}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Uploaded By User</h4>
                                    {uploadedDocuments.length === 0 ? (
                                      <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {uploadedDocuments.map((doc, index) => {
                                          const docUrl = typeof doc === 'string' ? doc : doc.url;
                                          const docLabel = typeof doc === 'string'
                                            ? (docUrl?.split('/').pop() || 'Document')
                                            : (doc.name || docUrl?.split('/').pop() || 'Document');

                                          return (
                                            <a
                                              key={`${docUrl || index}-${index}`}
                                              href={toAbsoluteFileUrl(docUrl)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                            >
                                              <span className="truncate pr-2">{docLabel}</span>
                                              <span className="text-xs font-semibold">View</span>
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                   {/* Show all uploaded documents (old and new) */}
                                   {Array.isArray(req.documents) && req.documents.length > 0 && (
                                     <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                                       <p className="text-xs font-semibold text-emerald-800 mb-1">All Uploaded Documents</p>
                                       <ul className="list-disc list-inside text-sm text-emerald-900">
                                         {req.documents.map((doc, idx) => {
                                           const docUrl = typeof doc === 'string' ? doc : doc.url;
                                           const docLabel = typeof doc === 'string'
                                             ? (docUrl?.split('/').pop() || doc)
                                             : (doc.name || docUrl?.split('/').pop() || 'Document');
                                           return (
                                             <li key={idx}>
                                               <a href={toAbsoluteFileUrl(docUrl)} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">
                                                 {docLabel}
                                               </a>
                                             </li>
                                           );
                                         })}
                                       </ul>
                                     </div>
                                   )}
                                </div>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-2 border-t border-slate-200 pt-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Status Timeline</h4>
                                  {timeline.length === 0 ? (
                                    <p className="text-sm text-slate-500">Timeline is not available yet.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                      {timeline.map((item, index) => (
                                        <div key={`${item.status}-${item.createdAt || index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                          <p className="text-xs font-semibold text-slate-800">{item.status}</p>
                                          <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)} · {item.changedBy?.name || 'System'}</p>
                                          {item.note && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{item.note}</p>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800 mb-2">Comments & Notes</h4>
                                  {comments.length === 0 ? (
                                    <p className="text-sm text-slate-500">No comments yet.</p>
                                  ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                      {comments.map((comment) => {
                                        const commentId = String(comment?._id || '');
                                        const ownComment = canManageComment(comment);
                                        const commentKey = `${requestId}:${commentId}`;
                                        const isEditing = editingCommentState.requestId === requestId
                                          && editingCommentState.commentId === commentId;
                                        const isUpdating = editingCommentKey === commentKey;
                                        const isDeleting = deletingCommentKey === commentKey;

                                        return (
                                          <div key={comment._id || `${comment.author?._id}-${comment.createdAt}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="text-xs font-semibold text-slate-800">{comment.author?.name || 'User'}</p>
                                              <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${comment.isInternal ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {comment.isInternal ? 'Internal' : 'Public'}
                                              </span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                              <p className="text-[11px] text-slate-500">{formatDateTime(comment.createdAt)}</p>
                                              {ownComment && (
                                                <div className="flex items-center gap-2">
                                                  {!isEditing && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleStartEditComment(requestId, comment)}
                                                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 disabled:text-slate-400"
                                                      disabled={Boolean(editingCommentKey || deletingCommentKey)}
                                                    >
                                                      Edit
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteComment(requestId, commentId)}
                                                    className="text-[11px] font-semibold text-red-600 hover:text-red-700 disabled:text-slate-400"
                                                    disabled={Boolean(editingCommentKey || deletingCommentKey)}
                                                  >
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {isEditing ? (
                                              <div className="mt-2 space-y-2">
                                                <textarea
                                                  className="input-field resize-none"
                                                  rows={3}
                                                  value={editingCommentState.text}
                                                  onChange={(event) => setEditingCommentState((prev) => ({
                                                    ...prev,
                                                    text: event.target.value,
                                                  }))}
                                                  disabled={isUpdating}
                                                />
                                                <div className="flex items-center justify-end gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={handleCancelEditComment}
                                                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isUpdating}
                                                  >
                                                    Cancel
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={handleSaveCommentEdit}
                                                    className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isUpdating}
                                                  >
                                                    {isUpdating ? 'Saving...' : 'Save'}
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{comment.text}</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-3 border-t border-slate-200 pt-4">
                                {(workflowStatus === 'inreview' || workflowStatus === 'submitted') && (
                                  <div>
                                    <label className="label">Move To Action Needed</label>
                                    <textarea
                                      className="input-field resize-none"
                                      rows={3}
                                      placeholder="Tell the client what is missing."
                                      value={actionNeededDraftById[requestId] || ''}
                                      onChange={(e) => setActionNeededDraftById((prev) => ({
                                        ...prev,
                                        [requestId]: e.target.value,
                                      }))}
                                    />
                                    <button
                                      onClick={() => handleMoveToActionNeeded(requestId)}
                                      disabled={isUpdating}
                                      className="mt-3 px-3 py-2 text-xs rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUpdating ? 'Sending...' : 'Set Action Needed'}
                                    </button>
                                  </div>
                                )}

                                <div>
                                  <label className="label">Internal Note (admin only)</label>
                                  <textarea
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Only visible to admins."
                                    value={internalNoteDraftById[requestId] || ''}
                                    onChange={(e) => setInternalNoteDraftById((prev) => ({
                                      ...prev,
                                      [requestId]: e.target.value,
                                    }))}
                                  />
                                  <button
                                    onClick={() => handleAddInternalNote(requestId)}
                                    disabled={isCommenting}
                                    className="mt-3 px-3 py-2 text-xs rounded-lg border border-violet-200 text-violet-800 bg-violet-50 hover:bg-violet-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isCommenting ? 'Saving...' : 'Add Internal Note'}
                                  </button>
                                </div>

                                <div>
                                  <label className="label">Public Comment</label>
                                  <textarea
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Visible to the client."
                                    value={publicCommentDraftById[requestId] || ''}
                                    onChange={(e) => setPublicCommentDraftById((prev) => ({
                                      ...prev,
                                      [requestId]: e.target.value,
                                    }))}
                                  />
                                  <button
                                    onClick={() => handleAddPublicComment(requestId)}
                                    disabled={isCommenting}
                                    className="mt-3 px-3 py-2 text-xs rounded-lg border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isCommenting ? 'Sending...' : 'Send Public Comment'}
                                  </button>
                                </div>
                              </div>

                              <div className="border-t border-slate-200 pt-4">
                                <button
                                  onClick={() => setExpandedRequestId('')}
                                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors font-medium"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailsRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Request Details</h3>
                <p className="text-sm text-slate-500">Completed request information and document summary.</p>
              </div>
              <button
                type="button"
                onClick={closeDetailsModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Request ID</p>
                  <p className="text-sm text-slate-800">REQ-{String(detailsRequest._id || '').slice(-6).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Status</p>
                  <div><StatusBadge status={detailsRequest.status} /></div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Client</p>
                  <p className="text-sm text-slate-800">{detailsRequest.user?.name || 'Unknown User'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="text-sm text-slate-800">{detailsRequest.user?.email || '-'}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Service</p>
                  <p className="text-sm text-slate-800">{detailsRequest.service?.title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Amount</p>
                  <p className="text-sm text-slate-800">₹{Number(detailsRequest.service?.price || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Applied On</p>
                  <p className="text-sm text-slate-800">{formatDateTime(detailsRequest.createdAt)}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">User Notes</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{(detailsRequest.details && detailsRequest.details.message) || 'No additional note provided.'}</p>
                </div>
                {detailsRequest.expiryDate && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-800 mb-2">Expiry Date</p>
                    <p className="text-sm text-blue-900">{formatDateTime(detailsRequest.expiryDate)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <p className="text-xs font-semibold text-slate-700 mb-2">Deliverables</p>
                {Array.isArray(detailsRequest.documents) && detailsRequest.documents.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                    {detailsRequest.documents.map((doc, index) => {
                      const docUrl = typeof doc === 'string' ? doc : doc.url;
                      const docLabel = typeof doc === 'string' ? (docUrl.split('/').pop() || 'Document') : (doc.name || docUrl?.split('/').pop() || 'Document');
                      return (
                        <li key={`${docUrl || index}-${index}`}>
                          {docUrl ? (
                            <a href={toAbsoluteFileUrl(docUrl)} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">
                              {docLabel}
                            </a>
                          ) : (
                            <span>{docLabel}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No deliverables are attached yet.</p>
                )}

                {(normalizeWorkflowStatus(detailsRequest.status) === 'completed' || normalizeWorkflowStatus(detailsRequest.status) === 'servicerenewing') && detailsRequest.renewalRequested && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => openRenewPopup(detailsRequest)}
                      className="px-3 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium"
                    >
                      Mark as Renewed
                    </button>
                  </div>
                )}

                {normalizeWorkflowStatus(detailsRequest.status) === 'servicerenewing' && (
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                    <p className="text-sm font-semibold">Renewal process is active for this service.</p>
                    <p className="text-sm mt-1">Use the timeline below to review the latest renewal notes and expiry details.</p>
                  </div>
                )}
                {normalizeWorkflowStatus(detailsRequest.status) === 'renewed' && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                    <p className="text-sm font-semibold">Service has been renewed.</p>
                    <p className="text-sm mt-1">The user has been notified and renewal is complete.</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700 mb-2">Status Timeline</p>
                {Array.isArray(detailsRequest.statusTimeline) && detailsRequest.statusTimeline.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {detailsRequest.statusTimeline.map((item, index) => (
                      <div key={`${item.status}-${item.createdAt || index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-800">{item.status}</p>
                        <p className="text-[11px] text-slate-500">{formatDateTime(item.createdAt)} · {item.changedBy?.name || 'System'}</p>
                        {item.note && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{item.note}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No timeline available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {renewPopup.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Renew Process</h3>
                <p className="text-sm text-slate-500">Add notes, documents and expiry details for the renewal workflow.</p>
              </div>
              <button
                type="button"
                onClick={closeRenewPopup}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Request</p>
                  <p className="text-sm text-slate-800">REQ-{String(renewPopup.request?._id || '').slice(-6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Service</p>
                  <p className="text-sm text-slate-800">{renewPopup.request?.service?.title || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Expiration / Validity</p>
                    <p className="text-sm text-slate-600">Set how long this renewal will remain valid.</p>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={renewExpiryDate}
                  onChange={(e) => setRenewExpiryDate(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Admin Notes</p>
                    <p className="text-sm text-slate-500">Add one or more notes for the renewal work.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRenewNote}
                    className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    + Add note
                  </button>
                </div>
                <div className="space-y-3">
                  {renewNotes.map((note, idx) => (
                    <div key={idx} className="space-y-2">
                      <textarea
                        value={note}
                        onChange={(e) => handleChangeRenewNote(idx, e.target.value)}
                        placeholder="Enter renewal note"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                      {renewNotes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRenewNote(idx)}
                          className="text-xs text-rose-600 hover:text-rose-800"
                        >
                          Remove note
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Add Documents</p>
                    <p className="text-sm text-slate-500">Upload files that should be attached to this renewal.</p>
                  </div>
                </div>
                <DynamicDocumentUpload onChange={handleRenewDocsChange} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700 mb-2">Timeline Preview</p>
                {Array.isArray(renewPopup.request?.statusTimeline) && renewPopup.request.statusTimeline.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {[...renewPopup.request.statusTimeline]
                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                      .map((item, index) => (
                        <div key={`${item.status}-${item.createdAt || index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold text-slate-800">{item.status}</p>
                          <p className="text-[11px] text-slate-500">{formatDateTime(item.createdAt)} · {item.changedBy?.name || 'System'}</p>
                          {item.note && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{item.note}</p>}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No timeline entries yet.</p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeRenewPopup}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRenewProcess}
                  disabled={renewSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renewSubmitting ? 'Starting...' : 'Start Renewal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManageServices() {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [formSchemaDraft, setFormSchemaDraft] = useState({});
  const [editingFormServiceId, setEditingFormServiceId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: SERVICE_CATEGORIES[0],
    documentsRequired: '',
    formSchema: {},
    planTier: 'basic',
  });

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      try {
        const response = await serviceAPI.getAll({ page: 1, limit: 200 });
        const items = response.data?.data?.items || [];
        setServices(items.map(normalizeService));
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to load services.';
        toast.error(message);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const openAdd = () => {
    setEditingServiceId(null);
    setForm({ title: '', description: '', price: '', category: SERVICE_CATEGORIES[0], documentsRequired: '', planTier: 'basic' });
    setShowModal(true);
  };

  const openEdit = (service) => {
    setEditingServiceId(service.id);
    setForm({
      title: service.title,
      description: service.description,
      price: String(service.price),
      category: service.category,
      documentsRequired: service.documents.join(', '),
      formSchema: service.formSchema || {},
      planTier: service.planTier || 'basic',
    });
    setShowModal(true);
  };




  const openFormBuilder = (service) => {
    setEditingFormServiceId(service.id);
    setFormSchemaDraft(service.formSchema || {});
    setShowFormBuilder(true);
  };

  // Sync formSchemaDraft to main form state when saving
  const handleFormBuilderSave = async () => {
    try {
      await serviceAPI.update(editingFormServiceId, { formSchema: formSchemaDraft });
      setForm(f => ({ ...f, formSchema: formSchemaDraft }));
      // Refresh services list
      const response = await serviceAPI.getAll({ page: 1, limit: 200 });
      const items = response.data?.data?.items || [];
      setServices(items.map(normalizeService));
      toast.success('Form schema updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update form schema.');
    } finally {
      setShowFormBuilder(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.price) {
      toast.error('Fill all required fields');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      documentsRequired: form.documentsRequired
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      formSchema: form.formSchema || {},
      planTier: form.planTier || 'basic',
    };

    setSavingService(true);

    try {
      if (editingServiceId) {
        const response = await serviceAPI.update(editingServiceId, payload);
        const updated = normalizeService(response.data?.data?.service);
        setServices((prev) => prev.map((service) => (service.id === editingServiceId ? updated : service)));
        toast.success('Service updated!');
      } else {
        const response = await serviceAPI.create(payload);
        const created = normalizeService(response.data?.data?.service);
        setServices((prev) => [created, ...prev]);
        toast.success('Service added!');
      }

      setShowModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save service.';
      toast.error(message);
    } finally {
      setSavingService(false);
    }
  };

  const handleDelete = async (serviceId) => {
    const shouldDelete = window.confirm('Delete this service? This action cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    setDeletingServiceId(serviceId);

    try {
      await serviceAPI.remove(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      toast.success('Service deleted');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete service.';
      toast.error(message);
    } finally {
      setDeletingServiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-slate-900">Manage Services</h2>
        <Button variant="primary" size="sm" onClick={openAdd}><Plus size={16} /> Add Service</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loadingServices ? (
          <div className="col-span-full text-center py-16 text-slate-500">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500">No services found. Add your first service.</div>
        ) : services.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase font-bold">{s.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      s.planTier === 'premium' ? 'bg-amber-100 text-amber-700' :
                      s.planTier === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {s.planTier || 'Basic'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm mb-3 line-clamp-2">{s.description}</p>
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-primary-800">₹{s.price.toLocaleString('en-IN')}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="p-2 text-slate-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => openFormBuilder(s)}
                  className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Form"
                >
                  📝
                </button>
                <button disabled={deletingServiceId === s.id} onClick={() => handleDelete(s.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {deletingServiceId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
                    {/* Form Builder Modal */}
                    {showFormBuilder && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-[6px]">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-display font-bold text-slate-900">Edit Form Schema</h3>
                            <button onClick={() => setShowFormBuilder(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                          </div>
                          <div className="p-6 space-y-4">
                            {/* FormBuilder visual component for schema editing */}
                            <FormBuilder
                              value={formSchemaDraft}
                              onChange={setFormSchemaDraft}
                            />
                            <div className="flex gap-3 pt-2">
                              <Button
                                variant="primary"
                                className="flex-1 justify-center"
                                onClick={handleFormBuilderSave}
                              >
                                Save Form
                              </Button>
                              <Button variant="outline" onClick={() => setShowFormBuilder(false)}>Cancel</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-900">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Service Title *</label>
                  <input className="input-field" placeholder="e.g. ITR Filing" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" className="input-field" placeholder="999" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Description *</label>
                  <textarea className="input-field resize-none" rows={3} placeholder="Short service description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="label">Documents Required (comma separated)</label>
                  <input className="input-field" placeholder="PAN Card, Aadhaar Card, Bank Statement" value={form.documentsRequired} onChange={(e) => setForm({ ...form, documentsRequired: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="primary" className="flex-1 justify-center" onClick={handleSave} loading={savingService}>{editingServiceId ? 'Save Changes' : 'Add Service'}</Button>
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsers({ requests }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);

      try {
        const response = await userAPI.getAll();
        setUsers(response.data?.data?.items || []);
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to load users.';
        toast.error(message);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => u.role !== 'admin' && u.role !== 'superadmin');

  const requestCountMap = requests.reduce((acc, request) => {
    const userId = String(request.user?._id || request.user?.id || '');
    if (!userId) {
      return acc;
    }

    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-slate-900">All Users</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">User</th>
                <th className="table-head">Email</th>
                <th className="table-head">Phone</th>
                <th className="table-head">City</th>
                <th className="table-head">Requests</th>
                <th className="table-head">Joined</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">No users found.</td>
                </tr>
              ) : filteredUsers.map((u) => {
                const userId = String(u.id || u._id || '');
                const userRequestCount = requestCountMap[userId] ?? u.requestCount ?? 0;

                return (
                  <tr key={userId || u.email} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedUserDetails(u)}>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            (u.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500">{u.email || '-'}</td>
                    <td className="table-cell text-slate-500">{u.phone || '-'}</td>
                    <td className="table-cell text-slate-500">{u.address?.city || '-'}</td>
                    <td className="table-cell">{userRequestCount}</td>
                    <td className="table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="table-cell">
                      {(u.status || 'active') === 'active'
                        ? <span className="badge-completed">Active Account</span>
                        : <span className="badge bg-slate-100 text-slate-500">Inactive</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-slate-900">User Details</h3>
              <button onClick={() => setSelectedUserDetails(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-700 font-bold text-3xl overflow-hidden shadow-inner">
                  {selectedUserDetails.profileImage ? (
                    <img src={selectedUserDetails.profileImage} alt={selectedUserDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    (selectedUserDetails.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">{selectedUserDetails.name}</h4>
                  <p className="text-slate-500">{selectedUserDetails.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="badge bg-blue-50 text-blue-700 capitalize">{selectedUserDetails.role}</span>
                    <span className={`badge ${selectedUserDetails.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {selectedUserDetails.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</p>
                  <p className="text-slate-800 font-medium">{selectedUserDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined On</p>
                  <p className="text-slate-800 font-medium">{new Date(selectedUserDetails.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</p>
                  <p className="text-slate-800 font-medium">
                    {selectedUserDetails.address?.street ? `${selectedUserDetails.address.street}, ` : ''}
                    {selectedUserDetails.address?.city ? `${selectedUserDetails.address.city}, ` : ''}
                    {selectedUserDetails.address?.country ? selectedUserDetails.address.country : 'Not provided'}
                  </p>
                </div>
              </div>


            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedUserDetails(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsCompletedList({ archivedRequests, loading, onRefresh }) {
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');

  const [searchUser, setSearchUser] = useState("");
  const [searchService, setSearchService] = useState("");
  const [filteredRequests, setFilteredRequests] = useState(archivedRequests);

  useEffect(() => {
    setFilteredRequests(
      archivedRequests.filter((req) => {
        const userMatch = searchUser.trim() === "" || (req.user?.name || "").toLowerCase().includes(searchUser.trim().toLowerCase());
        const serviceMatch = searchService.trim() === "" || (req.service?.title || "").toLowerCase().includes(searchService.trim().toLowerCase());
        return userMatch && serviceMatch;
      })
    );
  }, [searchUser, searchService, archivedRequests]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilteredRequests(
      archivedRequests.filter((req) => {
        const userMatch = searchUser.trim() === "" || (req.user?.name || "").toLowerCase().includes(searchUser.trim().toLowerCase());
        const serviceMatch = searchService.trim() === "" || (req.service?.title || "").toLowerCase().includes(searchService.trim().toLowerCase());
        return userMatch && serviceMatch;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Completed Requests List</h2>
          <p className="text-slate-500 text-sm mt-1">
            Completed requests saved from Manage Requests are stored here for later review.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} loading={loading}>
          Refresh List
        </Button>
      </div>

      <div className="card overflow-hidden">
        {/* Search Bar */}
        <form className="dashboard-page__completed-search-form flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100 items-start sm:items-center" onSubmit={handleSearch}>
          <input
            type="text"
            className="input w-full sm:w-56 min-w-0 border-2 border-blue-600 focus:border-blue-700 focus:ring-blue-700 rounded-md px-3 py-2 outline-none"
            placeholder="Enter user name"
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
          />
          <input
            type="text"
            className="input w-full sm:w-56 min-w-0 border-2 border-blue-600 focus:border-blue-700 focus:ring-blue-700 rounded-md px-3 py-2 outline-none"
            placeholder="Enter your service"
            value={searchService}
            onChange={e => setSearchService(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
            Search
          </button>
        </form>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-slate-900">Saved Completed Requests</h3>
          <span className="text-xs text-slate-500">{archivedRequests.length} saved</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">Request ID</th>
                <th className="table-head">Client</th>
                <th className="table-head">Service</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Completed On</th>
                <th className="table-head">Saved On</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">Loading saved completed requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">No completed requests found.</td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const requestId = String(request._id || '');
                  const timeline = Array.isArray(request.statusTimeline) ? request.statusTimeline : [];
                  const latestCompletedAt = [...timeline]
                    .reverse()
                    .find((item) => normalizeWorkflowStatus(item.status) === 'completed')?.createdAt;

                  return (
                    <tr key={requestId} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-mono text-xs text-slate-500">{formatRequestCode(requestId)}</td>
                      <td className="table-cell font-medium text-slate-800">{request.user?.name || 'Unknown User'}</td>
                      <td className="table-cell text-slate-600">{request.service?.title || 'N/A'}</td>
                      <td className="table-cell font-semibold">₹{Number(request.service?.price || 0).toLocaleString('en-IN')}</td>
                      <td className="table-cell text-slate-500">{formatDateTime(latestCompletedAt || request.updatedAt)}</td>
                      <td className="table-cell text-slate-500">{formatDateTime(request.archivedAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [archivedCompletedRequests, setArchivedCompletedRequests] = useState([]);
  const renewalRequestCount = requests.filter((request) => request.renewalRequested === true).length;
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingArchivedCompleted, setLoadingArchivedCompleted] = useState(true);
  const [loadingUsersCount, setLoadingUsersCount] = useState(true);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [savingCompletedRequestId, setSavingCompletedRequestId] = useState(null);
  const [commentingRequestId, setCommentingRequestId] = useState(null);
  const [editingCommentKey, setEditingCommentKey] = useState('');
  const [deletingCommentKey, setDeletingCommentKey] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState('');
  const notificationPanelRef = useRef(null);
  const adminAccessErrorShown = useRef(false); // Use ref to prevent re-renders
  const { user } = useAuth();

  const fetchRequests = async () => {
    setLoadingRequests(true);

    try {
      const response = await requestAPI.getAll();
      setRequests(response.data?.data?.items || []);
    } catch (error) {
      // Only show error if it's not an admin access error (which is shown once)
      if (!adminAccessErrorShown.current && error.response?.data?.message?.includes('Admin access not assigned')) {
        toast.error('You do not have admin access assigned yet.');
        adminAccessErrorShown.current = true;
      } else if (!error.response?.data?.message?.includes('Admin access not assigned')) {
        const message = error.response?.data?.message || 'Failed to load admin requests.';
        toast.error(message);
      }
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchArchivedCompletedRequests = async () => {
    setLoadingArchivedCompleted(true);

    try {
      const response = await requestAPI.getArchivedCompleted();
      setArchivedCompletedRequests(response.data?.data?.items || []);
    } catch (error) {
      // Silently fail for archived if it's an admin access error
      if (!error.response?.data?.message?.includes('Admin access not assigned')) {
        const message = error.response?.data?.message || 'Failed to load saved completed requests.';
        toast.error(message);
      }
      setArchivedCompletedRequests([]);
    } finally {
      setLoadingArchivedCompleted(false);
    }
  };

  const fetchTotalUsersCount = async () => {
    setLoadingUsersCount(true);

    try {
      const response = await userAPI.getAll();
      const items = response.data?.data?.items || [];
      const regularUsersCount = items.filter((user) => user.role !== 'admin' && user.role !== 'superadmin').length;
      setTotalUsersCount(regularUsersCount);
    } catch (error) {
      // Only show error if it's not an admin access error
      if (!adminAccessErrorShown.current && error.response?.data?.message?.includes('Admin access not assigned')) {
        toast.error('You do not have admin access assigned yet.');
        adminAccessErrorShown.current = true;
      } else if (!error.response?.data?.message?.includes('Admin access not assigned')) {
        const message = error.response?.data?.message || 'Failed to load users count.';
        toast.error(message);
      }
      setTotalUsersCount(0);
    } finally {
      setLoadingUsersCount(false);
    }
  };

  const fetchAdminNotifications = async () => {
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

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const toggleNotificationPanel = async () => {
    const willOpen = !showNotificationPanel;
    setShowNotificationPanel(willOpen);

    if (willOpen && unreadCount > 0) {
      try {
        await notificationAPI.markAllRead();
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      } catch {
        // Ignore failures when marking notifications read.
      }
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchArchivedCompletedRequests();
    fetchTotalUsersCount();
    fetchAdminNotifications();

    const liveRefreshInterval = setInterval(() => {
      if (!adminAccessErrorShown.current) {
        fetchRequests();
        fetchTotalUsersCount();
      }
    }, 15000); // Refresh stats every 15 seconds to stay in sync with backend

    return () => clearInterval(liveRefreshInterval);
  }, []);

  useEffect(() => {
    if (!showNotificationPanel) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
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

  const handleNotificationItemClick = async (notification) => {
    if (!notification) {
      return;
    }

    const notificationId = notification._id || notification.id;

    if (notificationId && !notification.read) {
      try {
        await notificationAPI.markRead(notificationId);
      } catch {
        // ignore failures to preserve navigation.
      }

      setNotifications((prev) => prev.map((item) => (
        (item._id || item.id) === notificationId ? { ...item, read: true } : item
      )));
    }

    setShowNotificationPanel(false);
    navigate('/admin/requests');
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

  const updateRequestStatus = async (requestId, status, message = '', deliverables = [], expiryDate = '', formData = null) => {
    setUpdatingRequestId(requestId);
    try {
      let response;
      if (formData) {
        response = await requestAPI.updateStatus(requestId, formData);
      } else {
        response = await requestAPI.updateStatus(requestId, { status, message, deliverables, expiryDate });
      }
      const updatedRequest = response.data?.data?.request;
      setRequests((prev) => prev.map((request) => {
        if (request._id !== requestId) {
          return request;
        }
        return updatedRequest || {
          ...request,
          status,
          reviewMessage: message,
        };
      }));
      toast.success(`Status updated to ${status}`);
      // Auto-refresh all requests from backend if status is Completed
      if (String(status).trim().toLowerCase() === 'completed') {
        await fetchRequests();
      }
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update request status.';
      toast.error(message);
      return false;
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const saveCompletedRequestToList = async (requestId) => {
    setSavingCompletedRequestId(requestId);

    try {
      const response = await requestAPI.archiveCompleted(requestId);
      const archivedRequest = response.data?.data?.request;

      setRequests((prev) => prev.filter((request) => request._id !== requestId));

      if (archivedRequest?._id) {
        setArchivedCompletedRequests((prev) => [
          archivedRequest,
          ...prev.filter((request) => request._id !== archivedRequest._id),
        ]);
      }

      toast.success('Request saved to Completed List');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save request to list.';
      toast.error(message);
      return false;
    } finally {
      setSavingCompletedRequestId(null);
    }
  };

  const addRequestComment = async (requestId, text, isInternal = false) => {
    setCommentingRequestId(requestId);

    try {
      const response = await requestAPI.addComment(requestId, { text, isInternal });
      const updatedRequest = response.data?.data?.request;

      setRequests((prev) => prev.map((request) => (
        request._id === requestId
          ? (updatedRequest || request)
          : request
      )));

      toast.success(isInternal ? 'Internal note added' : 'Comment sent to client');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add comment.';
      toast.error(message);
      return false;
    } finally {
      setCommentingRequestId(null);
    }
  };

  const updateRequestComment = async (requestId, commentId, text) => {
    const requestCommentKey = `${requestId}:${commentId}`;
    setEditingCommentKey(requestCommentKey);

    try {
      const response = await requestAPI.updateComment(requestId, commentId, { text });
      const updatedRequest = response.data?.data?.request;

      setRequests((prev) => prev.map((request) => (
        request._id === requestId
          ? (updatedRequest || request)
          : request
      )));

      toast.success('Comment updated');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update comment.';
      toast.error(message);
      return false;
    } finally {
      setEditingCommentKey('');
    }
  };

  const deleteRequestComment = async (requestId, commentId) => {
    const requestCommentKey = `${requestId}:${commentId}`;
    setDeletingCommentKey(requestCommentKey);

    try {
      const response = await requestAPI.deleteComment(requestId, commentId);
      const updatedRequest = response.data?.data?.request;

      setRequests((prev) => prev.map((request) => (
        request._id === requestId
          ? (updatedRequest || request)
          : request
      )));

      toast.success('Comment deleted');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete comment.';
      toast.error(message);
      return false;
    } finally {
      setDeletingCommentKey('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-slate-100 bg-white">
        <Sidebar isAdmin renewCount={renewalRequestCount} />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 h-full shadow-2xl"><Sidebar isAdmin onClose={() => setSidebarOpen(false)} renewCount={renewalRequestCount} /></div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-slate-900 text-lg">Admin Panel</h1>
              <span className="badge bg-red-100 text-red-600 text-[10px]">ADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotificationPanel}
                className="relative p-2 rounded-lg hover:bg-slate-100"
                title="View admin notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 text-[11px] text-white px-1">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotificationPanel && (
                <div
                  ref={notificationPanelRef}
                  className="fixed inset-x-2 top-[72px] z-20 mx-auto w-auto max-w-[320px] max-h-[480px] overflow-hidden overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[320px]"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} unread` : 'No unread notifications'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowNotificationPanel(false); navigate('/admin/requests'); }}
                      className="text-xs text-slate-600 hover:text-slate-900"
                    >
                      View all
                    </button>
                  </div>
                  {loadingNotifications ? (
                    <div className="px-4 py-6 text-center text-slate-500">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-500">No notifications yet</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((notification) => {
                        const notificationId = String(notification._id || notification.id || '');
                        const isDeleting = deletingNotificationId === notificationId;

                        return (
                          <li
                            key={notificationId}
                            onClick={() => handleNotificationItemClick(notification)}
                            className={`cursor-pointer px-4 py-3 ${notification.read ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                                <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{notification.message}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!notification.read && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />}
                                <button
                                  type="button"
                                  onClick={(event) => handleDeleteNotification(notification, event)}
                                  disabled={isDeleting}
                                  className="rounded-full p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  aria-label="Delete notification"
                                >
                                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                                </button>
                              </div>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleDateString('en-IN')}</p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="w-9 h-9 bg-primary-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route
              index
              element={(
                <AdminOverview
                  requests={requests}
                  loading={loadingRequests}
                  totalUsersCount={totalUsersCount}
                  loadingUsersCount={loadingUsersCount}
                />
              )}
            />
            <Route
              path="requests"
              element={(
                <ManageRequests
                  requests={requests}
                  loading={loadingRequests}
                  onUpdateStatus={updateRequestStatus}
                  onAddComment={addRequestComment}
                  onUpdateComment={updateRequestComment}
                  onDeleteComment={deleteRequestComment}
                  onSaveToCompletedList={saveCompletedRequestToList}
                  updatingRequestId={updatingRequestId}
                  savingCompletedRequestId={savingCompletedRequestId}
                  commentingRequestId={commentingRequestId}
                  editingCommentKey={editingCommentKey}
                  deletingCommentKey={deletingCommentKey}
                  currentUser={user}
                />
              )}
            />
            <Route path="services" element={<ManageServices />} />
            <Route path="users" element={<AdminUsers requests={requests} />} />
            <Route
              path="completed-list"
              element={(
                <SettingsCompletedList
                  archivedRequests={archivedCompletedRequests}
                  loading={loadingArchivedCompleted}
                  onRefresh={fetchArchivedCompletedRequests}
                />
              )}
            />
            <Route
              path="renewals"
              element={(
                <AdminRenewals
                  requests={requests}
                  loading={loadingRequests}
                />
              )}
            />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
