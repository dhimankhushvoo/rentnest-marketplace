const Rental = require('../models/Rental');
const Item = require('../models/Item');
const Deposit = require('../models/Deposit');

/**
 * Helper: Check for overlapping date conflicts for an item
 * Condition: Existing rental has an active booking status AND
 * [existingStart, existingEnd] overlaps with [newStart, newEnd]
 * Overlap formula: newStart <= existingEnd AND newEnd >= existingStart
 */
const checkDateConflict = async (itemId, newStart, newEnd, excludeRentalId = null) => {
  const query = {
    item: itemId,
    status: { $in: ['Approved', 'Handed Over', 'Overdue'] },
    startDate: { $lte: newEnd },
    endDate: { $gte: newStart },
  };

  if (excludeRentalId) {
    query._id = { $ne: excludeRentalId };
  }

  const conflictingRental = await Rental.findOne(query);
  return conflictingRental;
};

/**
 * @desc    Create a new rental request (Renter)
 * @route   POST /api/rentals
 * @access  Private (Renter / User)
 */
const createRentalRequest = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.body;

    // 1. Validate inputs
    if (!itemId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide itemId, startDate, and endDate.',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Date order validations
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start or end date format.',
      });
    }

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past.',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be strictly after the start date.',
      });
    }

    // 3. Find Item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    // 4. Item availability check
    if (!item.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This item is currently marked as unavailable for rental.',
      });
    }

    // 5. Anti-self-renting rule: Owner cannot rent their own item
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rent an item that you own.',
      });
    }

    // 6. Date Conflict Check (Double-booking prevention)
    const conflict = await checkDateConflict(itemId, start, end);
    if (conflict) {
      return res.status(400).json({
        success: false,
        message:
          'Date conflict: This item is already booked for the selected dates. Please choose different dates.',
        conflictingBooking: {
          startDate: conflict.startDate,
          endDate: conflict.endDate,
        },
      });
    }

    // 7. Calculate Rental Duration (in days) & Total Amount
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / millisecondsPerDay)
    );
    const totalAmount = durationDays * item.pricePerDay;

    // 8. Create Rental Document
    const rental = await Rental.create({
      item: itemId,
      renter: req.user._id,
      startDate: start,
      endDate: end,
      totalAmount,
      status: 'Requested',
    });

    await rental.populate('item', 'title images pricePerDay depositAmount owner');
    await rental.populate('renter', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Rental requested successfully. Awaiting owner approval.',
      durationDays,
      depositAmount: item.depositAmount,
      rental,
    });
  } catch (error) {
    console.error('Create Rental Request Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while requesting rental',
    });
  }
};

/**
 * @desc    Get all rental bookings for the logged-in Renter
 * @route   GET /api/rentals/my-rentals
 * @access  Private
 */
const getMyRentals = async (req, res) => {
  try {
    const rentals = await Rental.find({ renter: req.user._id })
      .populate({
        path: 'item',
        select: 'title images pricePerDay depositAmount owner',
        populate: { path: 'owner', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rentals.length,
      rentals,
    });
  } catch (error) {
    console.error('Get My Rentals Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your rentals',
    });
  }
};

/**
 * @desc    Get all rental requests received for items owned by logged-in Owner
 * @route   GET /api/rentals/owner-requests
 * @access  Private (Owner / Admin)
 */
const getOwnerRentalRequests = async (req, res) => {
  try {
    // 1. Find all items owned by current user
    const ownerItems = await Item.find({ owner: req.user._id }).select('_id');
    const itemIds = ownerItems.map((item) => item._id);

    // 2. Find rentals associated with these items
    const rentals = await Rental.find({ item: { $in: itemIds } })
      .populate('item', 'title images pricePerDay depositAmount')
      .populate('renter', 'name email phone address')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rentals.length,
      rentals,
    });
  } catch (error) {
    console.error('Get Owner Requests Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching rental requests',
    });
  }
};

/**
 * @desc    Get single rental details by ID
 * @route   GET /api/rentals/:id
 * @access  Private (Renter, Item Owner, or Admin)
 */
const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate({
        path: 'item',
        select: 'title description images pricePerDay depositAmount owner',
        populate: { path: 'owner', select: 'name email phone' },
      })
      .populate('renter', 'name email phone address');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Access check: only the renter, the item owner, or an admin can view
    const isRenter = rental.renter._id.toString() === req.user._id.toString();
    const isOwner =
      rental.item &&
      rental.item.owner &&
      rental.item.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this rental record',
      });
    }

    return res.status(200).json({
      success: true,
      rental,
    });
  } catch (error) {
    console.error('Get Rental By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching rental details',
    });
  }
};

/**
 * @desc    Owner approves a rental request
 * @route   PUT /api/rentals/:id/approve
 * @access  Private (Item Owner / Admin)
 */
const approveRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Verify logged-in user is the owner of the item
    if (
      rental.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the item owner can approve this request',
      });
    }

    // Check status is 'Requested'
    if (rental.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a rental that is currently '${rental.status}'`,
      });
    }

    // Double-check date conflicts in case another booking was approved in the meantime
    const conflict = await checkDateConflict(
      rental.item._id,
      rental.startDate,
      rental.endDate,
      rental._id
    );

    if (conflict) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot approve: An overlapping booking for this item has already been approved.',
      });
    }

    rental.status = 'Approved';
    await rental.save();

    return res.status(200).json({
      success: true,
      message: 'Rental request approved successfully',
      rental,
    });
  } catch (error) {
    console.error('Approve Rental Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while approving rental',
    });
  }
};

/**
 * @desc    Owner rejects a rental request
 * @route   PUT /api/rentals/:id/reject
 * @access  Private (Item Owner / Admin)
 */
const rejectRental = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Verify owner
    if (
      rental.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the item owner can reject this request',
      });
    }

    if (rental.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a rental that is currently '${rental.status}'`,
      });
    }

    rental.status = 'Rejected';
    rental.rejectionReason = rejectionReason || 'Declined by owner';
    await rental.save();

    return res.status(200).json({
      success: true,
      message: 'Rental request rejected',
      rental,
    });
  } catch (error) {
    console.error('Reject Rental Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while rejecting rental',
    });
  }
};

/**
 * @desc    Renter cancels their own requested rental
 * @route   PUT /api/rentals/:id/cancel
 * @access  Private (Renter who requested)
 */
const cancelRental = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Verify renter identity
    if (rental.renter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only cancel your own rental requests',
      });
    }

    // Can only cancel if still in 'Requested' status
    if (rental.status !== 'Requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a rental that has already been '${rental.status}'`,
      });
    }

    rental.status = 'Cancelled';
    rental.cancellationReason = cancellationReason || 'Cancelled by renter';
    await rental.save();

    return res.status(200).json({
      success: true,
      message: 'Rental request cancelled successfully',
      rental,
    });
  } catch (error) {
    console.error('Cancel Rental Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while cancelling rental',
    });
  }
};

/**
 * @desc    Get all booked/reserved date intervals for a specific item
 * @route   GET /api/rentals/item/:itemId/booked-dates
 * @access  Public (Used by frontend calendar picker)
 */
const getBookedDatesForItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const activeRentals = await Rental.find({
      item: itemId,
      status: { $in: ['Approved', 'Handed Over', 'Overdue'] },
    }).select('startDate endDate status');

    const bookedRanges = activeRentals.map((r) => ({
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    }));

    return res.status(200).json({
      success: true,
      count: bookedRanges.length,
      bookedRanges,
    });
  } catch (error) {
    console.error('Get Booked Dates Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching booked dates',
    });
  }
};

/**
 * @desc    Owner marks item as physically handed over to renter
 *          Locks deposit in 'held' status
 * @route   PUT /api/rentals/:id/handover
 * @access  Private (Owner / Admin)
 */
const markHandover = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Verify ownership
    if (
      rental.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the item owner can confirm item handover',
      });
    }

    // Must be in 'Approved' status
    if (rental.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Cannot handover an item with status '${rental.status}'. Must be 'Approved'.`,
      });
    }

    // Update rental status
    rental.status = 'Handed Over';
    await rental.save();

    // Create or update Deposit record
    let deposit = await Deposit.findOne({ rental: rental._id });
    if (!deposit) {
      deposit = await Deposit.create({
        rental: rental._id,
        renter: rental.renter,
        amount: rental.item.depositAmount,
        status: 'held',
        deductedAmount: 0,
        refundAmount: 0,
        reason: 'Security deposit held upon item handover',
      });
    } else {
      deposit.status = 'held';
      await deposit.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Item handover confirmed. Deposit is now held.',
      rental,
      deposit,
    });
  } catch (error) {
    console.error('Mark Handover Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during handover confirmation',
    });
  }
};

/**
 * @desc    Owner marks item as returned
 *          Calculates late penalties, processes damage deductions, and settles deposit
 * @route   PUT /api/rentals/:id/return
 * @access  Private (Owner / Admin)
 */
const processReturn = async (req, res) => {
  try {
    const { damageAmount = 0, damageReason = '' } = req.body;
    const rental = await Rental.findById(req.params.id).populate('item');

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Verify ownership
    if (
      rental.item.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the item owner can process item return',
      });
    }

    // Must be in 'Handed Over' or 'Overdue' status
    if (rental.status !== 'Handed Over' && rental.status !== 'Overdue') {
      return res.status(400).json({
        success: false,
        message: `Cannot return an item with status '${rental.status}'. Must be 'Handed Over' or 'Overdue'.`,
      });
    }

    const now = new Date();
    const endDate = new Date(rental.endDate);
    let lateDays = 0;
    let latePenalty = 0;

    // Check if returned past endDate
    if (now > endDate) {
      const diffMs = now.getTime() - endDate.getTime();
      lateDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      latePenalty = lateDays * rental.item.pricePerDay;
    }

    const totalPenalty = (rental.penaltyAmount || 0) + latePenalty;
    const damageFee = Math.max(0, Number(damageAmount) || 0);
    const totalDeductions = totalPenalty + damageFee;

    // Settle Deposit
    let deposit = await Deposit.findOne({ rental: rental._id });
    if (!deposit) {
      deposit = await Deposit.create({
        rental: rental._id,
        renter: rental.renter,
        amount: rental.item.depositAmount,
        status: 'held',
      });
    }

    const depositAmount = deposit.amount;
    const actualDeducted = Math.min(depositAmount, totalDeductions);
    const refundAmount = Math.max(0, depositAmount - actualDeducted);

    deposit.deductedAmount = actualDeducted;
    deposit.refundAmount = refundAmount;
    deposit.status = actualDeducted > 0 ? 'deducted' : 'refunded';

    const deductionReasons = [];
    if (totalPenalty > 0) {
      deductionReasons.push(`Late return penalty (${lateDays} day(s)): ₹${totalPenalty}`);
    }
    if (damageFee > 0) {
      deductionReasons.push(`Damage deduction: ₹${damageFee} (${damageReason || 'Physical damage'})`);
    }
    deposit.reason =
      deductionReasons.length > 0
        ? deductionReasons.join(' | ')
        : 'Item returned in good condition. Full deposit refunded.';

    await deposit.save();

    // Finalize rental record
    rental.status = 'Returned';
    rental.returnedOn = now;
    rental.penaltyAmount = totalPenalty;
    await rental.save();

    return res.status(200).json({
      success: true,
      message: 'Item return processed and deposit settled successfully',
      settlementSummary: {
        depositHeld: depositAmount,
        lateDays,
        latePenalty,
        damageFee,
        totalDeducted: actualDeducted,
        refundAmount: refundAmount,
        depositStatus: deposit.status,
      },
      rental,
      deposit,
    });
  } catch (error) {
    console.error('Process Return Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing return',
    });
  }
};

/**
 * @desc    Manually trigger overdue detection job (For Admin & Viva demonstration)
 * @route   POST /api/rentals/trigger-overdue-check
 * @access  Private (Admin)
 */
const triggerOverdueCheck = async (req, res) => {
  try {
    const { checkOverdueRentals } = require('../jobs/overdueJob');
    const result = await checkOverdueRentals();

    return res.status(200).json({
      success: true,
      message: 'Overdue check executed successfully',
      result,
    });
  } catch (error) {
    console.error('Trigger Overdue Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while running overdue check',
    });
  }
};

/**
 * @desc    Simulate an overdue rental for testing/viva (Rewinds endDate into the past)
 * @route   PUT /api/rentals/:id/simulate-overdue
 * @access  Private (Admin)
 */
const simulateOverdue = async (req, res) => {
  try {
    const { daysAgo = 3 } = req.body;
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental record not found',
      });
    }

    // Rewind endDate into the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - Math.max(1, Number(daysAgo)));
    rental.endDate = pastDate;

    // Ensure status is at least 'Handed Over' so the cron job picks it up
    if (rental.status === 'Requested' || rental.status === 'Approved') {
      rental.status = 'Handed Over';
    }

    await rental.save();

    return res.status(200).json({
      success: true,
      message: `Rental simulated as overdue. endDate rewound to ${pastDate.toISOString()} (${daysAgo} day(s) ago).`,
      rental,
    });
  } catch (error) {
    console.error('Simulate Overdue Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while simulating overdue rental',
    });
  }
};

module.exports = {
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
};

