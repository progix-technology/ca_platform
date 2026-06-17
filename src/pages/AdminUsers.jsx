import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import Button from '../components/Button';

export default function AdminUsers({ requests }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    if (!userId) return acc;
    acc[userId] = (acc[userId] || 0) + 1;
    return acc;
  }, {});

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-8">No users found.</td>
                </tr>
              ) : currentUsers.map((u) => {
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
        
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-sm text-slate-600">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length}
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
