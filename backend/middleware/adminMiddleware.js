import { ApiError } from '../utils/apiError.js';

export const adminOnly = (req, _res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    throw new ApiError(403, 'Access denied, admin only');
  }

  next();
};

export const superAdminOnly = (req, _res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Access denied, superadmin only');
  }

  next();
};


