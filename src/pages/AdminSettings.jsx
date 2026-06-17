import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Loader2, CreditCard, Camera, Star } from 'lucide-react';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  const [adminAssigned, setAdminAssigned] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setStreet(user.address?.street || '');
      setCity(user.address?.city || '');
      setCountry(user.address?.country || '');
      setZipCode(user.address?.zipCode || '');
      setProfileImage(user.profileImage || '');
      setPreviewImage(user.profileImage || '');
      setAdminAssigned(user.adminAssigned !== false);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, phone, street, city, country, zipCode };
      if (profileImage !== user.profileImage) {
        payload.profileImage = profileImage;
      }
      const response = await userAPI.updateAdminSettings(payload);
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
        <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-slate-400 font-display font-medium">
                    {name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-sm ring-2 ring-white">
                <Camera size={14} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div>
              <p className="font-medium text-slate-900">Profile Picture</p>
              <p className="text-xs text-slate-500 mt-1 mb-2">JPG, JPEG or PNG. Max size 5MB.</p>
              {previewImage && profileImage !== user.profileImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewImage(user?.profileImage || '');
                    setProfileImage(user?.profileImage || '');
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Cancel Change
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="label">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-field"
                placeholder="e.g., Mumbai"
              />
            </div>
            <div>
              <label htmlFor="country" className="label">Country</label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input-field"
                placeholder="e.g., India"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="street" className="label">Street Address</label>
              <input
                type="text"
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input-field"
                placeholder="Street address"
              />
            </div>
            <div>
              <label htmlFor="zipCode" className="label">Zip/Postal Code</label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="input-field"
                placeholder="Zip Code"
              />
            </div>
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

      {/* Subscription Card */}
      <div className="card border-blue-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <div>
            <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              Subscription Plan
            </h2>
            <p className="text-xs text-slate-500 mt-1">Manage your active subscription</p>
          </div>
          <Link to="/admin/plans" className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-md shadow-sm border border-slate-200">
            View Plans
          </Link>
        </div>
        <div className="p-6">
          {user?.subscription?.status === 'active' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
                <p className="text-lg font-bold text-slate-800">{user.subscription.planName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valid Until</p>
                <p className="text-sm font-medium text-slate-800">
                  {user.subscription.endDate ? new Date(user.subscription.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="text-slate-400" size={24} />
              </div>
              <p className="text-slate-600 font-medium mb-1">No Active Subscription</p>
              <p className="text-slate-500 text-sm mb-4">You need an active plan to use premium features.</p>
              <Link to="/admin/plans" className="btn-primary inline-flex items-center gap-2">
                Choose a Plan
              </Link>
            </div>
          )}
        </div>
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

      {/* Client Feedbacks */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" />
              Client Feedbacks
            </h2>
            <p className="text-xs text-slate-400 mt-1">What your clients are saying about your services</p>
          </div>
        </div>
        <div className="p-6">
          {user?.feedbacks && user.feedbacks.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {[...user.feedbacks].reverse().map((feedback, idx) => (
                <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-800">{feedback.serviceName}</h4>
                      <p className="text-xs text-slate-500">By {feedback.userName} on {new Date(feedback.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="flex text-yellow-400 text-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={feedback.rating >= star ? 'text-yellow-400' : 'text-slate-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 italic">"{feedback.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="text-slate-300 mx-auto mb-3" size={32} />
              <p className="text-slate-500 font-medium">No feedbacks yet.</p>
              <p className="text-xs text-slate-400 mt-1">Complete requests to start receiving feedback from your clients.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
