import mongoose from 'mongoose';
import AdminUser from './models/AdminUser.js';

const checkStatus = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1/ca-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const admins = await AdminUser.find({}, 'name email adminAssigned role');
    console.log('\n📊 Admin Status:');
    console.log('='.repeat(60));
    admins.forEach((admin) => {
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Admin Assigned: ${admin.adminAssigned ? '✅ TRUE' : '❌ FALSE'}`);
      console.log('-'.repeat(60));
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkStatus();
