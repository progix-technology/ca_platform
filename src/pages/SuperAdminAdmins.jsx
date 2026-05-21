import { useEffect, useState } from 'react';
import { Loader2, Menu, Plus, Trash2, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';
import { userAPI, subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';

export default function SuperAdminAdmins() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    pan: '',
    street: '',
    city: '',
    country: '',
    zipCode: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, plansRes] = await Promise.all([
        userAPI.getAll(),
        subscriptionAPI.getAllPlans(),
      ]);
      setUsers(usersRes.data?.data?.items || []);
      setPlans(plansRes.data?.data?.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdminInput = (field, value) => {
    setNewAdminData((prev) => ({ ...prev, [field]: value }));
  };

  const resetAddAdminForm = () => {
    setNewAdminData({
      name: '',
      email: '',
      password: '',
      phone: '',
      pan: '',
      street: '',
      city: '',
      country: '',
      zipCode: '',
    });
    setAdminError('');
  };

  const handleCreateAdmin = async () => {
    setAdminError('');
    setCreatingAdmin(true);

    try {
      const response = await userAPI.createAdmin({
        name: newAdminData.name,
        email: newAdminData.email,
        password: newAdminData.password,
        phone: newAdminData.phone,
        pan: newAdminData.pan,
        street: newAdminData.street,
        city: newAdminData.city,
        country: newAdminData.country,
        zipCode: newAdminData.zipCode,
      });

      setUsers((prev) => [response.data.data.user, ...prev]);
      toast.success('New admin created successfully.');
      setShowAddAdmin(false);
      resetAddAdminForm();
    } catch (error) {
      setAdminError(error.response?.data?.message || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };



  const handleDeleteAdmin = async (targetId) => {
    if (targetId === user.id) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (!window.confirm('Delete this admin forever? This action cannot be undone.')) {
      return;
    }

    setSavingId(targetId);
    try {
      await userAPI.deleteUser(targetId);
      setUsers((prev) => prev.filter((item) => item.id !== targetId));
      toast.success('Admin deleted successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin.');
    } finally {
      setSavingId(null);
    }
  };



  const handleRevokePlan = async (adminId) => {
    if (!window.confirm('Revoke this admin\'s subscription plan?')) {
      return;
    }

    setSavingId(adminId);
    try {
      const response = await subscriptionAPI.revokePlanFromAdmin(adminId);
      setUsers((prev) =>
        prev.map((item) => (item._id === adminId ? response.data.data.admin : item))
      );
      toast.success('Subscription plan revoked successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke plan.');
    } finally {
      setSavingId(null);
    }
  };

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
              <h1 className="font-display font-bold text-slate-900 text-lg">Admin Management</h1>
              <p className="text-sm text-slate-500">Create, manage, and control admin accounts.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Admin Accounts</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{adminUsers.length}</p>
              </div>

            </div>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="is-spinning" size={32} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admins Table */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Admin Accounts</h2>
                      <p className="text-sm text-slate-500">All admin users and their access levels.</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2"
                      onClick={() => setShowAddAdmin(true)}
                    >
                      <Plus size={16} /> Add Admin
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.16em]">
                        <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Subscription</th>
                          <th className="px-6 py-3">Requests</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                              No admin accounts found.
                            </td>
                          </tr>
                        ) : (
                          adminUsers.map((item) => (
                            <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-600">
                                    {(item.name || 'A').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-800">{item.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{item.email}</td>
                              <td className="px-6 py-4">
                                {item.subscription?.status === 'active' ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                      {item.subscription.planName}
                                    </span>
                                    <p className="text-xs text-slate-600">
                                      Until {new Date(item.subscription.endDate).toLocaleDateString('en-IN')}
                                    </p>
                                  </div>
                                ) : item.subscription?.status === 'expired' ? (
                                  <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    No Plan
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-800">{item.requestCount || 0}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap items-center gap-2">

                                  {item.subscription?.status === 'active' && (
                                    <button
                                      className="btn btn-warning p-2"
                                      type="button"
                                      disabled={savingId === item._id}
                                      onClick={() => handleRevokePlan(item._id)}
                                      title="Revoke plan"
                                    >
                                      {savingId === item._id ? '...' : 'Revoke'}
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-danger p-2"
                                    type="button"
                                    disabled={savingId === item._id}
                                    onClick={() => handleDeleteAdmin(item._id)}
                                    title="Delete admin"
                                  >
                                    {savingId === item._id ? 'Deleting...' : <Trash2 size={16} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Create Admin Modal */}
                {showAddAdmin && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">Create New Admin</h2>
                          <p className="text-sm text-slate-500">Add a new admin account to the platform.</p>
                        </div>
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-900 text-2xl"
                          onClick={() => {
                            setShowAddAdmin(false);
                            resetAddAdminForm();
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-4 p-6">
                        {adminError && (
                          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                            {adminError}
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Name *</span>
                            <input
                              value={newAdminData.name}
                              onChange={(e) => handleAddAdminInput('name', e.target.value)}
                              className="input-field"
                              placeholder="Full name"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Email *</span>
                            <input
                              value={newAdminData.email}
                              onChange={(e) => handleAddAdminInput('email', e.target.value)}
                              className="input-field"
                              placeholder="admin@example.com"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Password *</span>
                            <input
                              type="password"
                              value={newAdminData.password}
                              onChange={(e) => handleAddAdminInput('password', e.target.value)}
                              className="input-field"
                              placeholder="Strong password"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Phone</span>
                            <input
                              value={newAdminData.phone}
                              onChange={(e) => handleAddAdminInput('phone', e.target.value)}
                              className="input-field"
                              placeholder="Mobile number"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">PAN</span>
                            <input
                              value={newAdminData.pan}
                              onChange={(e) => handleAddAdminInput('pan', e.target.value)}
                              className="input-field"
                              placeholder="PAN number"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">City</span>
                            <input
                              value={newAdminData.city}
                              onChange={(e) => handleAddAdminInput('city', e.target.value)}
                              className="input-field"
                              placeholder="City"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Street</span>
                            <input
                              value={newAdminData.street}
                              onChange={(e) => handleAddAdminInput('street', e.target.value)}
                              className="input-field"
                              placeholder="Street address"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Country</span>
                            <input
                              value={newAdminData.country}
                              onChange={(e) => handleAddAdminInput('country', e.target.value)}
                              className="input-field"
                              placeholder="Country"
                            />
                          </label>
                          <label className="sm:col-span-2 space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Zip Code</span>
                            <input
                              value={newAdminData.zipCode}
                              onChange={(e) => handleAddAdminInput('zipCode', e.target.value)}
                              className="input-field"
                              placeholder="Zip code"
                            />
                          </label>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            className="btn btn-outline px-4 py-2"
                            onClick={() => {
                              setShowAddAdmin(false);
                              resetAddAdminForm();
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2"
                            onClick={handleCreateAdmin}
                            disabled={creatingAdmin}
                          >
                            {creatingAdmin ? 'Creating...' : 'Create Admin'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
