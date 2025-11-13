// ========================
// LOST REPORT ROUTES
// ========================
import express from 'express';
import lostReportController from '../controllers/lostReportController.js';
import { protect, checkBanStatus } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, lostReportController.getAllReports.bind(lostReportController));
router.get('/my-reports', protect, lostReportController.getMyReports.bind(lostReportController));
router.get('/:id', protect, lostReportController.getReportById.bind(lostReportController));

router.post(
  '/',
  protect,
  checkBanStatus,
  lostReportController.createReport.bind(lostReportController)
);

router.put(
  '/:id',
  protect,
  lostReportController.updateReport.bind(lostReportController)
);

router.delete(
  '/:id',
  protect,
  lostReportController.deleteReport.bind(lostReportController)
);

export default router;
