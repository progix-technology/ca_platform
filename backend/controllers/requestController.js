import Request from '../models/Request.js';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Service from '../models/Service.js';
import Plan from '../models/Plan.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { uploadDocumentToCloudinary } from '../config/cloudinary.js';
import { sendEmail } from '../utils/email.js';
import { normalizeCategory } from '../utils/serviceCategories.js';

// Delete a request (user or admin)
export const deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }
  // Only allow owner or admin to delete
  if (req.user.role !== 'admin' && String(request.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to delete this request');
  }
  await request.deleteOne();
  // Optionally, delete related comments/notifications here if needed
  return sendResponse(res, 200, true, 'Request deleted successfully');
});




const WORKFLOW_STATUS = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  PAID: 'Paid',
  IN_PROGRESS: 'In Progress',
  FILED: 'Filed',
  COMPLETED: 'Completed',
  RENEWED: 'Renewed',
  SERVICE_RENEWING: 'Service Renewing',
  REJECTED: 'Rejected',
  APPROVED: 'Approved',
  ACTION_NEEDED: 'Action Needed',
};

const WORKFLOW_STATUSES = Object.values(WORKFLOW_STATUS);

const normalizeStatusKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '');

const STATUS_ALIASES = {
  submitted: WORKFLOW_STATUS.SUBMITTED,
  inreview: WORKFLOW_STATUS.IN_REVIEW,
  approved: WORKFLOW_STATUS.APPROVED,
  actionneeded: WORKFLOW_STATUS.ACTION_NEEDED,
  paid: WORKFLOW_STATUS.PAID,
  inprogress: WORKFLOW_STATUS.IN_PROGRESS,
  filed: WORKFLOW_STATUS.FILED,
  completed: WORKFLOW_STATUS.COMPLETED,
  renewed: WORKFLOW_STATUS.RENEWED,
  servicerenewing: WORKFLOW_STATUS.SERVICE_RENEWING,
  rejected: WORKFLOW_STATUS.REJECTED,
  pending: WORKFLOW_STATUS.SUBMITTED, // legacy
  needmoreinfo: WORKFLOW_STATUS.ACTION_NEEDED, // legacy
};

const NEXT_ALLOWED_STATUSES = {
  [WORKFLOW_STATUS.SUBMITTED]: [WORKFLOW_STATUS.IN_REVIEW, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.IN_REVIEW]: [WORKFLOW_STATUS.APPROVED, WORKFLOW_STATUS.ACTION_NEEDED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.APPROVED]: [WORKFLOW_STATUS.PAID, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.ACTION_NEEDED]: [WORKFLOW_STATUS.IN_REVIEW, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.PAID]: [WORKFLOW_STATUS.IN_PROGRESS, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.IN_PROGRESS]: [WORKFLOW_STATUS.FILED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.FILED]: [WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.COMPLETED]: [WORKFLOW_STATUS.RENEWED, WORKFLOW_STATUS.SERVICE_RENEWING],
  [WORKFLOW_STATUS.SERVICE_RENEWING]: [WORKFLOW_STATUS.RENEWED, WORKFLOW_STATUS.IN_PROGRESS, WORKFLOW_STATUS.FILED, WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.RENEWED]: [WORKFLOW_STATUS.IN_PROGRESS, WORKFLOW_STATUS.FILED, WORKFLOW_STATUS.COMPLETED, WORKFLOW_STATUS.REJECTED],
  [WORKFLOW_STATUS.REJECTED]: [WORKFLOW_STATUS.IN_REVIEW],
};

// Add missing statuses for transition
WORKFLOW_STATUS.APPROVED = 'Approved';
WORKFLOW_STATUS.ACTION_NEEDED = 'Action Needed';

const normalizeWorkflowStatus = (value) => STATUS_ALIASES[normalizeStatusKey(value)] || null;

const canTransitionStatus = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return true;
  }

  return NEXT_ALLOWED_STATUSES[currentStatus]?.includes(nextStatus) || false;
};

const populateRequest = (query) => query
  .populate('user', 'name email role')
  .populate('service', 'title category price documentsRequired')
  .populate('reviewedBy', 'name email role')
  .populate('assignedTo', 'name email profileImage phone feedbacks')
  .populate('archivedBy', 'name email role')
  .populate('statusTimeline.changedBy', 'name email role')
  .populate('comments.author', 'name email role');

const canAccessRequest = (request, user) => {
  if (user?.role === 'admin') {
    return true;
  }

  const requestUserId = String(request.user?._id || request.user || '');
  return requestUserId && requestUserId === String(user?._id || '');
};

const isCommentAuthor = (comment, user) => {
  const commentAuthorId = String(comment?.author?._id || comment?.author || '');
  return commentAuthorId && commentAuthorId === String(user?._id || '');
};

const isCompletedByAdmin = (request) => {
  const normalizedStatus = normalizeWorkflowStatus(request?.status);
  return normalizedStatus === WORKFLOW_STATUS.COMPLETED;
};

const getUserVisibleStatus = (request) => request?.status;

const buildRequestStatusNotification = ({ status, serviceTitle, reviewMessage }) => {
  const safeServiceTitle = serviceTitle || 'your service request';

  if (status === WORKFLOW_STATUS.SUBMITTED) {
    return {
      title: 'Request Submitted',
      message: `Your request for ${safeServiceTitle} has been submitted.`,
    };
  }

  if (status === WORKFLOW_STATUS.IN_REVIEW) {
    return {
      title: 'Request In Review',
      message: `Your request for ${safeServiceTitle} is now under review.`,
    };
  }

  if (status === WORKFLOW_STATUS.ACTION_NEEDED) {
    return {
      title: 'Action Needed',
      message: reviewMessage
        ? `Action needed for ${safeServiceTitle}: ${reviewMessage}`
        : `Action needed for ${safeServiceTitle}.`,
    };
  }

  if (status === WORKFLOW_STATUS.APPROVED) {
    return {
      title: 'Request Approved',
      message: `Your request for ${safeServiceTitle} is approved. Please complete payment to finalize it.`,
    };
  }

  if (status === WORKFLOW_STATUS.COMPLETED) {
    return {
      title: 'Request Completed',
      message: `Payment received for ${safeServiceTitle}. Your request is completed.`,
    };
  }

  if (status === WORKFLOW_STATUS.RENEWED) {
    return {
      title: 'Service Renewed',
      message: `Your request for ${safeServiceTitle} has been renewed successfully.`,
    };
  }

  return {
    title: 'Request Updated',
    message: `Your request for ${safeServiceTitle} is now marked as ${status}.`,
  };
};

const formatRequestCode = (request) => {
  const id = String(request?._id || request?.id || '');

  if (!id) {
    return 'REQ-NA';
  }

  return id.startsWith('REQ-') ? id : `REQ-${id.slice(-6).toUpperCase()}`;
};

const toCsvCell = (value) => {
  const safe = String(value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
};

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (Array.isArray(value)) {
    return value.join(' | ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const toDisplayDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString('en-IN');
};

const normalizePaymentMethod = (method) => {
  const value = String(method || '').trim().toLowerCase();

  if (value === 'card') {
    return 'Card';
  }

  if (value === 'upi') {
    return 'UPI';
  }

  return '-';
};

const HIDDEN_EXPORT_STATUS_KEYS = new Set(['submitted', 'pending', 'inreview', 'inprogress']);

const getExportStatusLabel = (status) => {
  const key = normalizeStatusKey(status);

  if (key === 'submitted' || key === 'pending' || key === 'inreview' || key === 'inprogress') {
    return 'In Process';
  }

  if (key === 'actionneeded' || key === 'needmoreinfo') {
    return 'Action Needed';
  }
  if (key === 'rejected') {
    return 'Rejected';
  }

  if (key === 'approved') {
    return 'Approved';
  }

  if (key === 'completed') {
    return 'Completed';
  }

  return String(status || '-');
};

const normalizeFieldKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const toFieldLabel = (fieldKey) => {
  const withSpaces = String(fieldKey || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  if (!withSpaces) {
    return 'Field';
  }

  return withSpaces
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const toSpreadsheetText = (value) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return '-';
  }

  return `'${text}`;
};

const toPhoneValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const raw = String(value).trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (digitsOnly.length >= 8) {
    if (raw.startsWith('+')) {
      return toSpreadsheetText(raw.replace(/\s+/g, ''));
    }

    return toSpreadsheetText(digitsOnly);
  }

  return raw;
};

const buildRequestExportRows = (request, { includeInternalComments = false } = {}) => {
  const requestCode = formatRequestCode(request);
  const service = request?.service && typeof request.service === 'object' ? request.service : {};
  const details = request?.details && typeof request.details === 'object' && !Array.isArray(request.details)
    ? request.details
    : {};
  const payment = request?.payment && typeof request.payment === 'object' ? request.payment : {};
  const paymentDetails = payment.details && typeof payment.details === 'object' && !Array.isArray(payment.details)
    ? payment.details
    : {};
  const uploadedDocuments = Array.isArray(request?.documents) ? request.documents : [];
  const requiredDocuments = Array.isArray(service.documentsRequired) ? service.documentsRequired : [];
  const timeline = Array.isArray(request?.statusTimeline) ? request.statusTimeline : [];
  const comments = Array.isArray(request?.comments)
    ? request.comments.filter((comment) => includeInternalComments || !comment?.isInternal)
    : [];
  const detailEntries = Object.entries(details);
  const exportedDetails = detailEntries
    .filter(([field]) => !['name', 'email', 'phone'].includes(normalizeFieldKey(field)))
    .sort(([fieldA], [fieldB]) => toFieldLabel(fieldA).localeCompare(toFieldLabel(fieldB)));
  const clientPhone = details.phone ?? details.mobile ?? details.contactNumber ?? '-';
  const paymentMethodLabel = normalizePaymentMethod(payment.method);
  const filteredTimeline = timeline.filter((entry) => {
    const statusKey = normalizeStatusKey(entry?.status);
    return !HIDDEN_EXPORT_STATUS_KEYS.has(statusKey);
  });

  const rows = [
    ['Section', 'Field', 'Value'],
    ['Request Summary', 'Request ID', toSpreadsheetText(requestCode)],
    ['Request Summary', 'Current Status', getExportStatusLabel(request?.status)],
    ['Request Summary', 'Applied On', toDisplayDate(request?.createdAt)],
    ['Request Summary', 'Last Updated', toDisplayDate(request?.updatedAt)],
    ['Client Details', 'Name', details.name || request?.user?.name || '-'],
    ['Client Details', 'Email', details.email || request?.user?.email || '-'],
    ['Client Details', 'Phone', toPhoneValue(clientPhone)],
    ['Service Details', 'Title', service.title || '-'],
    ['Service Details', 'Category', service.category || '-'],
    ['Service Details', 'Amount', `₹${Number(service.price || 0).toLocaleString('en-IN')}`],
    ['Service Details', 'Required Documents', requiredDocuments.length ? requiredDocuments.join(' | ') : '-'],
    ['Payment Details', 'Method', paymentMethodLabel === '-' ? 'Not Paid' : paymentMethodLabel],
    ['Payment Details', 'Paid On', toDisplayDate(payment.paidAt)],
  ];

  if (String(payment.method || '').toLowerCase() === 'card') {
    rows.push(['Payment Details', 'Card Holder', paymentDetails.holderName || '-']);
    rows.push(['Payment Details', 'Card Number', paymentDetails.cardNumberMasked || '-']);
    rows.push(['Payment Details', 'Card Expiry', paymentDetails.expiry || '-']);
  }

  if (String(payment.method || '').toLowerCase() === 'upi') {
    rows.push(['Payment Details', 'UPI ID', paymentDetails.upiId || '-']);
  }

  exportedDetails.forEach(([key, value]) => {
    const keyLabel = toFieldLabel(key);
    const isPhoneLike = /phone|mobile|contact/i.test(keyLabel);
    const valueLabel = isPhoneLike ? toPhoneValue(value) : toDisplayValue(value);
    rows.push(['Submitted Form Details', keyLabel, valueLabel]);
  });

  if (uploadedDocuments.length === 0) {
    rows.push(['Uploaded Documents', 'Document List', 'No documents uploaded']);
  } else {
    uploadedDocuments.forEach((documentPath, index) => {
      const documentName = typeof documentPath === 'object'
        ? documentPath.name || documentPath.url?.split('/').pop() || 'Document'
        : documentPath.split('/').pop() || documentPath;
      const documentValue = typeof documentPath === 'object'
        ? (documentPath.url || documentPath.name || '')
        : documentPath;

      rows.push(['Uploaded Documents', `Document ${index + 1}`, `${documentName} - ${documentValue}`]);
    });
  }

  if (filteredTimeline.length === 0) {
    rows.push(['Final Timeline', 'Entries', 'No final status updates']);
  } else {
    filteredTimeline.forEach((entry, index) => {
      const changedBy = entry?.changedBy?.name || 'System';
      const note = entry?.note ? ` | Note: ${entry.note}` : '';
      rows.push([
        'Final Timeline',
        `Step ${index + 1}`,
        `${getExportStatusLabel(entry?.status)} | ${toDisplayDate(entry?.createdAt)} | By: ${changedBy}${note}`,
      ]);
    });
  }

  if (comments.length === 0) {
    rows.push(['Comments', 'Entries', includeInternalComments ? 'No comments or notes' : 'No public comments']);
  } else {
    comments.forEach((comment, index) => {
      const commentAuthor = comment?.author?.name || 'User';
      const commentType = comment?.isInternal ? 'Internal' : 'Public';
      rows.push([
        'Comments',
        `Comment ${index + 1}`,
        `${commentType} | ${commentAuthor} | ${toDisplayDate(comment?.createdAt)} | ${comment?.text || ''}`,
      ]);
    });
  }

  return rows;
};

export const createRequest = asyncHandler(async (req, res) => {
  const {
    serviceId,
    details,
    serviceTitle,
    serviceCategory,
    servicePrice,
    serviceDescription,
    documentsRequired,
    selectedSavedDocuments,
  } = req.body;

  let service = null;

  if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
    service = await Service.findById(serviceId);
  }

  if (!service && serviceTitle?.trim()) {
    const normalizedTitle = serviceTitle.trim();

    service = await Service.findOne({
      title: { $regex: `^${normalizedTitle}$`, $options: 'i' },
    });

    if (!service) {
      service = await Service.create({
        title: normalizedTitle,
        description: serviceDescription?.trim() || `${normalizedTitle} service request`,
        price: Number(servicePrice) || 0,
        category: normalizeCategory(serviceCategory?.trim()),
        documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [],
      });
    }
  }

  if (!service) {
    throw new ApiError(400, 'Valid serviceId or serviceTitle is required');
  }

  const toDetailsObject = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }

    return {};
  };

  const toStringArray = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
        return [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const normalizedDetails = toDetailsObject(details);
  const userDoc = await User.findById(req.user._id).select('savedDocuments');
  const savedDocumentsByUrl = new Map((userDoc?.savedDocuments || []).map((doc) => [doc.url, doc]));

  const requestedSavedDocuments = toStringArray(selectedSavedDocuments);
  const approvedSavedDocuments = requestedSavedDocuments
    .map((url) => savedDocumentsByUrl.get(url))
    .filter(Boolean)
    .map((doc) => ({ url: doc.url, name: doc.name }));

  const uploadedDocuments = await Promise.all(
    (req.files || []).map(async (file, index) => {
      const uploaded = await uploadDocumentToCloudinary(file, {
        folder: 'ca-platform/request-documents',
        public_id: `request_${req.user._id}_${Date.now()}_${index}`,
      });

      return {
        url: uploaded.secure_url,
        name: file.originalname,
      };
    }),
  );

  const finalDocumentsMap = new Map();
  approvedSavedDocuments.forEach((doc) => finalDocumentsMap.set(doc.url, doc));
  uploadedDocuments.forEach((doc) => finalDocumentsMap.set(doc.url, doc));
  const documents = Array.from(finalDocumentsMap.values());
  const initialUserMessage = String(normalizedDetails.message || '').trim();

  const comments = initialUserMessage
    ? [{
      author: req.user._id,
      text: initialUserMessage,
      isInternal: false,
    }]
    : [];

  const request = await Request.create({
    user: req.user._id,
    service: service._id,
    status: WORKFLOW_STATUS.SUBMITTED,
    details: normalizedDetails,
    documents,
    comments,
    statusTimeline: [{
      status: WORKFLOW_STATUS.SUBMITTED,
      changedBy: req.user._id,
      note: 'Request submitted by user',
    }],
  });

  await request.save();

  // Notify all admins and superadmins that a new request is available
  const AdminUser = (await import('../models/AdminUser.js')).default;
  const SuperAdmin = (await import('../models/SuperAdmin.js')).default;
  
  const allAdminsAndSuperAdmins = await Promise.all([
    AdminUser.find({}).select('_id'),
    SuperAdmin.find({}).select('_id')
  ]).then(([admins, superadmins]) => [...admins, ...superadmins]);

  if (allAdminsAndSuperAdmins.length > 0) {
    await Notification.insertMany(allAdminsAndSuperAdmins.map((admin) => ({
      user: admin._id,
      request: request._id,
      type: 'request-created',
      title: 'New Service Request Available',
      message: `${req.user.name || 'A user'} submitted a new request for ${service.title}. It is available in the Unassigned pool.`,
      meta: {
        requestId: request._id,
      },
    })));
  }

  const populatedRequest = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 201, true, 'Service request created successfully', {
    request: populatedRequest,
  });
});

export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.find({ user: req.user._id })
    .populate('service', 'title category price')
    .populate('reviewedBy', 'name role')
    .populate('assignedTo', 'name email profileImage feedbacks')
    .sort({ createdAt: -1 });

  const items = requests.map((request) => request.toObject());

  return sendResponse(res, 200, true, 'User requests fetched successfully', {
    items,
  });
});

export const getAllRequests = asyncHandler(async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const filter = includeArchived ? {} : { archivedByAdmin: { $ne: true } };

  // Fetch the current admin user to get their subscription and leadPriorityLevel
  let leadPriorityLevel = 0;
  if (req.user.role === 'admin') {
    const adminUser = await AdminUser.findById(req.user._id).populate('subscription.planId');
    if (adminUser?.subscription?.planId?.leadPriorityLevel) {
      leadPriorityLevel = adminUser.subscription.planId.leadPriorityLevel;
    }
  }

  // If the user is a regular admin, apply standard filters
  if (req.user.role === 'admin') {
    filter.$or = [
      { assignedTo: req.user._id },
      { assignedTo: null },
      { acquireStatus: 'pending_user_approval' }
    ];

    // Lead Priority Logic: 
    // If priority is 0 (Basic), they can't see requests created in the last 30 minutes
    // If priority is 1 (Medium), they can't see requests created in the last 15 minutes
    // If priority is 2+ (High), they see them immediately.
    // This only applies to unassigned requests.
    if (leadPriorityLevel < 2) {
      const delayMinutes = leadPriorityLevel === 1 ? 15 : 30;
      const cutoffTime = new Date(Date.now() - delayMinutes * 60 * 1000);
      
      // We modify the $or array to apply the cutoff time only to unassigned requests
      filter.$or = filter.$or.map(condition => {
        if (condition.assignedTo === null) {
          return { assignedTo: null, createdAt: { $lte: cutoffTime } };
        }
        return condition;
      });
    }
  }

  const requests = await populateRequest(
    Request.find(filter).sort({ createdAt: -1 }),
  );

  return sendResponse(res, 200, true, 'All requests fetched successfully', {
    items: requests,
  });
});

export const archiveCompletedRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (normalizeWorkflowStatus(request.status) !== WORKFLOW_STATUS.COMPLETED) {
    throw new ApiError(400, 'Only completed requests can be saved to list');
  }

  if (request.archivedByAdmin) {
    throw new ApiError(400, 'This request is already saved to the completed list');
  }

  request.archivedByAdmin = true;
  request.archivedAt = new Date();
  request.archivedBy = req.user._id;

  await request.save();

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Completed request saved to list', {
    request: updated,
  });
});

export const getArchivedCompletedRequests = asyncHandler(async (req, res) => {
  let query;
  if (req.user.role === 'admin') {
    query = { status: WORKFLOW_STATUS.COMPLETED };
  } else {
    query = { status: WORKFLOW_STATUS.COMPLETED, user: req.user._id };
  }
  const completedRequests = await populateRequest(
    Request.find(query).sort({ updatedAt: -1 })
  );
  return sendResponse(res, 200, true, 'Completed requests fetched successfully', {
    items: completedRequests,
  });
});

export const renewRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id).populate('service', 'title').populate('user', 'name email');
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  const requestUserId = String(request.user?._id || request.user || '');
  if (requestUserId !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You are not authorized to renew this request');
  }

  const currentStatus = normalizeWorkflowStatus(request.status);
  if (currentStatus !== WORKFLOW_STATUS.COMPLETED) {
    throw new ApiError(400, 'Only completed requests can be renewed');
  }

  if (request.renewalRequested) {
    throw new ApiError(400, 'Renewal has already been requested for this service');
  }

  request.renewalRequested = true;
  request.statusTimeline.push({
    status: 'Renewal Requested',
    changedBy: req.user._id,
    note: 'User requested renewal',
  });
  await request.save();

  await Notification.create({
    user: request.user,
    request: request._id,
    type: 'request-status',
    title: 'Renewal Requested',
    message: `Renewal requested for ${request.service?.title || 'your service'}.
Please review and process it from the admin panel.`,
    meta: {
      requestId: request._id,
      renewalRequested: true,
    },
  });

  const updated = await populateRequest(Request.findById(request._id));
  return sendResponse(res, 200, true, 'Renewal request submitted successfully', {
    request: updated,
  });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const nextStatus = normalizeWorkflowStatus(req.body.status);
  const reviewMessage = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!WORKFLOW_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, 'Invalid status value');
  }


  if (nextStatus === WORKFLOW_STATUS.ACTION_NEEDED && !reviewMessage) {
    throw new ApiError(400, 'Message is required when status is Action Needed');
  }

  const request = await Request.findById(req.params.id).populate('service', 'title');
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  const currentStatus = normalizeWorkflowStatus(request.status);
  // Allow admin to set Completed only from Filed (final step)
  if (req.user.role === 'admin' && nextStatus === WORKFLOW_STATUS.COMPLETED) {
    const allowed = [WORKFLOW_STATUS.FILED, WORKFLOW_STATUS.COMPLETED];
    if (!allowed.includes(currentStatus)) {
      throw new ApiError(400, 'Completed can only be set from Filed by admin after deliverables upload');
    }
  }

  if (!currentStatus) {
    throw new ApiError(400, 'Current request status is invalid');
  }

  if (!canTransitionStatus(currentStatus, nextStatus)) {
    throw new ApiError(400, `Invalid status transition from ${currentStatus} to ${nextStatus}`);
  }

  request.status = nextStatus;
  request.reviewMessage = reviewMessage;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();

  let newDocs = [];

  // If admin is setting Filed, Completed, or Renewed, allow deliverables upload and expiryDate
  if (req.user.role === 'admin' && (nextStatus === WORKFLOW_STATUS.FILED || nextStatus === WORKFLOW_STATUS.COMPLETED || nextStatus === WORKFLOW_STATUS.RENEWED)) {
    let deliverableUrls = [];
    // Handle file uploads (from req.files)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadDocumentToCloudinary(file, {
          folder: 'ca-platform/deliverables',
          public_id: `deliverable_${request._id}_${Date.now()}_${file.originalname}`,
        });
        deliverableUrls.push(uploaded.secure_url);
      }
    }
    // Handle deliverable names (from req.body.deliverables)
    let deliverableNames = [];
    if (req.body.deliverables) {
      if (typeof req.body.deliverables === 'string') {
        try {
          deliverableNames = JSON.parse(req.body.deliverables);
        } catch {
          deliverableNames = [req.body.deliverables];
        }
      } else if (Array.isArray(req.body.deliverables)) {
        deliverableNames = req.body.deliverables;
      }
    }
    // Combine uploaded file URLs and deliverable names as objects
    // If both arrays are present and same length, pair them; else fallback to old logic
    if (deliverableNames.length && deliverableUrls.length && deliverableNames.length === deliverableUrls.length) {
      newDocs = deliverableNames.map((name, i) => ({ name, url: deliverableUrls[i] }));
    } else if (deliverableUrls.length) {
      // fallback: just use url as name
      newDocs = deliverableUrls.map((url, i) => ({ name: `Document ${i + 1}`, url }));
    } else if (deliverableNames.length) {
      // fallback: just names, no files
      newDocs = deliverableNames.map((name) => ({ name, url: '' }));
    }
    request.documents = [...(request.documents || []), ...newDocs];

    if (req.body.removeDocuments) {
      let removeKeys = [];
      if (typeof req.body.removeDocuments === 'string') {
        try {
          removeKeys = JSON.parse(req.body.removeDocuments);
        } catch {
          removeKeys = [req.body.removeDocuments];
        }
      } else if (Array.isArray(req.body.removeDocuments)) {
        removeKeys = req.body.removeDocuments;
      }

      if (removeKeys.length) {
        request.documents = (request.documents || []).filter((doc) => {
          const key = typeof doc === 'string' ? doc : (doc.url || doc.name || '');
          return !removeKeys.includes(key);
        });
      }
    }

    if (req.body.expiryDate) {
      request.expiryDate = new Date(req.body.expiryDate);
      request.expiryReminderSent = false;
    }
  }

  const timelineEntry = {
    status: nextStatus,
    changedBy: req.user._id,
    note: reviewMessage,
  };

  if (nextStatus === WORKFLOW_STATUS.RENEWED) {
    if (req.body.expiryDate) {
      timelineEntry.expiryDate = new Date(req.body.expiryDate);
    }
    if (newDocs.length) {
      timelineEntry.documents = newDocs;
    }
    request.renewalRequested = false;
  }

  request.statusTimeline.push(timelineEntry);

  if (reviewMessage) {
    request.comments.push({
      author: req.user._id,
      text: reviewMessage,
      isInternal: false,
    });
  }


  await request.save();

  // Send instant email if status is approved or rejected
  if (nextStatus === WORKFLOW_STATUS.APPROVED || nextStatus === WORKFLOW_STATUS.REJECTED) {
    // Get user email
    const user = await User.findById(request.user);
    if (user && user.email) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const serviceUrl = `${clientUrl}/dashboard/services/${request._id}`;
      let subject, html;
      if (nextStatus === WORKFLOW_STATUS.APPROVED) {
        subject = 'Your Service Request is Approved!';
        html = `
          <div style="font-family: 'DM Sans', Arial, sans-serif; background: #f8fafc; padding: 32px;">
            <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 32px;">
              <h2 style="color: #10b981;">Service Approved</h2>
              <p style="color: #334155; font-size: 16px;">Dear ${user.name || 'User'},</p>
              <p style="color: #334155; font-size: 16px;">Your service request <b>${request.service?.title || ''}</b> has been <b>approved</b> by our team.</p>
              <p style="color: #334155; font-size: 16px;">To complete your service, please click the button below to view your request timeline and next steps.</p>
              <a href="${clientUrl}/dashboard/services" style="display: inline-block; margin: 24px 0 0 0; padding: 12px 24px; background: #10b981; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View Service Timeline</a>
              <p style="color: #64748b; font-size: 13px; margin-top: 32px;">If you have any questions, reply to this email or contact support.</p>
            </div>
          </div>
        `;
      } else if (nextStatus === WORKFLOW_STATUS.REJECTED) {
        subject = 'Your Service Request is Rejected';
        html = `
          <div style="font-family: 'DM Sans', Arial, sans-serif; background: #f8fafc; padding: 32px;">
            <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 32px;">
              <h2 style="color: #ef4444; font-size: 2rem; margin-bottom: 16px;">Your Service is Rejected</h2>
              <p style="color: #334155; font-size: 16px;">Dear ${user.name || 'User'},</p>
              <p style="color: #334155; font-size: 16px;">Your service request <b>${request.service?.title || ''}</b> has been <b>rejected</b> by the admin.</p>
              <div style="background: #fef2f2; color: #b91c1c; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <b>Reason:</b><br />
                <span style="white-space: pre-line;">${reviewMessage || 'No reason provided.'}</span>
              </div>
              <a href="${serviceUrl}" style="display: inline-block; margin: 24px 0 0 0; padding: 12px 24px; background: #ef4444; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">See the Service</a>
              <p style="color: #64748b; font-size: 13px; margin-top: 32px;">If you have any questions, reply to this email or contact support.</p>
            </div>
          </div>
        `;
      }
      try {
        await sendEmail(user.email, subject, html, true);
      } catch (err) {
        console.error('Failed to send status email:', err);
      }
    }
  }

  const notificationPayload = buildRequestStatusNotification({
    status: nextStatus,
    serviceTitle: request.service?.title,
    reviewMessage,
  });

  await Notification.create({
    user: request.user,
    request: request._id,
    type: 'request-status',
    title: notificationPayload.title,
    message: notificationPayload.message,
    meta: {
      fromStatus: currentStatus,
      toStatus: nextStatus,
      note: reviewMessage,
    },
  });

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Request status updated successfully', {
    request: updated,
  });
});

export const getRequestById = asyncHandler(async (req, res) => {
  const request = await populateRequest(Request.findById(req.params.id));

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(request, req.user)) {
    throw new ApiError(403, 'You are not authorized to access this request');
  }

  return sendResponse(res, 200, true, 'Request fetched successfully', {
    request,
  });
});

export const exportRequestData = asyncHandler(async (req, res) => {
  const requestDoc = await populateRequest(Request.findById(req.params.id));

  if (!requestDoc) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(requestDoc, req.user)) {
    throw new ApiError(403, 'You are not authorized to export this request');
  }

  const request = requestDoc.toObject();

  if (req.user.role !== 'admin' && isCompletedByAdmin(request)) {
    request.status = WORKFLOW_STATUS.APPROVED;
  }

  const rows = buildRequestExportRows(request, {
    includeInternalComments: req.user.role === 'admin',
  });

  const csvContent = rows
    .map((row) => row.map((value) => toCsvCell(value)).join(','))
    .join('\n');

  const fileName = `${formatRequestCode(request)}-data-export.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  return res.status(200).send(`\uFEFF${csvContent}`);
});

export const addRequestComment = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  const isInternal = req.body.isInternal === true || req.body.isInternal === 'true';

  if (!text) {
    throw new ApiError(400, 'Comment text is required');
  }

  const request = await Request.findById(req.params.id).populate('service', 'title');
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(request, req.user)) {
    throw new ApiError(403, 'You are not authorized to comment on this request');
  }

  if (isInternal && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can add internal notes');
  }

  const normalizedStatus = normalizeWorkflowStatus(request.status);
  if (normalizedStatus && request.status !== normalizedStatus) {
    request.status = normalizedStatus;
  }

  request.comments.push({
    author: req.user._id,
    text,
    isInternal,
  });

  await request.save();

  if (req.user.role === 'admin' && !isInternal) {
    await Notification.create({
      user: request.user,
      request: request._id,
      type: 'request-status',
      title: 'New Update on Request',
      message: `Admin shared an update for ${request.service?.title || 'your request'}: ${text}`,
      meta: {
        comment: text,
      },
    });
  }

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Comment added successfully', {
    request: updated,
  });
});

export const updateRequestComment = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();

  if (!text) {
    throw new ApiError(400, 'Comment text is required');
  }

  const request = await Request.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(request, req.user)) {
    throw new ApiError(403, 'You are not authorized to update comments on this request');
  }

  const comment = request.comments.id(req.params.commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (!isCommentAuthor(comment, req.user)) {
    throw new ApiError(403, 'You can only update your own comments');
  }

  if (comment.isInternal && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can edit internal notes');
  }

  comment.text = text;
  await request.save();

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Comment updated successfully', {
    request: updated,
  });
});

export const deleteRequestComment = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(request, req.user)) {
    throw new ApiError(403, 'You are not authorized to delete comments on this request');
  }

  const comment = request.comments.id(req.params.commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (!isCommentAuthor(comment, req.user)) {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  if (comment.isInternal && req.user.role !== 'admin') {
    throw new ApiError(403, 'Only admins can delete internal notes');
  }

  comment.deleteOne();
  await request.save();

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Comment deleted successfully', {
    request: updated,
  });
});

export const completeRequestPayment = asyncHandler(async (req, res) => {
  const paymentMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
  const paymentDetails = req.body.paymentDetails && typeof req.body.paymentDetails === 'object' && !Array.isArray(req.body.paymentDetails)
    ? req.body.paymentDetails
    : {};

  if (paymentMethod && !['card', 'upi'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  const request = await Request.findById(req.params.id).populate('service', 'title');
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (!canAccessRequest(request, req.user)) {
    throw new ApiError(403, 'You are not authorized to pay for this request');
  }

  if (req.user.role === 'admin') {
    throw new ApiError(403, 'Admins cannot complete payments on behalf of clients');
  }

  const currentStatus = normalizeWorkflowStatus(request.status);
  if (currentStatus !== WORKFLOW_STATUS.APPROVED && currentStatus !== WORKFLOW_STATUS.SUBMITTED) {
    throw new ApiError(400, 'Payment is allowed only after request approval');
  }

  request.status = WORKFLOW_STATUS.PAID;
  request.reviewMessage = 'Payment completed by client';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.statusTimeline.push({
    status: WORKFLOW_STATUS.PAID,
    changedBy: req.user._id,
    note: 'Payment completed by client',
  });
  request.payment = {
    method: paymentMethod || request.payment?.method || '',
    details: paymentDetails,
    paidAt: new Date(),
  };
  request.comments.push({
    author: req.user._id,
    text: 'Payment completed successfully.',
    isInternal: false,
  });

  // Do not auto-archive after payment; archive only after completion

  await request.save();

  await Notification.create({
    user: request.user,
    request: request._id,
    type: 'request-status',
    title: 'Payment Received',
    message: `Payment received for ${request.service?.title || 'your request'}. Your request is now marked as Paid and will be processed by admin.`,
    meta: {
      fromStatus: currentStatus,
      toStatus: WORKFLOW_STATUS.PAID,
      paymentCompleted: true,
      paymentMethod: paymentMethod || null,
    },
  });

  const updated = await populateRequest(Request.findById(request._id));

  return sendResponse(res, 200, true, 'Payment completed and request marked as Paid', {
    request: updated,
  });
});

export const acquireRequest = asyncHandler(async (req, res) => {
  const userRole = req.user.role;

  // Subscription Enforcement for Admins
  if (userRole === 'admin' || userRole === 'superadmin') {
    const AdminModel = userRole === 'admin' ? AdminUser : SuperAdmin;
    const admin = await AdminModel.findById(req.user._id).populate('subscription.planId');
    
    if (!admin || !admin.subscription || !admin.subscription.planId) {
      throw new ApiError(403, 'Subscription details not found. Please activate a plan to acquire requests.');
    }

    const { status, endDate, usage, planId } = admin.subscription;
    
    if (status !== 'active' && status !== 'trial') {
      throw new ApiError(403, 'Your subscription is not active. Please renew your plan to acquire requests.');
    }
    
    if (endDate && new Date() > new Date(endDate)) {
      admin.subscription.status = 'expired';
      await admin.save();
      throw new ApiError(403, 'Your subscription has expired. Please renew your plan.');
    }
    
    if (planId.requestLimitPerMonth !== -1) {
      if (usage >= planId.requestLimitPerMonth) {
        throw new ApiError(403, 'Plan request limit reached. Please upgrade your subscription.');
      }
    }
    
    // We will increment the usage if the request acquisition is successful below
    req.adminUserToUpdate = admin;
  }

  const { proposedTime, proposedPrice } = req.body;
  const request = await Request.findById(req.params.id).populate('user').populate('service');
  
  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.acquireStatus !== 'unacquired' || request.assignedTo) {
    throw new ApiError(400, 'This request has already been acquired by someone else.');
  }

  request.assignedTo = req.user._id;
  request.acquireStatus = 'pending_user_approval';
  request.proposedTime = proposedTime || '';
  if (proposedPrice !== undefined && proposedPrice !== null) {
    request.proposedPrice = Number(proposedPrice);
  }

  await request.save();

  // Increment usage
  if (req.adminUserToUpdate) {
    req.adminUserToUpdate.subscription.usage = (req.adminUserToUpdate.subscription.usage || 0) + 1;
    await req.adminUserToUpdate.save();
  }

  // Notify the user
  await Notification.create({
    user: request.user._id,
    request: request._id,
    type: 'request-status',
    title: 'CA Proposed to Fulfill Your Request',
    message: `A CA (${req.user.name}) has offered to fulfill your request. Please review their proposal.`,
    meta: {
      requestId: request._id,
    },
  });

  const updated = await populateRequest(Request.findById(request._id));
  return sendResponse(res, 200, true, 'Request acquired successfully. Pending user approval.', {
    request: updated,
  });
});

export const respondToAcquisition = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'approve' or 'deny'
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (String(request.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to respond to this request');
  }

  if (request.acquireStatus !== 'pending_user_approval') {
    throw new ApiError(400, 'Request is not pending approval');
  }

  if (status === 'approve') {
    request.acquireStatus = 'approved';
    request.status = 'In Review';
    await request.save();

    await Notification.create({
      user: request.assignedTo,
      request: request._id,
      type: 'request-status',
      title: 'Proposal Approved',
      message: `The user has approved your proposal. You can now start working on the request.`,
      meta: {
        requestId: request._id,
      },
    });
  } else if (status === 'deny') {
    const rejectedAdminId = request.assignedTo;
    request.acquireStatus = 'unacquired';
    request.assignedTo = null;
    request.proposedTime = '';
    request.proposedPrice = null;
    await request.save();

    await Notification.create({
      user: rejectedAdminId,
      request: request._id,
      type: 'request-status',
      title: 'Proposal Denied',
      message: `The user has denied your proposal for the request.`,
      meta: {
        requestId: request._id,
      },
    });
  } else {
    throw new ApiError(400, 'Invalid status response');
  }

  const updated = await populateRequest(Request.findById(request._id));
  return sendResponse(res, 200, true, 'Response recorded successfully', {
    request: updated,
  });
});

export const updateRequestPrice = asyncHandler(async (req, res) => {
  const { proposedPrice } = req.body;
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (proposedPrice !== undefined && proposedPrice !== null) {
    request.proposedPrice = Number(proposedPrice);
  }

  await request.save();

  await Notification.create({
    user: request.user._id,
    request: request._id,
    type: 'request-status',
    title: 'Price Updated',
    message: `The price for your request has been updated to ₹${proposedPrice}. Please review.`,
    meta: {
      requestId: request._id,
    },
  });

  const updated = await populateRequest(Request.findById(request._id));
  return sendResponse(res, 200, true, 'Request price updated successfully.', {
    request: updated,
  });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('service', 'title')
    .populate('user', 'name');

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
    throw new ApiError(403, 'Not authorized to provide feedback for this request');
  }

  if (request.status !== 'Completed') {
    throw new ApiError(400, 'Feedback can only be submitted for completed services');
  }

  if (request.feedbackSubmitted) {
    throw new ApiError(400, 'Feedback has already been submitted for this request');
  }

  const { rating, comment } = req.body;

  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  if (request.assignedTo) {
    const AdminUser = (await import('../models/AdminUser.js')).default;
    const adminUser = await AdminUser.findById(request.assignedTo);
    if (adminUser) {
      adminUser.feedbacks = adminUser.feedbacks || [];
      adminUser.feedbacks.push({
        userId: req.user._id,
        userName: request.user?.name || req.user.name,
        requestId: request._id,
        serviceName: request.service?.title || 'Unknown Service',
        rating: Number(rating),
        comment,
        createdAt: new Date(),
      });
      await adminUser.save();
    }
  }

  request.feedbackSubmitted = true;
  await request.save();

  return sendResponse(res, 200, true, 'Feedback submitted successfully');
});

// @desc    Cancel a request by user
// @route   PATCH /api/requests/:id/cancel
// @access  Private
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // Ensure user owns request
  if (request.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to cancel this request');
  }

  if (['Completed', 'Rejected', 'Canceled'].includes(request.status)) {
    throw new ApiError(400, 'Cannot cancel a completed, rejected, or already canceled request');
  }

  // Find index of 'Rejected' in timeline or just push it
  request.status = 'Rejected';
  
  request.statusTimeline.push({
    status: 'Rejected',
    changedBy: req.user._id,
    note: 'services canceled by user'
  });

  await request.save();

  return sendResponse(res, 200, true, 'Request cancelled successfully', {
    request
  });
});
