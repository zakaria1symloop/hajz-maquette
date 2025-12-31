'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineCheck, HiOutlinePlus, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail, HiOutlinePhotograph, HiOutlineTrash, HiOutlineStar, HiOutlineClipboardList } from 'react-icons/hi';
import { FaCar } from 'react-icons/fa';

interface CompanyImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

export default function MyCompanyPage() {
  const router = useRouter();
  const { companyOwner, company, loading, refreshCompany, businessType } = useProAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<CompanyImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (!loading && !companyOwner && businessType !== 'car_rental') {
      router.push('/pro/login');
    }
    if (!loading && !company) {
      router.push('/pro/company/create');
    }
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
        address: company.address || '',
        city: company.city || '',
        phone: company.phone || '',
        email: company.email || '',
      });
      setImages(company.images || []);
    }
  }, [loading, companyOwner, company, router, businessType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put('/company-owner/company', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Company updated successfully!');
      await refreshCompany();
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const token = localStorage.getItem('pro_token');
      const formData = new FormData();

      Array.from(files).forEach((file) => {
        formData.append('images[]', file);
      });

      const response = await api.post('/company-owner/company/images', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      toast.success('Images uploaded successfully!');
      await refreshCompany();
      setImages(prev => [...prev, ...response.data.images]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/company-owner/company/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted');
      setImages(prev => prev.filter(img => img.id !== imageId));
      await refreshCompany();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      const token = localStorage.getItem('pro_token');
      await api.put(`/company-owner/company/images/${imageId}/primary`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Primary image updated');
      setImages(prev => prev.map(img => ({
        ...img,
        is_primary: img.id === imageId
      })));
      await refreshCompany();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set primary image');
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder-car.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!company) return null;

  const statusColor = company.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                      company.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700';

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
              <span className="font-semibold text-gray-900">My Company</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {company.verification_status}
            </span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <HiOutlinePencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Images Section */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlinePhotograph size={20} className="text-green-500" />
                <h2 className="font-semibold text-gray-900">Company Images</h2>
                <span className="text-sm text-gray-500">({images.length} images)</span>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingImages ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus size={16} />
                      Add Images
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="p-6">
            {images.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <HiOutlinePhotograph size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">No images uploaded yet</p>
                <p className="text-sm text-gray-400">Upload images to showcase your company</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                    <img
                      src={getImageUrl(image.image_path)}
                      alt="Company"
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
                          onClick={() => handleSetPrimary(image.id)}
                          className="p-2 bg-white rounded-full hover:bg-green-100 transition-colors"
                          title="Set as primary"
                        >
                          <HiOutlineStar size={18} className="text-green-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                        title="Delete image"
                      >
                        <HiOutlineTrash size={18} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Company Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {/* Company Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-gray-500">
                    <div className="flex items-center gap-1">
                      <HiOutlineLocationMarker size={16} />
                      <span>{company.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                ) : (
                  <p className="text-gray-600">{company.description || 'No description provided'}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-600">{company.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-600">{company.city}</p>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlinePhone className="inline mr-1" size={16} />
                  Phone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+213 XXX XXX XXX"
                  />
                ) : (
                  <p className="text-gray-600">{formData.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HiOutlineMail className="inline mr-1" size={16} />
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <p className="text-gray-600">{formData.email || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <HiOutlineCheck size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/pro/cars"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <FaCar size={20} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Manage Cars</h3>
              <p className="text-sm text-gray-500">Add, edit or remove cars</p>
            </Link>

            <Link
              href="/pro/car-bookings"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <HiOutlineClipboardList size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">View Bookings</h3>
              <p className="text-sm text-gray-500">Manage car bookings</p>
            </Link>

            <Link
              href="/pro/settings"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-green-500 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <HiOutlineCheck size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
              <p className="text-sm text-gray-500">Manage company settings</p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
