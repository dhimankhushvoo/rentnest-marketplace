const express = require('express');
const router = express.Router();
const {
  getDepositByRentalId,
  getMyDeposits,
} = require('../controllers/depositController');
const { protect } = require('../middleware/authMiddleware');

// Protected route for renter to view all their deposits
router.get('/my-deposits', protect, getMyDeposits);

// Protected route to view deposit for a specific rental
router.get('/rental/:rentalId', protect, getDepositByRentalId);

module.exports = router;

