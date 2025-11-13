// ========================
// ITEM MODEL
// ========================
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 1000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'Books',
        'Clothing',
        'Accessories',
        'ID Card',
        'Keys',
        'Bags',
        'Sports Equipment',
        'Others',
      ],
    },
    photo: {
      type: String,
      required: [true, 'Photo is required'],
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    locationText: {
      type: String,
      required: [true, 'Location text is required'],
      trim: true,
    },
    internalTag: {
      type: String,
      trim: true,
      default: '',
    },
    dateFound: {
      type: Date,
      required: [true, 'Date found is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Open', 'Claimed', 'Resolved'],
      default: 'Open',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    acceptedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ title: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema);

export default Item;
