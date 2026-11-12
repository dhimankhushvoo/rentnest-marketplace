const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route to browse all items (supports search, filters, pagination)
router.get('/', getAllItems);

// Protected route for owners to see their own listings
// Note: Must be placed BEFORE /:id route so 'my-items' is not treated as an ID
router.get('/my-items', protect, authorize('owner', 'admin'), getMyItems);

// Public route to view a single item's details
router.get('/:id', getItemById);

// Protected routes for creating, updating, and deleting items
router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  upload.array('images', 5),
  createItem
);

router.put(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  upload.array('images', 5),
  updateItem
);

router.delete('/:id', protect, authorize('owner', 'admin'), deleteItem);

module.exports = router;

