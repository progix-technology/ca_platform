import mongoose from 'mongoose';
import Request from './models/Request.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ca-platform';

async function migrateRenewingToRenewed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const requests = await Request.find({ status: 'Service Renewing' });

  if (!requests.length) {
    console.log('No Service Renewing requests found.');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  for (const request of requests) {
    request.status = 'Renewed';
    request.renewalRequested = false;

    request.statusTimeline.push({
      status: 'Renewed',
      changedBy: request.reviewedBy || null,
      note: 'Migrated from Service Renewing to Renewed',
      expiryDate: request.expiryDate || null,
      documents: Array.isArray(request.documents) ? request.documents : [],
    });

    await request.save();
    updated += 1;
  }

  console.log(`Migrated ${updated} request(s) from Service Renewing to Renewed.`);
  await mongoose.disconnect();
}

migrateRenewingToRenewed().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
