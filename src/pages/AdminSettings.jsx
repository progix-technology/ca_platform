import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminAssigned, setAdminAssigned] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAdminAssigned(user.adminAssigned !== false);
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await userAPI.updateAdminSettings({ name, phone });
      // Response structure: { success, message, data: { admin: {...} } }
      const updatedUser = response.data?.data?.admin;
      if (updatedUser) {
        updateUser({ ...user, ...updatedUser });
      }
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (e) => {
    const isChecked = e.target.checked;
    setAdminAssigned(isChecked);
    try {
      const response = await userAPI.updateAdminSettings({ adminAssigned: isChecked });
      // Response structure: { success, message, data: { admin: {...} } }
      const updatedUser = response.data?.data?.admin;
      if (updatedUser) {
        updateUser({ ...user, ...updatedUser });
      }
      toast.success(`Availability ${isChecked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Availability update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update availability');
      setAdminAssigned(!isChecked);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await userAPI.changeAdminPassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile, availability, and security settings</p>
      </div>

      {/* Profile Information Card */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-900">Profile Information</h2>
          <p className="text-xs text-slate-400 mt-1">Update your name and contact information</p>
        </div>
        <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="Enter your phone number"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Availability Card */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-900">Availability Status</h2>
          <p className="text-xs text-slate-400 mt-1">Toggle to enable/disable receiving new service requests</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Accept New Requests</p>
              <p className="text-xs text-slate-500 mt-1">
                {adminAssigned ? '✅ Currently available to receive requests' : '⏸️ Not accepting new requests'}
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={adminAssigned}
                onChange={handleAvailabilityChange}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                adminAssigned ? 'bg-emerald-500' : 'bg-slate-300'
              }`}>
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    adminAssigned ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-900">Change Password</h2>
          <p className="text-xs text-slate-400 mt-1">Update your account password for security</p>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="current-password" className="label">
                Current Password
              </label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="label">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Security Info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">🔒 Security Tip</p>
            <p className="text-xs text-blue-700 mt-1">
              Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
