import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const plans = [
  {
    name: 'trial',
    price: 0,
    durationMonths: 1,
    docLimit: 2,
    allowedTiers: ['basic'],
    requestLimitPerMonth: 2,
  },
  {
    name: 'basic',
    price: 499,
    durationMonths: 1,
    docLimit: 5,
    allowedTiers: ['basic'],
    requestLimitPerMonth: 6,
  },
  {
    name: 'pro',
    price: 2499,
    durationMonths: 6,
    docLimit: 20,
    allowedTiers: ['basic', 'pro'],
    requestLimitPerMonth: -1, // Unlimited
  },
  {
    name: 'premium',
    price: 4999,
    durationMonths: 12,
    docLimit: 1000, // Effectively unlimited
    allowedTiers: ['basic', 'pro', 'premium'],
    requestLimitPerMonth: -1, // Unlimited
  },
];

const seedPlans = async () => {
  try {
    await connectDB();

    for (const planData of plans) {
      await Plan.findOneAndUpdate(
        { name: planData.name },
        planData,
        { upsert: true, new: true }
      );
    }

    console.log('Plans seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error.message);
    process.exit(1);
  }
};

seedPlans();
