// ========================
// CLAIM MODEL
// ========================
import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Claim description is required'],
      maxlength: 500,
    },
    proofImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Canceled'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimant: 1, status: 1 });

const Claim = mongoose.model('Claim', claimSchema);

export default Claim;
