import { useState, useEffect } from 'react';
import Button from '../components/Button';
import { formatRequestCode, normalizeWorkflowStatus } from '../utils/adminUtils';

export default function SettingsCompletedList({ archivedRequests, loading, onRefresh }) {
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-');

  const [searchUser, setSearchUser] = useState("");
  const [searchService, setSearchService] = useState("");
  const [filteredRequests, setFilteredRequests] = useState(archivedRequests);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setFilteredRequests(
      archivedRequests.filter((req) => {
        const userMatch = searchUser.trim() === "" || (req.user?.name || "").toLowerCase().includes(searchUser.trim().toLowerCase());
        const serviceMatch = searchService.trim() === "" || (req.service?.title || "").toLowerCase().includes(searchService.trim().toLowerCase());
        return userMatch && serviceMatch;
      })
    );
    setCurrentPage(1);
  }, [searchUser, searchService, archivedRequests]);

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
        <form className="dashboard-page__completed-search-form flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100 items-start sm:items-center bg-white" onSubmit={handleSearch}>
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
              ) : currentRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center text-slate-500 py-8">No completed requests found.</td>
                </tr>
              ) : (
                currentRequests.map((request) => {
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
