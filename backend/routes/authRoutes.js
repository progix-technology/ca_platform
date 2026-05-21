import express from 'express';
import { login, register } from '../controllers/authController.js';
import { validateRequiredFields } from '../middleware/validateMiddleware.js';

const router = express.Router();

router.post('/register', validateRequiredFields(['name', 'email', 'password']), register);
router.post('/login', validateRequiredFields(['email', 'password']), login);

export default router;
