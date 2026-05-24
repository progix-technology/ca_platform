import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import PendingRegistration from '../models/PendingRegistration.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { sendEmail } from '../utils/email.js';


const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedName || normalizedName.length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters long');
  }

  

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  const existingAdmin = await AdminUser.findOne({ email: normalizedEmail });
  const existingSuperAdmin = await SuperAdmin.findOne({ email: normalizedEmail });

  if (existingUser || existingAdmin || existingSuperAdmin) {
    throw new ApiError(400, 'Email is already registered');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  let pending = await PendingRegistration.findOne({ email: normalizedEmail });

  if (!pending) {
    pending = new PendingRegistration({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });
  } else {
    pending.name = normalizedName;
    pending.password = hashedPassword;
    pending.otp = otp;
    pending.otpExpiry = Date.now() + 10 * 60 * 1000;
  }

  await pending.save();

  try {
    await sendEmail(
      normalizedEmail,
      'Verify your email for TaxEasePro',
      `Your verification code is: ${otp}`,
    );
  } catch (error) {
    console.error('EMAIL ERROR:', error);
    throw new ApiError(500, 'Failed to send verification email');
  }

  return sendResponse(res, 200, true, 'OTP sent to your email. Verify to complete registration.');
});

export const verifyRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const pending = await PendingRegistration.findOne({ email: normalizedEmail });
  if (!pending) {
    throw new ApiError(400, 'No pending registration found for this email');
  }

  if (pending.otp !== String(otp) || pending.otpExpiry < Date.now()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  const existingAdmin = await AdminUser.findOne({ email: normalizedEmail });
  const existingSuperAdmin = await SuperAdmin.findOne({ email: normalizedEmail });

  if (existingUser || existingAdmin || existingSuperAdmin) {
    await pending.deleteOne();
    throw new ApiError(400, 'Email is already registered');
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    role: 'user',
  });

  await pending.deleteOne();

  const token = generateToken(user);

  return sendResponse(res, 200, true, 'Registration completed successfully', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  // Check in User collection first
  let user = await User.findOne({ email: normalizedEmail });
  let userRole = 'user';

  // If not found in User collection, check SuperAdmin collection
  if (!user) {
    user = await SuperAdmin.findOne({ email: normalizedEmail });
    if (user) {
      userRole = 'superadmin';
    }
  }

  // If not found in SuperAdmin, check Admin collection
  if (!user) {
    user = await AdminUser.findOne({ email: normalizedEmail });
    if (user) {
      userRole = user.role; // admin
    }
  }

  if (!user) {
    throw new ApiError(401, 'Email not registered');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(401, 'Incorrect password');
  }

  const token = generateToken(user);

  return sendResponse(res, 200, true, 'Login successful', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || userRole,
      adminAssigned: (user.role || userRole) === 'admin' || (user.role || userRole) === 'superadmin' ? true : (user.adminAssigned || false),
    },
  });
});


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Check in User collection first
  let user = await User.findOne({ email });
  
  // If not found, check SuperAdmin collection
  if (!user) {
    user = await SuperAdmin.findOne({ email });
  }
  
  // If not found, check Admin collection
  if (!user) {
    user = await AdminUser.findOne({ email });
  }
  
  if (!user) throw new ApiError(404, 'User not found');

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = otp;
  user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 min expiry
  await user.save();

  // Send OTP via email (implement sendEmail utility)
  try {
    await sendEmail(user.email, 'Your OTP Code', `Your OTP is: ${otp}`);
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw new ApiError(500, 'Email service failed');
  }

  return sendResponse(res, 200, true, 'OTP sent to your email');
});


export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Check in User collection first
  let user = await User.findOne({ email: email.trim().toLowerCase() });
  
  // If not found, check SuperAdmin collection
  if (!user) {
    user = await SuperAdmin.findOne({ email: email.trim().toLowerCase() });
  }
  
  // If not found, check Admin collection
  if (!user) {
    user = await AdminUser.findOne({ email: email.trim().toLowerCase() });
  }

  if (!user) throw new ApiError(404, 'User not found');
  console.log("DB OTP:", user.resetOTP);
  console.log("Entered OTP:", otp);

  if (
    user.resetOTP !== String(otp) ||
    user.resetOTPExpiry < Date.now()
  ) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  return sendResponse(res, 200, true, 'OTP verified');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Check in User collection first
  let user = await User.findOne({
    email: email.trim().toLowerCase()
  });
  
  // If not found, check SuperAdmin collection
  if (!user) {
    user = await SuperAdmin.findOne({
      email: email.trim().toLowerCase()
    });
  }
  
  // If not found, check Admin collection
  if (!user) {
    user = await AdminUser.findOne({
      email: email.trim().toLowerCase()
    });
  }

  if (!user) throw new ApiError(404, 'User not found');

  if (
    user.resetOTP !== String(otp) ||
    user.resetOTPExpiry < Date.now()
  ) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // ✅ HASH PASSWORD HERE
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;

  await user.save();

  return sendResponse(res, 200, true, 'Password reset successful');
});