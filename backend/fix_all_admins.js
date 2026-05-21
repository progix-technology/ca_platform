import mongoose from 'mongoose';
import AdminUser from './models/AdminUser.js';

const fixAllAdmins = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1/ca-platform');

    // Find all admins
    const admins = await AdminUser.find({});
    
    if (admins.length === 0) {
      console.log('❌ No admins found in database');
      process.exit(0);
    }

    console.log(`\n📊 Found ${admins.length} admin(s):\n`);

    // Update all to have adminAssigned: true
    for (const admin of admins) {
      console.log(`Email: ${admin.email}`);
      console.log(`Current adminAssigned: ${admin.adminAssigned}`);
      
      admin.adminAssigned = true;
      await admin.save();
      
      console.log(`Updated adminAssigned: ✅ TRUE\n`);
    }

    console.log('✅ All admins updated successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixAllAdmins();
