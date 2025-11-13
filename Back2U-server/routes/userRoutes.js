// ========================
// USER ROUTES
// ========================
import express from 'express';
import userController from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('Admin'));

router.get('/', userController.getAllUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id/role', userController.updateUserRole.bind(userController));
router.put('/:id/warn', userController.warnUser.bind(userController));
router.put('/:id/ban', userController.banUser.bind(userController));
router.put('/:id/unban', userController.unbanUser.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;
