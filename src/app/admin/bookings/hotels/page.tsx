'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoEyeOutline, IoCloseOutline, IoBedOutline } from 'react-icons/io5';
import toast, { Toaster } from 'react-hot-toast';

interface Reservation {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  status: string;
  total_price: number;
  check_in: string;
  check_out: string;
  guests: number;
  special_requests?: string;
  user?: { name: string; email: string };
  room?: {
    id: number;
    name: string;
    room_type: string;
    price_per_night: number;
    hotel?: {
      id: number;
      name: string;
      city: string;
      wilaya?: { name: string };
    };
  };
  payment?: {
    amount: number;
    payment_method: string;
    status: string;
  };
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminHotelBookingsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, [page, search, statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await api.get(`/admin/bookings/hotels?${params.toString()}`);
      setReservations(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      toast.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationDetails = async (id: number) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/admin/bookings/hotels/${id}`);
      setSelectedReservation(response.data);
    } catch (err) {
      console.error('Failed to fetch reservation details:', err);
      toast.error('Failed to fetch reservation details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewReservation = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
    await fetchReservationDetails(reservation.id);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/bookings/hotels/${id}`, { status });
      toast.success('Status updated successfully');
      fetchReservations();
      if (selectedReservation?.id === id) {
        fetchReservationDetails(id);
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
      checked_in: 'bg-purple-100 text-purple-700',
      checked_out: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hotel Bookings</h1>
        <p className="text-gray-500 mt-1">Manage hotel reservations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by guest name, email, or hotel..."
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
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No reservations found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Guest</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Hotel / Room</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Dates</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-gray-900 font-medium">{res.guest_name}</p>
                      <p className="text-gray-500 text-xs">{res.guest_email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-900">{res.room?.hotel?.name || '-'}</p>
                      <p className="text-gray-500 text-xs">{res.room?.name} - {res.room?.room_type}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-600">{formatDate(res.check_in)}</p>
                      <p className="text-gray-500 text-xs">to {formatDate(res.check_out)}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-900 font-semibold">{formatCurrency(res.total_price)}</p>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(res.status)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          onChange={(e) => e.target.value && handleUpdateStatus(res.id, e.target.value)}
                          value=""
                          className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="checked_in">Check In</option>
                          <option value="checked_out">Check Out</option>
                          <option value="cancelled">Cancel</option>
                        </select>
                        <button
                          onClick={() => handleViewReservation(res)}
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
              {pagination.total} reservations
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
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <IoBedOutline className="text-red-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reservation #{selectedReservation.id}</h2>
                  <p className="text-gray-500 text-sm">{selectedReservation.room?.hotel?.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedReservation(null); }}
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
                      {getStatusBadge(selectedReservation.status)}
                      <select
                        onChange={(e) => e.target.value && handleUpdateStatus(selectedReservation.id, e.target.value)}
                        value={selectedReservation.status}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Guest Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Name</p>
                        <p className="text-gray-900">{selectedReservation.guest_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="text-gray-900">{selectedReservation.guest_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="text-gray-900">{selectedReservation.guest_phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Guests</p>
                        <p className="text-gray-900">{selectedReservation.guests || 0} Guests</p>
                      </div>
                    </div>
                  </div>

                  {/* Hotel & Room Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Hotel & Room</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Hotel</p>
                        <p className="text-gray-900">{selectedReservation.room?.hotel?.name}</p>
                        <p className="text-gray-500 text-xs">{selectedReservation.room?.hotel?.city}, {selectedReservation.room?.hotel?.wilaya?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Room</p>
                        <p className="text-gray-900">{selectedReservation.room?.name}</p>
                        <p className="text-gray-500 text-xs">{selectedReservation.room?.room_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Check-in</p>
                        <p className="text-gray-900">{formatDate(selectedReservation.check_in)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Check-out</p>
                        <p className="text-gray-900">{formatDate(selectedReservation.check_out)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Price per Night</p>
                        <p className="text-gray-900">{formatCurrency(selectedReservation.room?.price_per_night || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedReservation.special_requests && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Special Requests</h3>
                      <p className="text-gray-600">{selectedReservation.special_requests}</p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-red-800 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedReservation.total_price)}</p>
                  </div>

                  {/* Booked Date */}
                  <p className="text-gray-400 text-xs text-center">
                    Booked on {new Date(selectedReservation.created_at).toLocaleString()}
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
