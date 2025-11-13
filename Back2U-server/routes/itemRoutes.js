// ========================
// ITEM ROUTES
// ========================
import express from 'express';
import itemController from '../controllers/itemController.js';
import { protect, authorize, checkBanStatus } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', itemController.getAllItems.bind(itemController));
router.get('/:id', itemController.getItemById.bind(itemController));
router.get('/user/:userId', itemController.getItemsByUser.bind(itemController));

// Staff/Admin routes (protected)
router.post(
  '/',
  protect,
  authorize('Staff', 'Admin'),
  checkBanStatus,
  itemController.createItem.bind(itemController)
);

router.put(
  '/:id',
  protect,
  authorize('Staff', 'Admin'),
  itemController.updateItem.bind(itemController)
);

router.delete(
  '/:id',
  protect,
  authorize('Staff', 'Admin'),
  itemController.deleteItem.bind(itemController)
);

export default router;
