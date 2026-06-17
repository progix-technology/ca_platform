import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    durationUnit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months',
    },
    docLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    allowedTiers: {
      type: [String],
      default: [],
    },
    requestLimitPerMonth: {
      type: Number,
      default: -1,
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
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
