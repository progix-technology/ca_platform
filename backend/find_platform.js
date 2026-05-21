import mongoose from 'mongoose';
import User from './models/User.js';
import AdminUser from './models/AdminUser.js';

const findPlatformUser = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1/ca-platform');

    console.log('\n🔍 Searching for "Platform" user:\n');

    // Search in User collection
    const userInUserCollection = await User.findOne({ $or: [{ name: 'Platform' }, { email: /platform/i }] });
    if (userInUserCollection) {
      console.log('✅ Found in User collection:');
      console.log(`  Name: ${userInUserCollection.name}`);
      console.log(`  Email: ${userInUserCollection.email}`);
      console.log(`  Role: ${userInUserCollection.role}`);
      console.log(`  AdminAssigned: ${userInUserCollection.adminAssigned}`);
    }

    // Search in AdminUser collection
    const userInAdminCollection = await AdminUser.findOne({ $or: [{ name: 'Platform' }, { email: /platform/i }] });
    if (userInAdminCollection) {
      console.log('\n✅ Found in AdminUser collection:');
      console.log(`  Name: ${userInAdminCollection.name}`);
      console.log(`  Email: ${userInAdminCollection.email}`);
      console.log(`  Role: ${userInAdminCollection.role}`);
      console.log(`  AdminAssigned: ${userInAdminCollection.adminAssigned}`);
    }

    if (!userInUserCollection && !userInAdminCollection) {
      console.log('❌ No "Platform" user found in either collection');
      
      console.log('\n📋 All admins in database:');
      const allAdmins = await AdminUser.find({}, 'name email role adminAssigned');
      allAdmins.forEach(a => {
        console.log(`  - ${a.name} (${a.email}) - adminAssigned: ${a.adminAssigned}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

findPlatformUser();
