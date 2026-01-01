'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineArrowLeft,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { FaHotel, FaUtensils, FaCar } from 'react-icons/fa';

interface Reservation {
  id: number;
  type: 'hotel' | 'restaurant' | 'car';
  name: string;
  location?: string;
  date: string;
  time?: string;
  end_date?: string;
  guests?: number;
  status: string;
  total_price: number;
  image?: string;
  details?: any;
}

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: HiOutlineClock },
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', icon: HiOutlineCheckCircle },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: HiOutlineX },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: HiOutlineCheckCircle },
  picked_up: { bg: 'bg-purple-50', text: 'text-purple-700', icon: FaCar },
  returned: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: HiOutlineCheckCircle },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-700', icon: HiOutlineExclamationCircle },
};

export default function ReservationsPage() {
  const router = useRouter();
  const t = useTranslations('reservations');
  const tToast = useTranslations('toast');
  const { user, loading: authLoading } = useAuth();

  const typeConfig = {
    hotel: { icon: FaHotel, color: '#2FB7EC', label: t('hotelBooking') },
    restaurant: { icon: FaUtensils, color: '#F97316', label: t('restaurantReservation') },
    car: { icon: FaCar, color: '#22C55E', label: t('carRental') },
  };
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hotel' | 'restaurant' | 'car'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadAllReservations();
    }
  }, [user, authLoading, router]);

  const loadAllReservations = async () => {
    try {
      const all: Reservation[] = [];

      // Load hotel reservations
      try {
        const hotelRes = await api.get('/reservations');
        const hotelData = hotelRes.data.data || hotelRes.data || [];
        hotelData.forEach((r: any) => {
          all.push({
            id: r.id,
            type: 'hotel',
            name: r.hotel?.name || r.room?.hotel?.name || 'Hotel Booking',
            location: r.hotel?.city || r.room?.hotel?.city,
            date: r.check_in,
            end_date: r.check_out,
            guests: r.guests,
            status: r.status,
            total_price: r.total_price,
            image: r.hotel?.primary_image_url,
            details: r,
          });
        });
      } catch (e) {
        console.error('Failed to load hotel reservations');
      }

      // Load table reservations
      try {
        const tableRes = await api.get('/table-reservations');
        const tableData = tableRes.data.data || tableRes.data || [];
        tableData.forEach((r: any) => {
          all.push({
            id: r.id,
            type: 'restaurant',
            name: r.restaurant?.name || 'Restaurant Reservation',
            location: r.restaurant?.city,
            date: r.reservation_date,
            time: r.reservation_time,
            guests: r.party_size || r.guests,
            status: r.status,
            total_price: r.total_price || 0,
            image: r.restaurant?.primary_image_url,
            details: r,
          });
        });
      } catch (e) {
        console.error('Failed to load table reservations');
      }

      // Load car bookings
      try {
        const carRes = await api.get('/car-bookings');
        const carData = carRes.data.data || carRes.data || [];
        carData.forEach((r: any) => {
          all.push({
            id: r.id,
            type: 'car',
            name: r.car ? `${r.car.brand} ${r.car.model}` : 'Car Rental',
            location: r.company?.city,
            date: r.pickup_date,
            time: r.pickup_time,
            end_date: r.return_date,
            status: r.status,
            total_price: r.total_amount || r.subtotal,
            image: r.car?.primary_image_url,
            details: r,
          });
        });
      } catch (e) {
        console.error('Failed to load car bookings');
      }

      // Sort by date (newest first)
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReservations(all);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservation: Reservation) => {
    if (!confirm(t('confirmCancel'))) return;

    try {
      if (reservation.type === 'hotel') {
        await api.post(`/reservations/${reservation.id}/cancel`);
      } else if (reservation.type === 'restaurant') {
        await api.post(`/table-reservations/${reservation.id}/cancel`);
      } else if (reservation.type === 'car') {
        await api.post(`/car-bookings/${reservation.id}/cancel`);
      }
      toast.success(t('reservationCancelled'));
      loadAllReservations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('cancelFailed'));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const filteredReservations = activeFilter === 'all'
    ? reservations
    : reservations.filter(r => r.type === activeFilter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <HiOutlineArrowLeft size={20} />
          <span>{t('backToSettings')}</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all', label: t('all') },
            { key: 'hotel', label: t('hotels'), icon: FaHotel },
            { key: 'restaurant', label: t('restaurants'), icon: FaUtensils },
            { key: 'car', label: t('cars'), icon: FaCar },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-[#2FB7EC] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <HiOutlineCalendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('noReservations')}</h2>
            <p className="text-gray-500 mb-6">{t('noReservationsDesc')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition"
              >
                <FaHotel size={14} />
                {t('browseHotels')}
              </Link>
              <Link
                href="/restaurants"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F97316] text-white rounded-xl font-medium hover:bg-[#ea6c10] transition"
              >
                <FaUtensils size={14} />
                {t('findRestaurants')}
              </Link>
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#22C55E] text-white rounded-xl font-medium hover:bg-[#1eb854] transition"
              >
                <FaCar size={14} />
                {t('rentCar')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const config = typeConfig[reservation.type];
              const status = statusConfig[reservation.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const TypeIcon = config.icon;

              return (
                <div
                  key={`${reservation.type}-${reservation.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all"
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}15` }}
                      >
                        <TypeIcon size={20} style={{ color: config.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: config.color }}>
                              {config.label}
                            </p>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {reservation.name}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            <StatusIcon size={14} />
                            {reservation.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <HiOutlineCalendar size={16} />
                            <span>{formatDate(reservation.date)}</span>
                            {reservation.end_date && reservation.end_date !== reservation.date && (
                              <span>- {formatDate(reservation.end_date)}</span>
                            )}
                          </div>
                          {reservation.time && (
                            <div className="flex items-center gap-1">
                              <HiOutlineClock size={16} />
                              <span>{formatTime(reservation.time)}</span>
                            </div>
                          )}
                          {reservation.guests && (
                            <div className="flex items-center gap-1">
                              <HiOutlineUsers size={16} />
                              <span>{reservation.guests} {reservation.guests > 1 ? t('guests') : t('guest')}</span>
                            </div>
                          )}
                          {reservation.location && (
                            <div className="flex items-center gap-1">
                              <HiOutlineLocationMarker size={16} />
                              <span>{reservation.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <span className="text-xl font-bold" style={{ color: config.color }}>
                              {reservation.total_price?.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">DZD</span>
                          </div>

                          {reservation.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(reservation)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              <HiOutlineX size={16} />
                              {t('cancel')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
