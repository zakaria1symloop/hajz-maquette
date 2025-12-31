'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoEyeOutline, IoCloseOutline, IoCarSportOutline } from 'react-icons/io5';
import toast, { Toaster } from 'react-hot-toast';

interface Booking {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id_number: string;
  driver_license_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  deposit_amount: number;
  extra_charges: number;
  extra_charges_description?: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  pickup_location: string;
  return_location: string;
  rental_days: number;
  price_per_day: number;
  notes?: string;
  user?: { name: string; email: string };
  car?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    type: string;
    transmission: string;
    fuel_type: string;
    full_name: string;
    company?: {
      id: number;
      name: string;
      city: string;
      wilaya?: { name: string };
    };
  };
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminCarBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [page, search, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await api.get(`/admin/bookings/cars?${params.toString()}`);
      setBookings(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async (id: number) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/admin/bookings/cars/${id}`);
      setSelectedBooking(response.data);
    } catch (err) {
      console.error('Failed to fetch booking details:', err);
      toast.error('Failed to fetch booking details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    await fetchBookingDetails(booking.id);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/bookings/cars/${id}`, { status });
      toast.success('Status updated successfully');
      fetchBookings();
      if (selectedBooking?.id === id) {
        fetchBookingDetails(id);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-purple-100 text-purple-700',
      returned: 'bg-indigo-100 text-indigo-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-600'} rounded-lg text-xs font-medium capitalize`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-DZ').format(amount || 0) + ' DZD';
  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Car Bookings</h1>
        <p className="text-gray-500 mt-1">Manage car rental bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by customer name, email, or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="picked_up">Picked Up</option>
          <option value="returned">Returned</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No bookings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Customer</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Car / Company</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Dates</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-gray-900 font-medium">{booking.customer_name}</p>
                      <p className="text-gray-500 text-xs">{booking.customer_email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-900">{booking.car?.brand} {booking.car?.model}</p>
                      <p className="text-gray-500 text-xs">{booking.car?.company?.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-600">{formatDate(booking.pickup_date)}</p>
                      <p className="text-gray-500 text-xs">to {formatDate(booking.return_date)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-900 font-semibold">{formatCurrency(booking.total_amount)}</p>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(booking.status)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          onChange={(e) => e.target.value && handleUpdateStatus(booking.id, e.target.value)}
                          value=""
                          className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirm</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="returned">Returned</option>
                          <option value="completed">Complete</option>
                          <option value="cancelled">Cancel</option>
                        </select>
                        <button
                          onClick={() => handleViewBooking(booking)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <IoEyeOutline size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} bookings
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.last_page}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <IoCarSportOutline className="text-red-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Booking #{selectedBooking.id}</h2>
                  <p className="text-gray-500 text-sm">{selectedBooking.car?.full_name || `${selectedBooking.car?.brand} ${selectedBooking.car?.model}`}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedBooking(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoCloseOutline size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Card */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-2">Booking Status</p>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(selectedBooking.status)}
                      <select
                        onChange={(e) => e.target.value && handleUpdateStatus(selectedBooking.id, e.target.value)}
                        value={selectedBooking.status}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="returned">Returned</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="text-gray-900">{selectedBooking.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="text-gray-900">{selectedBooking.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="text-gray-900">{selectedBooking.customer_phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">ID Number</p>
                        <p className="text-gray-900">{selectedBooking.customer_id_number || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs">Driver License</p>
                        <p className="text-gray-900">{selectedBooking.driver_license_number || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Car & Company Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Car & Company</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Car</p>
                        <p className="text-gray-900">{selectedBooking.car?.brand} {selectedBooking.car?.model} ({selectedBooking.car?.year})</p>
                        <p className="text-gray-500 text-xs">{selectedBooking.car?.color} - {selectedBooking.car?.license_plate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Company</p>
                        <p className="text-gray-900">{selectedBooking.car?.company?.name}</p>
                        <p className="text-gray-500 text-xs">{selectedBooking.car?.company?.city}, {selectedBooking.car?.company?.wilaya?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Type</p>
                        <p className="text-gray-900 capitalize">{selectedBooking.car?.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Transmission / Fuel</p>
                        <p className="text-gray-900 capitalize">{selectedBooking.car?.transmission} / {selectedBooking.car?.fuel_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Rental Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Pickup Date</p>
                        <p className="text-gray-900">{formatDate(selectedBooking.pickup_date)}</p>
                        <p className="text-gray-500 text-xs">{selectedBooking.pickup_time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Return Date</p>
                        <p className="text-gray-900">{formatDate(selectedBooking.return_date)}</p>
                        <p className="text-gray-500 text-xs">{selectedBooking.return_time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Pickup Location</p>
                        <p className="text-gray-900">{selectedBooking.pickup_location || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Return Location</p>
                        <p className="text-gray-900">{selectedBooking.return_location || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Rental Days</p>
                        <p className="text-gray-900">{selectedBooking.rental_days} days</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Price per Day</p>
                        <p className="text-gray-900">{formatCurrency(selectedBooking.price_per_day)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Pricing Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">Subtotal ({selectedBooking.rental_days} days x {formatCurrency(selectedBooking.price_per_day)})</p>
                        <p className="text-gray-900">{formatCurrency(selectedBooking.subtotal)}</p>
                      </div>
                      {selectedBooking.deposit_amount > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600">Deposit</p>
                          <p className="text-gray-900">{formatCurrency(selectedBooking.deposit_amount)}</p>
                        </div>
                      )}
                      {selectedBooking.extra_charges > 0 && (
                        <div className="flex items-center justify-between">
                          <p className="text-gray-600">Extra Charges</p>
                          <p className="text-gray-900">{formatCurrency(selectedBooking.extra_charges)}</p>
                        </div>
                      )}
                      {selectedBooking.extra_charges_description && (
                        <p className="text-gray-500 text-xs">{selectedBooking.extra_charges_description}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedBooking.notes && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                      <p className="text-gray-600">{selectedBooking.notes}</p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-red-800 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedBooking.total_amount)}</p>
                  </div>

                  {/* Booked Date */}
                  <p className="text-gray-400 text-xs text-center">
                    Booked on {new Date(selectedBooking.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
