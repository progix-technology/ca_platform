import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    durationUnit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months',
    },
    features: {
      type: [String],
      default: [],
    },
    leadPriorityLevel: {
      type: Number,
      default: 0,
    },
    hasAdvancedAnalytics: {
      type: Boolean,
      default: false,
    },
    maxRequests: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
