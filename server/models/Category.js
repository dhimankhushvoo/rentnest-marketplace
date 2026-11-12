const mongoose = require('mongoose');

/**
 * Category Schema for RentNest
 * Categorizes rental items (e.g., Electronics, Camping & Trekking, Books, Tools)
 * Simple entity for ER diagrams: Category (1) ---- (N) Items
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

