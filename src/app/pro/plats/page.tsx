'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph, HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import { FaUtensils, FaLeaf } from 'react-icons/fa';

interface PlatImage {
  id: number;
  image_path: string;
  image_url: string;
  is_primary: boolean;
}

interface Plat {
  id: number;
  name: string;
  name_ar?: string;
  description?: string;
  price: number;
  category?: string;
  is_available: boolean;
  is_featured: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  preparation_time?: number;
  images: PlatImage[];
}

const CATEGORIES = [
  'Starters',
  'Main Course',
  'Grills',
  'Seafood',
  'Pasta',
  'Pizza',
  'Salads',
  'Sandwiches',
  'Desserts',
  'Beverages',
  'Traditional',
  'Other',
];

export default function PlatsPage() {
  const router = useRouter();
  const { restaurantOwner, restaurant, loading, businessType } = useProAuth();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlat, setEditingPlat] = useState<Plat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    price: '',
    category: '',
    is_available: true,
    is_featured: false,
    is_vegetarian: false,
    is_vegan: false,
    is_halal: true,
    preparation_time: '',
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
      fetchPlats();
    }
  }, [restaurant]);

  const fetchPlats = async () => {
    try {
      const token = localStorage.getItem('pro_token');
      const response = await api.get('/restaurant-owner/plats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlats(response.data.plats || []);
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoadingPlats(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      price: '',
      category: '',
      is_available: true,
      is_featured: false,
      is_vegetarian: false,
      is_vegan: false,
      is_halal: true,
      preparation_time: '',
    });
    setSelectedFiles([]);
    setEditingPlat(null);
  };

  const openEditModal = (plat: Plat) => {
    setEditingPlat(plat);
    setFormData({
      name: plat.name,
      name_ar: plat.name_ar || '',
      description: plat.description || '',
      price: plat.price.toString(),
      category: plat.category || '',
      is_available: plat.is_available,
      is_featured: plat.is_featured,
      is_vegetarian: plat.is_vegetarian,
      is_vegan: plat.is_vegan,
      is_halal: plat.is_halal,
      preparation_time: plat.preparation_time?.toString() || '',
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
        price: parseFloat(formData.price),
        preparation_time: formData.preparation_time ? parseInt(formData.preparation_time) : null,
      };

      if (editingPlat) {
        await api.put(`/restaurant-owner/plats/${editingPlat.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Dish updated successfully!');
      } else {
        const response = await api.post('/restaurant-owner/plats', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Upload images if any
        if (selectedFiles.length > 0) {
          const formDataImages = new FormData();
          selectedFiles.forEach((file) => {
            formDataImages.append('images[]', file);
          });

          await api.post(`/restaurant-owner/plats/${response.data.plat.id}/images`, formDataImages, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          });
        }
        toast.success('Dish created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchPlats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save dish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plat: Plat) => {
    if (!confirm(`Are you sure you want to delete "${plat.name}"?`)) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/restaurant-owner/plats/${plat.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Dish deleted successfully!');
      fetchPlats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete dish');
    }
  };

  const handleImageUpload = async (platId: number, files: FileList) => {
    setUploadingImages(true);
    try {
      const token = localStorage.getItem('pro_token');
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images[]', file);
      });

      await api.post(`/restaurant-owner/plats/${platId}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      toast.success('Images uploaded successfully!');
      fetchPlats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/restaurant-owner/plats/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted!');
      fetchPlats();
    } catch (err: any) {
      toast.error('Failed to delete image');
    }
  };

  const toggleAvailability = async (plat: Plat) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`/restaurant-owner/plats/${plat.id}`, {
        is_available: !plat.is_available
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlats();
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  if (loading || loadingPlats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Group plats by category
  const platsByCategory = plats.reduce((acc, plat) => {
    const category = plat.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(plat);
    return acc;
  }, {} as Record<string, Plat[]>);

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
              <span className="font-semibold text-gray-900">Menu Management</span>
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
            Add Dish
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Dishes</p>
            <p className="text-2xl font-bold text-gray-900">{plats.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Available</p>
            <p className="text-2xl font-bold text-green-600">{plats.filter(p => p.is_available).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Featured</p>
            <p className="text-2xl font-bold text-orange-600">{plats.filter(p => p.is_featured).length}</p>
          </div>
        </div>

        {/* Plats List */}
        {plats.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUtensils size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No dishes yet</h3>
            <p className="text-gray-500 mb-6">Start building your menu by adding your first dish</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <HiOutlinePlus size={18} />
              Add Your First Dish
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(platsByCategory).map(([category, categoryPlats]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPlats.map((plat) => (
                    <div key={plat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Image */}
                      <div className="relative h-40 bg-gray-100">
                        {plat.images.length > 0 ? (
                          <Image
                            src={plat.images[0].image_url}
                            alt={plat.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaUtensils size={32} className="text-gray-300" />
                          </div>
                        )}
                        {!plat.is_available && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Unavailable
                            </span>
                          </div>
                        )}
                        {plat.is_featured && (
                          <span className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            Featured
                          </span>
                        )}
                        {/* Image upload button */}
                        <label className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                          <HiOutlinePhotograph size={16} className="text-gray-600" />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files && handleImageUpload(plat.id, e.target.files)}
                          />
                        </label>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{plat.name}</h3>
                            {plat.name_ar && (
                              <p className="text-sm text-gray-500" dir="rtl">{plat.name_ar}</p>
                            )}
                          </div>
                          <span className="font-bold text-orange-600">{plat.price.toLocaleString()} DZD</span>
                        </div>

                        {plat.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{plat.description}</p>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {plat.is_vegetarian && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs">
                              <FaLeaf size={10} /> Vegetarian
                            </span>
                          )}
                          {plat.is_halal && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs">
                              Halal
                            </span>
                          )}
                          {plat.preparation_time && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {plat.preparation_time} min
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <button
                            onClick={() => toggleAvailability(plat)}
                            className={`text-sm font-medium ${plat.is_available ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            {plat.is_available ? 'Available' : 'Unavailable'}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(plat)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <HiOutlinePencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(plat)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <HiOutlineTrash size={18} />
                            </button>
                          </div>
                        </div>
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlat ? 'Edit Dish' : 'Add New Dish'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arabic Name</label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (DZD) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (minutes)</label>
                <input
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'is_available', label: 'Available' },
                  { key: 'is_featured', label: 'Featured' },
                  { key: 'is_vegetarian', label: 'Vegetarian' },
                  { key: 'is_halal', label: 'Halal' },
                ].map((toggle) => (
                  <label key={toggle.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData as any)[toggle.key]}
                      onChange={(e) => setFormData({ ...formData, [toggle.key]: e.target.checked })}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{toggle.label}</span>
                  </label>
                ))}
              </div>

              {/* Image upload for new plat */}
              {!editingPlat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{selectedFiles.length} file(s) selected</p>
                  )}
                </div>
              )}

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
                  {submitting ? 'Saving...' : (editingPlat ? 'Update Dish' : 'Add Dish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
