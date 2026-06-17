import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate, Routes, Route, useSearchParams, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Loader2, X, Plus } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { requestAPI, userAPI, notificationAPI } from '../services/api';

const AdminOverview = lazy(() => import('./AdminOverview'));
const ManageRequests = lazy(() => import('./ManageRequests'));
const AdminUsers = lazy(() => import('./AdminUsers'));
const SettingsCompletedList = lazy(() => import('./SettingsCompletedList'));
const AdminRenewals = lazy(() => import('./AdminRenewals'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const Subscription = lazy(() => import('./Subscription'));
const AdminAnalytics = lazy(() => import('./AdminAnalytics'));

const FallbackLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
    <p className="text-slate-500 font-medium animate-pulse">Loading component...</p>
  </div>
);

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
  const [acquiringRequestId, setAcquiringRequestId] = useState(null);
  const [savingCompletedRequestId, setSavingCompletedRequestId] = useState(null);
  const [subscriptionPrompt, setSubscriptionPrompt] = useState({ open: false, message: '' });
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

  const fetchRequests = async (showLoader = true) => {
    if (showLoader) {
      setLoadingRequests(true);
    }

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
        fetchRequests(false);
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

  const acquireRequestData = async (requestId, proposedTime, proposedPrice) => {
    setAcquiringRequestId(requestId);
    try {
      const response = await requestAPI.acquire(requestId, { proposedTime, proposedPrice });
      const updatedRequest = response.data?.data?.request;
      setRequests((prev) => prev.map((request) => {
        if (request._id !== requestId) return request;
        return updatedRequest || { ...request, acquireStatus: 'pending_user_approval', assignedTo: user._id };
      }));
      toast.success('Request acquired successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to acquire request.';
      if (error.response?.status === 403 && (message.toLowerCase().includes('subscription') || message.toLowerCase().includes('plan limit'))) {
        setSubscriptionPrompt({ open: true, message });
      } else {
        toast.error(message);
      }
      return false;
    } finally {
      setAcquiringRequestId(null);
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
          <Suspense fallback={<FallbackLoader />}>
            <Routes>
              <Route
                index
                element={(
                  <AdminOverview
                    requests={requests}
                    loading={loadingRequests}
                    totalUsersCount={totalUsersCount}
                    loadingUsersCount={loadingUsersCount}
                    onAcquireRequest={acquireRequestData}
                    acquiringRequestId={acquiringRequestId}
                    currentUser={user}
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
                    onAcquireRequest={acquireRequestData}
                    onAddComment={addRequestComment}
                    onUpdateComment={updateRequestComment}
                    onDeleteComment={deleteRequestComment}
                    onSaveToCompletedList={saveCompletedRequestToList}
                    updatingRequestId={updatingRequestId}
                    acquiringRequestId={acquiringRequestId}
                    savingCompletedRequestId={savingCompletedRequestId}
                    commentingRequestId={commentingRequestId}
                    editingCommentKey={editingCommentKey}
                    deletingCommentKey={deletingCommentKey}
                    currentUser={user}
                  />
                )}
              />
              
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
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {/* Subscription Prompt Modal */}
      {subscriptionPrompt.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-rose-600 mb-2">Subscription Action Required</h3>
              <p className="text-slate-600 mb-6">{subscriptionPrompt.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSubscriptionPrompt({ open: false, message: '' })}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSubscriptionPrompt({ open: false, message: '' });
                    window.location.hash = '#/admin/settings'; // Go to settings which renders Subscription
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

