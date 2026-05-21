import mongoose from 'mongoose';

const superadminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['superadmin'],
      default: 'superadmin',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        trim: true,
        default: '',
      },
      country: {
        type: String,
        trim: true,
        default: '',
      },
      zipCode: {
        type: String,
        trim: true,
        default: '',
      },
    },
    resetOTP: { type: String },
    resetOTPExpiry: { type: Date },
    profileImage: {
      type: String,
      default: '',
    },
    profileImagePublicId: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const SuperAdmin = mongoose.model('SuperAdmin', superadminSchema);

export default SuperAdmin;
