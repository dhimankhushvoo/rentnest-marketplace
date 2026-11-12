const mongoose = require('mongoose');

/**
 * Rental Schema for RentNest
 * Tracks the complete lifecycle of a rental transaction:
 * Requested -> Approved -> Handed Over -> Returned (with deposit settlement)
 * Also covers: Rejected, Cancelled, Overdue, and Disputed.
 *
 * ER Relationships:
 * - Many Rentals belong to 1 Item (item_id)
 * - Many Rentals belong to 1 Renter (User model)
 */
const rentalSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'A rental must be associated with an item'],
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A rental must have a renter'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide rental start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide rental end date'],
    },
    returnedOn: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [
          'Requested',
          'Approved',
          'Handed Over',
          'Returned',
          'Rejected',
          'Cancelled',
          'Overdue',
          'Disputed',
        ],
        message: '{VALUE} is not a valid rental status',
      },
      default: 'Requested',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total rental amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: [0, 'Penalty amount cannot be negative'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast date-conflict checks on an item
rentalSchema.index({ item: 1, status: 1, startDate: 1, endDate: 1 });

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;

