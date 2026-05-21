import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';
import { connectDB } from '../config/db.js';
import { config } from 'dotenv';

config();

async function fixAdminAccess() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find all admins with adminAssigned: false and set it to true
    const result = await AdminUser.updateMany(
      { adminAssigned: false },
      { $set: { adminAssigned: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} admin users with adminAssigned: true`);
    console.log(`📊 Matched ${result.matchedCount} admin users total`);

    // Show all admins for verification
    const allAdmins = await AdminUser.find({}).select('_id email name adminAssigned');
    console.log('\n📝 All admins in database:');
    allAdmins.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.name}) - adminAssigned: ${admin.adminAssigned}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminAccess();
