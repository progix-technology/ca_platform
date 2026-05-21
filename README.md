# CA Platform

A comprehensive admin management platform built with modern web technologies, designed for managing services, requests, subscriptions, and user authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### User Management
- Multi-role user system (Super Admin, Admin, Regular User)
- JWT-based authentication
- Email verification and password reset
- User profile management

### Service Management
- Dynamic service creation and management
- Service categorization
- Service availability control

### Request Management
- Service request submission and tracking
- Request status monitoring (Pending, In Progress, Completed)
- Request renewal capability
- Automated reminders for renewing requests

### Subscription Management
- Multiple subscription plans
- Subscription lifecycle management
- Automatic renewal tracking

### Billing & Invoicing
- Invoice generation and management
- Payment tracking
- Digital invoice downloads

### Notifications
- Email notifications
- SMS notifications (via Twilio)
- Real-time notification system

### Admin Dashboard
- Comprehensive admin controls
- User management
- Service management
- Request oversight
- Analytics and reporting

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **UI/Styling**: Tailwind CSS, PostCSS
- **State Management**: React Context API
- **Build Tool**: Vite
- **Electron**: Desktop application wrapper

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Upload**: Cloudinary (Image/File storage)
- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio
- **Task Scheduling**: node-cron

### Development Tools
- **Linting**: ESLint
- **Package Manager**: npm
- **Version Control**: Git

---

## 📁 Project Structure

```
ca-platform/
├── src/                          # Frontend React application
│   ├── components/              # Reusable React components
│   ├── pages/                   # Page components
│   ├── layout/                  # Layout components
│   ├── services/                # API service functions
│   ├── context/                 # React Context providers
│   ├── assets/                  # Images, icons, static files
│   ├── constants/               # Global constants
│   ├── style/                   # CSS files
│   ├── App.jsx                  # Main App component
│   └── main.jsx                 # Entry point
│
├── backend/                      # Node.js/Express backend
│   ├── server.js                # Main server file
│   ├── config/
│   │   ├── db.js               # MongoDB configuration
│   │   └── cloudinary.js        # Cloudinary setup
│   │
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── requestController.js
│   │   ├── serviceController.js
│   │   ├── subscriptionController.js
│   │   ├── invoiceController.js
│   │   └── notificationController.js
│   │
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── AdminUser.js
│   │   ├── SuperAdmin.js
│   │   ├── RegularUser.js
│   │   ├── Request.js
│   │   ├── Service.js
│   │   ├── Subscription.js
│   │   ├── Plan.js
│   │   └── Notification.js
│   │
│   ├── routes/                  # API route definitions
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   ├── invoiceRoutes.js
│   │   └── notificationRoutes.js
│   │
│   ├── middleware/              # Express middleware
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── adminMiddleware.js   # Admin role check
│   │   ├── uploadMiddleware.js  # File upload handling
│   │   ├── validateMiddleware.js # Input validation
│   │   └── errorMiddleware.js   # Global error handling
│   │
│   ├── utils/                   # Utility functions
│   │   ├── asyncHandler.js
│   │   ├── apiResponse.js
│   │   ├── apiError.js
│   │   ├── email.js
│   │   ├── sms.js
│   │   ├── logger.js
│   │   ├── serviceCategories.js
│   │   ├── reminderScheduler.js
│   │   └── createAdmin.js
│   │
│   ├── scripts/                 # Database scripts
│   │   ├── seedAdmin.js
│   │   ├── seedPlans.js
│   │   ├── moveAdminsToAdminCollection.js
│   │   └── ... (various data migration scripts)
│   │
│   ├── .env                     # Environment variables (NOT in git)
│   ├── .env.example             # Example environment template
│   └── package.json             # Node dependencies
│
├── public/                       # Static assets
├── dist_electron/               # Built Electron application
├── .gitignore                   # Git ignore rules
├── package.json                 # Root package.json
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── eslint.config.js            # ESLint configuration
└── README.md                   # This file
```

---

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (Local or Atlas cloud) - [Setup Guide](https://www.mongodb.com/docs/manual/installation/)
- **Git** - [Download](https://git-scm.com/)

### Required Accounts
- **MongoDB Atlas** (for database)
- **Cloudinary** (for image/file storage)
- **Gmail** (for SMTP email service)
- **Twilio** (for SMS service)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ca-platform.git
cd ca-platform
```

### 2. Install Root Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 4. Configure Environment Variables

#### Root `./.env`
```env
VITE_API_URL=http://localhost:5001/api
MONGO_URI=mongodb://127.0.0.1:27017/ca_platform
```

#### Backend `./backend/.env`
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=your_very_strong_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Gmail)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin Credentials (for initial setup)
ADMIN_EMAIL=superadmin@gmail.com
ADMIN_PASSWORD=your_secure_password
ADMIN_ROLE=superadmin
```

---

## ⚙️ Configuration

### MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a cluster
3. Add database user credentials
4. Whitelist your IP
5. Get connection string and add to `.env`

### Cloudinary Setup
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add to `.env`

### Gmail SMTP Setup
1. Enable 2-Factor Authentication on Gmail
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `.env` (not your regular Gmail password)

### Twilio Setup (for SMS)
1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Add to `.env` (if not already configured)

---

## 🏃 Running the Application

### Development Mode

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5001
```

#### Terminal 2 - Start Frontend Development Server
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

#### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api

### Production Mode

#### Build Frontend
```bash
npm run build
```

#### Build Electron App
```bash
npm run electron:build
```

#### Run Backend in Production
```bash
cd backend
NODE_ENV=production npm start
```

---

## 📡 API Routes

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh JWT token
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### User Routes (`/api/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /all` - Get all users (Admin only)
- `GET /:id` - Get user by ID
- `DELETE /:id` - Delete user (Admin only)

### Service Routes (`/api/services`)
- `GET /` - Get all services
- `POST /` - Create new service (Admin only)
- `PUT /:id` - Update service (Admin only)
- `DELETE /:id` - Delete service (Admin only)
- `GET /category/:category` - Get services by category

### Request Routes (`/api/requests`)
- `GET /` - Get user's requests
- `POST /` - Create new request
- `GET /:id` - Get request details
- `PUT /:id` - Update request (Admin only)
- `DELETE /:id` - Delete request (Admin only)
- `POST /:id/renew` - Renew a request

### Subscription Routes (`/api/subscriptions`)
- `GET /` - Get user subscriptions
- `POST /` - Create subscription
- `GET /:id` - Get subscription details
- `PUT /:id` - Update subscription (Admin only)
- `DELETE /:id` - Cancel subscription

### Invoice Routes (`/api/invoices`)
- `GET /` - Get invoices
- `GET /:id` - Get invoice details
- `POST /` - Generate invoice (Admin only)
- `GET /:id/download` - Download invoice PDF

### Notification Routes (`/api/notifications`)
- `GET /` - Get user notifications
- `PUT /:id/read` - Mark notification as read
- `DELETE /:id` - Delete notification

---

## 🗄️ Database Models

### User Model
- Base user schema with email, password, profile info
- Role-based access control

### AdminUser Model
- Extends User for admin-specific data
- Permissions management

### SuperAdmin Model
- Full system access
- User and admin management

### RegularUser Model
- Standard user with service request access

### Request Model
- Service request with status tracking
- Renewal management
- Request history

### Service Model
- Service definition
- Category classification
- Availability status

### Subscription Model
- Plan selection
- Auto-renewal settings
- Payment tracking

### Plan Model
- Subscription plan details
- Pricing and duration

### Notification Model
- User notifications
- Read/unread status
- Type (email, SMS, in-app)

---

## 🛠️ Scripts

### Backend Database Scripts
```bash
# Seed admin users
node backend/scripts/seedAdmin.js

# Seed subscription plans
node backend/scripts/seedPlans.js

# Check admin status
node backend/scripts/checkAdminStatus.js

# Fix admin access
node backend/scripts/fixAdminAccess.js

# Migrate admins to admin collection
node backend/scripts/moveAdminsToAdminCollection.js

# Normalize service categories
node backend/scripts/normalizeServiceCategories.js
```

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

### Coding Standards
- Follow ESLint configuration
- Use meaningful variable/function names
- Add comments for complex logic
- Write modular, reusable code

---

## 📝 License

This project is proprietary and confidential. All rights reserved.

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or Atlas is accessible
- Check IP whitelist in MongoDB Atlas
- Verify connection string in `.env`

### Cloudinary Upload Errors
- Verify API credentials are correct
- Check Cloudinary console for account status
- Ensure file size limits are respected

### Email/SMS Not Sending
- Verify SMTP credentials for Gmail
- Check Twilio account balance and credentials
- Review application logs for detailed errors

### Port Already in Use
```bash
# Find and kill process using port 5001 (Windows)
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# For port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## 📞 Support

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include error logs and reproduction steps

---

## 🔐 Security Notes

- **Never commit `.env` files** to Git
- Rotate API keys and credentials regularly
- Use strong passwords and JWT secrets
- Keep dependencies updated
- Review logs regularly for suspicious activity
- Use HTTPS in production

---

**Last Updated**: May 2026  
**Version**: 1.0.0
