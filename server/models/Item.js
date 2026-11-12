const mongoose = require('mongoose');

/**
 * Item Schema for RentNest
 * Represents an item listed by an Owner for rent.
 *
 * ER Relationships:
 * - Many Items belong to 1 Owner (User model)
 * - Many Items belong to 1 Category (Category model)
 */
const itemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An item must have an owner'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'An item must belong to a category'],
    },
    title: {
      type: String,
      required: [true, 'Please provide an item title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed item description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Please specify the rental price per day'],
      min: [0, 'Price per day cannot be negative'],
    },
    depositAmount: {
      type: Number,
      required: [true, 'Please specify the security deposit amount'],
      min: [0, 'Deposit amount cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for high-performance search queries on title and description
itemSchema.index({ title: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

