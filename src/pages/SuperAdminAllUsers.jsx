import { useEffect, useState } from 'react';
import { Loader2, Shield, Menu, Search, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function SuperAdminAllUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getAll();
        setUsers(response.data?.data?.items || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    users: users.filter((u) => u.role === 'user').length,
    admins: users.filter((u) => u.role === 'admin').length,
    superadmins: users.filter((u) => u.role === 'superadmin').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 overflow-y-auto border-r border-slate-100 bg-white">
        <SuperAdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 h-full shadow-2xl bg-white">
            <SuperAdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              type="button"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-display font-bold text-slate-900 text-lg">All Users</h1>
              <p className="text-sm text-slate-500">View and manage all platform users.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{userStats.total}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Regular Users</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{userStats.users}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Admins</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{userStats.admins}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Super Admins</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{userStats.superadmins}</p>
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="is-spinning" size={32} />
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Users List</h2>
                    <p className="text-sm text-slate-500">Complete overview of all platform users.</p>
                  </div>
                </div>

                <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50">
                  <div className="flex-1 max-w-sm">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-9 bg-white"
                      />
                    </div>
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                    <option value="superadmin">Super Admins</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.16em]">
                      <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3">City</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600">
                                  {(u.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800">{u.name || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{u.email || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">{u.phone || '-'}</td>
                            <td className="px-6 py-4 text-slate-600">{u.address?.city || '-'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                u.role === 'superadmin' 
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : u.role === 'admin' 
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
