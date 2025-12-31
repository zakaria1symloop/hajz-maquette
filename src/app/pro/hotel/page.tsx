'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlinePhotograph, HiOutlinePlus, HiOutlineTrash, HiOutlineStar, HiOutlineLocationMarker, HiOutlineClock, HiOutlinePhone, HiOutlineMail, HiOutlineGlobe } from 'react-icons/hi';
import { BsBriefcase } from 'react-icons/bs';

export default function MyHotelPage() {
  const router = useRouter();
  const { hotelOwner, hotel, loading, refreshHotel } = useProAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    star_rating: 3,
    phone: '',
    email: '',
    website: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    amenities: [] as string[],
  });

  useEffect(() => {
    if (!loading && !hotelOwner) {
      router.push('/pro/login');
    }
    if (!loading && !hotel) {
      router.push('/pro/hotel/create');
    }
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        address: hotel.address || '',
        city: hotel.city || '',
        state: hotel.state || '',
        star_rating: hotel.star_rating || 3,
        phone: (hotel as any).phone || '',
        email: (hotel as any).email || '',
        website: (hotel as any).website || '',
        check_in_time: (hotel as any).check_in_time || '14:00',
        check_out_time: (hotel as any).check_out_time || '12:00',
        amenities: (hotel as any).amenities || [],
      });
    }
  }, [loading, hotelOwner, hotel, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.put('/hotel-owner/hotel', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Hotel updated successfully!');
      await refreshHotel();
      setEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update hotel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  if (!hotel) return null;

  const statusColor = hotel.status === 'verified' ? 'bg-green-100 text-green-700' :
                      hotel.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
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
              <div className="w-8 h-8 bg-[#2FB7EC] rounded-lg flex items-center justify-center">
                <BsBriefcase size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">My Hotel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {hotel.status}
            </span>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2FB7EC] text-white rounded-lg hover:bg-[#26a5d8] transition-colors"
              >
                <HiOutlinePencil size={16} />
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          {/* Hotel Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {/* Hotel Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-gray-500">
                    <HiOutlineLocationMarker size={16} />
                    <span>{hotel.city}, {hotel.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      disabled={!editing}
                      onClick={() => editing && setFormData({ ...formData, star_rating: star })}
                      className={`${editing ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <HiOutlineStar
                        size={24}
                        className={`${(editing ? formData.star_rating : hotel.star_rating) >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] resize-none"
                  />
                ) : (
                  <p className="text-gray-600">{hotel.description || 'No description provided'}</p>
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                  />
                ) : (
                  <p className="text-gray-600">{hotel.address}</p>
                )}
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    />
                  ) : (
                    <p className="text-gray-600">{hotel.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    />
                  ) : (
                    <p className="text-gray-600">{hotel.state}</p>
                  )}
                </div>
              </div>

              {/* Check-in/out Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiOutlineClock className="inline mr-1" size={16} />
                    Check-in
                  </label>
                  {editing ? (
                    <input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    />
                  ) : (
                    <p className="text-gray-600">{formData.check_in_time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiOutlineClock className="inline mr-1" size={16} />
                    Check-out
                  </label>
                  {editing ? (
                    <input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    />
                  ) : (
                    <p className="text-gray-600">{formData.check_out_time}</p>
                  )}
                </div>
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
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
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2FB7EC] text-white rounded-lg hover:bg-[#26a5d8] transition-colors disabled:opacity-50"
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
              href="/pro/rooms"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#2FB7EC] hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <HiOutlinePlus size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Manage Rooms</h3>
              <p className="text-sm text-gray-500">Add, edit or remove rooms</p>
            </Link>

            <Link
              href="/pro/reservations"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#2FB7EC] hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <HiOutlineCheck size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">View Reservations</h3>
              <p className="text-sm text-gray-500">Manage bookings</p>
            </Link>

            <Link
              href="/pro/wallet"
              className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#2FB7EC] hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <span className="text-purple-600 font-bold">DZD</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Wallet</h3>
              <p className="text-sm text-gray-500">View earnings & withdraw</p>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
