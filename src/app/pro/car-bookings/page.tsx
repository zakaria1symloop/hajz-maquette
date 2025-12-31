'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX, HiOutlineClipboardList, HiOutlineCalendar, HiOutlineUser, HiOutlinePhone, HiOutlineMail, HiOutlineTruck, HiOutlineRefresh } from 'react-icons/hi';
import { FaCar } from 'react-icons/fa';

interface CarBooking {
  id: number;
  car_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  driver_license_number: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  pickup_location: string;
  return_location: string;
  pickup_mileage: number | null;
  return_mileage: number | null;
  km_driven: number | null;
  extra_km: number | null;
  extra_km_charge: number;
  rental_days: number;
  price_per_day: number;
  subtotal: number;
  deposit_amount: number;
  extra_charges: number;
  total_amount: number;
  status: string;
  notes: string | null;
  car?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    mileage_limit: number | null;
    extra_km_price: number | null;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-purple-100 text-purple-700',
  returned: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

// Format date from ISO string to readable format
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

// Format time from HH:MM:SS to HH:MM
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

export default function CarBookingsPage() {
  const router = useRouter();
  const { companyOwner, company, loading, businessType } = useProAuth();
  const [bookings, setBookings] = useState<CarBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<CarBooking | null>(null);
  const [processing, setProcessing] = useState(false);

  // Pickup/Return form
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [extraCharges, setExtraCharges] = useState('');
  const [extraChargesReason, setExtraChargesReason] = useState('');

  useEffect(() => {
    if (!loading && !companyOwner && businessType !== 'car_rental') {
      router.push('/pro/login');
    }
    if (!loading && !company) {
      router.push('/pro/company/create');
    }
    if (company) {
      fetchBookings();
    }
  }, [loading, companyOwner, company, router, businessType, statusFilter]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const token = localStorage.getItem('pro_token');
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/company-owner/bookings', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBookings(response.data.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleConfirm = async (bookingId: number) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${bookingId}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking confirmed!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking cancelled!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setProcessing(false);
    }
  };

  const handlePickup = async () => {
    if (!selectedBooking || !mileage) {
      toast.error('Please enter pickup mileage');
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${selectedBooking.id}/pick-up`, {
        pickup_mileage: parseInt(mileage),
        notes: notes || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Car picked up!');
      setShowPickupModal(false);
      setMileage('');
      setNotes('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record pickup');
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedBooking || !mileage) {
      toast.error('Please enter return mileage');
      return;
    }
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${selectedBooking.id}/return`, {
        return_mileage: parseInt(mileage),
        notes: notes || undefined,
        extra_charges: extraCharges ? parseFloat(extraCharges) : undefined,
        extra_charges_reason: extraChargesReason || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Car returned!');
      setShowReturnModal(false);
      setMileage('');
      setNotes('');
      setExtraCharges('');
      setExtraChargesReason('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record return');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (bookingId: number) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${bookingId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking completed!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleNoShow = async (bookingId: number) => {
    if (!confirm('Mark this customer as no-show?')) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/bookings/${bookingId}/no-show`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Marked as no-show!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to mark as no-show');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <HiOutlineClipboardList size={14} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Car Bookings</span>
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up</option>
            <option value="returned">Returned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loadingBookings ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <HiOutlineClipboardList size={56} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500">Bookings will appear here when customers book your cars</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500 text-sm">#{booking.id}</span>
                      </div>
                      {booking.car && (
                        <h3 className="text-lg font-bold text-gray-900">
                          <FaCar className="inline mr-2 text-green-500" />
                          {booking.car.brand} {booking.car.model} ({booking.car.year})
                        </h3>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{booking.total_amount?.toLocaleString()} DZD</p>
                      <p className="text-sm text-gray-500">{booking.rental_days} days × {booking.price_per_day?.toLocaleString()} DZD</p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <HiOutlineUser size={16} />
                        Customer
                      </h4>
                      <p className="text-gray-600">{booking.customer_name}</p>
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <HiOutlinePhone size={14} />
                        {booking.customer_phone}
                      </p>
                      <p className="text-gray-500 text-sm flex items-center gap-2">
                        <HiOutlineMail size={14} />
                        {booking.customer_email}
                      </p>
                      <p className="text-gray-500 text-sm">License: {booking.driver_license_number}</p>
                    </div>

                    {/* Dates */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <HiOutlineCalendar size={16} />
                        Rental Period
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Pickup</p>
                          <p className="text-gray-900 font-medium">{formatDate(booking.pickup_date)}</p>
                          <p className="text-gray-600">{formatTime(booking.pickup_time)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Return</p>
                          <p className="text-gray-900 font-medium">{formatDate(booking.return_date)}</p>
                          <p className="text-gray-600">{formatTime(booking.return_time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mileage Info (if available) */}
                  {(booking.pickup_mileage || booking.return_mileage) && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                        <HiOutlineTruck size={16} />
                        Mileage Details
                      </h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Pickup</p>
                          <p className="text-gray-900 font-medium">{booking.pickup_mileage?.toLocaleString()} km</p>
                        </div>
                        {booking.return_mileage && (
                          <>
                            <div>
                              <p className="text-gray-500">Return</p>
                              <p className="text-gray-900 font-medium">{booking.return_mileage.toLocaleString()} km</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Driven</p>
                              <p className="text-gray-900 font-medium">{booking.km_driven?.toLocaleString()} km</p>
                            </div>
                            {booking.extra_km && booking.extra_km > 0 && (
                              <div>
                                <p className="text-gray-500">Extra KM</p>
                                <p className="text-red-600 font-medium">{booking.extra_km.toLocaleString()} km (+{booking.extra_km_charge?.toLocaleString()} DZD)</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <HiOutlineCheck size={18} />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <HiOutlineX size={18} />
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => { setSelectedBooking(booking); setShowPickupModal(true); }}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                        >
                          <HiOutlineTruck size={18} />
                          Record Pickup
                        </button>
                        <button
                          onClick={() => handleNoShow(booking.id)}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          No Show
                        </button>
                      </>
                    )}
                    {booking.status === 'picked_up' && (
                      <button
                        onClick={() => { setSelectedBooking(booking); setShowReturnModal(true); }}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        <HiOutlineRefresh size={18} />
                        Record Return
                      </button>
                    )}
                    {booking.status === 'returned' && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <HiOutlineCheck size={18} />
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pickup Modal */}
      {showPickupModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Record Car Pickup</h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedBooking.car?.brand} {selectedBooking.car?.model} - {selectedBooking.customer_name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Mileage (km) *</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter current odometer reading"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Any notes about the car condition..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowPickupModal(false); setMileage(''); setNotes(''); setSelectedBooking(null); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePickup}
                  disabled={processing || !mileage}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Pickup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Record Car Return</h2>
              <p className="text-gray-500 text-sm mt-1">
                {selectedBooking.car?.brand} {selectedBooking.car?.model} - {selectedBooking.customer_name}
              </p>
              {selectedBooking.pickup_mileage && selectedBooking.car?.mileage_limit && (
                <p className="text-sm text-gray-500 mt-2">
                  Pickup: {selectedBooking.pickup_mileage.toLocaleString()} km |
                  Allowed: {(selectedBooking.car.mileage_limit * selectedBooking.rental_days).toLocaleString()} km total
                </p>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Return Mileage (km) *</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter current odometer reading"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extra Charges (DZD)</label>
                <input
                  type="number"
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Damage, cleaning, fuel, etc."
                />
              </div>
              {extraCharges && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Extra Charges</label>
                  <input
                    type="text"
                    value={extraChargesReason}
                    onChange={(e) => setExtraChargesReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the reason..."
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Any notes about the car condition..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowReturnModal(false); setMileage(''); setNotes(''); setExtraCharges(''); setExtraChargesReason(''); setSelectedBooking(null); }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturn}
                  disabled={processing || !mileage}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
