import express from 'express';
import {
  addRequestComment,
  archiveCompletedRequest,
  completeRequestPayment,
  createRequest,
  deleteRequest,
  deleteRequestComment,
  exportRequestData,
  getAllRequests,
  getArchivedCompletedRequests,
  getRequestById,
  getMyRequests,
  renewRequest,
  updateRequestComment,
  updateRequestStatus,
  acquireRequest,
  respondToAcquisition,
  updateRequestPrice,
  submitFeedback,
  cancelRequest,
} from '../controllers/requestController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { uploadDocuments } from '../middleware/uploadMiddleware.js';
import { validateRequiredFields } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  uploadDocuments.array('documents', 10),
  createRequest,
);
router.get('/my', protect, getMyRequests);
router.get('/archived/completed', protect, getArchivedCompletedRequests);
router.get('/:id/export', protect, exportRequestData);
router.get('/:id', protect, getRequestById);
router.delete('/:id', protect, deleteRequest);
router.post('/:id/comments', protect, validateRequiredFields(['text']), addRequestComment);
router.patch('/:id/comments/:commentId', protect, validateRequiredFields(['text']), updateRequestComment);
router.delete('/:id/comments/:commentId', protect, deleteRequestComment);
router.patch('/:id/pay', protect, completeRequestPayment);
router.patch('/:id/renew', protect, renewRequest);
router.patch('/:id/cancel', protect, cancelRequest);
router.patch('/:id/archive-completed', protect, adminOnly, archiveCompletedRequest);

router.post('/:id/feedback', protect, validateRequiredFields(['rating', 'comment']), submitFeedback);

router.post('/:id/acquire-response', protect, respondToAcquisition);

router.get('/', protect, adminOnly, getAllRequests);
router.post('/:id/acquire', protect, adminOnly, acquireRequest);
router.patch('/:id/update-price', protect, adminOnly, updateRequestPrice);
router.put(
  '/:id',
  protect,
  adminOnly,
  uploadDocuments.array('files', 10), // Accept up to 10 deliverable files
  validateRequiredFields(['status']),
  updateRequestStatus
);

export default router;
