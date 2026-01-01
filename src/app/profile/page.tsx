'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineCamera,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineArrowLeft,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, authLoading, router]);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      if (user.avatar.startsWith('http')) return user.avatar;
      return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${user.avatar}`;
    }
    return null;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('pleaseSelectImage'));
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(t('avatarUpdated'));
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('avatarRemoved'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.avatar) return;
    if (!confirm(t('removeProfilePhoto'))) return;

    setUploadingAvatar(true);
    try {
      await api.delete('/user/avatar');
      toast.success(t('avatarRemoved'));
      await refreshUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('avatarRemoved'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/user/profile', profileData);
      toast.success(response.data.message || t('profileUpdated'));
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      const message = err.response?.data?.message || t('profileUpdated');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/user/password', passwordData);
      toast.success(response.data.message || t('passwordChanged'));
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0] as string[];
        toast.error(firstError[0]);
      } else {
        toast.error(err.response?.data?.message || t('passwordChanged'));
      }
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft size={20} />
          <span>{t('backToSettings')}</span>
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with Upload */}
            <div className="relative group">
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()!}
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-[#2FB7EC] to-[#1a9fd4] rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white shadow-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Upload photo"
                >
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlineCamera size={20} />
                  )}
                </button>
                {user.avatar && (
                  <button
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove photo"
                  >
                    <HiOutlineTrash size={18} />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {t('active')}
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {t('memberSince')} {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-[#2FB7EC] border-b-2 border-[#2FB7EC] bg-[#2FB7EC]/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <HiOutlineUser size={18} />
                {t('profile')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-[#2FB7EC] border-b-2 border-[#2FB7EC] bg-[#2FB7EC]/5'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <HiOutlineLockClosed size={18} />
                {t('password')}
              </div>
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">{t('personalDetails')}</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-[#2FB7EC] hover:bg-[#2FB7EC]/10 rounded-lg transition-colors"
                  >
                    <HiOutlinePencil size={18} />
                    {t('edit')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditing(false);
                      setProfileData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HiOutlineX size={18} />
                    {t('cancel')}
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('fullName')}</label>
                  <div className="relative">
                    <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!editing}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all ${
                        editing
                          ? 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent'
                          : 'bg-gray-50 border-gray-100 text-gray-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress')}</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!editing}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all ${
                        editing
                          ? 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent'
                          : 'bg-gray-50 border-gray-100 text-gray-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('phoneNumber')}</label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!editing}
                      placeholder={editing ? '+213 XXX XXX XXX' : t('notProvided')}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all ${
                        editing
                          ? 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent'
                          : 'bg-gray-50 border-gray-100 text-gray-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Save Button */}
                {editing && (
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-[#2FB7EC] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#26a5d8] transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <HiOutlineCheck size={20} />
                          {t('saveChanges')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('changeYourPassword')}</h2>

              <form onSubmit={handlePasswordChange} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('currentPassword')}</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder={t('enterCurrentPassword')}
                      required
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPassword')}</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.password}
                      onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder={t('enterNewPassword')}
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{t('passwordMinLength')}</p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirmNewPassword')}</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#2FB7EC] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#26a5d8] transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('changing')}
                      </>
                    ) : (
                      t('changePassword')
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
