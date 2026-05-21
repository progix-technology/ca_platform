import cron from 'node-cron';
import Request from '../models/Request.js';
import User from '../models/User.js';
import { sendEmail } from './email.js';

// Helper: Send reminders for a request
async function sendReminders(request, type) {
  const user = await User.findById(request.user);
  if (!user) return;
  const email = user.email;
  let subject = '';
  let message = '';
  let html = '';

  switch (type) {
    case 'pending_payment':
      subject = 'Payment Pending Reminder';
      message = `Dear ${user.name}, your payment for request #${request._id} is pending. Please complete it soon.`;
      break;
    case 'pending_document':
      subject = 'Document Pending Reminder';
      message = `Dear ${user.name}, documents are pending for request #${request._id}. Please upload them.`;
      break;
    case 'action_needed':
      subject = 'Action Needed Reminder';
      message = `Dear ${user.name}, action is needed for your request #${request._id}. Please check your dashboard.`;
      break;
    case 'status_change':
      subject = 'Status Update';
      message = `Dear ${user.name}, the status of your request #${request._id} has changed to ${request.status}.`;
      break;
    case 'expiry_renewal': {
      subject = 'Your Service Validity is Expired';
      const expiryDate = request.expiryDate ? new Date(request.expiryDate) : null;
      const dateStr = expiryDate ? expiryDate.toLocaleDateString('en-IN') : '-';
      const timeStr = expiryDate ? expiryDate.toLocaleTimeString('en-IN') : '-';
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const renewUrl = `${clientUrl}/dashboard/completed-list?requestId=${request._id}`;
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; background: #f8fafc; padding: 32px;">
          <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 8px #0001; padding: 32px;">
            <h2 style="color: #ef4444; font-size: 2rem; margin-bottom: 16px;">Your Service Validity is Expired</h2>
            <p style="color: #334155; font-size: 16px;">Dear ${user.name || 'User'},</p>
            <p style="color: #334155; font-size: 16px;">Your service <b>${request.service?.title || ''}</b> expired on <b>${dateStr}</b> at <b>${timeStr}</b>.</p>
            <a href="${renewUrl}" style="display: inline-block; margin: 24px 0 0 0; padding: 12px 24px; background: #ef4444; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Renew Service</a>
            <p style="color: #64748b; font-size: 13px; margin-top: 32px;">If you have any questions, reply to this email or contact support.</p>
          </div>
        </div>
      `;
      // Also create a notification for the user
      try {
        const Notification = (await import('../models/Notification.js')).default;
        await Notification.create({
          user: user._id,
          request: request._id,
          type: 'request-status',
          title: 'Service Validity Expired',
          message: `Your service <b>${request.service?.title || ''}</b> expired on <b>${dateStr}</b> at <b>${timeStr}</b>. Please renew to continue.`,
          meta: {
            expiryDate: request.expiryDate,
            renewUrl,
          },
        });
      } catch (err) {
        console.error('Failed to create expiry notification:', err);
      }
      break;
    }
    default:
      return;
  }

  if (type === 'expiry_renewal' && email) {
    try {
      await sendEmail(email, subject, html, true);
    } catch (err) {
      console.error('Expiry reminder email failed for request', request._id, err);
    }
  } else if (email) {
    try {
      await sendEmail(email, subject, message);
    } catch (err) {
      console.error('Reminder email failed for request', request._id, err);
    }
  }
}


async function runExpiryReminderCheck() {
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const expiringToday = await Request.find({
    status: 'Completed',
    expiryReminderSent: false,
    expiryDate: { $lte: todayEnd },
  });

  console.log('Expiry reminders candidates:', expiringToday.length);

  for (const req of expiringToday) {
    try {
      await sendReminders(req, 'expiry_renewal');
      req.expiryReminderSent = true;
      await req.save();
    } catch (err) {
      console.error('Expiry reminder processing failed for request', req._id, err);
    }
  }
}

// Main scheduled job
cron.schedule('0 9 * * *', async () => {
  // Runs every day at 9 AM
  // 1. Pending Payment (new: status = Paid, but not In Progress/Filed/Completed)
  const pendingPayments = await Request.find({ status: 'Paid' });
  for (const req of pendingPayments) {
    await sendReminders(req, 'pending_payment');
  }
  // 2. Action Needed (legacy, still supported)
  const actionNeeded = await Request.find({ status: 'Action Needed' });
  for (const req of actionNeeded) {
    await sendReminders(req, 'action_needed');
  }
  // 3. Status Change (last 24h)
  const since = new Date(Date.now() - 24*60*60*1000);
  const changed = await Request.find({ updatedAt: { $gte: since } });
  for (const req of changed) {
    await sendReminders(req, 'status_change');
  }
  // 4. Expiry/Renewal Reminder (status = Completed, expiryDate is today or earlier, not yet notified)
  await runExpiryReminderCheck();
});

// Delay initial check by 15 seconds to allow MongoDB connection to establish
setTimeout(() => {
  runExpiryReminderCheck().catch((err) => {
    console.error('Initial expiry reminder check failed:', err);
  });
}, 15000);

console.log('Reminder scheduler started.');
