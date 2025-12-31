'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { IoShieldCheckmark, IoEyeOutline, IoEyeOffOutline, IoBedOutline, IoRestaurantOutline, IoCarOutline } from 'react-icons/io5';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/login', formData);
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#2FB7EC]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <IoBedOutline className="absolute top-20 left-[15%] text-[#2FB7EC]/20 animate-bounce" size={40} style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <IoRestaurantOutline className="absolute top-40 right-[20%] text-orange-500/20 animate-bounce" size={35} style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
        <IoCarOutline className="absolute bottom-32 left-[25%] text-green-500/20 animate-bounce" size={45} style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
        <IoBedOutline className="absolute bottom-20 right-[15%] text-[#2FB7EC]/15 animate-bounce" size={30} style={{ animationDelay: '1.5s', animationDuration: '3.2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#2FB7EC] via-[#2FB7EC] to-blue-600 rounded-2xl mb-4 shadow-lg shadow-[#2FB7EC]/25 transform hover:scale-105 transition-transform">
            <IoShieldCheckmark className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-[#2FB7EC] to-blue-400 bg-clip-text text-transparent">Hajz</span> Admin
          </h1>
          <p className="text-gray-400">Manage your platform with ease</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]/50 focus:border-[#2FB7EC]/50 transition-all"
                placeholder="admin@hajz.dz"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]/50 focus:border-[#2FB7EC]/50 transition-all pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#2FB7EC] to-blue-600 text-white font-semibold rounded-xl hover:from-[#2FB7EC]/90 hover:to-blue-600/90 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]/50 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2FB7EC]/25 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <IoBedOutline className="text-[#2FB7EC]" />
                <span>Hotels</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <IoRestaurantOutline className="text-orange-500" />
                <span>Restaurants</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <IoCarOutline className="text-green-500" />
                <span>Cars</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-[#2FB7EC] transition-colors">
            Back to main site
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Hajz Platform - All rights reserved
        </p>
      </div>
    </div>
  );
}
