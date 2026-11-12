const express = require('express');
const router = express.Router();
const {
  createReview,
  getItemReviews,
  getUserReviews,
  getMyReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view reviews & average rating for an item
router.get('/item/:itemId', getItemReviews);

// Public route to view trust score & reviews for a user
router.get('/user/:userId', getUserReviews);

// Protected route to view reviews written by the logged-in user
router.get('/my-reviews', protect, getMyReviews);

// Protected route to submit a review for a completed rental
router.post('/', protect, createReview);

// Protected route to delete a review (Author or Admin)
router.delete('/:id', protect, deleteReview);

module.exports = router;

