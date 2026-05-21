import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, RefreshCcw, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionAPI } from '../services/api';

const AVAILABLE_TIERS = ['basic', 'pro', 'premium'];

const initialForm = {
  name: 'basic',
  price: '',
  durationMonths: '',
  docLimit: '',
  requestLimitPerMonth: -1,
  allowedTiers: ['basic'],
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionAPI.getAllPlans();
      setPlans(response.data?.data?.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setEditingId('');
    setForm(initialForm);
  };

  const handleSelectTier = (tier) => {
    setForm((prev) => {
      const next = new Set(prev.allowedTiers || []);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return {
        ...prev,
        allowedTiers: [...next].sort((a, b) => AVAILABLE_TIERS.indexOf(a) - AVAILABLE_TIERS.indexOf(b)),
      };
    });
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setForm({
      name: plan.name,
      price: plan.price,
      durationMonths: plan.durationMonths,
      docLimit: plan.docLimit,
      requestLimitPerMonth: plan.requestLimitPerMonth,
      allowedTiers: plan.allowedTiers || ['basic'],
    });
  };

  const handleSubmit = async () => {
    if (!form.name || form.price === '' || form.durationMonths === '' || form.docLimit === '' || !form.allowedTiers.length) {
      toast.error('Please fill all required fields and choose allowed tiers');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        durationMonths: Number(form.durationMonths),
        docLimit: Number(form.docLimit),
        requestLimitPerMonth: Number(form.requestLimitPerMonth),
        allowedTiers: form.allowedTiers,
      };

      if (editingId) {
        await subscriptionAPI.updatePlan(editingId, payload);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionAPI.createPlan(payload);
        toast.success('Plan created successfully');
      }

      resetForm();
      loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Delete this plan? Existing users on this plan must be migrated first.')) {
      return;
    }

    try {
      await subscriptionAPI.deletePlan(planId);
      toast.success('Plan deleted successfully');
      if (editingId === planId) resetForm();
      loadPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Plan Management</h1>
          <p className="text-slate-500">Create, edit, and remove subscription plans that users can purchase.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCcw size={16} /> Reset form
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">{editingId ? 'Edit Plan' : 'New Plan'}</h2>
              <p className="text-sm text-slate-500">Update plan details and availability for users.</p>
            </div>
            <span className="badge bg-slate-100 text-slate-700">{editingId ? 'Edit mode' : 'Create mode'}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Plan name</label>
              <select
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              >
                {AVAILABLE_TIERS.map((tier) => (
                  <option key={tier} value={tier}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Price</label>
              <input
                type="number"
                className="input-field"
                min="0"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="label">Duration (months)</label>
              <input
                type="number"
                className="input-field"
                min="1"
                value={form.durationMonths}
                onChange={(e) => setForm((prev) => ({ ...prev, durationMonths: e.target.value }))}
                placeholder="e.g. 1"
              />
            </div>
            <div>
              <label className="label">Document limit</label>
              <input
                type="number"
                className="input-field"
                min="0"
                value={form.docLimit}
                onChange={(e) => setForm((prev) => ({ ...prev, docLimit: e.target.value }))}
                placeholder="Number of docs"
              />
            </div>
            <div>
              <label className="label">Request limit per month</label>
              <input
                type="number"
                className="input-field"
                value={form.requestLimitPerMonth}
                onChange={(e) => setForm((prev) => ({ ...prev, requestLimitPerMonth: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Use -1 for unlimited requests.</p>
            </div>
            <div className="space-y-2">
              <label className="label">Allowed service tiers</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {AVAILABLE_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handleSelectTier(tier)}
                    className={
                      `rounded-2xl border px-3 py-2 text-sm transition ${form.allowedTiers.includes(tier) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700'}`
                    }
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <X size={16} /> Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? 'Saving...' : editingId ? 'Update plan' : 'Create plan'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-semibold text-slate-900">Available Plans</h2>
              <p className="text-sm text-slate-500">Existing plans that users can purchase from the subscription page.</p>
            </div>
            <button
              type="button"
              onClick={loadPlans}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">No plans found yet.</div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan._id} className="rounded-3xl border border-slate-200 p-5 hover:border-slate-300 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-semibold uppercase text-slate-900">{plan.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">₹{plan.price}</span>
                      </div>
                      <p className="text-sm text-slate-500">{plan.durationMonths} month(s), {plan.docLimit} doc uploads, {plan.requestLimitPerMonth === -1 ? 'unlimited' : `${plan.requestLimitPerMonth} requests`}.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(plan)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {plan.allowedTiers?.map((tier) => (
                      <span key={tier} className="badge bg-blue-50 text-blue-700">{tier}</span>
                    ))}
                    {plan.requestLimitPerMonth === -1 ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Unlimited requests</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-700">{plan.requestLimitPerMonth} requests / mo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
