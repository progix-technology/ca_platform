import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const updateAdmins = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI is not defined in the .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to database.');

    const result = await AdminUser.updateMany(
      { role: 'admin' },
      { $set: { adminAssigned: true } }
    );

    console.log(`Updated ${result.modifiedCount} admin documents.`);
    
  } catch (error) {
    console.error('Error updating admins:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

updateAdmins();
