import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/admin/StatusBadge';
import { normalizeWorkflowStatus } from '../utils/adminUtils';

export default function AdminOverview({ requests, loading, totalUsersCount, loadingUsersCount, onAcquireRequest, acquiringRequestId, currentUser }) {
  const navigate = useNavigate();
  const [acquireModal, setAcquireModal] = useState({ open: false, requestId: '', proposedTime: '', proposedPrice: '' });

  const pendingCount = requests.filter((request) => {
    const workflowStatus = normalizeWorkflowStatus(request.status);
    return workflowStatus === 'submitted' || workflowStatus === 'actionneeded';
  }).length;

  const totalRequestsCount = requests.length;

  // Calculate Revenue (MTD)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let currentMonthRevenue = 0;
  let lastMonthRevenue = 0;

  requests.forEach(req => {
    const isCompleted = normalizeWorkflowStatus(req.status) === 'completed';
    if (!isCompleted) return;
    
    const reqDate = new Date(req.createdAt || req.updatedAt);
    const reqMonth = reqDate.getMonth();
    const reqYear = reqDate.getFullYear();
    const price = Number(req.proposedPrice || req.service?.price || 0);

    if (reqYear === currentYear && reqMonth === currentMonth) {
      currentMonthRevenue += price;
    } else if ((reqYear === currentYear && reqMonth === currentMonth - 1) || 
               (reqYear === currentYear - 1 && currentMonth === 0 && reqMonth === 11)) {
      lastMonthRevenue += price;
    }
  });

  const revenueChangePercent = lastMonthRevenue === 0 
    ? 100 
    : Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    
  const revenueChangeText = lastMonthRevenue === 0 && currentMonthRevenue === 0 
    ? 'No data yet' 
    : `${revenueChangePercent >= 0 ? '+' : ''}${revenueChangePercent}% vs last month`;

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

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
    { 
      label: 'Revenue (MTD)', 
      value: loading ? '...' : formatCurrency(currentMonthRevenue), 
      icon: DollarSign, 
      color: 'bg-emerald-50 text-emerald-600', 
      change: revenueChangeText, 
      to: '/admin/requests' 
    },
    { label: 'Pending Actions', value: String(pendingCount), icon: TrendingUp, color: 'bg-amber-50 text-amber-600', change: 'Needs review', to: '/admin/requests' },
  ];

  const handleOpenAcquire = (requestId, currentPrice) => {
    setAcquireModal({ open: true, requestId, proposedTime: '', proposedPrice: currentPrice || '' });
  };

  const handleCloseAcquire = () => {
    setAcquireModal({ open: false, requestId: '', proposedTime: '', proposedPrice: '' });
  };

  const handleAcquireSubmit = async (e) => {
    e.preventDefault();
    const { requestId, proposedTime, proposedPrice } = acquireModal;
    if (!proposedTime.trim()) {
      toast.error('Please provide an estimated time to complete.');
      return;
    }
    const success = await onAcquireRequest(requestId, proposedTime.trim(), proposedPrice);
    if (success) {
      handleCloseAcquire();
    }
  };

  const hasActiveSubscription = currentUser?.subscription?.status === 'active';
  const planName = currentUser?.subscription?.planName || currentUser?.subscription?.planId?.name || 'No Active Plan';

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-1">Admin Dashboard</h2>
          <p className="text-slate-500">Overview of platform activity and performance.</p>
        </div>

        {/* Plan Information Section */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 w-full sm:w-auto">
          {hasActiveSubscription ? (
            <>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{planName}</span>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Active</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/subscription')}
                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Manage
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Current Plan</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Free / None</span>
                  <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Inactive</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/subscription')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Upgrade Plan
              </button>
            </>
          )}
        </div>
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
                <th className="table-head">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">Loading requests...</td>
                </tr>
              ) : requests.filter(req => !['Rejected', 'Completed', 'Canceled'].includes(req.status)).length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">No active requests found yet.</td>
                </tr>
              ) : (
                requests.filter(req => !['Rejected', 'Completed', 'Canceled'].includes(req.status)).slice(0, 5).map((req) => {
                  const isUnacquired = req.acquireStatus === 'unacquired';
                  const currentUserIdStr = String(currentUser?._id || currentUser?.id || '');
                  const assignedToId = typeof req.assignedTo === 'object' && req.assignedTo !== null
                    ? String(req.assignedTo._id || '')
                    : String(req.assignedTo || '');
                  const isLockedForMe = Boolean(assignedToId && assignedToId !== currentUserIdStr);
                  const rowClass = isUnacquired
                    ? "hover:bg-indigo-50 transition-colors cursor-pointer bg-indigo-50/40 relative overflow-hidden"
                    : isLockedForMe
                      ? "bg-slate-50 opacity-75 cursor-not-allowed"
                      : "hover:bg-slate-50 transition-colors cursor-pointer";
                  return (
                    <tr
                      key={req._id}
                      onClick={() => {
                        if (!isLockedForMe) {
                          navigate('/admin/requests');
                        }
                      }}
                      className={rowClass}
                    >
                      <td className="table-cell font-mono text-xs text-slate-500">
                        {isUnacquired && <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 animate-pulse"></span>}
                        REQ-{req._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="table-cell font-medium text-slate-800">{req.user?.name || 'Unknown User'}</td>
                      <td className="table-cell text-slate-600">{req.service?.title || 'N/A'}</td>
                      <td className="table-cell">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="table-cell font-semibold">₹{Number(req.service?.price || 0).toLocaleString('en-IN')}</td>
                      <td className="table-cell"><StatusBadge status={req.status} /></td>
                      <td className="table-cell">
                        {isUnacquired ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAcquire(req._id, req.service?.price);
                            }}
                            disabled={acquiringRequestId === req._id}
                            className="px-2.5 py-1 text-xs rounded-lg border border-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-medium animate-pulse shadow-sm shadow-indigo-200"
                          >
                            {acquiringRequestId === req._id ? 'Acquiring...' : 'Acquire Now'}
                          </button>
                        ) : req.acquireStatus === 'pending_user_approval' ? (
                          <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${assignedToId === currentUserIdStr ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {assignedToId === currentUserIdStr ? 'Pending' : 'Acquired'}
                          </span>
                        ) : !isLockedForMe ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/admin/requests');
                            }}
                            className="px-2.5 py-1 text-xs rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors font-medium"
                          >
                            Review
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Acquire modal for Admin Overview */}
      {acquireModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-2 text-indigo-700">Acquire Request</h3>
            <form onSubmit={handleAcquireSubmit}>
              <label className="block mb-2 text-sm font-medium text-slate-700">Estimated Time to Complete *</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={acquireModal.proposedTime}
                onChange={e => setAcquireModal(m => ({ ...m, proposedTime: e.target.value }))}
                placeholder="e.g. 3 Days"
                required
              />
              
              <label className="block mb-2 text-sm font-medium text-slate-700">Proposed Price (₹) (Optional)</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={acquireModal.proposedPrice}
                onChange={e => setAcquireModal(m => ({ ...m, proposedPrice: e.target.value }))}
                placeholder="e.g. 999"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={handleCloseAcquire} className="px-4 py-1 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={acquiringRequestId === acquireModal.requestId} className="px-4 py-1 rounded-lg border border-indigo-200 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold disabled:opacity-50">
                  {acquiringRequestId === acquireModal.requestId ? 'Submitting...' : 'Propose'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
