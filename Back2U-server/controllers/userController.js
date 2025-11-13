// ========================
// USER CONTROLLER
// ========================
import User from '../models/User.js';

class UserController {
  // @desc    Get all users
  // @route   GET /api/users
  // @access  Private (Admin)
  async getAllUsers(req, res, next) {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get user by ID
  // @route   GET /api/users/:id
  // @access  Private
  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user role
  // @route   PUT /api/users/:id/role
  // @access  Private (Admin)
  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Warn user
  // @route   PUT /api/users/:id/warn
  // @access  Private (Admin)
  async warnUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.warnings += 1;
      user.lastWarningDate = Date.now();

      // Ban after 3 warnings
      if (user.warnings >= 3) {
        user.isBanned = true;
        const banDate = new Date();
        banDate.setDate(banDate.getDate() + 30); // 30 days ban
        user.banExpiresAt = banDate;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: user.isBanned
          ? 'User has been banned for 30 days'
          : `User warned (${user.warnings}/3)`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Ban user
  // @route   PUT /api/users/:id/ban
  // @access  Private (Admin)
  async banUser(req, res, next) {
    try {
      const { duration = 30 } = req.body; // Default 30 days

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.isBanned = true;
      const banDate = new Date();
      banDate.setDate(banDate.getDate() + duration);
      user.banExpiresAt = banDate;

      await user.save();

      res.status(200).json({
        success: true,
        message: `User banned for ${duration} days`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Unban user
  // @route   PUT /api/users/:id/unban
  // @access  Private (Admin)
  async unbanUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.isBanned = false;
      user.banExpiresAt = null;
      user.warnings = 0;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'User unbanned successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Delete user
  // @route   DELETE /api/users/:id
  // @access  Private (Admin)
  async deleteUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      await user.deleteOne();

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
