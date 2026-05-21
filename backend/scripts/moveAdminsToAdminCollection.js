import mongoose from 'mongoose';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateAdmins = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmails = ['admin@gmail.com', 'admin2@gmail.com'];

    for (const email of adminEmails) {
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log(`❌ User with email ${email} not found`);
        continue;
      }

      // Check if already exists in AdminUser
      const existingAdmin = await AdminUser.findOne({ email });
      if (existingAdmin) {
        console.log(`⚠️  Admin with email ${email} already exists in AdminUser collection`);
        continue;
      }

      // Create in AdminUser collection
      const adminUser = new AdminUser({
        name: user.name,
        email: user.email,
        password: user.password,
        role: 'admin',
        phone: user.phone || '',
        pan: user.pan || '',
        address: user.address || {},
        profileImage: user.profileImage || '',
        profileImagePublicId: user.profileImagePublicId || '',
        resetOTP: user.resetOTP,
        resetOTPExpiry: user.resetOTPExpiry,
        subscription: {
          planId: null,
          planName: '',
          startDate: null,
          endDate: null,
          status: 'inactive',
          usage: 0,
        },
        adminAssigned: false,
      });

      await adminUser.save();
      console.log(`✅ Created admin: ${email} in AdminUser collection`);

      // Delete from User collection
      await User.findByIdAndDelete(user._id);
      console.log(`✅ Deleted user: ${email} from User collection`);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateAdmins();
