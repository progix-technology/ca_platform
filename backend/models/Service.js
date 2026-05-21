import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    documentsRequired: {
      type: [String],
      default: [],
    },
    formSchema: {
      type: Object, // ya mongoose.Schema.Types.Mixed
      default: {},
    },
    planTier: {
      type: String,
      enum: ['basic', 'pro', 'premium'],
      default: 'basic',
    },
  },
  {
    timestamps: true,
  },
);

const Service = mongoose.model('Service', serviceSchema);

export default Service;
