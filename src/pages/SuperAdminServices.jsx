import { useEffect, useState } from 'react';
import { Loader2, Menu, Plus, Trash2, Pencil, X } from 'lucide-react';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';
import { serviceAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import FormBuilder from '../components/FormBuilder';
import { normalizeService } from '../services/serviceMapper';
import { SERVICE_CATEGORIES } from '../constants/serviceCategories';

export default function SuperAdminServices() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [savingService, setSavingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [formSchemaDraft, setFormSchemaDraft] = useState({});
  const [editingFormServiceId, setEditingFormServiceId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: SERVICE_CATEGORIES[0],
    documentsRequired: '',
    formSchema: {},
    planTier: 'basic',
  });

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);

      try {
        const response = await serviceAPI.getAll({ page: 1, limit: 200 });
        const items = response.data?.data?.items || [];
        setServices(items.map(normalizeService));
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to load services.';
        toast.error(message);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const openAdd = () => {
    setEditingServiceId(null);
    setForm({ title: '', description: '', price: '', category: SERVICE_CATEGORIES[0], documentsRequired: '', planTier: 'basic' });
    setShowModal(true);
  };

  const openEdit = (service) => {
    setEditingServiceId(service.id);
    setForm({
      title: service.title,
      description: service.description,
      price: String(service.price),
      category: service.category,
      documentsRequired: service.documents.join(', '),
      formSchema: service.formSchema || {},
      planTier: service.planTier || 'basic',
    });
    setShowModal(true);
  };

  const openFormBuilder = (service) => {
    setEditingFormServiceId(service.id);
    setFormSchemaDraft(service.formSchema || {});
    setShowFormBuilder(true);
  };

  const handleFormBuilderSave = async () => {
    try {
      await serviceAPI.update(editingFormServiceId, { formSchema: formSchemaDraft });
      setForm(f => ({ ...f, formSchema: formSchemaDraft }));
      const response = await serviceAPI.getAll({ page: 1, limit: 200 });
      const items = response.data?.data?.items || [];
      setServices(items.map(normalizeService));
      toast.success('Form schema updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update form schema.');
    } finally {
      setShowFormBuilder(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.price) {
      toast.error('Fill all required fields');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      documentsRequired: form.documentsRequired
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      formSchema: form.formSchema || {},
      planTier: form.planTier || 'basic',
    };

    setSavingService(true);

    try {
      if (editingServiceId) {
        const response = await serviceAPI.update(editingServiceId, payload);
        const updated = normalizeService(response.data?.data?.service);
        setServices((prev) => prev.map((service) => (service.id === editingServiceId ? updated : service)));
        toast.success('Service updated!');
      } else {
        const response = await serviceAPI.create(payload);
        const created = normalizeService(response.data?.data?.service);
        setServices((prev) => [created, ...prev]);
        toast.success('Service added!');
      }

      setShowModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save service.';
      toast.error(message);
    } finally {
      setSavingService(false);
    }
  };

  const handleDelete = async (serviceId) => {
    const shouldDelete = window.confirm('Delete this service? This action cannot be undone.');
    if (!shouldDelete) {
      return;
    }

    setDeletingServiceId(serviceId);

    try {
      await serviceAPI.remove(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      toast.success('Service deleted');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete service.';
      toast.error(message);
    } finally {
      setDeletingServiceId(null);
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
              <h1 className="font-display font-bold text-slate-900 text-lg">Services Management</h1>
              <p className="text-sm text-slate-500">Create, manage, and configure platform services.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-slate-900">Manage Services</h2>
              <Button variant="primary" size="sm" onClick={openAdd}><Plus size={16} /> Add Service</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loadingServices ? (
                <div className="col-span-full text-center py-16 text-slate-500">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-500">No services found. Add your first service.</div>
              ) : services.map((s) => (
                <div key={s.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800">{s.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase font-bold">{s.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            s.planTier === 'premium' ? 'bg-amber-100 text-amber-700' :
                            s.planTier === 'pro' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {s.planTier || 'Basic'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-3 line-clamp-2">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-primary-800">₹{s.price.toLocaleString('en-IN')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 text-slate-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => openFormBuilder(s)}
                        className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Form"
                      >
                        📝
                      </button>
                      <button disabled={deletingServiceId === s.id} onClick={() => handleDelete(s.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {deletingServiceId === s.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Builder Modal */}
            {showFormBuilder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-[6px]">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-display font-bold text-slate-900">Edit Form Schema</h3>
                    <button onClick={() => setShowFormBuilder(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                    <FormBuilder
                      value={formSchemaDraft}
                      onChange={setFormSchemaDraft}
                    />
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="primary"
                        className="flex-1 justify-center"
                        onClick={handleFormBuilderSave}
                      >
                        Save Form
                      </Button>
                      <Button variant="outline" onClick={() => setShowFormBuilder(false)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="font-display font-bold text-slate-900">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="label">Service Title *</label>
                        <input className="input-field" placeholder="e.g. ITR Filing" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Category</label>
                        <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Price (₹) *</label>
                        <input type="number" className="input-field" placeholder="999" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Description *</label>
                        <textarea className="input-field resize-none" rows={3} placeholder="Short service description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="label">Documents Required (comma separated)</label>
                        <input className="input-field" placeholder="PAN Card, Aadhaar Card, Bank Statement" value={form.documentsRequired} onChange={(e) => setForm({ ...form, documentsRequired: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button variant="primary" className="flex-1 justify-center" onClick={handleSave} loading={savingService}>{editingServiceId ? 'Save Changes' : 'Add Service'}</Button>
                      <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
