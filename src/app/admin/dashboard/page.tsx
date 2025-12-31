'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  IoPersonOutline,
  IoBriefcaseOutline,
  IoBedOutline,
  IoRestaurantOutline,
  IoCarOutline,
  IoCalendarOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
  IoArrowUpOutline,
} from 'react-icons/io5';

interface Stats {
  users: { total: number; this_month: number };
  professionals: { total: number; pending: number; verified: number };
  hotels: { total: number; active: number; pending: number };
  restaurants: { total: number; active: number; pending: number };
  car_rentals: { total: number; active: number; pending: number };
  bookings: { hotel_reservations: number; table_reservations: number; car_bookings: number; pending: number };
  revenue: { total: number; this_month: number; pending: number };
}

interface Activity {
  type: string;
  id: number;
  user: string;
  item: string;
  status: string;
  amount: number;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/recent-activity'),
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + ' DZD';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'hotel':
        return { bg: 'bg-blue-50', icon: 'text-blue-600', Icon: IoBedOutline };
      case 'restaurant':
        return { bg: 'bg-orange-50', icon: 'text-orange-600', Icon: IoRestaurantOutline };
      case 'car':
        return { bg: 'bg-green-50', icon: 'text-green-600', Icon: IoCarOutline };
      default:
        return { bg: 'bg-gray-100', icon: 'text-gray-600', Icon: IoCalendarOutline };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users.total || 0,
      subtitle: `+${stats?.users.this_month || 0} this month`,
      icon: IoPersonOutline,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Professionals',
      value: stats?.professionals.total || 0,
      subtitle: `${stats?.professionals.pending || 0} pending`,
      icon: IoBriefcaseOutline,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Hotels',
      value: stats?.hotels.total || 0,
      subtitle: `${stats?.hotels.active || 0} active`,
      icon: IoBedOutline,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Restaurants',
      value: stats?.restaurants.total || 0,
      subtitle: `${stats?.restaurants.active || 0} active`,
      icon: IoRestaurantOutline,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Car Rentals',
      value: stats?.car_rentals.total || 0,
      subtitle: `${stats?.car_rentals.active || 0} active`,
      icon: IoCarOutline,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Bookings',
      value: (stats?.bookings.hotel_reservations || 0) + (stats?.bookings.table_reservations || 0) + (stats?.bookings.car_bookings || 0),
      subtitle: `${stats?.bookings.pending || 0} pending`,
      icon: IoCalendarOutline,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your platform.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <IoWalletOutline size={18} />
                <span>Total Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats?.revenue.total || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <IoTrendingUpOutline size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <IoArrowUpOutline className="text-green-500" size={18} />
                <span>This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue.this_month || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <IoTrendingUpOutline className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <IoCalendarOutline className="text-yellow-500" size={18} />
                <span>Pending</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue.pending || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <IoWalletOutline className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500 mt-0.5">Latest bookings across all services</p>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400">
              <IoCalendarOutline className="mx-auto mb-3 text-gray-300" size={40} />
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const typeStyles = getTypeStyles(activity.type);
              return (
                <div key={`${activity.type}-${activity.id}-${index}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`p-2.5 rounded-xl ${typeStyles.bg}`}>
                    <typeStyles.Icon className={typeStyles.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium truncate">{activity.user}</p>
                    <p className="text-gray-500 text-sm truncate">{activity.item}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(activity.status)}`}>
                      {activity.status}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(activity.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[100px]">
                    <p className="text-gray-900 font-semibold">{formatCurrency(activity.amount)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
