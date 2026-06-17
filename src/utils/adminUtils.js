export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
export const uploadsBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const toAbsoluteFileUrl = (filePath) => {
  if (!filePath) {
    return '#';
  }

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  return `${uploadsBaseUrl}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
};

export const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/\s+/g, '');

export const normalizeWorkflowStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'submitted' || normalized === 'pending') return 'submitted';
  if (normalized === 'paid') return 'paid';
  if (normalized === 'inprogress') return 'inprogress';
  if (normalized === 'filed') return 'filed';
  if (normalized === 'inreview') return 'inreview';
  if (normalized === 'actionneeded' || normalized === 'needmoreinfo') return 'actionneeded';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'approved') return 'approved';
  if (normalized === 'completed') return 'completed';
  return normalized;
};

export const formatRequestCode = (requestId) => {
  const id = String(requestId || '');
  if (!id) {
    return 'REQ-NA';
  }

  return id.startsWith('REQ-') ? id : `REQ-${id.slice(-6).toUpperCase()}`;
};
