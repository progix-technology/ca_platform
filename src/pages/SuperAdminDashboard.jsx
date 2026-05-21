import { useEffect, useState } from 'react';
import { Loader2, Menu, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const adminUsers = users.filter((u) => u.role === 'admin');

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
              <h1 className="font-display font-bold text-slate-900 text-lg">Super Admin Overview</h1>
              <p className="text-sm text-slate-500">Platform overview and key metrics.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
            <Shield size={16} /> Super Admin Access
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Key Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Admin Accounts</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{adminUsers.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Regular Users</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{users.filter((u) => u.role === 'user').length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{users.length}</p>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="is-spinning" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Management Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Admin Management</h3>
                      <p className="text-sm text-slate-500 mt-1">Create and manage admin accounts</p>
                    </div>
                    <div className="text-3xl font-semibold text-amber-600">{adminUsers.length}</div>
                  </div>
                  <a href="/#/superadmin/admins" className="inline-flex btn btn-primary mt-4">
                    Manage Admins →
                  </a>
                </div>

                {/* All Users Card */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">All Users</h3>
                      <p className="text-sm text-slate-500 mt-1">View all platform users</p>
                    </div>
                    <div className="text-3xl font-semibold text-blue-600">{users.length}</div>
                  </div>
                  <a href="/#/superadmin/all-users" className="inline-flex btn btn-primary mt-4">
                    View All Users →
                  </a>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
