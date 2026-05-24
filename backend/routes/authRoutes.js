import express from 'express';
import { login, register, verifyRegistrationOTP } from '../controllers/authController.js';
import { validateRequiredFields } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/register', validateRequiredFields(['name', 'email', 'password']), register);
router.post('/register/verify', validateRequiredFields(['email', 'otp']), verifyRegistrationOTP);
router.post('/login', validateRequiredFields(['email', 'password']), login);

export default router;
