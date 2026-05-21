import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';
import SuperAdmin from '../models/SuperAdmin.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find superadmin in AdminUser collection
    const superadmin = await AdminUser.findOne({ role: 'superadmin' });
    
    if (!superadmin) {
      console.log('❌ No superadmin found in AdminUser collection');
      process.exit(0);
    }

    // Check if already exists in SuperAdmin collection
    const existingSuperAdmin = await SuperAdmin.findOne({ email: superadmin.email });
    if (existingSuperAdmin) {
      console.log(`⚠️  Superadmin with email ${superadmin.email} already exists in SuperAdmin collection`);
      process.exit(0);
    }

    // Create in SuperAdmin collection
    const newSuperAdmin = new SuperAdmin({
      name: superadmin.name,
      email: superadmin.email,
      password: superadmin.password,
      role: 'superadmin',
      phone: superadmin.phone || '',
      address: superadmin.address || {},
      profileImage: superadmin.profileImage || '',
      profileImagePublicId: superadmin.profileImagePublicId || '',
      resetOTP: superadmin.resetOTP,
      resetOTPExpiry: superadmin.resetOTPExpiry,
    });

    await newSuperAdmin.save();
    console.log(`✅ Created superadmin: ${superadmin.email} in SuperAdmin collection`);

    // Delete from AdminUser collection
    await AdminUser.findByIdAndDelete(superadmin._id);
    console.log(`✅ Deleted superadmin: ${superadmin.email} from AdminUser collection`);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateSuperAdmin();
