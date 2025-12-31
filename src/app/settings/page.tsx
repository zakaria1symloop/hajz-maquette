'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineBell,
  HiOutlineGlobe,
  HiOutlineTrash,
  HiOutlineChevronRight,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineMoon,
} from 'react-icons/hi';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    promotions: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.error('Account deletion is not available yet');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  if (!user) return null;

  const getAvatarUrl = () => {
    if (user.avatar) {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${user.avatar}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()!}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-[#2FB7EC] to-[#1a9fd4] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <HiOutlineChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Account</h2>
          </div>

          <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <HiOutlineUser size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Personal Information</p>
                <p className="text-sm text-gray-500">Update your profile details</p>
              </div>
            </div>
            <HiOutlineChevronRight size={20} className="text-gray-400" />
          </Link>

          <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <HiOutlineLockClosed size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Password & Security</p>
                <p className="text-sm text-gray-500">Manage your password</p>
              </div>
            </div>
            <HiOutlineChevronRight size={20} className="text-gray-400" />
          </Link>

          <Link href="/reservations" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <HiOutlineShieldCheck size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">My Reservations</p>
                <p className="text-sm text-gray-500">View your booking history</p>
              </div>
            </div>
            <HiOutlineChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Preferences</h2>
          </div>

          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <HiOutlineBell size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Manage notification preferences</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2FB7EC]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <HiOutlineGlobe size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Language</p>
                <p className="text-sm text-gray-500">English</p>
              </div>
            </div>
            <HiOutlineChevronRight size={20} className="text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <HiOutlineMoon size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer opacity-50">
              <input type="checkbox" disabled className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Session</h2>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <HiOutlineLogout size={20} className="text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Logout</p>
                <p className="text-sm text-gray-500">Sign out of your account</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <HiOutlineTrash size={20} className="text-red-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account</p>
              </div>
            </div>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>Hajz v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
