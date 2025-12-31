'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineUsers, HiOutlineLocationMarker } from 'react-icons/hi';
import { FaUtensils } from 'react-icons/fa';

interface Table {
  id: number;
  name: string;
  capacity: number;
  price_per_hour: number;
  location?: string;
  description?: string;
  is_available: boolean;
  sort_order: number;
  reservations_count?: number;
}

const LOCATIONS = [
  'Indoor',
  'Outdoor',
  'Terrace',
  'Private Room',
  'Rooftop',
  'Garden',
  'Bar Area',
  'VIP Section',
];

export default function TablesPage() {
  const router = useRouter();
  const { restaurantOwner, restaurant, loading, businessType } = useProAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    price_per_hour: '',
    location: '',
    description: '',
    is_available: true,
  });

  useEffect(() => {
    if (!loading && (!restaurantOwner || businessType !== 'restaurant')) {
      router.push('/pro/login');
    }
    if (!loading && !restaurant) {
      router.push('/pro/restaurant/create');
    }
  }, [loading, restaurantOwner, restaurant, router, businessType]);

  useEffect(() => {
    if (restaurant) {
      fetchTables();
    }
  }, [restaurant]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('pro_token');
      const response = await api.get('/restaurant-owner/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTables(response.data.tables || []);
    } catch (err) {
      toast.error('Failed to load tables');
    } finally {
      setLoadingTables(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: '',
      price_per_hour: '',
      location: '',
      description: '',
      is_available: true,
    });
    setEditingTable(null);
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.capacity.toString(),
      price_per_hour: table.price_per_hour?.toString() || '',
      location: table.location || '',
      description: table.description || '',
      is_available: table.is_available,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('pro_token');
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        price_per_hour: parseFloat(formData.price_per_hour) || 0,
      };

      if (editingTable) {
        await api.put(`/restaurant-owner/tables/${editingTable.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Table updated successfully!');
      } else {
        await api.post('/restaurant-owner/tables', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Table created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Are you sure you want to delete "${table.name}"?`)) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/restaurant-owner/tables/${table.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Table deleted successfully!');
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const toggleAvailability = async (table: Table) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`/restaurant-owner/tables/${table.id}`, {
        is_available: !table.is_available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTables();
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  if (loading || loadingTables) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Group tables by location
  const tablesByLocation = tables.reduce((acc, table) => {
    const location = table.location || 'Unassigned';
    if (!acc[location]) acc[location] = [];
    acc[location].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

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
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <FaUtensils size={14} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Table Management</span>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <HiOutlinePlus size={18} />
            Add Table
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Tables</p>
            <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Capacity</p>
            <p className="text-2xl font-bold text-orange-600">{totalCapacity} seats</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{tables.filter(t => t.is_available).length}</p>
          </div>
        </div>

        {/* Tables List */}
        {tables.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tables yet</h3>
            <p className="text-gray-500 mb-6">Start managing reservations by adding your tables</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <HiOutlinePlus size={18} />
              Add Your First Table
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tablesByLocation).map(([location, locationTables]) => (
              <div key={location}>
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineLocationMarker size={18} className="text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">{location}</h2>
                  <span className="text-sm text-gray-500">({locationTables.length} tables)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {locationTables.map((table) => (
                    <div
                      key={table.id}
                      className={`bg-white rounded-xl border p-4 transition-all ${
                        table.is_available
                          ? 'border-gray-100 hover:shadow-lg hover:border-orange-200'
                          : 'border-red-100 bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{table.name}</h3>
                          <div className="flex items-center gap-3 text-sm mt-1">
                            <span className="flex items-center gap-1 text-gray-500">
                              <HiOutlineUsers size={14} />
                              {table.capacity} seats
                            </span>
                            <span className="font-semibold text-orange-600">
                              {table.price_per_hour?.toLocaleString()} DZD/h
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleAvailability(table)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            table.is_available
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {table.is_available ? 'Available' : 'Unavailable'}
                        </button>
                      </div>

                      {table.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{table.description}</p>
                      )}

                      {table.reservations_count !== undefined && table.reservations_count > 0 && (
                        <p className="text-xs text-orange-600 mb-3">
                          {table.reservations_count} upcoming reservation(s)
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditModal(table)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <HiOutlinePencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(table)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <HiOutlineTrash size={18} />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Table 1, VIP Table A"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (seats) *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="1"
                    placeholder="Number of seats"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour (DZD) *</label>
                  <input
                    type="number"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="0"
                    step="100"
                    placeholder="e.g., 500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select location</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Optional notes about this table..."
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Available for reservations</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingTable ? 'Update Table' : 'Add Table')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
