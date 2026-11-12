const Review = require('../models/Review');
const Rental = require('../models/Rental');
const Item = require('../models/Item');

/**
 * @desc    Submit a review for a completed rental
 * @route   POST /api/reviews
 * @access  Private (Renter or Owner of the rental)
 */
const createReview = async (req, res) => {
  try {
    const { rentalId, rating, comment } = req.body;

    // 1. Validate inputs
    if (!rentalId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rentalId, rating (1-5), and comment',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    // 2. Fetch the rental transaction
    const rental = await Rental.findById(rentalId).populate('item');
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental transaction not found',
      });
    }

    // 3. Status check: Can only review completed/returned rentals
    if (rental.status !== 'Returned') {
      return res.status(400).json({
        success: false,
        message: `Cannot review a rental with status '${rental.status}'. The item must be 'Returned' first.`,
      });
    }

    // 4. Participant verification and reviewee determination
    const isRenter = rental.renter.toString() === req.user._id.toString();
    const isOwner =
      rental.item &&
      rental.item.owner &&
      rental.item.owner.toString() === req.user._id.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You were not a participant in this rental transaction',
      });
    }

    // If Renter is reviewing -> reviewee is the Owner
    // If Owner is reviewing -> reviewee is the Renter
    const revieweeId = isRenter ? rental.item.owner : rental.renter;

    // 5. Duplicate review prevention
    const existingReview = await Review.findOne({
      rental: rental._id,
      reviewer: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this rental transaction',
      });
    }

    // 6. Create Review
    const review = await Review.create({
      rental: rental._id,
      item: rental.item._id,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: numRating,
      comment: comment.trim(),
    });

    await review.populate('reviewer', 'name');
    await review.populate('reviewee', 'name');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while submitting review',
    });
  }
};

/**
 * @desc    Get all reviews for an item with average rating calculation
 * @route   GET /api/reviews/item/:itemId
 * @access  Public
 */
const getItemReviews = async (req, res) => {
  try {
    const { itemId } = req.params;

    const reviews = await Review.find({ item: itemId })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const averageRating =
      count > 0
        ? Number(
            (
              reviews.reduce((acc, curr) => acc + curr.rating, 0) / count
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      count,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error('Get Item Reviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching item reviews',
    });
  }
};

/**
 * @desc    Get user reputation & reviews received as owner or renter
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ reviewee: userId })
      .populate('reviewer', 'name')
      .populate('item', 'title')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const averageRating =
      count > 0
        ? Number(
            (
              reviews.reduce((acc, curr) => acc + curr.rating, 0) / count
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      count,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error('Get User Reviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user reviews',
    });
  }
};

/**
 * @desc    Get all reviews written by logged-in user
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate('item', 'title images')
      .populate('reviewee', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error('Get My Reviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your reviews',
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Author of review or Admin)
 */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (
      review.reviewer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own reviews',
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete Review Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting review',
    });
  }
};

module.exports = {
  createReview,
  getItemReviews,
  getUserReviews,
  getMyReviews,
  deleteReview,
};

