const express = require('express');
const router = express.Router();
const {
  raiseDispute,
  getAllDisputes,
  getDisputeById,
  resolveDispute,
  getMyDisputes,
} = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadEvidence } = require('../middleware/uploadMiddleware');

// Protected route for users to view disputes they are involved in
router.get('/my-disputes', protect, getMyDisputes);

// Protected route for Admin to view all disputes across the platform
router.get('/', protect, authorize('admin'), getAllDisputes);

// Protected route for participants or Admin to view single dispute details
router.get('/:id', protect, getDisputeById);

// Protected route for Renter or Owner to file a dispute with photo evidence
router.post('/', protect, uploadEvidence.array('evidence', 5), raiseDispute);

// Protected route for Admin to resolve dispute and allocate deposit funds
router.put('/:id/resolve', protect, authorize('admin'), resolveDispute);

module.exports = router;

