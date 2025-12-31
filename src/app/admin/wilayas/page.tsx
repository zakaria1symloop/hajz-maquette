'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoAddOutline, IoCloseOutline, IoTrashOutline, IoPencilOutline, IoLocationOutline, IoImageOutline } from 'react-icons/io5';
import toast, { Toaster } from 'react-hot-toast';

interface Wilaya {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  description: string;
  image: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  hotels_count: number;
  restaurants_count: number;
  car_rentals_count: number;
  total_services_count: number;
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminWilayasPage() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingWilaya, setEditingWilaya] = useState<Wilaya | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    code: '',
    description: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWilayas();
  }, [page, search]);

  const fetchWilayas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);

      const response = await api.get(`/admin/wilayas?${params.toString()}`);
      setWilayas(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch wilayas:', err);
      toast.error('Failed to fetch wilayas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (wilaya?: Wilaya) => {
    if (wilaya) {
      setEditingWilaya(wilaya);
      setForm({
        name: wilaya.name,
        name_ar: wilaya.name_ar || '',
        code: wilaya.code,
        description: wilaya.description || '',
        is_active: wilaya.is_active,
        is_featured: wilaya.is_featured,
        sort_order: wilaya.sort_order || 0,
      });
      setImagePreview(wilaya.image_url);
    } else {
      setEditingWilaya(null);
      setForm({
        name: '',
        name_ar: '',
        code: '',
        description: '',
        is_active: true,
        is_featured: false,
        sort_order: 0,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWilaya(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('name_ar', form.name_ar);
      formData.append('code', form.code);
      formData.append('description', form.description);
      formData.append('is_active', form.is_active ? '1' : '0');
      formData.append('is_featured', form.is_featured ? '1' : '0');
      formData.append('sort_order', form.sort_order.toString());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingWilaya) {
        formData.append('_method', 'PUT');
        await api.post(`/admin/wilayas/${editingWilaya.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Wilaya updated successfully');
      } else {
        await api.post('/admin/wilayas', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Wilaya created successfully');
      }

      handleCloseModal();
      fetchWilayas();
    } catch (err: any) {
      console.error('Failed to save wilaya:', err);
      toast.error(err.response?.data?.message || 'Failed to save wilaya');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wilaya: Wilaya) => {
    if (!confirm(`Are you sure you want to delete "${wilaya.name}"?`)) return;

    try {
      await api.delete(`/admin/wilayas/${wilaya.id}`);
      toast.success('Wilaya deleted successfully');
      fetchWilayas();
    } catch (err: any) {
      console.error('Failed to delete wilaya:', err);
      toast.error(err.response?.data?.message || 'Failed to delete wilaya');
    }
  };

  const handleToggleActive = async (wilaya: Wilaya) => {
    try {
      await api.put(`/admin/wilayas/${wilaya.id}`, { is_active: !wilaya.is_active });
      toast.success(wilaya.is_active ? 'Wilaya deactivated' : 'Wilaya activated');
      fetchWilayas();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleToggleFeatured = async (wilaya: Wilaya) => {
    try {
      await api.put(`/admin/wilayas/${wilaya.id}`, { is_featured: !wilaya.is_featured });
      toast.success(wilaya.is_featured ? 'Removed from featured' : 'Added to featured');
      fetchWilayas();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
      toast.error('Failed to update featured status');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wilayas</h1>
          <p className="text-gray-500 mt-1">Manage Algerian provinces</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
        >
          <IoAddOutline size={20} />
          Add Wilaya
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : wilayas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No wilayas found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Wilaya</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Code</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Services</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Featured</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wilayas.map((wilaya) => (
                  <tr key={wilaya.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {wilaya.image_url ? (
                          <img
                            src={wilaya.image_url}
                            alt={wilaya.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <IoLocationOutline className="text-gray-400" size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-gray-900 font-medium">{wilaya.name}</p>
                          {wilaya.name_ar && <p className="text-gray-500 text-xs" dir="rtl">{wilaya.name_ar}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">{wilaya.code}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-blue-600">{wilaya.hotels_count} Hotels</span>
                        <span className="text-red-600">{wilaya.restaurants_count} Restaurants</span>
                        <span className="text-green-600">{wilaya.car_rentals_count} Cars</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleFeatured(wilaya)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          wilaya.is_featured
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {wilaya.is_featured ? 'Featured' : 'Not Featured'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(wilaya)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          wilaya.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          wilaya.is_active ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(wilaya)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <IoPencilOutline size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(wilaya)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <IoTrashOutline size={18} />
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
              {pagination.total} wilayas
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <IoLocationOutline className="text-red-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingWilaya ? 'Edit Wilaya' : 'Add Wilaya'}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoCloseOutline size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IoImageOutline className="text-gray-400" size={24} />
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Choose Image
                    </button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., Algiers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                  <input
                    type="text"
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., الجزائر"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                    placeholder="e.g., 16"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Brief description of the wilaya..."
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingWilaya ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
