import { ApiError } from '../utils/apiError.js';

export const validateRequiredFields = (fields) => (req, _res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length) {
    throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }

  next();
};
