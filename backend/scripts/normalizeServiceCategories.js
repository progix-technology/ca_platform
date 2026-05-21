import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import { normalizeCategory } from '../utils/serviceCategories.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = envContent.split(/\r?\n/).reduce((acc, line) => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    acc[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return acc;
}, {});

const mongoUri = env.MONGO_URI || 'mongodb://127.0.0.1:27017/ca_platform';

const run = async () => {
  await mongoose.connect(mongoUri);
  const services = await Service.find();
  console.log(`Found ${services.length} services.`);

  let updatedCount = 0;
  for (const service of services) {
    const normalized = normalizeCategory(service.category);
    if (service.category !== normalized) {
      service.category = normalized;
      await service.save();
      updatedCount += 1;
      console.log(`Updated service ${service._id}: ${service.category}`);
    }
  }

  console.log(`Updated ${updatedCount} services.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
