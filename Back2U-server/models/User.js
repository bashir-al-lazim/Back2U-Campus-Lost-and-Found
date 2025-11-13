// ========================
// USER MODEL
// ========================
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['Student', 'Staff', 'Admin'],
      default: 'Student',
    },
    studentId: {
      type: String,
      sparse: true,
    },
    phone: {
      type: String,
    },
    avatar: {
      type: String,
      default: '',
    },
    warnings: {
      type: Number,
      default: 0,
      max: 3,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banExpiresAt: {
      type: Date,
      default: null,
    },
    lastWarningDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is currently banned
userSchema.methods.isCurrentlyBanned = function () {
  if (!this.isBanned) return false;
  if (this.banExpiresAt && this.banExpiresAt < new Date()) {
    this.isBanned = false;
    this.banExpiresAt = null;
    this.save();
    return false;
  }
  return true;
};

const User = mongoose.model('User', userSchema);

export default User;
