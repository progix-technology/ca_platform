import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw } from 'lucide-react';

function formatRequestCode(requestId) {
  const id = String(requestId || '');
  if (!id) return 'REQ-NA';
  return id.startsWith('REQ-') ? id : `REQ-${id.slice(-6).toUpperCase()}`;
}

export default function AdminRenewals({ requests, loading }) {
  const navigate = useNavigate();
  const completedRequests = useMemo(
    () => requests.filter((request) => request.renewalRequested === true && String(request.status).trim().toLowerCase() !== 'renewed'),
    [requests],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Renewal Requests</h2>
          <p className="text-slate-500">View completed requests that may need renewal attention.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/requests?status=completed')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <RefreshCcw size={16} />
          Go to Completed Requests
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-head">Request ID</th>
                <th className="table-head">Client</th>
                <th className="table-head">Service</th>
                <th className="table-head">Expiry Date</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-slate-500 py-8">Loading requests...</td>
                </tr>
              ) : completedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell text-center text-slate-500 py-8">No completed requests available for renewal.</td>
                </tr>
              ) : (
                completedRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-mono text-xs text-slate-500">{formatRequestCode(request._id)}</td>
                    <td className="table-cell font-medium text-slate-800">{request.user?.name || 'Unknown'}</td>
                    <td className="table-cell text-slate-600">{request.service?.title || 'N/A'}</td>
                    <td className="table-cell text-slate-500">{request.expiryDate ? new Date(request.expiryDate).toLocaleDateString('en-IN') : 'Not set'}</td>
                    <td className="table-cell text-slate-700">{request.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 text-blue-700">
            <RefreshCcw size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Renewal workflow</p>
            <p className="text-sm text-slate-600">This page provides an admin view to monitor completed requests that may need renewal action. Use the completed requests page to review individual request details and initiate renewal from the standard admin workflow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
