'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  IoGridOutline,
  IoPersonOutline,
  IoBriefcaseOutline,
  IoBedOutline,
  IoRestaurantOutline,
  IoCarOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoSettingsOutline,
  IoShieldCheckmark,
  IoLogOutOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoChevronDownOutline,
  IoLocationOutline,
} from 'react-icons/io5';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/admin/me');
        setAdmin(response.data.admin);
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    try {
      await api.post('/admin/logout');
    } catch {
      // Ignore error
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin');
      router.push('/admin/login');
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: IoGridOutline },
    { name: 'Users', href: '/admin/users', icon: IoPersonOutline },
    { name: 'Professionals', href: '/admin/professionals', icon: IoBriefcaseOutline },
    { name: 'Hotels', href: '/admin/hotels', icon: IoBedOutline },
    { name: 'Restaurants', href: '/admin/restaurants', icon: IoRestaurantOutline },
    { name: 'Car Rentals', href: '/admin/car-rentals', icon: IoCarOutline },
    {
      name: 'Bookings',
      icon: IoCalendarOutline,
      submenu: [
        { name: 'Hotel Bookings', href: '/admin/bookings/hotels' },
        { name: 'Restaurant Bookings', href: '/admin/bookings/restaurants' },
        { name: 'Car Bookings', href: '/admin/bookings/cars' },
      ],
    },
    { name: 'Wilayas', href: '/admin/wilayas', icon: IoLocationOutline },
    { name: 'Wallet', href: '/admin/wallet', icon: IoWalletOutline },
    { name: 'Admins', href: '/admin/admins', icon: IoShieldCheckmark },
    { name: 'Settings', href: '/admin/settings', icon: IoSettingsOutline },
  ];

  const isActive = (href: string) => pathname === href;
  const isBookingsActive = pathname.startsWith('/admin/bookings');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center">
                <IoShieldCheckmark className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Hajz Admin</h1>
                <p className="text-xs text-gray-400">Management Panel</p>
              </div>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <IoCloseOutline size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) =>
                'submenu' in item ? (
                  <li key={item.name}>
                    <button
                      onClick={() => setBookingsOpen(!bookingsOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isBookingsActive
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      <IoChevronDownOutline
                        className={`transition-transform ${bookingsOpen ? 'rotate-180' : ''}`}
                        size={16}
                      />
                    </button>
                    {bookingsOpen && item.submenu && (
                      <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                        {item.submenu.map((sub) => (
                          <li key={sub.name}>
                            <Link
                              href={sub.href}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                                isActive(sub.href)
                                  ? 'bg-red-50 text-red-600 font-medium'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              }`}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ) : (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          {/* User info */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{admin?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <IoLogOutOutline size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <IoMenuOutline size={24} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <IoShieldCheckmark className="text-white" size={16} />
              </div>
              <span className="font-semibold text-gray-900">Hajz Admin</span>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">{admin?.email}</span>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {admin?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
