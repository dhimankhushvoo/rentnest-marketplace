const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * If SMTP credentials are provided in .env, sends real emails.
 * Otherwise, gracefully logs simulated emails to console (ideal for testing & viva).
 */
let transporter = null;

if (
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Send Overdue Rental Alert Email
 * @param {Object} rental - Populated rental document
 * @param {Number} lateDays - Days overdue
 * @param {Number} penaltyAmount - Accumulated late penalty
 */
const sendOverdueAlert = async (rental, lateDays, penaltyAmount) => {
  const renterName = rental.renter?.name || 'Renter';
  const renterEmail = rental.renter?.email;
  const itemTitle = rental.item?.title || 'Rental Item';
  const pricePerDay = rental.item?.pricePerDay || 0;

  if (!renterEmail) {
    console.log('⚠️ Cannot send email: No renter email found');
    return;
  }

  const subject = `⚠️ Overdue Notice: Return Required for "${itemTitle}"`;
  const textMessage = `Hello ${renterName},\n\nYour rental for "${itemTitle}" was due on ${new Date(
    rental.endDate
  ).toLocaleDateString()}.\n\nIt is now ${lateDays} day(s) overdue. A late penalty fee of ₹${pricePerDay}/day is being applied.\nCurrent penalty: ₹${penaltyAmount}.\n\nPlease return the item immediately to avoid deposit forfeiture.\n\nThank you,\nRentNest Team`;

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #e53e3e; margin-top: 0;">⚠️ Overdue Rental Notice</h2>
      <p>Hello <strong>${renterName}</strong>,</p>
      <p>Your rental period for <strong>${itemTitle}</strong> expired on <strong>${new Date(
    rental.endDate
  ).toDateString()}</strong>.</p>
      
      <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 12px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Days Overdue:</strong> ${lateDays} day(s)</p>
        <p style="margin: 4px 0 0; font-size: 14px;"><strong>Daily Late Penalty Rate:</strong> ₹${pricePerDay} / day</p>
        <p style="margin: 4px 0 0; font-size: 16px; color: #c53030;"><strong>Current Accumulated Penalty:</strong> ₹${penaltyAmount}</p>
      </div>

      <p>Please contact the owner and return the item immediately. This penalty will be deducted from your security deposit during return settlement.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">RentNest Marketplace Automated Alert System</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"RentNest" <alerts@rentnest.com>',
        to: renterEmail,
        subject,
        text: textMessage,
        html: htmlMessage,
      });
      console.log(`✉️ Overdue alert email sent to ${renterEmail}`);
    } catch (err) {
      console.error(`❌ Failed to send email to ${renterEmail}:`, err.message);
    }
  } else {
    // Simulated Mode: Logs clearly for development and viva demonstration
    console.log('\n================== [EMAIL SIMULATION] ==================');
    console.log(`To: ${renterEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${textMessage}`);
    console.log('========================================================\n');
  }
};

module.exports = {
  sendOverdueAlert,
};

