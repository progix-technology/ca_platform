import React, { useEffect, useState } from "react";
import { requestAPI } from '../services/api';

export default function CompletedRequestModal({ open, onClose, request, loading }) {
  if (!open) return null;

  // Helper to get absolute file URL (copied from AdminDashboard)
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const toAbsoluteFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `${uploadsBaseUrl}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
  };

  const [isRenewing, setIsRenewing] = useState(false);
  const [renewStarted, setRenewStarted] = useState(false);
  const [renewalTimestamp, setRenewalTimestamp] = useState('');

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    setIsRenewing(false);
    setRenewStarted(false);
    setRenewalTimestamp('');
    setFeedbackModalOpen(false);
    setRating(5);
    setComment('');
  }, [request?._id]);

  const handleRenewRequest = async () => {
    if (!request?._id) {
      return;
    }

    setIsRenewing(true);

    try {
      const response = await requestAPI.renew(request._id);
      if (response?.data?.data?.request) {
        // update note only locally if needed
      }
      setRenewStarted(true);
      setRenewalTimestamp(new Date().toISOString());
      window.alert('Renewal started successfully.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not start renewal.';
      window.alert(message);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!comment.trim()) {
      window.alert('Please provide a comment.');
      return;
    }
    setSubmittingFeedback(true);
    try {
      await requestAPI.submitFeedback(request._id, { rating, comment });
      window.alert('Feedback submitted successfully!');
      if (request) {
        request.feedbackSubmitted = true;
      }
      setFeedbackModalOpen(false);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to submit feedback.';
      window.alert(message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Helper to format timeline if present
  const renderTimeline = (timeline) => {
    if (!Array.isArray(timeline) || timeline.length === 0) return null;
    return (
      <div className="mt-4">
        <h3 className="font-semibold mb-2 text-base">Status Timeline</h3>
        <ol className="border-l-2 border-blue-200 ml-2">
          {timeline.map((item, idx) => (
            <li key={idx} className="mb-2 ml-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="font-medium">{item.status}</span>
                <span className="text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}</span>
              </div>
              {item.changedBy && (
                <div className="ml-5 text-xs text-gray-600">
                  By: {item.changedBy.name} ({item.changedBy.email})
                </div>
              )}
              {item.note && item.note.trim() && (
                <div className="ml-5 text-xs italic text-gray-700">Note: {item.note}</div>
              )}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const getDocumentLabel = (doc, index) => {
    if (typeof doc === 'string') {
      return doc.split('/').pop() || `Document ${index + 1}`;
    }
    if (doc && typeof doc === 'object') {
      return doc.name || (doc.url ? doc.url.split('/').pop() : `Document ${index + 1}`) || `Document ${index + 1}`;
    }
    return `Document ${index + 1}`;
  };

  const renderDocuments = (docs) => {
    if (!Array.isArray(docs) || docs.length === 0) return null;
    return (
      <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
        {docs.map((doc, idx) => {
          const url = typeof doc === 'string' ? doc : (doc?.url || '');
          const label = getDocumentLabel(doc, idx);
          const href = url ? toAbsoluteFileUrl(url) : '#';
          return (
            <li key={`${label}-${idx}`}>
              {url ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-900">
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  const getMatchedUploadedDocuments = (requiredDocName, uploadedDocs) => {
    if (!Array.isArray(uploadedDocs) || uploadedDocs.length === 0) {
      return [];
    }
    const normalizedRequired = String(requiredDocName || '').trim().toLowerCase();
    return uploadedDocs.filter((doc) => {
      const label = String(getDocumentLabel(doc)).toLowerCase();
      if (label.includes(normalizedRequired)) return true;
      return normalizedRequired
        .split(/\s+/)
        .filter(Boolean)
        .every((token) => label.includes(token));
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-5xl max-h-[88vh] relative overflow-hidden">
        <button
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 text-2xl leading-none"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Request Details</h2>
        <div className="overflow-y-auto max-h-[80vh] pr-2 pb-6">
          {loading ? (
            <div className="text-slate-500">Loading request details...</div>
          ) : request ? (
            <div className="space-y-4 pb-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Request ID</p>
                  <p className="text-sm text-slate-900 font-mono">REQ-{String(request._id).slice(-6).toUpperCase()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Status</p>
                  <p className="text-sm text-slate-900">
                    {request?.status || 'Unknown'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Client</p>
                  <p className="text-sm text-slate-900">{request.user?.name || '-'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="text-sm text-slate-900">{request.user?.email || '-'}</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Service</p>
                  <p className="text-sm text-slate-900">{request.service?.title || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Amount</p>
                  <p className="text-sm text-slate-900">₹{Number(request.service?.price || 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Completed On</p>
                  <p className="text-sm text-slate-900">{request.updatedAt ? new Date(request.updatedAt).toLocaleString('en-IN') : '-'}</p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">User Note</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{request.details?.message || 'No additional note provided.'}</p>
                </div>
                {request.expiryDate && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-1">Expiry Date</p>
                    <p className="text-sm text-blue-900">{new Date(request.expiryDate).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Service Required Documents</p>
                  {Array.isArray(request.service?.documentsRequired) && request.service.documentsRequired.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-2">
                      {request.service.documentsRequired.map((docName) => {
                        const matchedDocs = getMatchedUploadedDocuments(docName, request.documents);
                        return (
                          <li key={docName} className="space-y-1">
                            <div className="font-medium">{docName}</div>
                            <div className="text-[11px] text-slate-500">
                              {matchedDocs.length > 0 ? matchedDocs.map((doc, idx) => getDocumentLabel(doc, idx)).join(', ') : 'Not uploaded'}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No predefined list for this service.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">All Uploaded Documents</p>
                  {renderDocuments(request.documents) || (<p className="text-sm text-slate-500">No documents uploaded.</p>)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">Status Timeline</p>
                {Array.isArray(request.statusTimeline) && request.statusTimeline.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {request.statusTimeline.map((item, idx) => (
                      <div key={`${item.status}-${item.createdAt || idx}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{item.status}</p>
                            <p className="text-[11px] text-slate-500">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}
                              {item.changedBy ? ` · ${item.changedBy.name || 'System'}` : ''}
                            </p>
                          </div>
                          {(item.expiryDate || (Array.isArray(item.documents) && item.documents.length > 0)) && (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-right text-[11px] text-slate-600 max-w-full sm:max-w-xs">
                              {item.expiryDate && (
                                <div>
                                  <span className="font-semibold">New Validity:</span>
                                  <div>{new Date(item.expiryDate).toLocaleString('en-IN')}</div>
                                </div>
                              )}
                              {Array.isArray(item.documents) && item.documents.length > 0 && (
                                <div className="mt-2">
                                  <span className="font-semibold">New Docs:</span>
                                  <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1">
                                    {item.documents.map((doc, docIndex) => (
                                      <li key={`${docIndex}-${doc?.name || doc?.url || String(doc)}`}>
                                        {typeof doc === 'string'
                                          ? doc.split('/').pop()
                                          : doc?.name || (doc?.url ? doc.url.split('/').pop() : 'Uploaded document')}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {item.status === 'Renewed' && (
                          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                            <p className="text-[11px]">Renewal completed on {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}</p>
                            {item.note && <p className="text-sm text-blue-700 mt-2">{item.note}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Timeline is not available yet.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 mb-4">
                {request.onDownloadInvoice && (
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => request.onDownloadInvoice(request._id)}
                  >
                    Download Invoice
                  </button>
                )}

                {request.status === 'Completed' && !request.feedbackSubmitted && (
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    onClick={() => setFeedbackModalOpen(true)}
                  >
                    Leave Feedback
                  </button>
                )}
              </div>

              {feedbackModalOpen && (
                <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <h4 className="font-semibold text-slate-800 mb-3">Provide Feedback</h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Tell us about your experience..."
                    ></textarea>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    <button
                      onClick={() => setFeedbackModalOpen(false)}
                      className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {request.feedbackSubmitted && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-green-900">
                  <p className="text-sm font-medium">✓ You have already provided feedback for this service. Thank you!</p>
                </div>
              )}

              {(request.status === 'Completed' || request.status === 'completed') && !renewStarted && !request.renewalRequested && requestAPI?.renew && (
                <button
                  className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  onClick={handleRenewRequest}
                  disabled={isRenewing}
                >
                  {isRenewing ? 'Renewing...' : 'Renew Service'}
                </button>
              )}
              {request.renewalRequested && !renewStarted && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                  Renewal request has already been submitted for this service.
                </div>
              )}
              {(renewStarted || request.renewalRequested || request.status === 'Service Renewing') && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                  Renewal is in progress for this service.
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">No request data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
