// ========================
// CLAIM ROUTES
// ========================
import express from 'express';
import claimController from '../controllers/claimController.js';
import { protect, authorize, checkBanStatus } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post(
  '/',
  protect,
  checkBanStatus,
  claimController.createClaim.bind(claimController)
);

router.get(
  '/my-claims',
  protect,
  claimController.getMyClaims.bind(claimController)
);

router.put(
  '/:id/cancel',
  protect,
  claimController.cancelClaim.bind(claimController)
);

// Staff/Admin routes
router.get(
  '/item/:itemId',
  protect,
  authorize('Staff', 'Admin'),
  claimController.getClaimsByItem.bind(claimController)
);

router.put(
  '/:id/accept',
  protect,
  authorize('Staff', 'Admin'),
  claimController.acceptClaim.bind(claimController)
);

router.put(
  '/:id/reject',
  protect,
  authorize('Staff', 'Admin'),
  claimController.rejectClaim.bind(claimController)
);

export default router;
