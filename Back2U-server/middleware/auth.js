// ========================
// AUTHENTICATION MIDDLEWARE
// ========================
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is banned
    if (req.user.isCurrentlyBanned()) {
      return res.status(403).json({
        success: false,
        message: `Your account is banned until ${req.user.banExpiresAt.toLocaleDateString()}`,
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user can post/claim (not banned)
export const checkBanStatus = (req, res, next) => {
  if (req.user.isBanned) {
    return res.status(403).json({
      success: false,
      message: 'You are banned and cannot perform this action',
    });
  }
  next();
};
