'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoCheckmarkCircle, IoEyeOutline, IoCloseOutline, IoAddOutline, IoTrashOutline, IoPencilOutline, IoRestaurantOutline } from 'react-icons/io5';
import toast, { Toaster } from 'react-hot-toast';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  city: string;
  address: string;
  cuisine_type: string;
  price_range: number;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
  rating: number;
  is_active: boolean;
  verification_status: string;
  tables_count: number;
  plats_count: number;
  table_reservations_count?: number;
  total_revenue?: number;
  total_bookings?: number;
  wilaya?: { id: number; name: string };
  wilaya_id?: number;
  owner?: { name: string; email: string };
  images?: { id: number; url: string; is_primary: boolean }[];
  tables?: Table[];
  plats?: Plat[];
  created_at: string;
}

interface Table {
  id: number;
  restaurant_id: number;
  name: string;
  capacity: number;
  price_per_hour: number;
  location: string;
  description: string;
  is_available: boolean;
}

interface Plat {
  id: number;
  restaurant_id: number;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  category: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
}

interface Reservation {
  id: number;
  user: { name: string; email: string };
  table: { name: string; capacity: number };
  reservation_date: string;
  reservation_time: string;
  guests_count: number;
  total_amount: number;
  status: string;
  special_requests?: string;
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'tables' | 'menu' | 'reservations'>('info');
  const [modalLoading, setModalLoading] = useState(false);

  // Table management
  const [tables, setTables] = useState<Table[]>([]);
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    name: '',
    capacity: 2,
    price_per_hour: 0,
    location: '',
    description: '',
    is_available: true,
  });

  // Plat management
  const [plats, setPlats] = useState<Plat[]>([]);
  const [showPlatForm, setShowPlatForm] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [platForm, setPlatForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: 0,
    category: '',
    is_available: true,
    is_featured: false,
    preparation_time: 15,
    is_vegetarian: false,
    is_vegan: false,
    is_halal: true,
  });

  // Reservations
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationPagination, setReservationPagination] = useState<Pagination | null>(null);
  const [reservationPage, setReservationPage] = useState(1);

  // Edit restaurant
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    cuisine_type: '',
    price_range: 1,
    phone: '',
    email: '',
    opening_time: '',
    closing_time: '',
    is_active: true,
    verification_status: 'pending',
  });

  useEffect(() => {
    fetchRestaurants();
  }, [page, search, statusFilter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('verification_status', statusFilter);

      const response = await api.get(`/admin/restaurants?${params.toString()}`);
      setRestaurants(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      toast.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantDetails = async (id: number) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/admin/restaurants/${id}`);
      setSelectedRestaurant(response.data);
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        city: response.data.city || '',
        address: response.data.address || '',
        cuisine_type: response.data.cuisine_type || '',
        price_range: response.data.price_range || 1,
        phone: response.data.phone || '',
        email: response.data.email || '',
        opening_time: response.data.opening_time || '',
        closing_time: response.data.closing_time || '',
        is_active: response.data.is_active,
        verification_status: response.data.verification_status,
      });
    } catch (err) {
      console.error('Failed to fetch restaurant details:', err);
      toast.error('Failed to fetch restaurant details');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchTables = async (restaurantId: number) => {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}/tables`);
      setTables(response.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    }
  };

  const fetchPlats = async (restaurantId: number) => {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}/plats`);
      setPlats(response.data);
    } catch (err) {
      console.error('Failed to fetch plats:', err);
    }
  };

  const fetchReservations = async (restaurantId: number, page: number = 1) => {
    try {
      const response = await api.get(`/admin/restaurants/${restaurantId}/reservations?page=${page}`);
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

  const handleViewRestaurant = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowModal(true);
    setActiveTab('info');
    await fetchRestaurantDetails(restaurant.id);
    await fetchTables(restaurant.id);
    await fetchPlats(restaurant.id);
  };

  const handleVerify = async (id: number) => {
    try {
      await api.post(`/admin/restaurants/${id}/verify`);
      toast.success('Restaurant verified successfully');
      fetchRestaurants();
      if (selectedRestaurant?.id === id) {
        fetchRestaurantDetails(id);
      }
    } catch (err) {
      console.error('Failed to verify restaurant:', err);
      toast.error('Failed to verify restaurant');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.post(`/admin/restaurants/${id}/toggle-active`);
      toast.success('Status updated successfully');
      fetchRestaurants();
      if (selectedRestaurant?.id === id) {
        fetchRestaurantDetails(id);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to toggle status');
    }
  };

  const handleUpdateRestaurant = async () => {
    if (!selectedRestaurant) return;
    try {
      await api.put(`/admin/restaurants/${selectedRestaurant.id}`, editForm);
      toast.success('Restaurant updated successfully');
      setIsEditing(false);
      fetchRestaurants();
      fetchRestaurantDetails(selectedRestaurant.id);
    } catch (err) {
      console.error('Failed to update restaurant:', err);
      toast.error('Failed to update restaurant');
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!selectedRestaurant) return;
    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    try {
      await api.delete(`/admin/restaurants/${selectedRestaurant.id}`);
      toast.success('Restaurant deleted successfully');
      setShowModal(false);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (err: any) {
      console.error('Failed to delete restaurant:', err);
      toast.error(err.response?.data?.message || 'Failed to delete restaurant');
    }
  };

  // Table handlers
  const handleSaveTable = async () => {
    if (!selectedRestaurant) return;
    try {
      if (editingTable) {
        await api.put(`/admin/restaurants/${selectedRestaurant.id}/tables/${editingTable.id}`, tableForm);
        toast.success('Table updated successfully');
      } else {
        await api.post(`/admin/restaurants/${selectedRestaurant.id}/tables`, tableForm);
        toast.success('Table created successfully');
      }
      setShowTableForm(false);
      setEditingTable(null);
      resetTableForm();
      fetchTables(selectedRestaurant.id);
    } catch (err) {
      console.error('Failed to save table:', err);
      toast.error('Failed to save table');
    }
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setTableForm({
      name: table.name,
      capacity: table.capacity,
      price_per_hour: table.price_per_hour,
      location: table.location || '',
      description: table.description || '',
      is_available: table.is_available,
    });
    setShowTableForm(true);
  };

  const handleDeleteTable = async (tableId: number) => {
    if (!selectedRestaurant) return;
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/admin/restaurants/${selectedRestaurant.id}/tables/${tableId}`);
      toast.success('Table deleted successfully');
      fetchTables(selectedRestaurant.id);
    } catch (err: any) {
      console.error('Failed to delete table:', err);
      toast.error(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const resetTableForm = () => {
    setTableForm({
      name: '',
      capacity: 2,
      price_per_hour: 0,
      location: '',
      description: '',
      is_available: true,
    });
  };

  // Plat handlers
  const handleSavePlat = async () => {
    if (!selectedRestaurant) return;
    try {
      if (editingPlat) {
        await api.put(`/admin/restaurants/${selectedRestaurant.id}/plats/${editingPlat.id}`, platForm);
        toast.success('Plat updated successfully');
      } else {
        await api.post(`/admin/restaurants/${selectedRestaurant.id}/plats`, platForm);
        toast.success('Plat created successfully');
      }
      setShowPlatForm(false);
      setEditingPlat(null);
      resetPlatForm();
      fetchPlats(selectedRestaurant.id);
    } catch (err) {
      console.error('Failed to save plat:', err);
      toast.error('Failed to save plat');
    }
  };

  const handleEditPlat = (plat: Plat) => {
    setEditingPlat(plat);
    setPlatForm({
      name: plat.name,
      name_ar: plat.name_ar || '',
      description: plat.description || '',
      description_ar: plat.description_ar || '',
      price: plat.price,
      category: plat.category,
      is_available: plat.is_available,
      is_featured: plat.is_featured,
      preparation_time: plat.preparation_time || 15,
      is_vegetarian: plat.is_vegetarian,
      is_vegan: plat.is_vegan,
      is_halal: plat.is_halal,
    });
    setShowPlatForm(true);
  };

  const handleDeletePlat = async (platId: number) => {
    if (!selectedRestaurant) return;
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/admin/restaurants/${selectedRestaurant.id}/plats/${platId}`);
      toast.success('Menu item deleted successfully');
      fetchPlats(selectedRestaurant.id);
    } catch (err) {
      console.error('Failed to delete plat:', err);
      toast.error('Failed to delete menu item');
    }
  };

  const resetPlatForm = () => {
    setPlatForm({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price: 0,
      category: '',
      is_available: true,
      is_featured: false,
      preparation_time: 15,
      is_vegetarian: false,
      is_vegan: false,
      is_halal: true,
    });
  };

  // Reservation handlers
  const handleUpdateReservation = async (reservationId: number, status: string) => {
    if (!selectedRestaurant) return;
    try {
      await api.put(`/admin/restaurants/${selectedRestaurant.id}/reservations/${reservationId}`, { status });
      toast.success('Reservation updated successfully');
      fetchReservations(selectedRestaurant.id, reservationPage);
    } catch (err) {
      console.error('Failed to update reservation:', err);
      toast.error('Failed to update reservation');
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (selectedRestaurant) {
      if (tab === 'tables') {
        fetchTables(selectedRestaurant.id);
      } else if (tab === 'menu') {
        fetchPlats(selectedRestaurant.id);
      } else if (tab === 'reservations') {
        setReservationPage(1);
        fetchReservations(selectedRestaurant.id, 1);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Verified</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{status}</span>;
    }
  };

  const getReservationStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      seated: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriceRange = (range: number) => {
    return '$'.repeat(range || 1);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
        <p className="text-gray-500 mt-1">Manage restaurants on the platform</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No restaurants found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Restaurant</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Location</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Owner</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Tables</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-900 font-medium">{restaurant.name}</p>
                        <p className="text-gray-500 text-xs">{restaurant.cuisine_type}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {restaurant.city}{restaurant.wilaya ? `, ${restaurant.wilaya.name}` : ''}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-600">{restaurant.owner?.name || '-'}</p>
                        <p className="text-gray-400 text-xs">{restaurant.owner?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{restaurant.tables_count}</td>
                    <td className="py-4 px-6">{getStatusBadge(restaurant.verification_status)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(restaurant.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          restaurant.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          restaurant.is_active ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {restaurant.verification_status === 'pending' && (
                          <button
                            onClick={() => handleVerify(restaurant.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Verify"
                          >
                            <IoCheckmarkCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewRestaurant(restaurant)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
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
              {pagination.total} restaurants
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
      {showModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <IoRestaurantOutline className="text-red-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedRestaurant.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedRestaurant.cuisine_type}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRestaurant(null);
                  setIsEditing(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoCloseOutline size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-1 px-6">
                {(['info', 'tables', 'menu', 'reservations'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'info' ? 'Information' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                </div>
              ) : (
                <>
                  {/* Info Tab */}
                  {activeTab === 'info' && (
                    <div className="space-y-6">
                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Tables</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedRestaurant.tables_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Menu Items</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedRestaurant.plats_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Total Bookings</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedRestaurant.total_bookings || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedRestaurant.total_revenue?.toLocaleString() || 0} DZD</p>
                        </div>
                      </div>

                      {/* Restaurant Info */}
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine Type</label>
                              <input
                                type="text"
                                value={editForm.cuisine_type}
                                onChange={(e) => setEditForm({ ...editForm, cuisine_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                              <input
                                type="text"
                                value={editForm.city}
                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                              <input
                                type="time"
                                value={editForm.opening_time}
                                onChange={(e) => setEditForm({ ...editForm, opening_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                              <input
                                type="time"
                                value={editForm.closing_time}
                                onChange={(e) => setEditForm({ ...editForm, closing_time: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                              <select
                                value={editForm.price_range}
                                onChange={(e) => setEditForm({ ...editForm, price_range: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <option value={1}>$ - Budget</option>
                                <option value={2}>$$ - Moderate</option>
                                <option value={3}>$$$ - Expensive</option>
                                <option value={4}>$$$$ - Luxury</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                value={editForm.verification_status}
                                onChange={(e) => setEditForm({ ...editForm, verification_status: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleUpdateRestaurant}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-500 text-sm">Owner</p>
                              <p className="text-gray-900 font-medium">{selectedRestaurant.owner?.name || '-'}</p>
                              <p className="text-gray-500 text-xs">{selectedRestaurant.owner?.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Location</p>
                              <p className="text-gray-900">{selectedRestaurant.city}, {selectedRestaurant.wilaya?.name}</p>
                              <p className="text-gray-500 text-xs">{selectedRestaurant.address}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Contact</p>
                              <p className="text-gray-900">{selectedRestaurant.phone || '-'}</p>
                              <p className="text-gray-500 text-xs">{selectedRestaurant.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Hours</p>
                              <p className="text-gray-900">{selectedRestaurant.opening_time} - {selectedRestaurant.closing_time}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Price Range</p>
                              <p className="text-gray-900">{getPriceRange(selectedRestaurant.price_range)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Status</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(selectedRestaurant.verification_status)}
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedRestaurant.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {selectedRestaurant.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedRestaurant.description && (
                            <div>
                              <p className="text-gray-500 text-sm">Description</p>
                              <p className="text-gray-900">{selectedRestaurant.description}</p>
                            </div>
                          )}
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Edit Restaurant
                            </button>
                            {selectedRestaurant.verification_status === 'pending' && (
                              <button
                                onClick={() => handleVerify(selectedRestaurant.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Verify Restaurant
                              </button>
                            )}
                            <button
                              onClick={handleDeleteRestaurant}
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Delete Restaurant
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tables Tab */}
                  {activeTab === 'tables' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Tables ({tables.length})</h3>
                        <button
                          onClick={() => {
                            setEditingTable(null);
                            resetTableForm();
                            setShowTableForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <IoAddOutline size={18} />
                          Add Table
                        </button>
                      </div>

                      {/* Table Form */}
                      {showTableForm && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                          <h4 className="font-medium text-gray-900">{editingTable ? 'Edit Table' : 'New Table'}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={tableForm.name}
                                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                                placeholder="e.g., Table 1, VIP Table"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                              <input
                                type="number"
                                min="1"
                                value={tableForm.capacity}
                                onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour (DZD)</label>
                              <input
                                type="number"
                                min="0"
                                value={tableForm.price_per_hour}
                                onChange={(e) => setTableForm({ ...tableForm, price_per_hour: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                              <input
                                type="text"
                                value={tableForm.location}
                                onChange={(e) => setTableForm({ ...tableForm, location: e.target.value })}
                                placeholder="e.g., Indoor, Terrace, VIP Room"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={tableForm.description}
                              onChange={(e) => setTableForm({ ...tableForm, description: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tableForm.is_available}
                                onChange={(e) => setTableForm({ ...tableForm, is_available: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Available</span>
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSaveTable}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              {editingTable ? 'Update Table' : 'Create Table'}
                            </button>
                            <button
                              onClick={() => {
                                setShowTableForm(false);
                                setEditingTable(null);
                                resetTableForm();
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tables List */}
                      {tables.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No tables found
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {tables.map((table) => (
                            <div key={table.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium text-gray-900">{table.name}</h4>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${table.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {table.is_available ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>Capacity: {table.capacity} guests</span>
                                  <span>Price: {table.price_per_hour.toLocaleString()} DZD/hr</span>
                                  {table.location && <span>Location: {table.location}</span>}
                                </div>
                                {table.description && (
                                  <p className="text-sm text-gray-500 mt-1">{table.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditTable(table)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                  <IoPencilOutline size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTable(table.id)}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <IoTrashOutline size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menu Tab */}
                  {activeTab === 'menu' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Menu Items ({plats.length})</h3>
                        <button
                          onClick={() => {
                            setEditingPlat(null);
                            resetPlatForm();
                            setShowPlatForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <IoAddOutline size={18} />
                          Add Item
                        </button>
                      </div>

                      {/* Plat Form */}
                      {showPlatForm && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                          <h4 className="font-medium text-gray-900">{editingPlat ? 'Edit Menu Item' : 'New Menu Item'}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={platForm.name}
                                onChange={(e) => setPlatForm({ ...platForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                              <input
                                type="text"
                                value={platForm.name_ar}
                                onChange={(e) => setPlatForm({ ...platForm, name_ar: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                dir="rtl"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price (DZD)</label>
                              <input
                                type="number"
                                min="0"
                                value={platForm.price}
                                onChange={(e) => setPlatForm({ ...platForm, price: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                              <input
                                type="text"
                                value={platForm.category}
                                onChange={(e) => setPlatForm({ ...platForm, category: e.target.value })}
                                placeholder="e.g., Appetizers, Main Course, Desserts"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
                              <input
                                type="number"
                                min="0"
                                value={platForm.preparation_time}
                                onChange={(e) => setPlatForm({ ...platForm, preparation_time: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={platForm.description}
                              onChange={(e) => setPlatForm({ ...platForm, description: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platForm.is_available}
                                onChange={(e) => setPlatForm({ ...platForm, is_available: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Available</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platForm.is_featured}
                                onChange={(e) => setPlatForm({ ...platForm, is_featured: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Featured</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platForm.is_vegetarian}
                                onChange={(e) => setPlatForm({ ...platForm, is_vegetarian: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Vegetarian</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platForm.is_vegan}
                                onChange={(e) => setPlatForm({ ...platForm, is_vegan: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Vegan</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={platForm.is_halal}
                                onChange={(e) => setPlatForm({ ...platForm, is_halal: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Halal</span>
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSavePlat}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              {editingPlat ? 'Update Item' : 'Create Item'}
                            </button>
                            <button
                              onClick={() => {
                                setShowPlatForm(false);
                                setEditingPlat(null);
                                resetPlatForm();
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Menu List */}
                      {plats.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No menu items found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Group by category */}
                          {Object.entries(
                            plats.reduce((acc, plat) => {
                              const cat = plat.category || 'Uncategorized';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(plat);
                              return acc;
                            }, {} as Record<string, Plat[]>)
                          ).map(([category, items]) => (
                            <div key={category}>
                              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">{category}</h4>
                              <div className="grid gap-3">
                                {items.map((plat) => (
                                  <div key={plat.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3">
                                        <h4 className="font-medium text-gray-900">{plat.name}</h4>
                                        {plat.is_featured && (
                                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Featured</span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded text-xs ${plat.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {plat.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                      </div>
                                      <p className="text-lg font-semibold text-red-600 mt-1">{plat.price.toLocaleString()} DZD</p>
                                      {plat.description && (
                                        <p className="text-sm text-gray-500 mt-1">{plat.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 mt-2">
                                        {plat.is_halal && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Halal</span>}
                                        {plat.is_vegetarian && <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Vegetarian</span>}
                                        {plat.is_vegan && <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Vegan</span>}
                                        {plat.preparation_time > 0 && <span className="text-xs text-gray-500">{plat.preparation_time} min</span>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditPlat(plat)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                      >
                                        <IoPencilOutline size={18} />
                                      </button>
                                      <button
                                        onClick={() => handleDeletePlat(plat.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <IoTrashOutline size={18} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reservations Tab */}
                  {activeTab === 'reservations' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Reservations</h3>

                      {reservations.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No reservations found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reservations.map((reservation) => (
                            <div key={reservation.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-medium text-gray-900">{reservation.user?.name || 'Guest'}</h4>
                                    {getReservationStatusBadge(reservation.status)}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{reservation.user?.email}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span>Date: {reservation.reservation_date}</span>
                                    <span>Time: {reservation.reservation_time}</span>
                                    <span>Guests: {reservation.guests_count}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">Table: {reservation.table?.name}</p>
                                  {reservation.special_requests && (
                                    <p className="text-sm text-gray-500 mt-1">Notes: {reservation.special_requests}</p>
                                  )}
                                  <p className="text-lg font-semibold text-red-600 mt-2">{reservation.total_amount?.toLocaleString() || 0} DZD</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <select
                                    value={reservation.status}
                                    onChange={(e) => handleUpdateReservation(reservation.id, e.target.value)}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="seated">Seated</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_show">No Show</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Reservation Pagination */}
                          {reservationPagination && reservationPagination.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4">
                              <p className="text-gray-500 text-sm">
                                Page {reservationPagination.current_page} of {reservationPagination.last_page}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newPage = reservationPage - 1;
                                    setReservationPage(newPage);
                                    fetchReservations(selectedRestaurant!.id, newPage);
                                  }}
                                  disabled={reservationPage === 1}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
                                >
                                  Previous
                                </button>
                                <button
                                  onClick={() => {
                                    const newPage = reservationPage + 1;
                                    setReservationPage(newPage);
                                    fetchReservations(selectedRestaurant!.id, newPage);
                                  }}
                                  disabled={reservationPage === reservationPagination.last_page}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
