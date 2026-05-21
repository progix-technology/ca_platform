import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
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
      enum: ['user'],
      default: 'user',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    nicCode: {
      type: String,
      trim: true,
      default: '',
    },
    paidUpCapital: {
      type: String,
      trim: true,
      default: '',
    },
    authorizedCapital: {
      type: String,
      trim: true,
      default: '',
    },
    incorporationDate: {
      type: String,
      trim: true,
      default: '',
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },
    panCompliance: {
      type: String,
      trim: true,
      default: '',
    },
    cin: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    tan: {
      type: String,
      trim: true,
      default: '',
    },
    pfRegistration: {
      type: String,
      trim: true,
      default: '',
    },
    esiRegistration: {
      type: String,
      trim: true,
      default: '',
    },
    rocFilingStatus: {
      type: String,
      trim: true,
      default: '',
    },
    auditStatus: {
      type: String,
      trim: true,
      default: '',
    },
    annualReturnStatus: {
      type: String,
      trim: true,
      default: '',
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    profileImagePublicId: {
      type: String,
      default: '',
    },
    savedDocuments: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          url: { type: String, required: true, trim: true },
          mimeType: { type: String, default: '' },
          size: { type: Number, default: 0 },
          uploadedAt: { type: Date, default: Date.now },
          cloudinaryPublicId: { type: String, default: '' },
          cloudinaryResourceType: { type: String, default: 'raw' },
        },
      ],
      default: [],
    },
    resetOTP: { type: String },
    resetOTPExpiry: { type: Date },
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
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', userSchema);

export default User;
