'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineUser, HiOutlineLockClosed, HiOutlineBell, HiOutlineTrash, HiOutlineCheck, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { BsBriefcase } from 'react-icons/bs';
import { FaUtensils, FaHotel, FaCar } from 'react-icons/fa';

export default function SettingsPage() {
  const router = useRouter();
  const { hotelOwner, restaurantOwner, companyOwner, hotel, restaurant, company, loading, logout, businessType, refreshHotel, refreshRestaurant, refreshCompany } = useProAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'password' | 'notifications'>('profile');
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Determine the current owner and business
  const owner = businessType === 'hotel' ? hotelOwner : businessType === 'restaurant' ? restaurantOwner : companyOwner;
  const business = businessType === 'hotel' ? hotel : businessType === 'restaurant' ? restaurant : company;
  const isHotel = businessType === 'hotel';
  const isCarRental = businessType === 'car_rental';
  const themeColor = isHotel ? '#2FB7EC' : isCarRental ? '#22C55E' : '#F97316';

  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    business_license: '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_new_booking: true,
    email_booking_cancelled: true,
    email_payment_received: true,
    email_review_received: true,
  });

  useEffect(() => {
    if (!loading && !owner) {
      router.push('/pro/login');
    }
    if (owner) {
      setProfileData({
        name: owner.name || '',
        email: owner.email || '',
        phone: owner.phone || '',
        business_license: owner.business_license || '',
      });
    }
  }, [loading, owner, router]);

  const getApiPrefix = () => isHotel ? '/hotel-owner' : isCarRental ? '/company-owner' : '/restaurant-owner';

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`${getApiPrefix()}/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`${getApiPrefix()}/password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`${getApiPrefix()}/notifications`, notifications, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification settings updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getBusinessTypeName = () => isHotel ? 'hotel' : isCarRental ? 'company' : 'restaurant';
  const getBusinessTypeLabel = () => isHotel ? 'Hotel' : isCarRental ? 'Company' : 'Restaurant';

  const handleToggleBusinessStatus = async () => {
    if (!business) return;

    const newStatus = !business.is_active;
    const action = newStatus ? 'open' : 'close';
    const businessLabel = getBusinessTypeLabel().toLowerCase();

    const confirmed = confirm(
      `Are you sure you want to ${action} your ${businessLabel}? ${
        !newStatus
          ? 'Customers will see it as "Not Available" but it will still be visible in listings.'
          : 'Customers will be able to make bookings again.'
      }`
    );

    if (!confirmed) return;

    setTogglingStatus(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`${getApiPrefix()}/${getBusinessTypeName()}`, {
        is_active: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh the business data
      if (isHotel && refreshHotel) {
        await refreshHotel();
      } else if (isCarRental && refreshCompany) {
        await refreshCompany();
      } else if (refreshRestaurant) {
        await refreshRestaurant();
      }

      toast.success(`${getBusinessTypeLabel()} is now ${newStatus ? 'open' : 'closed'} for bookings!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleDeleteAccount = async () => {
    const dataType = isHotel ? 'rooms' : isCarRental ? 'cars' : 'tables';
    const confirmed = confirm(
      `Are you sure you want to delete your account? This action cannot be undone and will remove all your ${getBusinessTypeLabel().toLowerCase()} data, ${dataType}, and reservations.`
    );
    if (!confirmed) return;

    const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`${getApiPrefix()}/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account deleted successfully');
      await logout();
      router.push('/pro/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: themeColor }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pro/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <HiOutlineArrowLeft size={20} />
              Dashboard
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                {isHotel ? <FaHotel size={14} className="text-white" /> : isCarRental ? <FaCar size={14} className="text-white" /> : <FaUtensils size={14} className="text-white" />}
              </div>
              <span className="font-semibold text-gray-900">Settings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'profile' ? { color: themeColor, borderColor: themeColor } : {}}
            >
              <HiOutlineUser size={18} />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'business'
                  ? 'border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'business' ? { color: themeColor, borderColor: themeColor } : {}}
            >
              <HiOutlineOfficeBuilding size={18} />
              Business
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'password'
                  ? 'border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'password' ? { color: themeColor, borderColor: themeColor } : {}}
            >
              <HiOutlineLockClosed size={18} />
              Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === 'notifications' ? { color: themeColor, borderColor: themeColor } : {}}
            >
              <HiOutlineBell size={18} />
              Notifications
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': themeColor } as any}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  placeholder="+213 XXX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business License Number</label>
                <input
                  type="text"
                  value={profileData.business_license}
                  onChange={(e) => setProfileData({ ...profileData, business_license: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  placeholder="Optional"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? 'Saving...' : (
                    <>
                      <HiOutlineCheck size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="p-6 space-y-6">
              {/* Business Status Card */}
              <div className={`p-6 rounded-xl ${business?.is_active ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${business?.is_active ? 'text-green-700' : 'text-red-700'}`}>
                      {business?.is_active ? 'Open for Bookings' : 'Closed for Bookings'}
                    </h3>
                    <p className={`text-sm mt-1 ${business?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {business?.is_active
                        ? 'Customers can make reservations at your ' + getBusinessTypeLabel().toLowerCase()
                        : 'Your ' + getBusinessTypeLabel().toLowerCase() + ' is visible but shows as "Not Available"'
                      }
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${business?.is_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                </div>
              </div>

              {/* Toggle Button */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Accept Bookings</p>
                  <p className="text-sm text-gray-500">
                    {business?.is_active
                      ? 'Turn off to stop accepting new bookings'
                      : 'Turn on to start accepting bookings again'
                    }
                  </p>
                </div>
                <button
                  onClick={handleToggleBusinessStatus}
                  disabled={togglingStatus}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                    business?.is_active ? 'bg-green-500' : 'bg-gray-300'
                  } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      business?.is_active ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Business Info Summary */}
              {business && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Business Information</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium text-gray-900">{business.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.verification_status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : business.verification_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {business.verification_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">City</span>
                      <span className="font-medium text-gray-900">{business.city}</span>
                    </div>
                    {isHotel && hotel && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rooms</span>
                        <span className="font-medium text-gray-900">{hotel.rooms_available || 0} available</span>
                      </div>
                    )}
                    {isCarRental && company && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cars</span>
                        <span className="font-medium text-gray-900">{(company as any).cars_count || 0} listed</span>
                      </div>
                    )}
                    {!isHotel && !isCarRental && restaurant && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tables</span>
                        <span className="font-medium text-gray-900">{restaurant.total_tables || 0} total</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <Link
                      href={isHotel ? '/pro/hotel' : isCarRental ? '/pro/company' : '/pro/restaurant'}
                      className="text-sm font-medium hover:underline"
                      style={{ color: themeColor }}
                    >
                      Edit {getBusinessTypeLabel()} Details →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? 'Changing...' : (
                    <>
                      <HiOutlineLockClosed size={18} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationsSubmit} className="p-6 space-y-6">
              <p className="text-gray-600 text-sm">
                Choose which email notifications you'd like to receive.
              </p>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">New Booking</p>
                    <p className="text-sm text-gray-500">Get notified when someone makes a {isHotel ? 'room' : isCarRental ? 'car' : 'table'} reservation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_new_booking}
                    onChange={(e) => setNotifications({ ...notifications, email_new_booking: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ accentColor: themeColor }}
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Booking Cancelled</p>
                    <p className="text-sm text-gray-500">Get notified when a booking is cancelled</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_booking_cancelled}
                    onChange={(e) => setNotifications({ ...notifications, email_booking_cancelled: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ accentColor: themeColor }}
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Payment Received</p>
                    <p className="text-sm text-gray-500">Get notified when payment is received</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_payment_received}
                    onChange={(e) => setNotifications({ ...notifications, email_payment_received: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ accentColor: themeColor }}
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">New Review</p>
                    <p className="text-sm text-gray-500">Get notified when someone leaves a review</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_review_received}
                    onChange={(e) => setNotifications({ ...notifications, email_review_received: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                    style={{ accentColor: themeColor }}
                  />
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? 'Saving...' : (
                    <>
                      <HiOutlineCheck size={18} />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-2xl border border-red-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
            <p className="text-gray-600 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <HiOutlineTrash size={18} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
