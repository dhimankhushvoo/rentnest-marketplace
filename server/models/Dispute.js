const mongoose = require('mongoose');

/**
 * Dispute Schema for RentNest
 * Allows Renters or Owners to raise an arbitration dispute regarding
 * item damages, security deposit unfair deductions, or unreturned items.
 *
 * ER Relationships:
 * - Many Disputes linked to 1 Rental
 * - Raised By 1 User (Renter or Owner)
 * - Against 1 User (the counter-party)
 * - Resolved By 1 Admin User
 */
const disputeSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      required: [true, 'A dispute must be linked to a rental transaction'],
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispute must specify who raised it'],
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispute must specify the opposing user'],
    },
    reason: {
      type: String,
      required: [true, 'Please explain the reason for raising the dispute'],
      trim: true,
      minlength: [10, 'Dispute explanation must be at least 10 characters long'],
      maxlength: [2000, 'Dispute explanation cannot exceed 2000 characters'],
    },
    evidence: {
      type: [String], // Array of uploaded image file paths
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'Under Review', 'Resolved', 'Dismissed'],
        message: '{VALUE} is not a valid dispute status',
      },
      default: 'Open',
    },
    adminDecision: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      resolutionNotes: {
        type: String,
        trim: true,
        default: '',
      },
      refundToRenter: {
        type: Number,
        default: 0,
        min: 0,
      },
      payoutToOwner: {
        type: Number,
        default: 0,
        min: 0,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index to query active disputes quickly
disputeSchema.index({ rental: 1, status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;

