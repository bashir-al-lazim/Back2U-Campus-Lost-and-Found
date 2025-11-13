// ========================
// AUTH CONTROLLER
// ========================
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

class AuthController {
  // Generate JWT Token
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  // @desc    Register new user
  // @route   POST /api/auth/register
  // @access  Public
  async register(req, res, next) {
    try {
      const { name, email, password, role, studentId, phone } = req.body;

      // Check if user exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password,
        role: role || 'Student',
        studentId,
        phone,
      });

      // Generate token
      const token = this.generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          avatar: user.avatar,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Login user
  // @route   POST /api/auth/login
  // @access  Public
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
      }

      // Find user and include password
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if banned
      if (user.isCurrentlyBanned()) {
        return res.status(403).json({
          success: false,
          message: `Your account is banned until ${user.banExpiresAt.toLocaleDateString()}`,
        });
      }

      // Generate token
      const token = this.generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          avatar: user.avatar,
          warnings: user.warnings,
          isBanned: user.isBanned,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get current user profile
  // @route   GET /api/auth/me
  // @access  Private
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user._id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user profile
  // @route   PUT /api/auth/profile
  // @access  Private
  async updateProfile(req, res, next) {
    try {
      const { name, phone, avatar } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, avatar },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Change password
  // @route   PUT /api/auth/change-password
  // @access  Private
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id).select('+password');

      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
