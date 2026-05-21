import mongoose from 'mongoose';
import AdminUser from './models/AdminUser.js';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1/ca-platform');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists with email: admin@gmail.com');
      console.log(`Current adminAssigned: ${existingAdmin.adminAssigned}`);
      
      // Update to true if false
      if (!existingAdmin.adminAssigned) {
        existingAdmin.adminAssigned = true;
        await existingAdmin.save();
        console.log('✅ Updated adminAssigned to true');
      }
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = await AdminUser.create({
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+91-9999999999',
        adminAssigned: true,
      });

      console.log('✅ Admin created successfully!');
      console.log(`Email: ${admin.email}`);
      console.log(`Password: admin123`);
      console.log(`Admin Assigned: ${admin.adminAssigned}`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
