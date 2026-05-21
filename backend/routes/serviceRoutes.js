import express from 'express';
import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  updateService,
} from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { validateRequiredFields } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);

router.post(
  '/',
  protect,
  adminOnly,
  validateRequiredFields(['title', 'description', 'price', 'category']),
  createService,
);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

export default router;
