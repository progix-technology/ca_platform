import express from 'express';
import { getAllPlans, createPlan, updatePlan, deletePlan, purchasePlan, checkSubscriptionStatus, assignPlanToAdmin, revokePlanFromAdmin, getAdminSubscription } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { superAdminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes
router.get('/plans', getAllPlans);

// Protected routes
router.use(protect);
router.post('/purchase', purchasePlan);
router.get('/status', checkSubscriptionStatus);
router.get('/admin/subscription', getAdminSubscription);

// Admin routes
router.post('/plans', adminOnly, createPlan);
router.put('/plans/:id', adminOnly, updatePlan);
router.delete('/plans/:id', adminOnly, deletePlan);

// Superadmin routes
router.post('/admin/:adminId/assign-plan', superAdminOnly, assignPlanToAdmin);
router.post('/admin/:adminId/revoke-plan', superAdminOnly, revokePlanFromAdmin);

export default router;
