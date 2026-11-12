const mongoose = require('mongoose');

/**
 * Deposit Schema for RentNest
 * Tracks the security deposit collected for a rental:
 * - Held: Deposit is locked during rental period after handover
 * - Refunded: Deposit returned in full to renter upon safe return
 * - Deducted: Partial or full deposit deducted for late penalty or damage
 *
 * ER Relationship:
 * - 1 Rental has exactly 1 Deposit record (1-to-1 relationship)
 */
const depositSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: [true, 'A deposit must be linked to a rental'],
      unique: true,
    },
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A deposit must belong to a renter'],
    },
    amount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['held', 'refunded', 'deducted'],
        message: '{VALUE} is not a valid deposit status',
      },
      default: 'held',
    },
    deductedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Deducted amount cannot be negative'],
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative'],
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;

