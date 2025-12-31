'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineUser, HiOutlineCheck, HiOutlineX, HiOutlineClock, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import { BsBriefcase } from 'react-icons/bs';
import { IoBedOutline } from 'react-icons/io5';

interface Reservation {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  } | null;
  room: {
    id: number;
    name: string;
    room_type: string;
    price_per_night: number;
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out';
  special_requests?: string;
  created_at: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ReservationsPage() {
  const router = useRouter();
  const { hotelOwner, hotel, loading } = useProAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!loading && !hotelOwner) {
      router.push('/pro/login');
    }
    if (!loading && !hotel) {
      router.push('/pro/hotel/create');
    }
    if (hotel) {
      fetchReservations();
    }
  }, [loading, hotelOwner, hotel, router]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('pro_token');
      const response = await api.get('/hotel-owner/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle different response formats
      const data = response.data;
      if (Array.isArray(data)) {
        setReservations(data);
      } else if (data?.reservations && Array.isArray(data.reservations)) {
        setReservations(data.reservations);
      } else if (data?.data && Array.isArray(data.data)) {
        setReservations(data.data);
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const updateStatus = async (reservationId: number, action: string) => {
    try {
      const token = localStorage.getItem('pro_token');
      let endpoint = '';

      switch (action) {
        case 'confirmed':
          endpoint = `/hotel-owner/reservations/${reservationId}/confirm`;
          break;
        case 'cancelled':
          endpoint = `/hotel-owner/reservations/${reservationId}/cancel`;
          break;
        case 'checked_in':
          endpoint = `/hotel-owner/reservations/${reservationId}/check-in`;
          break;
        case 'checked_out':
          endpoint = `/hotel-owner/reservations/${reservationId}/check-out`;
          break;
        default:
          throw new Error('Invalid action');
      }

      await api.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Reservation ${action.replace('_', ' ')}!`);
      fetchReservations();
      setSelectedReservation(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredReservations = reservations.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading || loadingReservations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pro/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <HiOutlineArrowLeft size={20} />
              Dashboard
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2FB7EC] rounded-lg flex items-center justify-center">
                <HiOutlineCalendar size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Reservations</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{reservations.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{reservations.filter(r => r.status === 'confirmed').length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Checked In</p>
            <p className="text-2xl font-bold text-green-600">{reservations.filter(r => r.status === 'checked_in').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-[#2FB7EC] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reservations</h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'You have no reservations yet' : `No ${filter.replace('_', ' ')} reservations`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReservation(reservation)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#2FB7EC]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <IoBedOutline size={24} className="text-[#2FB7EC]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{reservation.room?.name || 'Room'}</h3>
                      <p className="text-sm text-gray-500">
                        {reservation.user?.name || reservation.guest_name || 'Guest'}
                        {!reservation.user && reservation.guest_name && <span className="ml-1 text-xs text-orange-500">(Guest)</span>}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar size={14} />
                          {formatDate(reservation.check_in)} - {formatDate(reservation.check_out)}
                        </span>
                        <span>{getNights(reservation.check_in, reservation.check_out)} nights</span>
                        <span>{reservation.guests} guests</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#2FB7EC]">{reservation.total_price?.toLocaleString()} DZD</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[reservation.status]}`}>
                        {reservation.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Reservation Details</h2>
              <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[selectedReservation.status]}`}>
                  {selectedReservation.status.replace('_', ' ')}
                </span>
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Guest Information</h4>
                  {!selectedReservation.user && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Guest Booking</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <HiOutlineUser size={16} />
                    <span>{selectedReservation.user?.name || selectedReservation.guest_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <HiOutlineMail size={16} />
                    <span>{selectedReservation.user?.email || selectedReservation.guest_email || 'N/A'}</span>
                  </div>
                  {(selectedReservation.user?.phone || selectedReservation.guest_phone) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <HiOutlinePhone size={16} />
                      <span>{selectedReservation.user?.phone || selectedReservation.guest_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Booking Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Room</span>
                    <p className="font-medium text-gray-900">{selectedReservation.room?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Guests</span>
                    <p className="font-medium text-gray-900">{selectedReservation.guests}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-in</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedReservation.check_in)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Check-out</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedReservation.check_out)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nights</span>
                    <p className="font-medium text-gray-900">{getNights(selectedReservation.check_in, selectedReservation.check_out)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total</span>
                    <p className="font-bold text-[#2FB7EC]">{selectedReservation.total_price?.toLocaleString()} DZD</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedReservation.special_requests && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-600">{selectedReservation.special_requests}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedReservation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'confirmed')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <HiOutlineCheck size={18} />
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(selectedReservation.id, 'cancelled')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <HiOutlineX size={18} />
                      Decline
                    </button>
                  </>
                )}
                {selectedReservation.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(selectedReservation.id, 'checked_in')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2FB7EC] text-white rounded-xl hover:bg-[#26a5d8] transition-colors"
                  >
                    <HiOutlineCheck size={18} />
                    Check In Guest
                  </button>
                )}
                {selectedReservation.status === 'checked_in' && (
                  <button
                    onClick={() => updateStatus(selectedReservation.id, 'checked_out')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    <HiOutlineCheck size={18} />
                    Check Out Guest
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
