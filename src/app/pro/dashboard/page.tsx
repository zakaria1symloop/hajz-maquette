'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth, BusinessType } from '@/context/ProAuthContext';
import api from '@/lib/api';
import { HiOutlineHome, HiOutlineLogout, HiOutlinePlus, HiOutlineOfficeBuilding, HiOutlineCurrencyDollar, HiOutlineClipboardList, HiOutlineCog, HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaHotel, FaUtensils, FaCar } from 'react-icons/fa';

const businessConfig: Record<BusinessType, { name: string; icon: any; color: string; bgColor: string }> = {
  hotel: { name: 'Hotel', icon: FaHotel, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  restaurant: { name: 'Restaurant', icon: FaUtensils, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  car_rental: { name: 'Car Rental', icon: FaCar, color: 'text-green-600', bgColor: 'bg-green-50' },
};

interface DashboardStats {
  activeBookings: number;
  totalRevenue: number;
}

export default function ProDashboard() {
  const router = useRouter();
  const { owner, businessType, loading, logout, hotelOwner, hotel } = useProAuth();
  const [stats, setStats] = useState<DashboardStats>({ activeBookings: 0, totalRevenue: 0 });

  useEffect(() => {
    if (!loading && !owner) {
      router.push('/pro/login');
    }
  }, [loading, owner, router]);

  const config = businessType ? businessConfig[businessType] : businessConfig.hotel;
  const business = businessType === 'hotel' ? owner?.hotel : businessType === 'restaurant' ? owner?.restaurant : owner?.company;

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!business || !businessType) return;

      try {
        const token = localStorage.getItem('pro_token');

        if (businessType === 'car_rental') {
          // Fetch car rental stats
          const statsRes = await api.get('/company-owner/company/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });

          setStats({
            activeBookings: (statsRes.data.pending_bookings || 0) + (statsRes.data.active_rentals || 0),
            totalRevenue: statsRes.data.monthly_revenue || 0,
          });
        } else {
          const apiPrefix = businessType === 'hotel' ? '/hotel-owner' : '/restaurant-owner';

          // Fetch reservation stats and wallet in parallel
          const [statsRes, walletRes] = await Promise.all([
            api.get(`${apiPrefix}/reservations/stats`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { today: { confirmed: 0, pending: 0 } } })),
            api.get(`${apiPrefix}/wallet`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { wallet: { total_earned: 0 }, stats: { total_earned: 0 } } }))
          ]);

          const statsData = statsRes.data;
          const walletData = walletRes.data;

          setStats({
            activeBookings: (statsData.today?.confirmed || 0) + (statsData.today?.pending || 0),
            totalRevenue: walletData.wallet?.total_earned || walletData.stats?.total_earned || 0,
          });
        }
      } catch (err) {
        // Silently handle - stats will show 0
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, [business, businessType]);

  const handleLogout = async () => {
    await logout();
    router.push('/pro/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  if (!owner) return null;

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/pro/dashboard" className="flex items-center gap-3">
            <div className={`w-9 h-9 ${config.bgColor} rounded-lg flex items-center justify-center`}>
              <Icon size={18} className={config.color} />
            </div>
            <span className="font-bold text-lg text-gray-900">Hajz Pro</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <Link
            href="/pro/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${config.bgColor} ${config.color} font-medium`}
          >
            <HiOutlineHome size={20} />
            Dashboard
          </Link>

          {businessType === 'hotel' && (
            hotel ? (
              <>
                <Link href="/pro/hotel" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineOfficeBuilding size={20} />
                  My Hotel
                </Link>
                <Link href="/pro/rooms" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlinePlus size={20} />
                  Rooms
                </Link>
                <Link href="/pro/reservations" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineClipboardList size={20} />
                  Reservations
                </Link>
                <Link href="/pro/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineCurrencyDollar size={20} />
                  Wallet
                </Link>
              </>
            ) : (
              <Link href="/pro/hotel/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <HiOutlinePlus size={20} />
                Add Hotel
              </Link>
            )
          )}

          {businessType === 'restaurant' && (
            business ? (
              <>
                <Link href="/pro/restaurant" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <FaUtensils size={20} />
                  My Restaurant
                </Link>
                <Link href="/pro/plats" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlinePlus size={20} />
                  Menu / Plats
                </Link>
                <Link href="/pro/tables" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineOfficeBuilding size={20} />
                  Tables
                </Link>
                <Link href="/pro/table-reservations" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineClipboardList size={20} />
                  Reservations
                </Link>
                <Link href="/pro/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineCurrencyDollar size={20} />
                  Wallet
                </Link>
              </>
            ) : (
              <Link href="/pro/restaurant/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <HiOutlinePlus size={20} />
                Add Restaurant
              </Link>
            )
          )}

          {businessType === 'car_rental' && (
            business ? (
              <>
                <Link href="/pro/company" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <FaCar size={20} />
                  My Company
                </Link>
                <Link href="/pro/cars" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlinePlus size={20} />
                  Cars
                </Link>
                <Link href="/pro/car-bookings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineClipboardList size={20} />
                  Bookings
                </Link>
                <Link href="/pro/wallet" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                  <HiOutlineCurrencyDollar size={20} />
                  Wallet
                </Link>
              </>
            ) : (
              <Link href="/pro/company/create" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <HiOutlinePlus size={20} />
                Add Company
              </Link>
            )
          )}

          <Link
            href="/pro/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <HiOutlineCog size={20} />
            Settings
          </Link>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center ${config.color}`}>
              {owner?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{owner?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{owner?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <HiOutlineLogout size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {owner?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-gray-500 mt-1">Manage your {config.name.toLowerCase()} and bookings</p>
        </div>

        {/* No Business Alert */}
        {!business && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <HiOutlineExclamationCircle size={24} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Complete Your Profile</h3>
                <p className="text-amber-700 text-sm mb-4">
                  You haven't added your {config.name.toLowerCase()} yet. Add your {config.name.toLowerCase()} information to start receiving bookings.
                </p>
                <Link
                  href={`/pro/${businessType === 'hotel' ? 'hotel' : businessType === 'restaurant' ? 'restaurant' : 'company'}/create`}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-amber-700 transition-colors"
                >
                  <HiOutlinePlus size={18} />
                  Add Your {config.name}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Business Summary */}
        {business && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className={config.color} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (business.status === 'verified' || business.verification_status === 'verified') ? 'bg-green-100 text-green-700' :
                  (business.status === 'pending' || business.verification_status === 'pending') ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {business.status || business.verification_status || 'Active'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{business.name}</h3>
              <p className="text-sm text-gray-500">{business.city || business.address}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <HiOutlineClipboardList size={24} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.activeBookings}</h3>
              <p className="text-sm text-gray-500">Active Bookings</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <HiOutlineCurrencyDollar size={24} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} DZD</h3>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {business ? (
              <>
                {businessType === 'hotel' && (
                  <>
                    <Link href="/pro/rooms/create" className={`flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:${config.bgColor} transition-colors group`}>
                      <HiOutlinePlus size={24} className={`text-gray-400 group-hover:${config.color}`} />
                      <span className="text-sm font-medium">Add Room</span>
                    </Link>
                    <Link href="/pro/hotel" className={`flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:${config.bgColor} transition-colors group`}>
                      <HiOutlineOfficeBuilding size={24} className={`text-gray-400 group-hover:${config.color}`} />
                      <span className="text-sm font-medium">Edit Hotel</span>
                    </Link>
                    <Link href="/pro/reservations" className={`flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:${config.bgColor} transition-colors group`}>
                      <HiOutlineClipboardList size={24} className={`text-gray-400 group-hover:${config.color}`} />
                      <span className="text-sm font-medium">View Bookings</span>
                    </Link>
                    <Link href="/pro/wallet" className={`flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:${config.bgColor} transition-colors group`}>
                      <HiOutlineCurrencyDollar size={24} className={`text-gray-400 group-hover:${config.color}`} />
                      <span className="text-sm font-medium">Wallet</span>
                    </Link>
                  </>
                )}
                {businessType === 'restaurant' && (
                  <>
                    <Link href="/pro/plats" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
                      <FaUtensils size={24} className="text-gray-400 group-hover:text-orange-600" />
                      <span className="text-sm font-medium">Manage Menu</span>
                    </Link>
                    <Link href="/pro/tables" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
                      <HiOutlineOfficeBuilding size={24} className="text-gray-400 group-hover:text-orange-600" />
                      <span className="text-sm font-medium">Manage Tables</span>
                    </Link>
                    <Link href="/pro/table-reservations" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
                      <HiOutlineClipboardList size={24} className="text-gray-400 group-hover:text-orange-600" />
                      <span className="text-sm font-medium">Reservations</span>
                    </Link>
                    <Link href="/pro/wallet" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors group">
                      <HiOutlineCurrencyDollar size={24} className="text-gray-400 group-hover:text-orange-600" />
                      <span className="text-sm font-medium">Wallet</span>
                    </Link>
                  </>
                )}
                {businessType === 'car_rental' && (
                  <>
                    <Link href="/pro/cars/create" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
                      <HiOutlinePlus size={24} className="text-gray-400 group-hover:text-green-600" />
                      <span className="text-sm font-medium">Add Car</span>
                    </Link>
                    <Link href="/pro/company" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
                      <FaCar size={24} className="text-gray-400 group-hover:text-green-600" />
                      <span className="text-sm font-medium">Edit Company</span>
                    </Link>
                    <Link href="/pro/car-bookings" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
                      <HiOutlineClipboardList size={24} className="text-gray-400 group-hover:text-green-600" />
                      <span className="text-sm font-medium">Bookings</span>
                    </Link>
                    <Link href="/pro/wallet" className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group">
                      <HiOutlineCurrencyDollar size={24} className="text-gray-400 group-hover:text-green-600" />
                      <span className="text-sm font-medium">Wallet</span>
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link
                href={`/pro/${businessType === 'hotel' ? 'hotel' : businessType === 'restaurant' ? 'restaurant' : 'company'}/create`}
                className={`col-span-2 md:col-span-4 flex flex-col items-center gap-3 p-8 ${config.bgColor} border-2 border-dashed rounded-xl hover:opacity-80 transition-colors ${config.color}`}
              >
                <HiOutlinePlus size={32} />
                <span className="font-medium">Add Your First {config.name}</span>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
