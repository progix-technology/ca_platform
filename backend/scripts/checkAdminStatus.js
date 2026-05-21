import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import { connectDB } from '../config/db.js';
import { config } from 'dotenv';

config();

async function checkAdmins() {
  try {
    await connectDB();
    console.log('Connected to MongoDB\n');

    // Check User collection
    const usersInUserCollection = await User.find({}).select('_id email name role adminAssigned');
    console.log('📌 Users in User collection:');
    if (usersInUserCollection.length === 0) {
      console.log('  (empty)');
    } else {
      usersInUserCollection.forEach(user => {
        console.log(`  - ${user.email} (role: ${user.role}, adminAssigned: ${user.adminAssigned})`);
      });
    }

    console.log('\n---\n');

    // Check AdminUser collection
    const adminsInAdminCollection = await AdminUser.find({}).select('_id email name adminAssigned');
    console.log('📌 Users in AdminUser collection:');
    if (adminsInAdminCollection.length === 0) {
      console.log('  (empty)');
    } else {
      adminsInAdminCollection.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name}) - adminAssigned: ${admin.adminAssigned}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdmins();
