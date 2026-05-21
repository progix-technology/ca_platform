import mongoose from 'mongoose';

const WORKFLOW_STATUSES = ['Submitted', 'In Review', 'Approved', 'Action Needed', 'Paid', 'In Progress', 'Filed', 'Completed', 'Renewed', 'Rejected', 'Renewal Requested', 'Service Renewing'];
const LEGACY_STATUSES = ['Pending', 'Need More Info'];

const requestStatusTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [...WORKFLOW_STATUSES, ...LEGACY_STATUSES],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    documents: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const requestCommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
    status: {
      type: String,
      enum: [...WORKFLOW_STATUSES, ...LEGACY_STATUSES],
      default: 'Submitted',
    },
    reviewMessage: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    archivedByAdmin: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    payment: {
      method: {
        type: String,
        enum: ['card', 'upi', ''],
        default: '',
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },
    documents: {
      type: [mongoose.Schema.Types.Mixed], // allow string or {name, url} object
      default: [],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    statusTimeline: {
      type: [requestStatusTimelineSchema],
      default: [],
    },
    comments: {
      type: [requestCommentSchema],
      default: [],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    renewalRequested: {
      type: Boolean,
      default: false,
    },
    expiryReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Request = mongoose.model('Request', requestSchema);

export default Request;
