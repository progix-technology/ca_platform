import { useState } from 'react';
import { Menu, Settings } from 'lucide-react';
import SuperAdminSidebar from '../layout/SuperAdminSidebar';

export default function SuperAdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <h1 className="font-display font-bold text-slate-900 text-lg">Settings</h1>
              <p className="text-sm text-slate-500">System settings and configuration.</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* System Settings Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Settings className="text-slate-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">System Configuration</h2>
                  <p className="text-sm text-slate-500 mt-1">Platform settings and information</p>
                </div>
              </div>

              <div className="space-y-6 border-t border-slate-200 pt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Platform Name</label>
                  <input
                    type="text"
                    defaultValue="CA Platform"
                    className="input-field bg-slate-50"
                    disabled
                  />
                  <p className="text-xs text-slate-500">Contact developer to change platform name</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">API Base URL</label>
                  <input
                    type="text"
                    defaultValue={import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}
                    className="input-field bg-slate-50"
                    disabled
                  />
                  <p className="text-xs text-slate-500">Current API configuration (read-only)</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Panel Version</label>
                  <input
                    type="text"
                    defaultValue="1.0.0"
                    className="input-field bg-slate-50"
                    disabled
                  />
                  <p className="text-xs text-slate-500">Current system version</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">System Status</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Database Status</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">Connected</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">API Status</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600">Active</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
                  <p className="text-sm text-slate-600">Last Backup</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Not Available</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5">
                  <p className="text-sm text-slate-600">System Uptime</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Running</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Most settings are read-only and managed at the system level. For configuration changes, please contact the system administrator.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
