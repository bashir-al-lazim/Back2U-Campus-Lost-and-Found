// ========================
// ITEM CONTROLLER
// ========================
import Item from '../models/Item.js';
import Claim from '../models/Claim.js';

class ItemController {
  // @desc    Get all items with filters
  // @route   GET /api/items
  // @access  Private
  async getAllItems(req, res, next) {
    try {
      const {
        keyword,
        category,
        status,
        dateFrom,
        dateTo,
        page = 1,
        limit = 12,
      } = req.query;

      // Build query
      const query = {};

      // Keyword search (title or description)
      if (keyword) {
        query.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ];
      }

      // Category filter
      if (category && category !== 'All') {
        query.category = category;
      }

      // Status filter
      if (status && status !== 'All') {
        query.status = status;
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query.dateFound = {};
        if (dateFrom) {
          query.dateFound.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          query.dateFound.$lte = endDate;
        }
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Execute query
      const items = await Item.find(query)
        .populate('postedBy', 'name email role avatar')
        .populate('claimedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      // Get total count
      const total = await Item.countDocuments(query);

      res.status(200).json({
        success: true,
        data: items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get single item by ID
  // @route   GET /api/items/:id
  // @access  Private
  async getItemById(req, res, next) {
    try {
      const item = await Item.findById(req.params.id)
        .populate('postedBy', 'name email role avatar phone')
        .populate('claimedBy', 'name email phone')
        .populate({
          path: 'acceptedClaim',
          populate: { path: 'claimant', select: 'name email' },
        });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Create new item
  // @route   POST /api/items
  // @access  Private (Staff/Admin)
  async createItem(req, res, next) {
    try {
      const { title, description, category, photo, location, dateFound } = req.body;

      const item = await Item.create({
        title,
        description,
        category,
        photo,
        location,
        dateFound,
        postedBy: req.user._id,
      });

      const populatedItem = await Item.findById(item._id).populate(
        'postedBy',
        'name email role avatar'
      );

      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: populatedItem,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update item
  // @route   PUT /api/items/:id
  // @access  Private (Staff/Admin or Owner)
  async updateItem(req, res, next) {
    try {
      let item = await Item.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }

      // Check ownership or admin/staff
      if (
        item.postedBy.toString() !== req.user._id.toString() &&
        req.user.role === 'Student'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this item',
        });
      }

      const { title, description, category, photo, location, dateFound, status } = req.body;

      item = await Item.findByIdAndUpdate(
        req.params.id,
        { title, description, category, photo, location, dateFound, status },
        { new: true, runValidators: true }
      ).populate('postedBy', 'name email role avatar');

      res.status(200).json({
        success: true,
        message: 'Item updated successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Delete item
  // @route   DELETE /api/items/:id
  // @access  Private (Admin or Owner)
  async deleteItem(req, res, next) {
    try {
      const item = await Item.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }

      // Check ownership or admin
      if (
        item.postedBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'Admin'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this item',
        });
      }

      await item.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get items posted by user
  // @route   GET /api/items/user/:userId
  // @access  Private
  async getItemsByUser(req, res, next) {
    try {
      const items = await Item.find({ postedBy: req.params.userId })
        .populate('postedBy', 'name email role avatar')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ItemController();
