import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { sendResponse } from './utils/apiResponse.js';
import { hasCloudinaryConfig, initCloudinary } from './config/cloudinary.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import invoiceRoutes from './routes/invoiceRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

// Start reminder scheduler
import './utils/reminderScheduler.js';

connectDB();

if (hasCloudinaryConfig()) {
  try {
    initCloudinary();
    console.log('Cloudinary configured for profile image uploads');
  } catch (error) {
    console.warn(`Cloudinary config error: ${error.message}`);
  }
} else {
  console.warn('Cloudinary credentials are missing. Profile image uploads will fail until configured.');
}

const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);

if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  throw new Error('CLIENT_URL must be set in production to restrict CORS access');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow access from this origin'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  sendResponse(res, 200, true, 'Server is healthy', {
    uptime: process.uptime(),
  });
});

app.use('/api/invoice', invoiceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/requests', requestRoutes);
// Removed stray open curly brace and custom error handler
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


