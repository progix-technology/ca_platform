import React from 'react';
import { X, Star, User, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

export default function AdminProfileModal({ open, onClose, admin }) {
  if (!open || !admin) return null;

  // Helper to get absolute file URL (copied from AdminDashboard)
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  const toAbsoluteFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (/^https?:\/\//i.test(filePath)) return filePath;
    return `${uploadsBaseUrl}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
  };

  const getInitials = (name) => {
    if (!name) return 'CA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden mb-10 animate-in slide-in-from-top-10 duration-300">
        {/* Header with Cover */}
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 mb-6">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {admin.profileImage ? (
                <img src={toAbsoluteFileUrl(admin.profileImage)} alt={admin.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-blue-600">{getInitials(admin.name)}</span>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-slate-900">{admin.name}</h2>
              <p className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-1">
                <Briefcase size={14} />
                Certified CA Professional
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Email Address</p>
                <p className="text-sm text-slate-800 font-semibold">{admin.email || 'N/A'}</p>
              </div>
            </div>
            {admin.phone && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Contact Number</p>
                  <p className="text-sm text-slate-800 font-semibold">{admin.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Feedback Section */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Star className="text-yellow-500" size={20} />
              Client Feedbacks ({admin.feedbacks?.length || 0})
            </h3>

            {admin.feedbacks && admin.feedbacks.length > 0 ? (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {[...admin.feedbacks].reverse().map((feedback, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{feedback.serviceName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <User size={12} /> {feedback.userName} 
                          <span className="mx-1">•</span>
                          <Calendar size={12} /> {new Date(feedback.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex text-yellow-400 text-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={feedback.rating >= star ? 'text-yellow-400' : 'text-slate-200'}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 italic mt-2">"{feedback.comment}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <Star className="text-slate-300 mx-auto mb-2" size={28} />
                <p className="text-slate-500 font-medium">No feedback yet</p>
                <p className="text-xs text-slate-400 mt-1">This CA admin hasn't received any client feedback yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
