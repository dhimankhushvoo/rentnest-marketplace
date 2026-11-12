const Dispute = require('../models/Dispute');
const Rental = require('../models/Rental');
const Deposit = require('../models/Deposit');

/**
 * @desc    Raise a dispute for a rental transaction (Renter or Owner)
 * @route   POST /api/disputes
 * @access  Private (Renter or Owner of the rental)
 */
const raiseDispute = async (req, res) => {
  try {
    const { rentalId, reason } = req.body;

    // 1. Basic validation
    if (!rentalId || !reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide rentalId and a detailed reason (minimum 10 characters).',
      });
    }

    // 2. Fetch rental with item details
    const rental = await Rental.findById(rentalId).populate('item');
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Rental transaction not found',
      });
    }

    // 3. Verify user was a participant
    const isRenter = rental.renter.toString() === req.user._id.toString();
    const isOwner =
      rental.item &&
      rental.item.owner &&
      rental.item.owner.toString() === req.user._id.toString();

    if (!isRenter && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this rental transaction',
      });
    }

    // Identify opposing user
    const opposingUser = isRenter ? rental.item.owner : rental.renter;

    // 4. Check if an active dispute already exists
    const existingActiveDispute = await Dispute.findOne({
      rental: rental._id,
      status: { $in: ['Open', 'Under Review'] },
    });

    if (existingActiveDispute) {
      return res.status(400).json({
        success: false,
        message: 'An active dispute is already in progress for this rental transaction',
      });
    }

    // 5. Process evidence images uploaded via Multer
    let evidence = [];
    if (req.files && req.files.length > 0) {
      evidence = req.files.map((file) => `/uploads/evidence/${file.filename}`);
    }

    // 6. Create Dispute document
    const dispute = await Dispute.create({
      rental: rental._id,
      raisedBy: req.user._id,
      against: opposingUser,
      reason: reason.trim(),
      evidence,
      status: 'Open',
    });

    // 7. Update rental status to 'Disputed'
    rental.status = 'Disputed';
    await rental.save();

    await dispute.populate('raisedBy', 'name email phone');
    await dispute.populate('against', 'name email phone');

    return res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully. Admin has been notified for arbitration.',
      dispute,
    });
  } catch (error) {
    console.error('Raise Dispute Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while raising dispute',
    });
  }
};

/**
 * @desc    Get all disputes with optional status filter (Admin only)
 * @route   GET /api/disputes
 * @access  Private (Admin)
 */
const getAllDisputes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const disputes = await Dispute.find(filter)
      .populate({
        path: 'rental',
        select: 'startDate endDate returnedOn status totalAmount penaltyAmount item',
        populate: { path: 'item', select: 'title pricePerDay depositAmount' },
      })
      .populate('raisedBy', 'name email phone role')
      .populate('against', 'name email phone role')
      .populate('adminDecision.resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    console.error('Get All Disputes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching disputes',
    });
  }
};

/**
 * @desc    Get single dispute details by ID
 * @route   GET /api/disputes/:id
 * @access  Private (Participants or Admin)
 */
const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate({
        path: 'rental',
        select: 'startDate endDate returnedOn status totalAmount penaltyAmount item',
        populate: { path: 'item', select: 'title images pricePerDay depositAmount' },
      })
      .populate('raisedBy', 'name email phone')
      .populate('against', 'name email phone')
      .populate('adminDecision.resolvedBy', 'name email');

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    // Access check: only the participants or admin can view
    const isRaisedBy = dispute.raisedBy._id.toString() === req.user._id.toString();
    const isAgainst = dispute.against._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRaisedBy && !isAgainst && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this dispute',
      });
    }

    // Also fetch associated deposit to inspect current escrow state
    const deposit = await Deposit.findOne({ rental: dispute.rental._id });

    return res.status(200).json({
      success: true,
      dispute,
      deposit,
    });
  } catch (error) {
    console.error('Get Dispute By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dispute details',
    });
  }
};

/**
 * @desc    Admin resolves a dispute and allocates the security deposit
 * @route   PUT /api/disputes/:id/resolve
 * @access  Private (Admin only)
 */
const resolveDispute = async (req, res) => {
  try {
    const {
      resolutionNotes,
      refundToRenter = 0,
      payoutToOwner = 0,
      status = 'Resolved',
    } = req.body;

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide detailed resolution notes explaining the decision.',
      });
    }

    const dispute = await Dispute.findById(req.params.id).populate('rental');
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found',
      });
    }

    if (dispute.status === 'Resolved' || dispute.status === 'Dismissed') {
      return res.status(400).json({
        success: false,
        message: `This dispute has already been marked as '${dispute.status}'`,
      });
    }

    const renterRefund = Number(refundToRenter) || 0;
    const ownerPayout = Number(payoutToOwner) || 0;

    // Fetch and settle the security deposit
    const deposit = await Deposit.findOne({ rental: dispute.rental._id });

    if (deposit) {
      const totalAllocated = renterRefund + ownerPayout;
      if (totalAllocated > deposit.amount) {
        return res.status(400).json({
          success: false,
          message: `Total allocated amount (₹${totalAllocated}) cannot exceed total deposit held (₹${deposit.amount})`,
        });
      }

      deposit.refundAmount = renterRefund;
      deposit.deductedAmount = ownerPayout;
      deposit.status = ownerPayout > 0 ? 'deducted' : 'refunded';
      deposit.reason = `Admin Dispute Resolution: ${resolutionNotes.trim()}`;
      await deposit.save();
    }

    // Update Dispute document
    dispute.status = status;
    dispute.adminDecision = {
      resolvedBy: req.user._id,
      resolutionNotes: resolutionNotes.trim(),
      refundToRenter: renterRefund,
      payoutToOwner: ownerPayout,
      resolvedAt: new Date(),
    };
    await dispute.save();

    // Conclude rental transaction
    const rental = await Rental.findById(dispute.rental._id);
    if (rental && rental.status === 'Disputed') {
      rental.status = 'Returned';
      if (!rental.returnedOn) {
        rental.returnedOn = new Date();
      }
      await rental.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully and deposit allocated',
      dispute,
      deposit,
    });
  } catch (error) {
    console.error('Resolve Dispute Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while resolving dispute',
    });
  }
};

/**
 * @desc    Get all disputes involving the currently logged-in user
 * @route   GET /api/disputes/my-disputes
 * @access  Private
 */
const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({
      $or: [{ raisedBy: req.user._id }, { against: req.user._id }],
    })
      .populate({
        path: 'rental',
        select: 'startDate endDate status totalAmount item',
        populate: { path: 'item', select: 'title images' },
      })
      .populate('raisedBy', 'name email')
      .populate('against', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: disputes.length,
      disputes,
    });
  } catch (error) {
    console.error('Get My Disputes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your disputes',
    });
  }
};

module.exports = {
  raiseDispute,
  getAllDisputes,
  getDisputeById,
  resolveDispute,
  getMyDisputes,
};

