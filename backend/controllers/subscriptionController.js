import Plan from '../models/Plan.js';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({}).sort({ price: 1 });
  const formattedPlans = plans.map(plan => {
    const planObj = plan.toObject();
    if (planObj.durationMonths && !planObj.duration) {
      planObj.duration = planObj.durationMonths;
    }
    return planObj;
  });
  return sendResponse(res, 200, true, 'Plans fetched successfully', { items: formattedPlans });
});

export const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    duration,
    durationUnit,
    docLimit,
    allowedTiers,
    requestLimitPerMonth,
    features,
    leadPriorityLevel,
    hasAdvancedAnalytics,
  } = req.body;

  if (!name || price === undefined || duration === undefined) {
    throw new ApiError(400, 'Please provide all required plan fields');
  }

  const existingPlan = await Plan.findOne({ name });
  if (existingPlan) {
    throw new ApiError(400, 'A plan with this name already exists');
  }

  const plan = await Plan.create({
    name,
    description,
    price,
    duration,
    durationUnit: durationUnit || 'months',
    docLimit: docLimit || 0,
    allowedTiers: Array.isArray(allowedTiers) ? allowedTiers : String(allowedTiers || '').split(',').map((item) => item.trim()).filter(Boolean),
    requestLimitPerMonth: requestLimitPerMonth === undefined ? -1 : requestLimitPerMonth,
    features: Array.isArray(features) ? features : String(features || '').split(',').map((item) => item.trim()).filter(Boolean),
    leadPriorityLevel: leadPriorityLevel || 0,
    hasAdvancedAnalytics: Boolean(hasAdvancedAnalytics),
  });

  return sendResponse(res, 201, true, 'Plan created successfully', { item: plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.allowedTiers && !Array.isArray(updateData.allowedTiers)) {
    updateData.allowedTiers = String(updateData.allowedTiers).split(',').map((item) => item.trim()).filter(Boolean);
  }
  
  if (updateData.features && !Array.isArray(updateData.features)) {
    updateData.features = String(updateData.features).split(',').map((item) => item.trim()).filter(Boolean);
  }

  const plan = await Plan.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }

  return sendResponse(res, 200, true, 'Plan updated successfully', { item: plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check both User and AdminUser collections
  const userUsingPlan = await User.exists({ 'subscription.planId': id });
  const adminUsingPlan = await AdminUser.exists({ 'subscription.planId': id });

  if (userUsingPlan || adminUsingPlan) {
    throw new ApiError(400, 'Cannot delete a plan while some users are subscribed to it');
  }

  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }

  return sendResponse(res, 200, true, 'Plan deleted successfully', { item: plan });
});

export const purchasePlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  
  // Determine model based on role
  let UserModel = User;
  if (req.user.role === 'admin') {
    UserModel = AdminUser;
  } else if (req.user.role === 'superadmin') {
    UserModel = SuperAdmin;
  }

  const user = await UserModel.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }

  const startDate = new Date();
  const endDate = new Date();
  if (plan.durationUnit === 'years') {
    endDate.setFullYear(endDate.getFullYear() + plan.duration);
  } else if (plan.durationUnit === 'days') {
    endDate.setDate(endDate.getDate() + plan.duration);
  } else {
    // Default to months
    endDate.setMonth(endDate.getMonth() + plan.duration);
  }

  user.subscription = {
    planId: plan._id,
    planName: plan.name,
    startDate,
    endDate,
    status: plan.name === 'trial' ? 'trial' : 'active',
    usage: req.user.role === 'user' ? {
      docsUploaded: user.savedDocuments?.length || 0,
      requestsThisMonth: 0,
      lastRequestDate: null,
    } : 0, // Admin model uses a number for usage
  };

  await user.save();

  return sendResponse(res, 200, true, 'Plan activated successfully', {
    subscription: user.subscription,
  });
});

export const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  // Determine which model to use based on user role
  let UserModel = User;
  if (req.user.role === 'admin') {
    UserModel = AdminUser;
  } else if (req.user.role === 'superadmin') {
    UserModel = SuperAdmin;
  }
  
  const user = await UserModel.findById(req.user._id).populate('subscription.planId');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check for expiry
  const now = new Date();
  if ((user.subscription.status === 'active' || user.subscription.status === 'trial') && user.subscription.endDate < now) {
    user.subscription.status = 'expired';
    await user.save();
  }

  // Calculate if active/eligible for ServiceDetail
  const isTrial = user.subscription.status === 'trial';
  const isActive = user.subscription.status === 'active';
  const notExpired = user.subscription.endDate > now;

  let canRequest = false;
  if (isActive && notExpired) {
    canRequest = true;
  } else if (isTrial && notExpired) {
    // Check trial request count
    const Request = mongoose.model('Request');
    const requestCount = await Request.countDocuments({
      user: user._id,
      // Trial is usually for all time, but we can check if they've ever made more than 2
    });
    if (requestCount < 2) {
      canRequest = true;
    }
  }

  return sendResponse(res, 200, true, 'Subscription status fetched', {
    subscription: user.subscription,
    active: canRequest, // ServiceDetail uses this
    canRequest,
    allowedTiers: user.subscription?.planId?.allowedTiers || [],
  });
});

// Assign plan to admin (superadmin only)
export const assignPlanToAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { planId } = req.body;

  if (!planId) {
    throw new ApiError(400, 'Plan ID is required');
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new ApiError(404, 'Plan not found');
  }

  const admin = await AdminUser.findById(adminId);
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    throw new ApiError(404, 'Admin not found');
  }

  const startDate = new Date();
  const endDate = new Date();
  if (plan.durationUnit === 'years') {
    endDate.setFullYear(endDate.getFullYear() + plan.duration);
  } else if (plan.durationUnit === 'days') {
    endDate.setDate(endDate.getDate() + plan.duration);
  } else {
    endDate.setMonth(endDate.getMonth() + plan.duration);
  }

  admin.subscription = {
    planId: plan._id,
    planName: plan.name,
    startDate,
    endDate,
    status: 'active',
    usage: 0,
  };

  await admin.save();

  return sendResponse(res, 200, true, 'Plan assigned to admin successfully', { admin });
});

// Revoke plan from admin (superadmin only)
export const revokePlanFromAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await AdminUser.findById(adminId);
  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    throw new ApiError(404, 'Admin not found');
  }

  admin.subscription = {
    planId: null,
    planName: '',
    startDate: null,
    endDate: null,
    status: 'inactive',
    usage: 0,
  };

  await admin.save();

  return sendResponse(res, 200, true, 'Plan revoked from admin successfully', { admin });
});

// Get admin subscription (for admin dashboard)
export const getAdminSubscription = asyncHandler(async (req, res) => {
  // Determine which model to use based on user role
  let AdminModel = AdminUser;
  if (req.user.role === 'superadmin') {
    AdminModel = SuperAdmin;
  }
  
  const admin = await AdminModel.findById(req.user._id).populate('subscription.planId');

  if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
    throw new ApiError(404, 'Admin not found');
  }

  // Check if subscription is expired
  if (admin.subscription && admin.subscription.status === 'active' && admin.subscription.endDate) {
    if (new Date() > new Date(admin.subscription.endDate)) {
      admin.subscription.status = 'expired';
      await admin.save();
    }
  }

  return sendResponse(res, 200, true, 'Admin subscription retrieved', {
    subscription: admin.subscription,
  });
});
