import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Plan from '../models/Plan.js';
import Request from '../models/Request.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import {
  deleteAssetFromCloudinary,
  deleteImageFromCloudinary,
  uploadDocumentToCloudinary,
  uploadImageToCloudinary,
} from '../config/cloudinary.js';

const formatSavedDocuments = (docs = []) => (docs || []).map((doc) => ({
  id: doc._id,
  name: doc.name,
  url: doc.url,
  mimeType: doc.mimeType || '',
  size: doc.size || 0,
  uploadedAt: doc.uploadedAt || null,
  cloudinaryPublicId: doc.cloudinaryPublicId || '',
  cloudinaryResourceType: doc.cloudinaryResourceType || 'raw',
}));

const formatUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  adminAssigned: Boolean(userDoc.adminAssigned),
  phone: userDoc.phone || '',
  pan: userDoc.pan || '',
  companyName: userDoc.companyName || '',
  nicCode: userDoc.nicCode || '',
  paidUpCapital: userDoc.paidUpCapital || '',
  authorizedCapital: userDoc.authorizedCapital || '',
  incorporationDate: userDoc.incorporationDate || '',
  registrationNumber: userDoc.registrationNumber || '',
  panCompliance: userDoc.panCompliance || '',
  cin: userDoc.cin || '',
  gstin: userDoc.gstin || '',
  tan: userDoc.tan || '',
  pfRegistration: userDoc.pfRegistration || '',
  esiRegistration: userDoc.esiRegistration || '',
  rocFilingStatus: userDoc.rocFilingStatus || '',
  auditStatus: userDoc.auditStatus || '',
  annualReturnStatus: userDoc.annualReturnStatus || '',
  notificationsEnabled: userDoc.notificationsEnabled !== false,
  profileImage: userDoc.profileImage || '',
  profileImagePublicId: userDoc.profileImagePublicId || '',
  feedbacks: userDoc.feedbacks || [],
  savedDocuments: formatSavedDocuments(userDoc.savedDocuments),
  address: {
    street: userDoc.address?.street || '',
    city: userDoc.address?.city || '',
    country: userDoc.address?.country || '',
    zipCode: userDoc.address?.zipCode || '',
  },
  subscription: userDoc.subscription || null,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

export const getMyProfile = asyncHandler(async (req, res) => {
  return sendResponse(res, 200, true, 'Profile fetched successfully', {
    user: formatUser(req.user),
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    pan,
    profileImage,
    address,
    street,
    city,
    country,
    zipCode,
    companyName,
    nicCode,
    paidUpCapital,
    authorizedCapital,
    incorporationDate,
    registrationNumber,
    panCompliance,
    cin,
    gstin,
    tan,
    pfRegistration,
    esiRegistration,
    rocFilingStatus,
    auditStatus,
    annualReturnStatus,
    notificationsEnabled,
  } = req.body;

  // Determine which model to use based on user role
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

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    if (normalizedName.length < 2) {
      throw new ApiError(400, 'Name must be at least 2 characters long');
    }
    user.name = normalizedName;
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    // Check all three collections for duplicate email
    const existingUserEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    const existingAdminEmail = await AdminUser.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    const existingSuperAdminEmail = await SuperAdmin.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUserEmail || existingAdminEmail || existingSuperAdminEmail) {
      throw new ApiError(400, 'Email is already in use');
    }

    user.email = normalizedEmail;
  }

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (pan !== undefined) {
    user.pan = String(pan).trim().toUpperCase();
  }

  if (companyName !== undefined) {
    user.companyName = String(companyName).trim();
  }

  if (nicCode !== undefined) {
    user.nicCode = String(nicCode).trim();
  }

  if (paidUpCapital !== undefined) {
    user.paidUpCapital = String(paidUpCapital).trim();
  }

  if (authorizedCapital !== undefined) {
    user.authorizedCapital = String(authorizedCapital).trim();
  }

  if (incorporationDate !== undefined) {
    user.incorporationDate = String(incorporationDate).trim();
  }

  if (registrationNumber !== undefined) {
    user.registrationNumber = String(registrationNumber).trim();
  }

  if (panCompliance !== undefined) {
    user.panCompliance = String(panCompliance).trim();
  }

  if (cin !== undefined) {
    user.cin = String(cin).trim();
  }

  if (gstin !== undefined) {
    user.gstin = String(gstin).trim();
  }

  if (tan !== undefined) {
    user.tan = String(tan).trim();
  }

  if (pfRegistration !== undefined) {
    user.pfRegistration = String(pfRegistration).trim();
  }

  if (esiRegistration !== undefined) {
    user.esiRegistration = String(esiRegistration).trim();
  }

  if (rocFilingStatus !== undefined) {
    user.rocFilingStatus = String(rocFilingStatus).trim();
  }

  if (auditStatus !== undefined) {
    user.auditStatus = String(auditStatus).trim();
  }

  if (annualReturnStatus !== undefined) {
    user.annualReturnStatus = String(annualReturnStatus).trim();
  }

  if (notificationsEnabled !== undefined) {
    user.notificationsEnabled = Boolean(notificationsEnabled);
  }

  if (profileImage !== undefined) {
    const nextProfileImage = String(profileImage || '').trim();

    if (!nextProfileImage) {
      if (user.profileImagePublicId) {
        await deleteImageFromCloudinary(user.profileImagePublicId);
      }

      user.profileImage = '';
      user.profileImagePublicId = '';
    } else if (/^data:image\/[a-zA-Z+]+;base64,/.test(nextProfileImage)) {
      try {
        const uploadResult = await uploadImageToCloudinary(nextProfileImage, {
          public_id: `user_${user._id}_${Date.now()}`,
        });

        if (user.profileImagePublicId) {
          await deleteImageFromCloudinary(user.profileImagePublicId);
        }

        user.profileImage = uploadResult.secure_url;
        user.profileImagePublicId = uploadResult.public_id;
      } catch (error) {
        throw new ApiError(500, error.message || 'Failed to upload image to Cloudinary');
      }
    } else {
      throw new ApiError(400, 'Invalid image format. Please upload a valid image file.');
    }
  }

  const incomingAddress = {
    ...(address && typeof address === 'object' ? address : {}),
    ...(street !== undefined ? { street } : {}),
    ...(city !== undefined ? { city } : {}),
    ...(country !== undefined ? { country } : {}),
    ...(zipCode !== undefined ? { zipCode } : {}),
  };

  if (Object.keys(incomingAddress).length > 0) {
    user.address = {
      ...user.address,
      ...(incomingAddress.street !== undefined ? { street: String(incomingAddress.street).trim() } : {}),
      ...(incomingAddress.city !== undefined ? { city: String(incomingAddress.city).trim() } : {}),
      ...(incomingAddress.country !== undefined ? { country: String(incomingAddress.country).trim() } : {}),
      ...(incomingAddress.zipCode !== undefined ? { zipCode: String(incomingAddress.zipCode).trim() } : {}),
    };
  }

  if (req.file) {
    if (user.profileImagePublicId) {
      await deleteImageFromCloudinary(user.profileImagePublicId);
    }
    const uploadResult = await uploadImageToCloudinary(req.file.path);
    user.profileImage = uploadResult.secure_url;
    user.profileImagePublicId = uploadResult.public_id;
  } else if (profileImage === null) {
    if (user.profileImagePublicId) {
      await deleteImageFromCloudinary(user.profileImagePublicId);
    }
    user.profileImage = '';
    user.profileImagePublicId = '';
  }

  await user.save();

  return sendResponse(res, 200, true, 'Profile updated successfully', {
    user: formatUser(user),
  });
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const { name, phone, adminAssigned, address, street, city, country, zipCode, profileImage } = req.body;
  const adminId = req.user._id;

  const admin = await AdminUser.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  if (name !== undefined) {
    admin.name = name;
  }

  if (phone !== undefined) {
    admin.phone = phone;
  }

  if (adminAssigned !== undefined) {
    admin.adminAssigned = adminAssigned;
  }

  if (profileImage !== undefined) {
    const nextProfileImage = String(profileImage || '').trim();

    if (!nextProfileImage) {
      if (admin.profileImagePublicId) {
        await deleteImageFromCloudinary(admin.profileImagePublicId);
      }

      admin.profileImage = '';
      admin.profileImagePublicId = '';
    } else if (/^data:image\/[a-zA-Z+]+;base64,/.test(nextProfileImage)) {
      try {
        const uploadResult = await uploadImageToCloudinary(nextProfileImage, {
          public_id: `user_${admin._id}_${Date.now()}`,
        });

        if (admin.profileImagePublicId) {
          await deleteImageFromCloudinary(admin.profileImagePublicId);
        }

        admin.profileImage = uploadResult.secure_url;
        admin.profileImagePublicId = uploadResult.public_id;
      } catch (error) {
        throw new ApiError(500, error.message || 'Failed to upload image to Cloudinary');
      }
    } else {
      throw new ApiError(400, 'Invalid image format. Please upload a valid image file.');
    }
  }

  const incomingAddress = {
    ...(address && typeof address === 'object' ? address : {}),
    ...(street !== undefined ? { street } : {}),
    ...(city !== undefined ? { city } : {}),
    ...(country !== undefined ? { country } : {}),
    ...(zipCode !== undefined ? { zipCode } : {}),
  };

  if (Object.keys(incomingAddress).length > 0) {
    admin.address = {
      ...admin.address,
      ...(incomingAddress.street !== undefined ? { street: String(incomingAddress.street).trim() } : {}),
      ...(incomingAddress.city !== undefined ? { city: String(incomingAddress.city).trim() } : {}),
      ...(incomingAddress.country !== undefined ? { country: String(incomingAddress.country).trim() } : {}),
      ...(incomingAddress.zipCode !== undefined ? { zipCode: String(incomingAddress.zipCode).trim() } : {}),
    };
  }

  await admin.save();

  return sendResponse(res, 200, true, 'Settings updated successfully', {
    admin: formatUser(admin),
  });
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.user._id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new passwords');
  }

  const admin = await AdminUser.findById(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid current password');
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters long');
  }

  admin.password = await bcrypt.hash(newPassword, 12);
  await admin.save();

  return sendResponse(res, 200, true, 'Password changed successfully');
});

export const getMyDocuments = asyncHandler(async (req, res) => {
  // Determine which model to use based on user role
  let UserModel = User;
  if (req.user.role === 'admin') {
    UserModel = AdminUser;
  } else if (req.user.role === 'superadmin') {
    UserModel = SuperAdmin;
  }
  
  const user = await UserModel.findById(req.user._id).select('savedDocuments');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sendResponse(res, 200, true, 'Saved documents fetched successfully', {
    items: formatSavedDocuments(user.savedDocuments),
  });
});

export const uploadMyDocuments = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    throw new ApiError(400, 'At least one document is required');
  }

  // Determine which model to use based on user role
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

  const documentNames = Array.isArray(req.body.documentNames)
    ? req.body.documentNames
    : typeof req.body.documentNames === 'string'
      ? [req.body.documentNames]
      : [];

  const uploadedDocs = files.map((file, index) => {
    return {
      name: documentNames[index] ? String(documentNames[index]).trim() : file.originalname,
      url: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      cloudinaryPublicId: file.filename || '',
      cloudinaryResourceType: 'auto',
    };
  });

  user.savedDocuments = [...(user.savedDocuments || []), ...uploadedDocs];
  await user.save();

  return sendResponse(res, 201, true, 'Documents uploaded successfully', {
    items: formatSavedDocuments(user.savedDocuments),
  });
});

export const deleteMyDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const targetDoc = user.savedDocuments.find((doc) => String(doc._id) === String(documentId));
  if (!targetDoc) {
    throw new ApiError(404, 'Document not found');
  }

  if (targetDoc.cloudinaryPublicId) {
    await deleteAssetFromCloudinary(
      targetDoc.cloudinaryPublicId,
      targetDoc.cloudinaryResourceType || 'raw',
    );
  }

  user.savedDocuments = user.savedDocuments.filter((doc) => String(doc._id) !== String(documentId));
  await user.save();

  return sendResponse(res, 200, true, 'Document removed successfully', {
    items: formatSavedDocuments(user.savedDocuments),
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  let regularUsers = [];

  if (req.user.role === 'superadmin') {
    // Get all regular users
    regularUsers = await User.find({}).select('-password').sort({ createdAt: -1 });
  } else if (req.user.role === 'admin') {
    // Find all distinct user IDs from requests assigned to this admin
    const distinctUserIds = await Request.distinct('user', { assignedTo: req.user._id });
    regularUsers = await User.find({ _id: { $in: distinctUserIds } }).select('-password').sort({ createdAt: -1 });
  }

  // Get all admins
  const admins = await AdminUser.find({}).select('-password').sort({ createdAt: -1 });
  
  // Get superadmin
  const superadmins = await SuperAdmin.find({}).select('-password').sort({ createdAt: -1 });

  const requestCounts = await Request.aggregate([
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
      },
    },
  ]);

  const requestCountMap = new Map(
    requestCounts.map((item) => [String(item._id), item.count]),
  );

  // Format regular users
  const enrichedRegularUsers = regularUsers.map((userDoc) => ({
    ...formatUser(userDoc),
    role: 'user',
    requestCount: requestCountMap.get(String(userDoc._id)) || 0,
    status: 'active',
  }));

  // Format admins
  const enrichedAdmins = admins.map((adminDoc) => ({
    ...formatUser(adminDoc),
    requestCount: requestCountMap.get(String(adminDoc._id)) || 0,
    status: 'active',
  }));

  // Format superadmins
  const enrichedSuperadmins = superadmins.map((superadminDoc) => ({
    ...formatUser(superadminDoc),
    role: 'superadmin',
    requestCount: requestCountMap.get(String(superadminDoc._id)) || 0,
    status: 'active',
  }));

  // Combine and sort by createdAt
  const allUsers = [...enrichedRegularUsers, ...enrichedAdmins, ...enrichedSuperadmins].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return sendResponse(res, 200, true, 'Users fetched successfully', {
    items: allUsers,
  });
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    pan,
    address,
    street,
    city,
    country,
    zipCode,
  } = req.body;

  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedName || normalizedName.length < 2) {
    throw new ApiError(400, 'Name must be at least 2 characters long');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  if (!password || String(password).length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  // Check both User and Admin collections
  const existingUser = await User.findOne({ email: normalizedEmail });
  const existingAdmin = await AdminUser.findOne({ email: normalizedEmail });

  if (existingUser || existingAdmin) {
    throw new ApiError(400, 'User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);

  const newAdmin = await AdminUser.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'admin',
    adminAssigned: true,
    phone: phone ? String(phone).trim() : '',
    pan: pan ? String(pan).trim().toUpperCase() : '',
    address: {
      street: street ? String(street).trim() : '',
      city: city ? String(city).trim() : '',
      country: country ? String(country).trim() : '',
      zipCode: zipCode ? String(zipCode).trim() : '',
      ...(address && typeof address === 'object' ? address : {}),
    },
  });

  return sendResponse(res, 201, true, 'Admin user created successfully', {
    user: formatUser(newAdmin),
  });
});

export const assignWorkToAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const userToAssign = await User.findById(id);
  if (!userToAssign) {
    throw new ApiError(404, 'User not found');
  }

  if (userToAssign.role !== 'admin') {
    throw new ApiError(400, 'Only admin users can be assigned work');
  }

  userToAssign.adminAssigned = true;
  await userToAssign.save();

  return sendResponse(res, 200, true, 'Admin work assigned successfully', {
    user: formatUser(userToAssign),
  });
});

export const revokeWorkAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const userToRevoke = await User.findById(id);
  if (!userToRevoke) {
    throw new ApiError(404, 'User not found');
  }

  if (userToRevoke.role !== 'admin') {
    throw new ApiError(400, 'Only admin users can have work revoked');
  }

  userToRevoke.adminAssigned = false;
  await userToRevoke.save();

  return sendResponse(res, 200, true, 'Admin work assignment revoked successfully', {
    user: formatUser(userToRevoke),
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    throw new ApiError(400, 'Role must be either user or admin');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const userToUpdate = await User.findById(id);
  if (!userToUpdate) {
    throw new ApiError(404, 'User not found');
  }

  if (role === 'admin' && userToUpdate.role === 'user') {
    throw new ApiError(400, 'Admin accounts must be created via the Super Admin dashboard, not by promoting existing users.');
  }

  userToUpdate.role = role;
  await userToUpdate.save();

  return sendResponse(res, 200, true, 'User role updated successfully', {
    user: formatUser(userToUpdate),
  });
});

export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  // Try to find in User collection first
  let userToDelete = await User.findById(id);

  // If not found, try AdminUser collection
  if (!userToDelete) {
    userToDelete = await AdminUser.findById(id);
  }

  // If not found, try SuperAdmin collection
  if (!userToDelete) {
    userToDelete = await SuperAdmin.findById(id);
  }

  if (!userToDelete) {
    throw new ApiError(404, 'User not found');
  }

  if (String(userToDelete._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }

  await userToDelete.deleteOne();

  return sendResponse(res, 200, true, 'User deleted successfully', {
    userId: String(userToDelete._id),
  });
});

