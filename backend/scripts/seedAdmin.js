import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import SuperAdmin from '../models/SuperAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '12312312';
    const adminRole = process.env.ADMIN_ROLE || 'superadmin';

    const existingAdmin = await SuperAdmin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      existingAdmin.password = await bcrypt.hash(adminPassword, 10);
      await existingAdmin.save();
      console.log('Admin updated successfully.');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await SuperAdmin.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: adminRole,
      });
      console.log('Admin created successfully.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
