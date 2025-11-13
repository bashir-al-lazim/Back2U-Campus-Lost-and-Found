// ========================
// AUTH ROUTES
// ========================
import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/me', protect, authController.getMe.bind(authController));
router.put('/profile', protect, authController.updateProfile.bind(authController));
router.put('/change-password', protect, authController.changePassword.bind(authController));

export default router;
