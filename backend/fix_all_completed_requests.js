// Script to migrate old document arrays (string URLs) to new format { name, url }
// Run with: node backend/fix_all_completed_requests.js

import mongoose from 'mongoose';
import Request from './models/Request.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ca-platform';

async function migrateDocuments() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const requests = await Request.find({ documents: { $exists: true, $not: { $size: 0 } } });
  let updated = 0;
  for (const req of requests) {
    if (!Array.isArray(req.documents)) continue;
    // If already in new format, skip
    if (req.documents.every(doc => typeof doc === 'object' && doc !== null && doc.name && doc.url)) continue;
    // Convert all string docs to { name, url }
    req.documents = req.documents.map((doc, idx) => {
      if (typeof doc === 'object' && doc !== null && doc.name && doc.url) return doc;
      if (typeof doc === 'string') {
        const fileName = doc.split('/').pop() || `Document ${idx + 1}`;
        return { name: fileName, url: doc };
      }
      return { name: `Document ${idx + 1}`, url: '' };
    });
    await req.save();
    updated++;
  }
  console.log(`Migrated ${updated} requests to new document format.`);
  await mongoose.disconnect();
}

migrateDocuments().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
