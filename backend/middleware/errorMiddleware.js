import { sendResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  return sendResponse(res, statusCode, false, error.message || 'Internal server error', {
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
};
