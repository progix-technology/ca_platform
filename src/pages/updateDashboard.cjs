const fs = require('fs');

const file = 'c:/Users/Vivang Mishra/Desktop/ca-platform/src/pages/AdminDashboard.jsx';
const lines = fs.readFileSync(file, 'utf-8').split('\n');

const newImports = `import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate, Routes, Route, useSearchParams, Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Loader2, X, Plus } from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { requestAPI, userAPI, notificationAPI } from '../services/api';

const AdminOverview = lazy(() => import('./AdminOverview'));
const ManageRequests = lazy(() => import('./ManageRequests'));
const AdminUsers = lazy(() => import('./AdminUsers'));
const SettingsCompletedList = lazy(() => import('./SettingsCompletedList'));
const AdminRenewals = lazy(() => import('./AdminRenewals'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const Subscription = lazy(() => import('./Subscription'));
const AdminAnalytics = lazy(() => import('./AdminAnalytics'));

const FallbackLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
    <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
    <p className="text-slate-500 font-medium animate-pulse">Loading component...</p>
  </div>
);
`;

const dashboardContent = lines.slice(2070).join('\n');
const newContent = newImports + '\n' + dashboardContent;

fs.writeFileSync(file, newContent, 'utf-8');
console.log('Successfully updated AdminDashboard.jsx');
