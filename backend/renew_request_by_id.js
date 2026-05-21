import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Request from './models/Request.js';

dotenv.config();
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ca_platform';

async function renewRequest(requestSuffix) {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const requests = await Request.find();
  const matched = requests.filter((r) => r._id.toString().slice(-6).toLowerCase() === requestSuffix.toLowerCase());

  if (!matched.length) {
    console.log(`No matching request found for REQ-${requestSuffix.toUpperCase()}`);
    await mongoose.disconnect();
    return;
  }

  for (const request of matched) {
    console.log('Found request:', request._id.toString(), 'status=', request.status, 'renewalRequested=', request.renewalRequested);
    if (String(request.status).trim().toLowerCase() === 'renewed') {
      console.log('Request is already Renewed. No change needed.');
      continue;
    }

    request.status = 'Renewed';
    request.renewalRequested = false;
    request.statusTimeline.push({
      status: 'Renewed',
      changedBy: request.reviewedBy || null,
      note: 'Admin forced renewal via maintenance script',
      expiryDate: request.expiryDate || null,
      documents: Array.isArray(request.documents) ? request.documents : [],
      createdAt: new Date(),
    });

    await request.save();
    console.log('Updated request to Renewed.');
  }

  await mongoose.disconnect();
}

const suffix = process.argv[2];
if (!suffix) {
  console.error('Usage: node renew_request_by_id.js <request-suffix>');
  process.exit(1);
}

renewRequest(suffix).catch((err) => {
  console.error('Error updating request:', err);
  process.exit(1);
});
