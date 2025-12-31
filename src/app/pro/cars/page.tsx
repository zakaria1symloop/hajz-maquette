'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlinePhotograph, HiOutlineStar, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { FaCar } from 'react-icons/fa';

interface CarImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  license_plate: string;
  price_per_day: number;
  deposit_amount: number;
  mileage_limit: number | null;
  extra_km_price: number | null;
  min_rental_days: number | null;
  max_rental_days: number | null;
  features: string[] | null;
  is_available: boolean;
  images: CarImage[];
}

const carTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'van', 'truck', 'convertible', 'wagon'];
const transmissions = ['manual', 'automatic'];
const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];

export default function CarsManagementPage() {
  const router = useRouter();
  const { companyOwner, company, loading, businessType } = useProAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'sedan',
    transmission: 'manual',
    fuel_type: 'gasoline',
    seats: 5,
    doors: 4,
    color: '',
    license_plate: '',
    price_per_day: '',
    deposit_amount: '',
    mileage_limit: '',
    extra_km_price: '',
    min_rental_days: '',
    max_rental_days: '',
    features: '',
  });

  useEffect(() => {
    if (!loading && !companyOwner && businessType !== 'car_rental') {
      router.push('/pro/login');
    }
    if (!loading && !company) {
      router.push('/pro/company/create');
    }
    if (company) {
      fetchCars();
    }
  }, [loading, companyOwner, company, router, businessType]);

  const fetchCars = async () => {
    setLoadingCars(true);
    try {
      const token = localStorage.getItem('pro_token');
      const response = await api.get('/company-owner/cars', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCars(response.data.cars || response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch cars');
    } finally {
      setLoadingCars(false);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'sedan',
      transmission: 'manual',
      fuel_type: 'gasoline',
      seats: 5,
      doors: 4,
      color: '',
      license_plate: '',
      price_per_day: '',
      deposit_amount: '',
      mileage_limit: '',
      extra_km_price: '',
      min_rental_days: '',
      max_rental_days: '',
      features: '',
    });
    setEditingCar(null);
  };

  const handleEdit = (car: Car) => {
    setFormData({
      brand: car.brand,
      model: car.model,
      year: car.year,
      type: car.type,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      seats: car.seats,
      doors: car.doors,
      color: car.color || '',
      license_plate: car.license_plate || '',
      price_per_day: car.price_per_day.toString(),
      deposit_amount: car.deposit_amount?.toString() || '',
      mileage_limit: car.mileage_limit?.toString() || '',
      extra_km_price: car.extra_km_price?.toString() || '',
      min_rental_days: car.min_rental_days?.toString() || '',
      max_rental_days: car.max_rental_days?.toString() || '',
      features: car.features?.join(', ') || '',
    });
    setEditingCar(car);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      const data = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
        mileage_limit: formData.mileage_limit ? parseInt(formData.mileage_limit) : null,
        extra_km_price: formData.extra_km_price ? parseFloat(formData.extra_km_price) : null,
        min_rental_days: formData.min_rental_days ? parseInt(formData.min_rental_days) : null,
        max_rental_days: formData.max_rental_days ? parseInt(formData.max_rental_days) : null,
        features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : null,
      };

      if (editingCar) {
        await api.put(`/company-owner/cars/${editingCar.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Car updated successfully!');
      } else {
        await api.post('/company-owner/cars', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Car added successfully!');
      }

      fetchCars();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (carId: number) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/company-owner/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Car deleted successfully!');
      fetchCars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete car');
    }
  };

  const handleToggleAvailability = async (carId: number) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/company-owner/cars/${carId}/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Availability updated!');
      fetchCars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleImageUpload = async (carId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const token = localStorage.getItem('pro_token');
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images[]', file);
      });

      await api.post(`/company-owner/cars/${carId}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      toast.success('Images uploaded successfully!');
      fetchCars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (carId: number, imageId: number) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/company-owner/cars/${carId}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted');
      fetchCars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleSetPrimaryImage = async (carId: number, imageId: number) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`/company-owner/cars/${carId}/images/${imageId}/primary`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Primary image updated');
      fetchCars();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set primary image');
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder-car.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
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
                <FaCar size={14} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Cars Management</span>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <HiOutlinePlus size={18} />
            Add Car
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loadingCars ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FaCar size={56} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cars Yet</h3>
            <p className="text-gray-500 mb-6">Add your first car to start receiving bookings</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              <HiOutlinePlus size={20} />
              Add Your First Car
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Car Image */}
                <div className="relative h-48 bg-gray-100">
                  {car.images && car.images.length > 0 ? (
                    <img
                      src={getImageUrl(car.images.find(i => i.is_primary)?.image_path || car.images[0].image_path)}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaCar size={48} className="text-gray-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                    car.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {car.is_available ? 'Available' : 'Not Available'}
                  </div>
                </div>

                {/* Car Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {car.year} • {car.type} • {car.transmission} • {car.seats} seats
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl font-bold text-green-600">{car.price_per_day.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-1">DZD/day</span>
                    </div>
                    {car.mileage_limit && (
                      <span className="text-sm text-gray-500">{car.mileage_limit} km/day</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(car.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        car.is_available
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {car.is_available ? 'Set Unavailable' : 'Set Available'}
                    </button>
                    <button
                      onClick={() => handleEdit(car)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <HiOutlinePencil size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedCar(car)}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <HiOutlinePhotograph size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Car Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCar ? 'Edit Car' : 'Add New Car'}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Toyota, BMW, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Corolla, X5, etc."
                    required
                  />
                </div>
              </div>

              {/* Year & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {carTypes.map((type) => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transmission & Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transmission *</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {transmissions.map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type *</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {fuelTypes.map((f) => (
                      <option key={f} value={f} className="capitalize">{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seats & Doors */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seats *</label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="2"
                    max="12"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Doors *</label>
                  <input
                    type="number"
                    value={formData.doors}
                    onChange={(e) => setFormData({ ...formData, doors: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="2"
                    max="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plate</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="XXX-XXX"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per Day (DZD) *</label>
                  <input
                    type="number"
                    value={formData.price_per_day}
                    onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit (DZD)</label>
                  <input
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Mileage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mileage Limit (km/day)</label>
                  <input
                    type="number"
                    value={formData.mileage_limit}
                    onChange={(e) => setFormData({ ...formData, mileage_limit: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Leave empty for unlimited"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extra KM Price (DZD)</label>
                  <input
                    type="number"
                    value={formData.extra_km_price}
                    onChange={(e) => setFormData({ ...formData, extra_km_price: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Price per extra km"
                    min="0"
                  />
                </div>
              </div>

              {/* Rental Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rental Days</label>
                  <input
                    type="number"
                    value={formData.min_rental_days}
                    onChange={(e) => setFormData({ ...formData, min_rental_days: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Rental Days</label>
                  <input
                    type="number"
                    value={formData.max_rental_days}
                    onChange={(e) => setFormData({ ...formData, max_rental_days: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="1"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features (comma separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="AC, GPS, Bluetooth, etc."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <HiOutlineCheck size={18} />
                      {editingCar ? 'Update Car' : 'Add Car'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Images Modal */}
      {selectedCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedCar.brand} {selectedCar.model} - Images
              </h2>
              <button
                onClick={() => setSelectedCar(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Upload */}
              <div className="mb-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(selectedCar.id, e)}
                  className="hidden"
                  id="car-image-upload"
                />
                <label
                  htmlFor="car-image-upload"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus size={20} />
                      Add Images
                    </>
                  )}
                </label>
              </div>

              {/* Images Grid */}
              {selectedCar.images && selectedCar.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {selectedCar.images.map((image) => (
                    <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                      <img
                        src={getImageUrl(image.image_path)}
                        alt="Car"
                        className="w-full h-full object-cover"
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                          <HiOutlineStar size={12} />
                          Primary
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.is_primary && (
                          <button
                            onClick={() => handleSetPrimaryImage(selectedCar.id, image.id)}
                            className="p-2 bg-white rounded-full hover:bg-green-100 transition-colors"
                            title="Set as primary"
                          >
                            <HiOutlineStar size={18} className="text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(selectedCar.id, image.id)}
                          className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                          title="Delete image"
                        >
                          <HiOutlineTrash size={18} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <HiOutlinePhotograph size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No images uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
