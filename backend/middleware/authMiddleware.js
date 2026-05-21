import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized, token missing');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check in User collection first
    let user = await User.findById(decoded.id).select('-password');
    
    // If not found, check SuperAdmin collection
    if (!user) {
      user = await SuperAdmin.findById(decoded.id).select('-password');
    }
    
    // If not found, check AdminUser collection
    if (!user) {
      user = await AdminUser.findById(decoded.id).select('-password');
    }

    if (!user) {
      throw new ApiError(401, 'Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (_error) {
    throw new ApiError(401, 'Not authorized, token invalid');
  }
});
