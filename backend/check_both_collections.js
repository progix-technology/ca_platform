import mongoose from 'mongoose';
import User from './models/User.js';
import AdminUser from './models/AdminUser.js';

const checkBoth = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1/ca-platform');

    console.log('\n📊 Checking both collections:\n');
    
    const users = await User.find({ role: 'admin' }, 'name email role adminAssigned');
    console.log(`✅ Users collection (admin role): ${users.length} found`);
    users.forEach(u => {
      console.log(`  - ${u.email} (adminAssigned: ${u.adminAssigned})`);
    });

    const adminUsers = await AdminUser.find({}, 'name email role adminAssigned');
    console.log(`\n✅ AdminUser collection: ${adminUsers.length} found`);
    adminUsers.forEach(a => {
      console.log(`  - ${a.email} (adminAssigned: ${a.adminAssigned})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkBoth();
