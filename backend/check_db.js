import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const AdminUser = mongoose.connection.collection('adminusers');
  const admins = await AdminUser.find({}).toArray();
  console.log("Admins:");
  admins.forEach(a => console.log(a.email, "Image:", a.profileImage ? "YES (" + a.profileImage.substring(0, 30) + "...)" : "NO"));

  const SuperAdmin = mongoose.connection.collection('superadmins');
  const superAdmins = await SuperAdmin.find({}).toArray();
  console.log("SuperAdmins:");
  superAdmins.forEach(a => console.log(a.email, "Image:", a.profileImage ? "YES" : "NO"));
  
  process.exit(0);
});
