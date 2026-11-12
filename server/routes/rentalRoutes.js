const express = require('express');
const router = express.Router();
const {
  createRentalRequest,
  getMyRentals,
  getOwnerRentalRequests,
  getRentalById,
  approveRental,
  rejectRental,
  cancelRental,
  getBookedDatesForItem,
  markHandover,
  processReturn,
  triggerOverdueCheck,
  simulateOverdue,
} = require('../controllers/rentalController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for calendar: get reserved dates for an item
router.get('/item/:itemId/booked-dates', getBookedDatesForItem);

// Protected route for renter to view all their rental bookings
router.get('/my-rentals', protect, getMyRentals);

// Protected route for owners to see incoming rental requests for their items
router.get(
  '/owner-requests',
  protect,
  authorize('owner', 'admin'),
  getOwnerRentalRequests
);

// Admin on-demand trigger to execute overdue detection (Viva & Testing)
router.post(
  '/trigger-overdue-check',
  protect,
  authorize('admin'),
  triggerOverdueCheck
);

// Protected route to view single rental details
router.get('/:id', protect, getRentalById);

// Protected route for renter to submit a rental request
router.post('/', protect, createRentalRequest);

// Protected routes for owner to approve or reject requests
router.put('/:id/approve', protect, authorize('owner', 'admin'), approveRental);
router.put('/:id/reject', protect, authorize('owner', 'admin'), rejectRental);

// Protected routes for item handover and return settlement
router.put('/:id/handover', protect, authorize('owner', 'admin'), markHandover);
router.put('/:id/return', protect, authorize('owner', 'admin'), processReturn);

// Protected route for renter to cancel their own request before approval
router.put('/:id/cancel', protect, cancelRental);

// Admin-only test helper to rewind rental dates for testing overdue cron job
router.put(
  '/:id/simulate-overdue',
  protect,
  authorize('admin'),
  simulateOverdue
);

module.exports = router;

