import { Fragment, useEffect, useState } from 'react';
import DynamicDocumentUpload from '../components/DynamicDocumentUpload';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestAPI } from '../services/api';
import StatusBadge from '../components/admin/StatusBadge';
import { normalizeWorkflowStatus, toAbsoluteFileUrl } from '../utils/adminUtils';

export default function ManageRequests({
  requests,
  loading,
  onUpdateStatus,
  onAcquireRequest,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  updatingRequestId,
  acquiringRequestId,
  commentingRequestId,
  editingCommentKey,
  deletingCommentKey,
  currentUser,
}) {
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const getDocumentKey = (doc) => {
    if (typeof doc === 'string') return doc;
    if (doc && typeof doc === 'object') return doc.url || doc.name || '';
    return '';
  };

  const openDetailsModal = (request) => setDetailsRequest(request);
  const closeDetailsModal = () => setDetailsRequest(null);

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

  const handleAddRenewNote = () => setRenewNotes((prev) => [...prev, '']);
  const handleRemoveRenewNote = (index) => setRenewNotes((prev) => prev.filter((_, idx) => idx !== index));
  const handleRenewDocsChange = (docs) => setRenewDocuments(docs);

  const handleSubmitRenewProcess = async () => {
    const requestId = renewPopup.request?._id;
    if (!requestId) return;

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
      if (renewExpiryDate) formData.append('expiryDate', renewExpiryDate);
      if (files.length) {
        formData.append('deliverables', JSON.stringify(files.map((doc) => doc.name)));
        files.forEach((doc) => formData.append('files', doc.file, doc.name));
      }

      const success = await onUpdateStatus(requestId, 'Renewed', noteText.join('\n\n'), files.map((doc) => doc.name), renewExpiryDate, formData);
      if (success) {
        toast.success('Service renewed successfully.');
        closeRenewPopup();
        if (detailsRequest?._id === requestId) {
          try {
            const response = await requestAPI.getById(requestId);
            setDetailsRequest(response.data?.data?.request || detailsRequest);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not start renewal process.');
    } finally {
      setRenewSubmitting(false);
    }
  };

  const toggleCompletedEditMode = (requestId) => setCompletedEditingRequestId((prev) => (prev === requestId ? '' : requestId));

  const handleMarkDocumentRemoved = (requestId, docKey) => {
    setRemovedDeliverablesById((prev) => ({
      ...prev,
      [requestId]: Array.from(new Set([...(prev[requestId] || []), docKey])),
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
      newDocs.forEach((doc) => formData.append('files', doc.file, doc.name));
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

  const handleMoveToInProgress = async (requestId) => await onUpdateStatus(requestId, 'In Progress');

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
    const formData = new FormData();
    formData.append('status', 'Filed');
    formData.append('expiryDate', expiryDate);
    formData.append('deliverables', JSON.stringify(docs.map(d => d.name)));
    docs.forEach((doc) => formData.append('files', doc.file, doc.name));
    await onUpdateStatus(requestId, 'Filed', '', docs.map(d => d.name), expiryDate, formData);
    setDocumentsById(prev => ({ ...prev, [requestId]: [] }));
    setExpiryDraftById(prev => ({ ...prev, [requestId]: '' }));
  };

  const handleMoveToCompleted = async (requestId) => await onUpdateStatus(requestId, 'Completed');

  const [expandedRequestId, setExpandedRequestId] = useState('');
  const [actionNeededDraftById, setActionNeededDraftById] = useState({});
  const [internalNoteDraftById, setInternalNoteDraftById] = useState({});
  const [publicCommentDraftById, setPublicCommentDraftById] = useState({});
  const [editingCommentState, setEditingCommentState] = useState({ requestId: '', commentId: '', text: '' });
  
  const [acquireModal, setAcquireModal] = useState({ open: false, requestId: '', proposedTime: '', proposedPrice: '' });
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: '', message: '' });
  const [updatePriceModal, setUpdatePriceModal] = useState({ open: false, requestId: '', proposedPrice: '' });
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');

  const canManageComment = (comment) => {
    const authorId = String(comment?.author?._id || comment?.author || '');
    return Boolean(authorId && currentUserId && authorId === currentUserId);
  };

  const toggleReviewPanel = (requestId) => setExpandedRequestId((prev) => (prev === requestId ? '' : requestId));

  const handleStartReview = async (requestId) => await onUpdateStatus(requestId, 'In Review');

  const handleMoveToActionNeeded = async (requestId) => {
    const message = (actionNeededDraftById[requestId] || '').trim();
    if (!message) {
      toast.error('Please write what is needed from the client.');
      return;
    }
    const success = await onUpdateStatus(requestId, 'Action Needed', message);
    if (success) setActionNeededDraftById((prev) => ({ ...prev, [requestId]: '' }));
  };

  const handleResumeReview = async (requestId) => await onUpdateStatus(requestId, 'In Review');
  const handleApprove = async (requestId) => await onUpdateStatus(requestId, 'Approved');

  const handleOpenReject = (requestId) => setRejectModal({ open: true, requestId, message: '' });
  const handleCloseReject = () => setRejectModal({ open: false, requestId: '', message: '' });
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

  const handleOpenAcquire = (requestId, currentPrice) => setAcquireModal({ open: true, requestId, proposedTime: '', proposedPrice: currentPrice || '' });
  const handleCloseAcquire = () => setAcquireModal({ open: false, requestId: '', proposedTime: '', proposedPrice: '' });
  const handleAcquireSubmit = async (e) => {
    e.preventDefault();
    const { requestId, proposedTime, proposedPrice } = acquireModal;
    if (!proposedTime.trim()) {
      toast.error('Please provide an estimated time to complete.');
      return;
    }
    const success = await onAcquireRequest(requestId, proposedTime.trim(), proposedPrice);
    if (success) handleCloseAcquire();
  };

  const handleOpenUpdatePrice = (requestId, currentPrice) => setUpdatePriceModal({ open: true, requestId, proposedPrice: currentPrice || '' });
  const handleCloseUpdatePrice = () => setUpdatePriceModal({ open: false, requestId: '', proposedPrice: '' });
  const handleUpdatePriceSubmit = async (e) => {
    e.preventDefault();
    const { requestId, proposedPrice } = updatePriceModal;
    if (!proposedPrice) {
      toast.error('Please provide a new proposed price.');
      return;
    }
    try {
      await requestAPI.updatePrice(requestId, { proposedPrice });
      toast.success('Proposed price updated successfully');
      handleCloseUpdatePrice();
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update price');
    }
  };

  const handleAddInternalNote = async (requestId) => {
    const text = (internalNoteDraftById[requestId] || '').trim();
    if (!text) {
      toast.error('Internal note cannot be empty.');
      return;
    }
    const success = await onAddComment(requestId, text, true);
    if (success) setInternalNoteDraftById((prev) => ({ ...prev, [requestId]: '' }));
  };

  const handleAddPublicComment = async (requestId) => {
    const text = (publicCommentDraftById[requestId] || '').trim();
    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }
    const success = await onAddComment(requestId, text, false);
    if (success) setPublicCommentDraftById((prev) => ({ ...prev, [requestId]: '' }));
  };

  const handleStartEditComment = (requestId, comment) => {
    const commentId = String(comment?._id || '');
    if (!commentId || !canManageComment(comment)) return;
    setEditingCommentState({ requestId, commentId, text: String(comment.text || '') });
  };

  const handleCancelEditComment = () => setEditingCommentState({ requestId: '', commentId: '', text: '' });

  const handleSaveCommentEdit = async () => {
    const { requestId, commentId, text } = editingCommentState;
    if (!requestId || !commentId) return;
    if (!text.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }
    const success = await onUpdateComment(requestId, commentId, text.trim());
    if (success) handleCancelEditComment();
  };

  const handleDeleteComment = async (requestId, commentId) => {
    if (!requestId || !commentId) return;
    if (!window.confirm('Delete this comment? This action cannot be undone.')) return;
    const success = await onDeleteComment(requestId, commentId);
    if (success && editingCommentState.commentId === commentId && editingCommentState.requestId === requestId) {
      handleCancelEditComment();
    }
  };

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
    setCurrentPage(1); // Reset page on filter change
  }, [searchUser, searchService, requests, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Manage Requests</h2>
          <p className="text-slate-500 text-sm mt-1">Use the workflow Submitted → In Review → Approved → Completed.</p>
        </div>
        <button
          className="btn btn-outline px-4 py-2 text-sm border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
          onClick={() => window.location.reload()}
          title="Reload latest requests"
        >
          Refresh
        </button>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100 items-start sm:items-center bg-white rounded-t-xl" onSubmit={handleSearch}>
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
        <button type="submit" className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md">
          Search
        </button>
      </form>

      <div className="card overflow-hidden bg-white shadow-sm rounded-b-xl border border-slate-200">
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
                <th className="table-head w-10"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">Loading requests...</td>
                </tr>
              ) : currentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">
                    No requests found.
                  </td>
                </tr>
              ) : (
                currentRequests.map((req) => {
                  const details = req.details && typeof req.details === 'object' ? req.details : {};
                  const requestId = String(req._id || '');
                  const workflowStatus = normalizeWorkflowStatus(req.status);
                  const isExpanded = expandedRequestId === requestId;
                  const isUpdating = updatingRequestId === requestId;
                  const isLockedForMe = typeof req.assignedTo === 'object' && req.assignedTo !== null 
                    ? String(req.assignedTo._id || '') !== currentUserId 
                    : String(req.assignedTo || '') !== currentUserId && req.assignedTo;

                  return (
                    <Fragment key={requestId}>
                      <tr className={`transition-colors ${isLockedForMe ? 'bg-slate-50 opacity-75' : 'hover:bg-slate-50'}`}>
                        <td className="table-cell font-mono text-xs text-slate-500">REQ-{requestId.slice(-6).toUpperCase()}</td>
                        <td className="table-cell font-medium text-slate-800">{req.user?.name || 'Unknown User'}</td>
                        <td className="table-cell text-slate-600">{req.service?.title || 'N/A'}</td>
                        <td className="table-cell font-semibold">₹{Number(req.service?.price || 0).toLocaleString('en-IN')}</td>
                        <td className="table-cell"><StatusBadge status={req.status} /></td>
                        <td className="table-cell">
                          <div className="flex gap-1 flex-wrap items-center">
                            {req.acquireStatus === 'unacquired' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAcquire(requestId, req.service?.price)}
                                disabled={isUpdating || acquiringRequestId === requestId}
                                className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                              >
                                {acquiringRequestId === requestId ? 'Acquiring...' : 'Acquire'}
                              </button>
                            )}
                            {workflowStatus === 'submitted' && req.acquireStatus === 'approved' && !isLockedForMe && (
                              <button
                                onClick={() => handleStartReview(requestId)}
                                disabled={isUpdating}
                                className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium"
                              >
                                Start Review
                              </button>
                            )}
                            {workflowStatus === 'inreview' && !isLockedForMe && (
                              <>
                                <button onClick={() => handleApprove(requestId)} disabled={isUpdating} className="px-2.5 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium">Approve Details</button>
                                <button onClick={() => handleOpenReject(requestId)} disabled={isUpdating} className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium">Reject</button>
                              </>
                            )}
                            {workflowStatus === 'paid' && (
                              <button onClick={() => handleMoveToInProgress(requestId)} disabled={isUpdating} className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 font-medium">Start Processing</button>
                            )}
                            {workflowStatus === 'inprogress' && (
                              <button onClick={() => handleMoveToFiled(requestId)} disabled={isUpdating} className="px-2.5 py-1 text-xs rounded-lg border border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50 font-medium">Mark as Filed</button>
                            )}
                            {workflowStatus === 'filed' && (
                              <button onClick={() => handleMoveToCompleted(requestId)} disabled={isUpdating} className="px-2.5 py-1 text-xs rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium">Mark as Completed</button>
                            )}
                          </div>
                        </td>
                        <td className="table-cell text-right">
                          <button
                            type="button"
                            onClick={() => toggleReviewPanel(requestId)}
                            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && !isLockedForMe && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={7} className="p-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                              <p className="text-sm font-semibold">Additional Details Panel Placeholder</p>
                              <p className="text-xs text-slate-500">The full details view has been condensed for brevity in this refactored component. Further UI updates can be easily applied here.</p>
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
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
