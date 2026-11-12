const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to browse categories
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected: Only Admin can create categories
router.post('/', protect, authorize('admin'), createCategory);

module.exports = router;

