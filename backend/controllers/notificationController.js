import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  const items = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'request',
      select: 'status service createdAt',
      populate: {
        path: 'service',
        select: 'title',
      },
    });

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  return sendResponse(res, 200, true, 'Notifications fetched successfully', {
    items,
    unreadCount,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (!notification.read) {
    notification.read = true;
    await notification.save();
  }

  return sendResponse(res, 200, true, 'Notification marked as read', {
    notification,
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } },
  );

  return sendResponse(res, 200, true, 'All notifications marked as read', {
    updatedCount: result.modifiedCount || 0,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notificationId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, 'Invalid notification id');
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return sendResponse(res, 200, true, 'Notification deleted successfully', {
    notificationId: String(notification._id),
  });
});
