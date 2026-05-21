import { useEffect, useState } from 'react';
import { Loader2, Menu, Plus, Edit2, Trash2 } from 'lucide-react';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';
import { subscriptionAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [planError, setPlanError] = useState('');
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    durationUnit: 'months',
    features: '',
    maxRequests: '',
    docLimit: '',
    allowedTiers: [],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionAPI.getAllPlans();
      setPlans(response.data?.data?.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlanInput = (field, value) => {
    setNewPlanData((prev) => ({ ...prev, [field]: value }));
  };

  const resetAddPlanForm = () => {
    setNewPlanData({
      name: '',
      description: '',
      price: '',
      duration: '',
      durationUnit: 'months',
      features: '',
      maxRequests: '',
      docLimit: '',
      allowedTiers: [],
    });
    setPlanError('');
    setEditingPlan(null);
  };

  const handleCreatePlan = async () => {
    setPlanError('');

    if (!newPlanData.name || !newPlanData.price || !newPlanData.duration) {
      setPlanError('Name, price, and duration are required');
      return;
    }

    setSavingId('creating');
    try {
      const payload = {
        name: newPlanData.name,
        description: newPlanData.description,
        price: parseFloat(newPlanData.price),
        duration: parseInt(newPlanData.duration),
        durationUnit: newPlanData.durationUnit,
        features: newPlanData.features ? newPlanData.features.split(',').map((f) => f.trim()) : [],
        maxRequests: newPlanData.maxRequests ? parseInt(newPlanData.maxRequests) : -1,
        docLimit: newPlanData.docLimit ? parseInt(newPlanData.docLimit) : 0,
        allowedTiers: newPlanData.allowedTiers,
      };

      if (editingPlan) {
        const response = await subscriptionAPI.updatePlan(editingPlan._id, payload);
        setPlans((prev) => prev.map((p) => (p._id === editingPlan._id ? response.data.data.item : p)));
        toast.success('Plan updated successfully.');
      } else {
        const response = await subscriptionAPI.createPlan(payload);
        setPlans((prev) => [response.data.data.item, ...prev]);
        toast.success('Plan created successfully.');
      }

      setShowAddPlan(false);
      resetAddPlanForm();
    } catch (error) {
      setPlanError(error.response?.data?.message || 'Failed to save plan.');
    } finally {
      setSavingId(null);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlanData({
      name: plan.name || '',
      description: plan.description || '',
      price: (plan.price || 0).toString(),
      duration: (plan.duration || plan.durationMonths || 1).toString(),
      durationUnit: plan.durationUnit || 'months',
      features: plan.features?.join(', ') || '',
      maxRequests: (plan.maxRequests !== undefined ? plan.maxRequests : -1).toString(),
      docLimit: (plan.docLimit || 0).toString(),
      allowedTiers: plan.allowedTiers || [],
    });
    setShowAddPlan(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan? This action cannot be undone.')) {
      return;
    }

    setSavingId(planId);
    try {
      await subscriptionAPI.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p._id !== planId));
      toast.success('Plan deleted successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan.');
    } finally {
      setSavingId(null);
    }
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
              <h1 className="font-display font-bold text-slate-900 text-lg">Subscription Plans</h1>
              <p className="text-sm text-slate-500">Create and manage subscription plans for admins.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Plans</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{plans.length}</p>
            </div>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <Loader2 className="is-spinning" size={32} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Plans Table */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">Plans</h2>
                      <p className="text-sm text-slate-500">All subscription plans available for admins.</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2"
                      onClick={() => {
                        resetAddPlanForm();
                        setShowAddPlan(true);
                      }}
                    >
                      <Plus size={16} /> Add Plan
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-[0.16em]">
                        <tr>
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Price</th>
                          <th className="px-6 py-3">Duration</th>
                          <th className="px-6 py-3">Requests</th>
                          <th className="px-6 py-3">Allowed Tiers</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {plans.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                              No plans found. Create one to get started.
                            </td>
                          </tr>
                        ) : (
                          plans.map((plan) => (
                            <tr key={plan._id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">{plan.name}</td>
                              <td className="px-6 py-4">₹{plan.price}</td>
                              <td className="px-6 py-4">
                                {plan.duration || plan.durationMonths || 0} {plan.durationUnit || 'months'}
                              </td>
                              <td className="px-6 py-4">{plan.maxRequests === -1 || !plan.maxRequests ? 'Unlimited' : plan.maxRequests}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {(plan.allowedTiers || []).map(tier => (
                                    <span key={tier} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                                      {tier}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="btn btn-secondary p-2"
                                    type="button"
                                    disabled={savingId === plan._id}
                                    onClick={() => handleEditPlan(plan)}
                                    title="Edit plan"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    className="btn btn-danger p-2"
                                    type="button"
                                    disabled={savingId === plan._id}
                                    onClick={() => handleDeletePlan(plan._id)}
                                    title="Delete plan"
                                  >
                                    {savingId === plan._id ? 'Deleting...' : <Trash2 size={16} />}
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

                {/* Add/Edit Plan Modal */}
                {showAddPlan && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">
                            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                          </h2>
                          <p className="text-sm text-slate-500">
                            {editingPlan ? 'Update plan details' : 'Add a new subscription plan'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-900 text-2xl"
                          onClick={() => {
                            setShowAddPlan(false);
                            resetAddPlanForm();
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-4 p-6 overflow-y-auto flex-1 custom-scrollbar">
                        {planError && (
                          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                            {planError}
                          </div>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Plan Name *</span>
                            <input
                              value={newPlanData.name}
                              onChange={(e) => handleAddPlanInput('name', e.target.value)}
                              className="input-field"
                              placeholder="e.g., Basic Plan"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Price (₹) *</span>
                            <input
                              type="number"
                              value={newPlanData.price}
                              onChange={(e) => handleAddPlanInput('price', e.target.value)}
                              className="input-field"
                              placeholder="1000"
                              min="0"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Duration *</span>
                            <input
                              type="number"
                              value={newPlanData.duration}
                              onChange={(e) => handleAddPlanInput('duration', e.target.value)}
                              className="input-field"
                              placeholder="1"
                              min="1"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Duration Unit</span>
                            <select
                              value={newPlanData.durationUnit}
                              onChange={(e) => handleAddPlanInput('durationUnit', e.target.value)}
                              className="input-field"
                            >
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </select>
                          </label>
                          <label className="sm:col-span-2 space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Description</span>
                            <textarea
                              value={newPlanData.description}
                              onChange={(e) => handleAddPlanInput('description', e.target.value)}
                              className="input-field"
                              placeholder="Plan description"
                              rows="3"
                            />
                          </label>
                          <label className="sm:col-span-2 space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Features (comma-separated)</span>
                            <textarea
                              value={newPlanData.features}
                              onChange={(e) => handleAddPlanInput('features', e.target.value)}
                              className="input-field"
                              placeholder="Feature 1, Feature 2, Feature 3"
                              rows="2"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Max Requests (-1 for unlimited)</span>
                            <input
                              type="number"
                              value={newPlanData.maxRequests}
                              onChange={(e) => handleAddPlanInput('maxRequests', e.target.value)}
                              className="input-field"
                              placeholder="-1"
                            />
                          </label>
                          <label className="space-y-2 text-sm">
                            <span className="font-medium text-slate-700">Document Limit</span>
                            <input
                              type="number"
                              value={newPlanData.docLimit}
                              onChange={(e) => handleAddPlanInput('docLimit', e.target.value)}
                              className="input-field"
                              placeholder="0"
                              min="0"
                            />
                          </label>
                          <div className="sm:col-span-2 space-y-2">
                            <span className="text-sm font-medium text-slate-700">Allowed Tiers</span>
                            <div className="flex flex-wrap gap-4 pt-1">
                              {['basic', 'pro', 'premium', 'trial'].map((tier) => (
                                <label key={tier} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newPlanData.allowedTiers.includes(tier)}
                                    onChange={(e) => {
                                      const tiers = e.target.checked
                                        ? [...newPlanData.allowedTiers, tier]
                                        : newPlanData.allowedTiers.filter((t) => t !== tier);
                                      handleAddPlanInput('allowedTiers', tiers);
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-slate-600 capitalize">{tier}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-200">
                          <button
                            type="button"
                            className="btn btn-outline px-4 py-2"
                            onClick={() => {
                              setShowAddPlan(false);
                              resetAddPlanForm();
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary px-4 py-2"
                            onClick={handleCreatePlan}
                            disabled={savingId === 'creating'}
                          >
                            {savingId === 'creating'
                              ? editingPlan
                                ? 'Updating...'
                                : 'Creating...'
                              : editingPlan
                              ? 'Update Plan'
                              : 'Create Plan'}
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
