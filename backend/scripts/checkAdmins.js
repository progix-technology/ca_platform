import mongoose from 'mongoose';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const checkAdmins = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    console.log('\n=== USER COLLECTION ===');
    const users = await User.find({}).select('name email role');
    users.forEach(u => console.log(`${u.email} - ${u.role}`));
    
    console.log('\n=== ADMIN COLLECTION ===');
    const admins = await AdminUser.find({}).select('name email role');
    admins.forEach(a => console.log(`${a.email} - ${a.role}`));
    
    console.log('\n=== SUPERADMIN COLLECTION ===');
    const superadmins = await SuperAdmin.find({}).select('name email role');
    superadmins.forEach(sa => console.log(`${sa.email} - ${sa.role}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkAdmins();
