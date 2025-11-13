// ========================
// LOST REPORT MODEL
// ========================
import mongoose from 'mongoose';

const lostReportSchema = new mongoose.Schema(
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
        'ID Cards',
        'Keys',
        'Bags',
        'Sports Equipment',
        'Others',
      ],
    },
    attachment: {
      type: String,
      default: null,
    },
    lastSeenLocation: {
      type: String,
      required: [true, 'Last seen location is required'],
      trim: true,
    },
    dateLost: {
      type: Date,
      required: [true, 'Date lost is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Found', 'Closed'],
      default: 'Active',
    },
    matchedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
lostReportSchema.index({ status: 1, createdAt: -1 });
lostReportSchema.index({ category: 1, status: 1 });
lostReportSchema.index({ title: 'text', description: 'text' });

const LostReport = mongoose.model('LostReport', lostReportSchema);

export default LostReport;
