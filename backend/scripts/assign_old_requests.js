import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Request from '../models/Request.js';
import AdminUser from '../models/AdminUser.js';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ca_platform';

const assignOldRequests = async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to database.');

    // 1. Find all active admins
    const admins = await AdminUser.find({ adminAssigned: true }).select('_id');
    if (!admins.length) {
      console.log('No active admins found. Cannot assign requests.');
      return;
    }
    console.log(`Found ${admins.length} active admins.`);

    // 2. Find all unassigned requests that are not completed or rejected
    const unassignedRequests = await Request.find({
      assignedTo: null,
      status: { $nin: ['Completed', 'Rejected'] },
    });

    if (!unassignedRequests.length) {
      console.log('No unassigned requests to process.');
      return;
    }
    console.log(`Found ${unassignedRequests.length} unassigned requests to distribute.`);

    // 3. Distribute requests using the "Least Active" logic
    for (const request of unassignedRequests) {
      // Count active requests for each admin
      const activeRequestCounts = await Promise.all(
        admins.map(admin =>
          Request.countDocuments({
            assignedTo: admin._id,
            status: { $nin: ['Completed', 'Rejected'] },
          })
        )
      );

      // Find the admin with the minimum number of active requests
      let leastBusyAdminIndex = 0;
      for (let i = 1; i < activeRequestCounts.length; i++) {
        if (activeRequestCounts[i] < activeRequestCounts[leastBusyAdminIndex]) {
          leastBusyAdminIndex = i;
        }
      }

      const assignedAdmin = admins[leastBusyAdminIndex];
      request.assignedTo = assignedAdmin._id;
      await request.save();

      console.log(`Assigned Request REQ-${request._id.toString().slice(-6).toUpperCase()} to Admin ID: ${assignedAdmin._id}`);
    }

    console.log('Successfully assigned all old requests.');

  } catch (error) {
    console.error('An error occurred during the assignment script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

assignOldRequests();
