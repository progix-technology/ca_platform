import express from 'express';
import {
	deleteMyDocument,
	getAllUsers,
	getMyDocuments,
	getMyProfile,
	updateMyProfile,
	uploadMyDocuments,
	updateUserRole,
	createAdminUser,
	assignWorkToAdmin,
	revokeWorkAssignment,
	deleteUserById,
	updateAdminSettings,
	changeAdminPassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly, superAdminOnly } from '../middleware/adminMiddleware.js';
import { uploadDocuments } from '../middleware/uploadMiddleware.js';
import { forgotPassword} from '../controllers/authController.js';
import { verifyOTP, resetPassword } from '../controllers/authController.js';



const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.put('/me/settings', protect, adminOnly, updateAdminSettings);
router.put('/me/change-password', protect, adminOnly, changeAdminPassword);
router.get('/me/documents', protect, getMyDocuments);
router.post('/me/documents', protect, uploadDocuments.array('documents', 10), uploadMyDocuments);
router.delete('/me/documents/:documentId', protect, deleteMyDocument);

router.get('/', protect, adminOnly, getAllUsers);
router.post('/create-admin', protect, superAdminOnly, createAdminUser);
router.put('/:id/role', protect, superAdminOnly, updateUserRole);
router.put('/:id/assign-work', protect, superAdminOnly, assignWorkToAdmin);
router.put('/:id/revoke-work', protect, superAdminOnly, revokeWorkAssignment);
router.delete('/:id', protect, superAdminOnly, deleteUserById);

router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);


export default router;
