'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  IoSearchOutline, IoCheckmarkCircle, IoCloseCircle, IoEyeOutline,
  IoStarSharp, IoClose, IoAddOutline, IoTrashOutline, IoPencilOutline,
  IoBedOutline, IoCalendarOutline
} from 'react-icons/io5';
import toast from 'react-hot-toast';

interface Hotel {
  id: number;
  name: string;
  description?: string;
  city: string;
  address?: string;
  star_rating: number;
  phone?: string;
  email?: string;
  is_active: boolean;
  verification_status: string;
  rooms_count: number;
  reservations_count?: number;
  total_revenue?: number;
  total_bookings?: number;
  wilaya?: { id: number; name: string };
  owner?: { name: string; email: string; phone?: string };
  created_at: string;
}

interface Room {
  id: number;
  name: string;
  description?: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  size?: number;
  bed_type?: string;
  amenities?: string[];
  is_available: boolean;
}

interface Reservation {
  id: number;
  guest_name?: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: string;
  user?: { name: string; email: string };
  room?: { name: string };
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'bookings'>('info');

  // Room states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    room_type: 'standard',
    price_per_night: '',
    capacity: '2',
    size: '',
    bed_type: 'double',
    is_available: true,
  });

  // Reservation states
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationPagination, setReservationPagination] = useState<Pagination | null>(null);
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationStatus, setReservationStatus] = useState('');

  // Edit hotel form
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    star_rating: 3,
    phone: '',
    email: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, [page, search, statusFilter]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('verification_status', statusFilter);

      const response = await api.get(`/admin/hotels?${params.toString()}`);
      setHotels(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
      toast.error('Failed to fetch hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotelDetails = async (hotelId: number) => {
    try {
      const response = await api.get(`/admin/hotels/${hotelId}`);
      setSelectedHotel(response.data);
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        city: response.data.city || '',
        address: response.data.address || '',
        star_rating: response.data.star_rating || 3,
        phone: response.data.phone || '',
        email: response.data.email || '',
      });
    } catch (err) {
      console.error('Failed to fetch hotel details:', err);
      toast.error('Failed to fetch hotel details');
    }
  };

  const fetchRooms = async (hotelId: number) => {
    try {
      const response = await api.get(`/admin/hotels/${hotelId}/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const fetchReservations = async (hotelId: number) => {
    try {
      const params = new URLSearchParams();
      params.set('page', reservationPage.toString());
      if (reservationStatus) params.set('status', reservationStatus);

      const response = await api.get(`/admin/hotels/${hotelId}/reservations?${params.toString()}`);
      setReservations(response.data.data);
      setReservationPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    }
  };

  const handleViewHotel = async (hotel: Hotel) => {
    await fetchHotelDetails(hotel.id);
    setActiveTab('info');
    setShowDetailModal(true);
  };

  useEffect(() => {
    if (showDetailModal && selectedHotel) {
      if (activeTab === 'rooms') {
        fetchRooms(selectedHotel.id);
      } else if (activeTab === 'bookings') {
        fetchReservations(selectedHotel.id);
      }
    }
  }, [activeTab, showDetailModal, selectedHotel, reservationPage, reservationStatus]);

  const handleVerify = async (hotelId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/hotels/${hotelId}/verify`);
      toast.success('Hotel verified successfully');
      fetchHotels();
      if (selectedHotel?.id === hotelId) {
        fetchHotelDetails(hotelId);
      }
    } catch (err) {
      console.error('Failed to verify hotel:', err);
      toast.error('Failed to verify hotel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (hotelId: number) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/hotels/${hotelId}/toggle-active`);
      toast.success('Hotel status updated');
      fetchHotels();
      if (selectedHotel?.id === hotelId) {
        fetchHotelDetails(hotelId);
      }
    } catch (err) {
      console.error('Failed to toggle hotel status:', err);
      toast.error('Failed to update hotel status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateHotel = async () => {
    if (!selectedHotel) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/hotels/${selectedHotel.id}`, editForm);
      toast.success('Hotel updated successfully');
      setShowEditModal(false);
      fetchHotels();
      fetchHotelDetails(selectedHotel.id);
    } catch (err) {
      console.error('Failed to update hotel:', err);
      toast.error('Failed to update hotel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!selectedHotel) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/hotels/${selectedHotel.id}`);
      toast.success('Hotel deleted successfully');
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedHotel(null);
      fetchHotels();
    } catch (err: any) {
      console.error('Failed to delete hotel:', err);
      toast.error(err.response?.data?.message || 'Failed to delete hotel');
    } finally {
      setActionLoading(false);
    }
  };

  // Room handlers
  const openRoomModal = (room?: Room) => {
    if (room) {
      setSelectedRoom(room);
      setRoomForm({
        name: room.name,
        description: room.description || '',
        room_type: room.room_type,
        price_per_night: room.price_per_night.toString(),
        capacity: room.capacity.toString(),
        size: room.size?.toString() || '',
        bed_type: room.bed_type || 'double',
        is_available: room.is_available,
      });
    } else {
      setSelectedRoom(null);
      setRoomForm({
        name: '',
        description: '',
        room_type: 'standard',
        price_per_night: '',
        capacity: '2',
        size: '',
        bed_type: 'double',
        is_available: true,
      });
    }
    setShowRoomModal(true);
  };

  const handleSaveRoom = async () => {
    if (!selectedHotel) return;
    setActionLoading(true);
    try {
      const data = {
        ...roomForm,
        price_per_night: parseFloat(roomForm.price_per_night),
        capacity: parseInt(roomForm.capacity),
        size: roomForm.size ? parseFloat(roomForm.size) : null,
      };

      if (selectedRoom) {
        await api.put(`/admin/hotels/${selectedHotel.id}/rooms/${selectedRoom.id}`, data);
        toast.success('Room updated successfully');
      } else {
        await api.post(`/admin/hotels/${selectedHotel.id}/rooms`, data);
        toast.success('Room created successfully');
      }
      setShowRoomModal(false);
      fetchRooms(selectedHotel.id);
    } catch (err) {
      console.error('Failed to save room:', err);
      toast.error('Failed to save room');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!selectedHotel || !confirm('Are you sure you want to delete this room?')) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/hotels/${selectedHotel.id}/rooms/${roomId}`);
      toast.success('Room deleted successfully');
      fetchRooms(selectedHotel.id);
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      toast.error(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setActionLoading(false);
    }
  };

  // Reservation handlers
  const handleUpdateReservationStatus = async (reservationId: number, status: string) => {
    if (!selectedHotel) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/hotels/${selectedHotel.id}/reservations/${reservationId}`, { status });
      toast.success('Reservation updated successfully');
      fetchReservations(selectedHotel.id);
    } catch (err) {
      console.error('Failed to update reservation:', err);
      toast.error('Failed to update reservation');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      confirmed: 'bg-blue-100 text-blue-700',
      checked_in: 'bg-purple-100 text-purple-700',
      checked_out: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 ${colors[status] || 'bg-gray-100 text-gray-600'} rounded-lg text-xs font-medium`}>{status.replace('_', ' ')}</span>;
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-DZ').format(amount) + ' DZD';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
        <p className="text-gray-500 mt-1">Manage hotels, rooms and reservations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search hotels..."
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
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Hotels Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hotels found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Hotel</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Location</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Owner</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Rooms</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-900 font-medium">{hotel.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(hotel.star_rating || 0)].map((_, i) => (
                            <IoStarSharp key={i} className="text-yellow-400" size={12} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {hotel.city}{hotel.wilaya ? `, ${hotel.wilaya.name}` : ''}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-600">{hotel.owner?.name || '-'}</p>
                        <p className="text-gray-400 text-xs">{hotel.owner?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{hotel.rooms_count}</td>
                    <td className="py-4 px-6">{getStatusBadge(hotel.verification_status)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(hotel.id)}
                        disabled={actionLoading}
                        className={`w-12 h-6 rounded-full transition-colors ${hotel.is_active ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${hotel.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {hotel.verification_status === 'pending' && (
                          <button
                            onClick={() => handleVerify(hotel.id)}
                            disabled={actionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Verify"
                          >
                            <IoCheckmarkCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewHotel(hotel)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View & Manage"
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
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} hotels
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={page === pagination.last_page} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Detail Modal */}
      {showDetailModal && selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedHotel.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {[...Array(selectedHotel.star_rating || 0)].map((_, i) => (
                    <IoStarSharp key={i} className="text-yellow-400" size={14} />
                  ))}
                  <span className="ml-2">{getStatusBadge(selectedHotel.verification_status)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEditModal(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Edit">
                  <IoPencilOutline size={20} />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                  <IoTrashOutline size={20} />
                </button>
                <button onClick={() => { setShowDetailModal(false); setSelectedHotel(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <IoClose size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Information
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'rooms' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <IoBedOutline size={18} /> Rooms
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'bookings' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  <IoCalendarOutline size={18} /> Bookings
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Info Tab */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500">Hotel Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-gray-500">City</span><span className="text-gray-900">{selectedHotel.city}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-gray-900">{selectedHotel.address || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Wilaya</span><span className="text-gray-900">{selectedHotel.wilaya?.name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="text-gray-900">{selectedHotel.phone || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-900">{selectedHotel.email || '-'}</span></div>
                    </div>
                    {selectedHotel.description && (
                      <div>
                        <span className="text-gray-500 block mb-2">Description</span>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">{selectedHotel.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-500">Owner & Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="text-gray-900">{selectedHotel.owner?.name || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Owner Email</span><span className="text-gray-900">{selectedHotel.owner?.email || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Total Rooms</span><span className="text-gray-900">{selectedHotel.rooms_count}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Total Bookings</span><span className="text-gray-900">{selectedHotel.total_bookings || 0}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Total Revenue</span><span className="text-gray-900 font-medium">{formatCurrency(selectedHotel.total_revenue || 0)}</span></div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => handleToggleActive(selectedHotel.id)}
                        disabled={actionLoading}
                        className={`flex-1 py-2 rounded-lg font-medium ${selectedHotel.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {selectedHotel.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {selectedHotel.verification_status === 'pending' && (
                        <button
                          onClick={() => handleVerify(selectedHotel.id)}
                          disabled={actionLoading}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                        >
                          Verify Hotel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rooms Tab */}
              {activeTab === 'rooms' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Rooms ({rooms.length})</h3>
                    <button onClick={() => openRoomModal()} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      <IoAddOutline size={18} /> Add Room
                    </button>
                  </div>
                  {rooms.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No rooms found</div>
                  ) : (
                    <div className="grid gap-4">
                      {rooms.map((room) => (
                        <div key={room.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{room.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs ${room.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {room.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">{room.room_type} • {room.capacity} guests • {room.bed_type}</p>
                            <p className="text-red-500 font-medium mt-1">{formatCurrency(room.price_per_night)} / night</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openRoomModal(room)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><IoPencilOutline size={18} /></button>
                            <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><IoTrashOutline size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Reservations</h3>
                    <select
                      value={reservationStatus}
                      onChange={(e) => { setReservationStatus(e.target.value); setReservationPage(1); }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked_in">Checked In</option>
                      <option value="checked_out">Checked Out</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  {reservations.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No reservations found</div>
                  ) : (
                    <div className="space-y-4">
                      {reservations.map((res) => (
                        <div key={res.id} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{res.user?.name || res.guest_name || 'Guest'}</p>
                              <p className="text-gray-500 text-sm">{res.user?.email}</p>
                              <p className="text-gray-500 text-sm mt-1">Room: {res.room?.name}</p>
                              <p className="text-gray-500 text-sm">{res.check_in_date} → {res.check_out_date}</p>
                              <p className="text-red-500 font-medium mt-2">{formatCurrency(res.total_price)}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(res.status)}
                              <div className="mt-3">
                                <select
                                  value={res.status}
                                  onChange={(e) => handleUpdateReservationStatus(res.id, e.target.value)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="checked_in">Checked In</option>
                                  <option value="checked_out">Checked Out</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {reservationPagination && reservationPagination.last_page > 1 && (
                        <div className="flex justify-center gap-2 pt-4">
                          <button onClick={() => setReservationPage(reservationPage - 1)} disabled={reservationPage === 1} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Prev</button>
                          <span className="px-3 py-1">{reservationPage} / {reservationPagination.last_page}</span>
                          <button onClick={() => setReservationPage(reservationPage + 1)} disabled={reservationPage === reservationPagination.last_page} className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50">Next</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Hotel Modal */}
      {showEditModal && selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Hotel</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><IoClose size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                <select value={editForm.star_rating} onChange={(e) => setEditForm({ ...editForm, star_rating: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                  {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={handleUpdateHotel} disabled={actionLoading} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{actionLoading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedRoom ? 'Edit Room' : 'Add Room'}</h2>
              <button onClick={() => setShowRoomModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><IoClose size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input type="text" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" placeholder="Room 101" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select value={roomForm.room_type} onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                    <option value="family">Family</option>
                    <option value="presidential">Presidential</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price/Night (DZD)</label>
                  <input type="number" value={roomForm.price_per_night} onChange={(e) => setRoomForm({ ...roomForm, price_per_night: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (m²)</label>
                  <input type="number" value={roomForm.size} onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                <select value={roomForm.bed_type} onChange={(e) => setRoomForm({ ...roomForm, bed_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg">
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="twin">Twin</option>
                  <option value="queen">Queen</option>
                  <option value="king">King</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_available" checked={roomForm.is_available} onChange={(e) => setRoomForm({ ...roomForm, is_available: e.target.checked })} className="rounded" />
                <label htmlFor="is_available" className="text-sm text-gray-700">Room is available</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowRoomModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveRoom} disabled={actionLoading || !roomForm.name || !roomForm.price_per_night} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{actionLoading ? 'Saving...' : 'Save Room'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedHotel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Hotel</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <span className="font-medium">{selectedHotel.name}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={handleDeleteHotel} disabled={actionLoading} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50">{actionLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
