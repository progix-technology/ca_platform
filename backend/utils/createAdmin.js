import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'Platform Admin';
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running create-admin');
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDB();

  const targetRole = process.env.ADMIN_ROLE === 'superadmin' ? 'superadmin' : 'admin';

  const existingAdmin = await User.findOne({ email: email.trim().toLowerCase() });
  if (existingAdmin) {
    existingAdmin.role = targetRole;
    existingAdmin.name = existingAdmin.name || name;
    existingAdmin.password = await bcrypt.hash(password, 10);
    await existingAdmin.save();
    console.log(`Updated existing user as ${targetRole}: ${existingAdmin.email}`);
  } else {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password: hashed,
      role: targetRole,
    });
    console.log(`${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} created: ${user.email}`);
  }

  await mongoose.connection.close();
};

createAdmin().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
