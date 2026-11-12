const Deposit = require('../models/Deposit');
const Rental = require('../models/Rental');

/**
 * @desc    Get deposit details for a specific rental
 * @route   GET /api/deposits/rental/:rentalId
 * @access  Private (Renter, Item Owner, or Admin)
 */
const getDepositByRentalId = async (req, res) => {
  try {
    const { rentalId } = req.params;

    const rental = await Rental.findById(rentalId).populate('item');
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Associated rental not found',
      });
    }

    // Authorization check
    const isRenter = rental.renter.toString() === req.user._id.toString();
    const isOwner =
      rental.item &&
      rental.item.owner &&
      rental.item.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this deposit record',
      });
    }

    const deposit = await Deposit.findOne({ rental: rentalId })
      .populate('renter', 'name email phone')
      .populate({
        path: 'rental',
        select: 'startDate endDate returnedOn status totalAmount penaltyAmount item',
        populate: { path: 'item', select: 'title pricePerDay depositAmount' },
      });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'No deposit record found for this rental',
      });
    }

    return res.status(200).json({
      success: true,
      deposit,
    });
  } catch (error) {
    console.error('Get Deposit By Rental ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching deposit record',
    });
  }
};

/**
 * @desc    Get all deposits belonging to the logged-in renter
 * @route   GET /api/deposits/my-deposits
 * @access  Private (Renter)
 */
const getMyDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find({ renter: req.user._id })
      .populate({
        path: 'rental',
        select: 'startDate endDate returnedOn status totalAmount item',
        populate: { path: 'item', select: 'title images pricePerDay' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: deposits.length,
      deposits,
    });
  } catch (error) {
    console.error('Get My Deposits Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your deposits',
    });
  }
};

module.exports = {
  getDepositByRentalId,
  getMyDeposits,
};

