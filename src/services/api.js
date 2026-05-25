// Removed stray line causing syntax error
import axios from 'axios';



const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  verifyRegistrationOTP: (payload) => api.post('/auth/register/verify', payload),
  login: (payload) => api.post('/auth/login', payload),
};


// src/services/api.js
export const downloadInvoice = (requestId) => api.get('/invoice/download', {
  params: { requestId },
  responseType: 'blob',
});

  
export const requestAPI = {
  create: (payload) => api.post(
    '/requests',
    payload,
    payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined,
  ),
  getMy: () => api.get('/requests/my'),
  getById: (requestId) => api.get(`/requests/${requestId}`),
  getAll: () => api.get('/requests'),
  getArchivedCompleted: () => api.get('/requests/archived/completed'),
  updateStatus: (requestId, payload) => {
    if (payload instanceof FormData) {
      return api.put(`/requests/${requestId}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/requests/${requestId}`, payload);
  },
  delete: (requestId) => api.delete(`/requests/${requestId}`),
  addComment: (requestId, payload) => api.post(`/requests/${requestId}/comments`, payload),
  updateComment: (requestId, commentId, payload) => api.patch(`/requests/${requestId}/comments/${commentId}`, payload),
  deleteComment: (requestId, commentId) => api.delete(`/requests/${requestId}/comments/${commentId}`),
  archiveCompleted: (requestId) => api.patch(`/requests/${requestId}/archive-completed`),
  renew: (requestId) => api.patch(`/requests/${requestId}/renew`),
  completePayment: (requestId, payload = {}) => api.patch(`/requests/${requestId}/pay`, payload),
};

export const serviceAPI = {
  getAll: (params = {}) => api.get('/services', { params }),
  getById: (serviceId) => api.get(`/services/${serviceId}`),
  create: (payload) => api.post('/services', payload),
  update: (serviceId, payload) => api.put(`/services/${serviceId}`, payload),
  remove: (serviceId) => api.delete(`/services/${serviceId}`),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (payload) => api.put('/users/me', payload),
  getAll: () => api.get('/users'),
  createAdmin: (payload) => api.post('/users/create-admin', payload),
  updateRole: (userId, payload) => api.put(`/users/${userId}/role`, payload),
  assignWork: (userId) => api.put(`/users/${userId}/assign-work`),
  revokeWork: (userId) => api.put(`/users/${userId}/revoke-work`),
  revokeWork: (userId) => api.put(`/users/${userId}/revoke-work`),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  getMyDocuments: () => api.get('/users/me/documents'),
  uploadMyDocuments: (items) => {
    const formData = new FormData();
    items.forEach((item) => {
      const file = item.file || item;
      const name = item.name || file.name;
      formData.append('documents', file);
      formData.append('documentNames', name);
    });
    return api.post('/users/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteMyDocument: (documentId) => api.delete('/users/me/documents/' + documentId),
  forgotPassword: (payload) => api.post('/users/forgot-password', payload),
  verifyOTP: (payload) => api.post('/users/verify-otp', payload),
  resetPassword: (payload) => api.post('/users/reset-password', payload),
  updateAdminSettings: (payload) => api.put('/users/me/settings', payload),
  changeAdminPassword: (payload) => api.put('/users/me/change-password', payload),
};

export const notificationAPI = {
  getMy: (params = {}) => api.get('/notifications/my', { params }),
  markRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  remove: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

export const subscriptionAPI = {
  getAllPlans: () => api.get('/subscriptions/plans'),
  createPlan: (payload) => api.post('/subscriptions/plans', payload),
  updatePlan: (planId, payload) => api.put(`/subscriptions/plans/${planId}`, payload),
  deletePlan: (planId) => api.delete(`/subscriptions/plans/${planId}`),
  purchasePlan: (planId) => api.post('/subscriptions/purchase', { planId }),
  getStatus: () => api.get('/subscriptions/status'),
  getAdminSubscription: () => api.get('/subscriptions/admin/subscription'),
  assignPlanToAdmin: (adminId, planId) => api.post(`/subscriptions/admin/${adminId}/assign-plan`, { planId }),
  revokePlanFromAdmin: (adminId) => api.post(`/subscriptions/admin/${adminId}/revoke-plan`),
};
