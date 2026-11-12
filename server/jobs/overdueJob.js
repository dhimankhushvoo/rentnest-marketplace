const cron = require('node-cron');
const Rental = require('../models/Rental');
const { sendOverdueAlert } = require('../utils/emailService');

/**
 * Core Overdue Detection Logic
 * Scans the database for active rentals whose endDate has passed without return.
 * - Transitions status: 'Handed Over' -> 'Overdue'
 * - Calculates accumulated late penalty (lateDays * item.pricePerDay)
 * - Dispatches email notification to renter
 */
const checkOverdueRentals = async () => {
  const now = new Date();
  console.log(`\n⏳ [Cron Job] Running Overdue Rental Check at ${now.toISOString()}...`);

  try {
    // Find rentals that are currently Handed Over or already Overdue, past their endDate, and not returned
    const overdueRentals = await Rental.find({
      status: { $in: ['Handed Over', 'Overdue'] },
      endDate: { $lt: now },
      returnedOn: null,
    })
      .populate('item', 'title pricePerDay owner')
      .populate('renter', 'name email phone');

    if (overdueRentals.length === 0) {
      console.log('✅ [Cron Job] No overdue rentals detected.');
      return { checkedAt: now, overdueCount: 0, updatedRentals: [] };
    }

    console.log(`⚠️ [Cron Job] Found ${overdueRentals.length} overdue rental(s). Processing...`);

    const updatedRentals = [];

    for (const rental of overdueRentals) {
      const endDate = new Date(rental.endDate);
      const diffMs = now.getTime() - endDate.getTime();
      const lateDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const pricePerDay = rental.item?.pricePerDay || 0;
      const calculatedPenalty = lateDays * pricePerDay;

      // Update rental status and penalty amount
      rental.status = 'Overdue';
      rental.penaltyAmount = calculatedPenalty;
      await rental.save();

      // Trigger email alert
      await sendOverdueAlert(rental, lateDays, calculatedPenalty);

      updatedRentals.push({
        rentalId: rental._id,
        itemTitle: rental.item?.title,
        renterName: rental.renter?.name,
        renterEmail: rental.renter?.email,
        lateDays,
        dailyRate: pricePerDay,
        totalPenalty: calculatedPenalty,
      });
    }

    console.log(`✅ [Cron Job] Completed overdue check. Updated ${updatedRentals.length} rentals.`);
    return {
      checkedAt: now,
      overdueCount: updatedRentals.length,
      updatedRentals,
    };
  } catch (error) {
    console.error('❌ [Cron Job Error]:', error.message);
    throw error;
  }
};

/**
 * Initialize Background Cron Schedule
 * Default schedule: Every day at midnight ('0 0 * * *')
 */
const initOverdueJob = () => {
  // Cron syntax: minute hour day-of-month month day-of-week
  // '0 0 * * *' = Runs every day at 00:00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Midnight Cron Trigger: Executing daily overdue check...');
    await checkOverdueRentals();
  });

  console.log('🕒 Automated Overdue Cron Job initialized (Scheduled for 00:00 Daily)');
};

module.exports = {
  initOverdueJob,
  checkOverdueRentals,
};

