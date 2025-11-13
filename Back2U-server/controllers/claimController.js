// ========================
// CLAIM CONTROLLER
// ========================
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';

class ClaimController {
  // @desc    Create new claim
  // @route   POST /api/claims
  // @access  Private (Student)
  async createClaim(req, res, next) {
    try {
      const { itemId, description, proofImage } = req.body;

      // Check if item exists and is open
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }

      if (item.status !== 'Open') {
        return res.status(400).json({
          success: false,
          message: 'This item is not available for claiming',
        });
      }

      // Check if user already has a pending claim for this item
      const existingClaim = await Claim.findOne({
        item: itemId,
        claimant: req.user._id,
        status: 'Pending',
      });

      if (existingClaim) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending claim for this item',
        });
      }

      // Create claim
      const claim = await Claim.create({
        item: itemId,
        claimant: req.user._id,
        description,
        proofImage,
      });

      const populatedClaim = await Claim.findById(claim._id)
        .populate('item', 'title photo category')
        .populate('claimant', 'name email studentId');

      res.status(201).json({
        success: true,
        message: 'Claim submitted successfully',
        data: populatedClaim,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get claims for an item
  // @route   GET /api/claims/item/:itemId
  // @access  Private (Staff/Admin)
  async getClaimsByItem(req, res, next) {
    try {
      const claims = await Claim.find({ item: req.params.itemId })
        .populate('claimant', 'name email studentId phone avatar')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: claims,
        count: claims.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user's claims
  // @route   GET /api/claims/my-claims
  // @access  Private
  async getMyClaims(req, res, next) {
    try {
      const claims = await Claim.find({ claimant: req.user._id })
        .populate('item', 'title photo category location status')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: claims,
        count: claims.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Accept claim
  // @route   PUT /api/claims/:id/accept
  // @access  Private (Staff/Admin)
  async acceptClaim(req, res, next) {
    try {
      const claim = await Claim.findById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
      }

      if (claim.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending claims can be accepted',
        });
      }

      // Update claim
      claim.status = 'Accepted';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = Date.now();
      await claim.save();

      // Update item status
      const item = await Item.findById(claim.item);
      item.status = 'Claimed';
      item.claimedBy = claim.claimant;
      item.acceptedClaim = claim._id;
      await item.save();

      // Reject all other pending claims for this item
      await Claim.updateMany(
        { item: claim.item, status: 'Pending', _id: { $ne: claim._id } },
        { 
          status: 'Rejected',
          reviewedBy: req.user._id,
          reviewedAt: Date.now(),
          rejectionReason: 'Another claim was accepted'
        }
      );

      const populatedClaim = await Claim.findById(claim._id)
        .populate('item', 'title photo category')
        .populate('claimant', 'name email studentId phone')
        .populate('reviewedBy', 'name email');

      res.status(200).json({
        success: true,
        message: 'Claim accepted successfully',
        data: populatedClaim,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Reject claim
  // @route   PUT /api/claims/:id/reject
  // @access  Private (Staff/Admin)
  async rejectClaim(req, res, next) {
    try {
      const { rejectionReason } = req.body;
      const claim = await Claim.findById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
      }

      if (claim.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending claims can be rejected',
        });
      }

      claim.status = 'Rejected';
      claim.reviewedBy = req.user._id;
      claim.reviewedAt = Date.now();
      claim.rejectionReason = rejectionReason;
      await claim.save();

      const populatedClaim = await Claim.findById(claim._id)
        .populate('item', 'title photo category')
        .populate('claimant', 'name email studentId')
        .populate('reviewedBy', 'name email');

      res.status(200).json({
        success: true,
        message: 'Claim rejected',
        data: populatedClaim,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Cancel claim
  // @route   PUT /api/claims/:id/cancel
  // @access  Private (Claimant)
  async cancelClaim(req, res, next) {
    try {
      const claim = await Claim.findById(req.params.id);

      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found',
        });
      }

      // Check ownership
      if (claim.claimant.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this claim',
        });
      }

      if (claim.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending claims can be canceled',
        });
      }

      claim.status = 'Canceled';
      await claim.save();

      res.status(200).json({
        success: true,
        message: 'Claim canceled successfully',
        data: claim,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ClaimController();
