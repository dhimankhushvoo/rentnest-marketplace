const mongoose = require('mongoose');

/**
 * Review Schema for RentNest
 * Allows Renters and Owners to review items and transactions once returned.
 *
 * ER Relationships:
 * - Many Reviews linked to 1 Rental transaction
 * - Many Reviews written by 1 Reviewer (User model)
 * - Many Reviews received by 1 Reviewee (User model)
 * - Many Reviews linked to 1 Item
 */
const reviewSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: [true, 'A review must be linked to a rental transaction'],
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'A review must be associated with an item'],
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a reviewer'],
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a reviewee (target user)'],
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a feedback comment'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters long'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevents a reviewer from submitting multiple reviews for the same rental
reviewSchema.index({ rental: 1, reviewer: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

