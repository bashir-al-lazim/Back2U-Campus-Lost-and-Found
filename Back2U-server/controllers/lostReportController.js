// ========================
// LOST REPORT CONTROLLER
// ========================
import LostReport from '../models/LostReport.js';

class LostReportController {
  // @desc    Get all lost reports
  // @route   GET /api/lost-reports
  // @access  Private
  async getAllReports(req, res, next) {
    try {
      const { keyword, category, status, page = 1, limit = 12 } = req.query;

      const query = {};

      if (keyword) {
        query.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ];
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      const reports = await LostReport.find(query)
        .populate('reportedBy', 'name email phone avatar')
        .populate('matchedItem', 'title photo location')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      const total = await LostReport.countDocuments(query);

      res.status(200).json({
        success: true,
        data: reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get single lost report
  // @route   GET /api/lost-reports/:id
  // @access  Private
  async getReportById(req, res, next) {
    try {
      const report = await LostReport.findById(req.params.id)
        .populate('reportedBy', 'name email phone avatar')
        .populate('matchedItem', 'title photo location status');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Lost report not found',
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Create lost report
  // @route   POST /api/lost-reports
  // @access  Private
  async createReport(req, res, next) {
    try {
      const {
        title,
        description,
        category,
        attachment,
        lastSeenLocation,
        dateLost,
      } = req.body;

      const report = await LostReport.create({
        title,
        description,
        category,
        attachment,
        lastSeenLocation,
        dateLost,
        reportedBy: req.user._id,
      });

      const populatedReport = await LostReport.findById(report._id).populate(
        'reportedBy',
        'name email phone avatar'
      );

      res.status(201).json({
        success: true,
        message: 'Lost report created successfully',
        data: populatedReport,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update lost report
  // @route   PUT /api/lost-reports/:id
  // @access  Private (Owner)
  async updateReport(req, res, next) {
    try {
      let report = await LostReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Lost report not found',
        });
      }

      if (report.reportedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this report',
        });
      }

      report = await LostReport.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('reportedBy', 'name email phone avatar');

      res.status(200).json({
        success: true,
        message: 'Lost report updated successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Delete lost report
  // @route   DELETE /api/lost-reports/:id
  // @access  Private (Owner/Admin)
  async deleteReport(req, res, next) {
    try {
      const report = await LostReport.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Lost report not found',
        });
      }

      if (
        report.reportedBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'Admin'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this report',
        });
      }

      await report.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Lost report deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user's lost reports
  // @route   GET /api/lost-reports/my-reports
  // @access  Private
  async getMyReports(req, res, next) {
    try {
      const reports = await LostReport.find({ reportedBy: req.user._id })
        .populate('matchedItem', 'title photo location')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new LostReportController();
