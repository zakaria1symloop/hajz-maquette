'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoCheckmarkCircle, IoEyeOutline, IoCloseOutline, IoAddOutline, IoTrashOutline, IoPencilOutline, IoCarSportOutline } from 'react-icons/io5';
import toast, { Toaster } from 'react-hot-toast';

interface CarRental {
  id: number;
  name: string;
  description: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  is_active: boolean;
  verification_status: string;
  cars_count: number;
  bookings_count?: number;
  total_revenue?: number;
  total_bookings?: number;
  wilaya?: { id: number; name: string };
  wilaya_id?: number;
  owner?: { name: string; email: string };
  images?: { id: number; url: string; is_primary: boolean }[];
  cars?: Car[];
  created_at: string;
}

interface Car {
  id: number;
  car_rental_company_id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  has_ac: boolean;
  has_gps: boolean;
  has_bluetooth: boolean;
  has_usb: boolean;
  has_child_seat: boolean;
  price_per_day: number;
  price_per_hour: number;
  deposit_amount: number;
  mileage_limit: number;
  extra_km_price: number;
  description: string;
  is_available: boolean;
  is_featured: boolean;
  full_name?: string;
}

interface Booking {
  id: number;
  user?: { name: string; email: string };
  car?: { brand: string; model: string; year: number; full_name: string };
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  rental_days: number;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminCarRentalsPage() {
  const [companies, setCompanies] = useState<CarRental[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedCompany, setSelectedCompany] = useState<CarRental | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'cars' | 'bookings'>('info');
  const [modalLoading, setModalLoading] = useState(false);

  // Car management
  const [cars, setCars] = useState<Car[]>([]);
  const [showCarForm, setShowCarForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [carForm, setCarForm] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    type: 'sedan',
    transmission: 'manual',
    fuel_type: 'petrol',
    seats: 5,
    doors: 4,
    has_ac: true,
    has_gps: false,
    has_bluetooth: false,
    has_usb: false,
    has_child_seat: false,
    price_per_day: 0,
    price_per_hour: 0,
    deposit_amount: 0,
    mileage_limit: 0,
    extra_km_price: 0,
    description: '',
    is_available: true,
    is_featured: false,
  });

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingPagination, setBookingPagination] = useState<Pagination | null>(null);
  const [bookingPage, setBookingPage] = useState(1);

  // Edit company
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
    verification_status: 'pending',
  });

  useEffect(() => {
    fetchCompanies();
  }, [page, search, statusFilter]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('verification_status', statusFilter);

      const response = await api.get(`/admin/car-rentals?${params.toString()}`);
      setCompanies(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch car rentals:', err);
      toast.error('Failed to fetch car rentals');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (id: number) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/admin/car-rentals/${id}`);
      setSelectedCompany(response.data);
      setEditForm({
        name: response.data.name || '',
        description: response.data.description || '',
        city: response.data.city || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        is_active: response.data.is_active,
        verification_status: response.data.verification_status,
      });
    } catch (err) {
      console.error('Failed to fetch company details:', err);
      toast.error('Failed to fetch company details');
    } finally {
      setModalLoading(false);
    }
  };

  const fetchCars = async (companyId: number) => {
    try {
      const response = await api.get(`/admin/car-rentals/${companyId}/cars`);
      setCars(response.data);
    } catch (err) {
      console.error('Failed to fetch cars:', err);
    }
  };

  const fetchBookings = async (companyId: number, page: number = 1) => {
    try {
      const response = await api.get(`/admin/car-rentals/${companyId}/bookings?page=${page}`);
      setBookings(response.data.data);
      setBookingPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const handleViewCompany = async (company: CarRental) => {
    setSelectedCompany(company);
    setShowModal(true);
    setActiveTab('info');
    await fetchCompanyDetails(company.id);
    await fetchCars(company.id);
  };

  const handleVerify = async (id: number) => {
    try {
      await api.post(`/admin/car-rentals/${id}/verify`);
      toast.success('Company verified successfully');
      fetchCompanies();
      if (selectedCompany?.id === id) {
        fetchCompanyDetails(id);
      }
    } catch (err) {
      console.error('Failed to verify:', err);
      toast.error('Failed to verify company');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.post(`/admin/car-rentals/${id}/toggle-active`);
      toast.success('Status updated successfully');
      fetchCompanies();
      if (selectedCompany?.id === id) {
        fetchCompanyDetails(id);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to toggle status');
    }
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;
    try {
      await api.put(`/admin/car-rentals/${selectedCompany.id}`, editForm);
      toast.success('Company updated successfully');
      setIsEditing(false);
      fetchCompanies();
      fetchCompanyDetails(selectedCompany.id);
    } catch (err) {
      console.error('Failed to update company:', err);
      toast.error('Failed to update company');
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await api.delete(`/admin/car-rentals/${selectedCompany.id}`);
      toast.success('Company deleted successfully');
      setShowModal(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (err: any) {
      console.error('Failed to delete company:', err);
      toast.error(err.response?.data?.message || 'Failed to delete company');
    }
  };

  // Car handlers
  const handleSaveCar = async () => {
    if (!selectedCompany) return;
    try {
      if (editingCar) {
        await api.put(`/admin/car-rentals/${selectedCompany.id}/cars/${editingCar.id}`, carForm);
        toast.success('Car updated successfully');
      } else {
        await api.post(`/admin/car-rentals/${selectedCompany.id}/cars`, carForm);
        toast.success('Car created successfully');
      }
      setShowCarForm(false);
      setEditingCar(null);
      resetCarForm();
      fetchCars(selectedCompany.id);
    } catch (err) {
      console.error('Failed to save car:', err);
      toast.error('Failed to save car');
    }
  };

  const handleEditCar = (car: Car) => {
    setEditingCar(car);
    setCarForm({
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color || '',
      license_plate: car.license_plate || '',
      type: car.type,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      seats: car.seats,
      doors: car.doors || 4,
      has_ac: car.has_ac,
      has_gps: car.has_gps,
      has_bluetooth: car.has_bluetooth,
      has_usb: car.has_usb,
      has_child_seat: car.has_child_seat,
      price_per_day: car.price_per_day,
      price_per_hour: car.price_per_hour || 0,
      deposit_amount: car.deposit_amount || 0,
      mileage_limit: car.mileage_limit || 0,
      extra_km_price: car.extra_km_price || 0,
      description: car.description || '',
      is_available: car.is_available,
      is_featured: car.is_featured,
    });
    setShowCarForm(true);
  };

  const handleDeleteCar = async (carId: number) => {
    if (!selectedCompany) return;
    if (!confirm('Are you sure you want to delete this car?')) return;
    try {
      await api.delete(`/admin/car-rentals/${selectedCompany.id}/cars/${carId}`);
      toast.success('Car deleted successfully');
      fetchCars(selectedCompany.id);
    } catch (err: any) {
      console.error('Failed to delete car:', err);
      toast.error(err.response?.data?.message || 'Failed to delete car');
    }
  };

  const resetCarForm = () => {
    setCarForm({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      type: 'sedan',
      transmission: 'manual',
      fuel_type: 'petrol',
      seats: 5,
      doors: 4,
      has_ac: true,
      has_gps: false,
      has_bluetooth: false,
      has_usb: false,
      has_child_seat: false,
      price_per_day: 0,
      price_per_hour: 0,
      deposit_amount: 0,
      mileage_limit: 0,
      extra_km_price: 0,
      description: '',
      is_available: true,
      is_featured: false,
    });
  };

  // Booking handlers
  const handleUpdateBooking = async (bookingId: number, status: string) => {
    if (!selectedCompany) return;
    try {
      await api.put(`/admin/car-rentals/${selectedCompany.id}/bookings/${bookingId}`, { status });
      toast.success('Booking updated successfully');
      fetchBookings(selectedCompany.id, bookingPage);
    } catch (err) {
      console.error('Failed to update booking:', err);
      toast.error('Failed to update booking');
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (selectedCompany) {
      if (tab === 'cars') {
        fetchCars(selectedCompany.id);
      } else if (tab === 'bookings') {
        setBookingPage(1);
        fetchBookings(selectedCompany.id, 1);
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

  const getBookingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      picked_up: 'bg-purple-100 text-purple-700',
      returned: 'bg-indigo-100 text-indigo-700',
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Car Rentals</h1>
        <p className="text-gray-500 mt-1">Manage car rental companies</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search companies..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No car rentals found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Company</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Location</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Owner</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Cars</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-gray-900 font-medium">{company.name}</p>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {company.city}{company.wilaya ? `, ${company.wilaya.name}` : ''}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-600">{company.owner?.name || '-'}</p>
                        <p className="text-gray-400 text-xs">{company.owner?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{company.cars_count}</td>
                    <td className="py-4 px-6">{getStatusBadge(company.verification_status)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(company.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${company.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${company.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {company.verification_status === 'pending' && (
                          <button
                            onClick={() => handleVerify(company.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Verify"
                          >
                            <IoCheckmarkCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewCompany(company)}
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
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors">Previous</button>
              <button onClick={() => setPage(page + 1)} disabled={page === pagination.last_page} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <IoCarSportOutline className="text-red-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                  <p className="text-gray-500 text-sm">{selectedCompany.city}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedCompany(null);
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
                {(['info', 'cars', 'bookings'] as const).map((tab) => (
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
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Cars</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedCompany.cars_count || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Total Bookings</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedCompany.total_bookings || 0}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-500 text-sm">Total Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">{selectedCompany.total_revenue?.toLocaleString() || 0} DZD</p>
                        </div>
                      </div>

                      {/* Company Info */}
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
                              onClick={handleUpdateCompany}
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
                              <p className="text-gray-900 font-medium">{selectedCompany.owner?.name || '-'}</p>
                              <p className="text-gray-500 text-xs">{selectedCompany.owner?.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Location</p>
                              <p className="text-gray-900">{selectedCompany.city}, {selectedCompany.wilaya?.name}</p>
                              <p className="text-gray-500 text-xs">{selectedCompany.address}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Contact</p>
                              <p className="text-gray-900">{selectedCompany.phone || '-'}</p>
                              <p className="text-gray-500 text-xs">{selectedCompany.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-sm">Status</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(selectedCompany.verification_status)}
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedCompany.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {selectedCompany.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedCompany.description && (
                            <div>
                              <p className="text-gray-500 text-sm">Description</p>
                              <p className="text-gray-900">{selectedCompany.description}</p>
                            </div>
                          )}
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Edit Company
                            </button>
                            {selectedCompany.verification_status === 'pending' && (
                              <button
                                onClick={() => handleVerify(selectedCompany.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                Verify Company
                              </button>
                            )}
                            <button
                              onClick={handleDeleteCompany}
                              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Delete Company
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cars Tab */}
                  {activeTab === 'cars' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Cars ({cars.length})</h3>
                        <button
                          onClick={() => {
                            setEditingCar(null);
                            resetCarForm();
                            setShowCarForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <IoAddOutline size={18} />
                          Add Car
                        </button>
                      </div>

                      {/* Car Form */}
                      {showCarForm && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                          <h4 className="font-medium text-gray-900">{editingCar ? 'Edit Car' : 'New Car'}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                              <input
                                type="text"
                                value={carForm.brand}
                                onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                                placeholder="e.g., Toyota, Honda"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                              <input
                                type="text"
                                value={carForm.model}
                                onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                                placeholder="e.g., Corolla, Civic"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                              <input
                                type="number"
                                value={carForm.year}
                                onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                              <select
                                value={carForm.type}
                                onChange={(e) => setCarForm({ ...carForm, type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <option value="sedan">Sedan</option>
                                <option value="suv">SUV</option>
                                <option value="hatchback">Hatchback</option>
                                <option value="coupe">Coupe</option>
                                <option value="pickup">Pickup</option>
                                <option value="van">Van</option>
                                <option value="luxury">Luxury</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                              <select
                                value={carForm.transmission}
                                onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <option value="manual">Manual</option>
                                <option value="automatic">Automatic</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                              <select
                                value={carForm.fuel_type}
                                onChange={(e) => setCarForm({ ...carForm, fuel_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <option value="petrol">Petrol</option>
                                <option value="diesel">Diesel</option>
                                <option value="electric">Electric</option>
                                <option value="hybrid">Hybrid</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                              <input
                                type="number"
                                min="1"
                                value={carForm.seats}
                                onChange={(e) => setCarForm({ ...carForm, seats: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                              <input
                                type="text"
                                value={carForm.color}
                                onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                              <input
                                type="text"
                                value={carForm.license_plate}
                                onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Day (DZD)</label>
                              <input
                                type="number"
                                min="0"
                                value={carForm.price_per_day}
                                onChange={(e) => setCarForm({ ...carForm, price_per_day: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (DZD)</label>
                              <input
                                type="number"
                                min="0"
                                value={carForm.deposit_amount}
                                onChange={(e) => setCarForm({ ...carForm, deposit_amount: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage Limit (km)</label>
                              <input
                                type="number"
                                min="0"
                                value={carForm.mileage_limit}
                                onChange={(e) => setCarForm({ ...carForm, mileage_limit: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={carForm.has_ac}
                                onChange={(e) => setCarForm({ ...carForm, has_ac: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">AC</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={carForm.has_gps}
                                onChange={(e) => setCarForm({ ...carForm, has_gps: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">GPS</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={carForm.has_bluetooth}
                                onChange={(e) => setCarForm({ ...carForm, has_bluetooth: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Bluetooth</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={carForm.is_available}
                                onChange={(e) => setCarForm({ ...carForm, is_available: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Available</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={carForm.is_featured}
                                onChange={(e) => setCarForm({ ...carForm, is_featured: e.target.checked })}
                                className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">Featured</span>
                            </label>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleSaveCar}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              {editingCar ? 'Update Car' : 'Create Car'}
                            </button>
                            <button
                              onClick={() => {
                                setShowCarForm(false);
                                setEditingCar(null);
                                resetCarForm();
                              }}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cars List */}
                      {cars.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No cars found
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {cars.map((car) => (
                            <div key={car.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium text-gray-900">{car.brand} {car.model} ({car.year})</h4>
                                  {car.is_featured && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Featured</span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-xs ${car.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {car.is_available ? 'Available' : 'Unavailable'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>{car.type}</span>
                                  <span>{car.transmission}</span>
                                  <span>{car.fuel_type}</span>
                                  <span>{car.seats} seats</span>
                                  {car.color && <span>{car.color}</span>}
                                </div>
                                <p className="text-lg font-semibold text-red-600 mt-2">{Number(car.price_per_day).toLocaleString()} DZD/day</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {car.has_ac && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">AC</span>}
                                  {car.has_gps && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">GPS</span>}
                                  {car.has_bluetooth && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Bluetooth</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditCar(car)}
                                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                  <IoPencilOutline size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCar(car.id)}
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

                  {/* Bookings Tab */}
                  {activeTab === 'bookings' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bookings</h3>

                      {bookings.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          No bookings found
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookings.map((booking) => (
                            <div key={booking.id} className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-medium text-gray-900">{booking.user?.name || booking.customer_name}</h4>
                                    {getBookingStatusBadge(booking.status)}
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{booking.user?.email || booking.customer_email}</p>
                                  <p className="text-sm text-gray-600 mt-2">Car: {booking.car?.full_name || `${booking.car?.brand} ${booking.car?.model}`}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span>Pickup: {booking.pickup_date}</span>
                                    <span>Return: {booking.return_date}</span>
                                    <span>{booking.rental_days} days</span>
                                  </div>
                                  {booking.notes && (
                                    <p className="text-sm text-gray-500 mt-1">Notes: {booking.notes}</p>
                                  )}
                                  <p className="text-lg font-semibold text-red-600 mt-2">{Number(booking.total_amount).toLocaleString()} DZD</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <select
                                    value={booking.status}
                                    onChange={(e) => handleUpdateBooking(booking.id, e.target.value)}
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="picked_up">Picked Up</option>
                                    <option value="returned">Returned</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="no_show">No Show</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Booking Pagination */}
                          {bookingPagination && bookingPagination.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4">
                              <p className="text-gray-500 text-sm">
                                Page {bookingPagination.current_page} of {bookingPagination.last_page}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const newPage = bookingPage - 1;
                                    setBookingPage(newPage);
                                    fetchBookings(selectedCompany!.id, newPage);
                                  }}
                                  disabled={bookingPage === 1}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors text-sm"
                                >
                                  Previous
                                </button>
                                <button
                                  onClick={() => {
                                    const newPage = bookingPage + 1;
                                    setBookingPage(newPage);
                                    fetchBookings(selectedCompany!.id, newPage);
                                  }}
                                  disabled={bookingPage === bookingPagination.last_page}
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
