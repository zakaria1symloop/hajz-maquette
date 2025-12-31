'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import { HiOutlineArrowLeft, HiOutlinePhotograph, HiOutlineX, HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineStar } from 'react-icons/hi';
import { BsBriefcase } from 'react-icons/bs';

interface Wilaya {
  id: number;
  name: string;
  name_ar: string;
  code: string;
}

const AMENITIES = [
  { id: 'wifi', label: 'Free WiFi' },
  { id: 'parking', label: 'Free Parking' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'gym', label: 'Fitness Center' },
  { id: 'spa', label: 'Spa & Wellness' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'room_service', label: 'Room Service' },
  { id: 'airport_shuttle', label: 'Airport Shuttle' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'bar', label: 'Bar/Lounge' },
  { id: 'breakfast', label: 'Breakfast Included' },
  { id: 'pet_friendly', label: 'Pet Friendly' },
];

export default function CreateHotelPage() {
  const router = useRouter();
  const { hotelOwner, hotel, loading, refreshHotel } = useProAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    wilaya_id: '',
    zip_code: '',
    latitude: '',
    longitude: '',
    star_rating: 3,
    amenities: [] as string[],
    check_in_time: '14:00',
    check_out_time: '12:00',
    cancellation_policy: 'Free cancellation up to 24 hours before check-in',
  });

  useEffect(() => {
    if (!loading && !hotelOwner) {
      router.push('/pro/login');
    }
    if (!loading && hotel) {
      router.push('/pro/dashboard');
    }
  }, [loading, hotelOwner, hotel, router]);

  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        const response = await api.get('/wilayas');
        setWilayas(response.data.wilayas || response.data);
      } catch (err) {
        console.error('Failed to fetch wilayas');
      }
    };
    fetchWilayas();
  }, []);

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('pro_token');
      const submitData = {
        ...formData,
        wilaya_id: formData.wilaya_id ? parseInt(formData.wilaya_id) : null,
      };
      await api.post('/hotel-owner/hotel', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await refreshHotel();
      router.push('/pro/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create hotel');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/pro/dashboard"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HiOutlineArrowLeft size={20} />
              Back
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#2FB7EC] rounded-lg flex items-center justify-center">
                <BsBriefcase size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Add Hotel</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s ? 'bg-[#2FB7EC] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {s}
                </div>
                <span className={`text-sm ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Location' : 'Amenities'}
                </span>
                {s < 3 && <div className="w-12 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <HiOutlineOfficeBuilding size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Tell us about your hotel</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                    placeholder="e.g., Grand Palace Hotel"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Describe your hotel, its unique features, and what guests can expect..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Star Rating *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, star_rating: star })}
                        className={`p-2 rounded-lg transition-colors ${
                          formData.star_rating >= star
                            ? 'text-yellow-500 bg-yellow-50'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      >
                        <HiOutlineStar size={28} className={formData.star_rating >= star ? 'fill-current' : ''} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500">{formData.star_rating} Star</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in Time</label>
                    <input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out Time</label>
                    <input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.description}
                  className="px-6 py-3 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Location
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <HiOutlineLocationMarker size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                  <p className="text-sm text-gray-500">Where is your hotel located?</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder="City name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Wilaya *</label>
                    <select
                      value={formData.wilaya_id}
                      onChange={(e) => {
                        const selectedWilaya = wilayas.find(w => w.id === parseInt(e.target.value));
                        setFormData({
                          ...formData,
                          wilaya_id: e.target.value,
                          state: selectedWilaya?.name || ''
                        });
                      }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      required
                    >
                      <option value="">Select Wilaya</option>
                      {wilayas.map((wilaya) => (
                        <option key={wilaya.id} value={wilaya.id}>{wilaya.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                    placeholder="16000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude (optional)</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder="36.7538"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude (optional)</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                      placeholder="3.0588"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.address || !formData.city || !formData.state}
                  className="px-6 py-3 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Amenities
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <HiOutlineStar size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Amenities & Policies</h2>
                  <p className="text-sm text-gray-500">What does your hotel offer?</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AMENITIES.map((amenity) => (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium text-left transition-all ${
                          formData.amenities.includes(amenity.id)
                            ? 'bg-[#2FB7EC] text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cancellation Policy</label>
                  <textarea
                    value={formData.cancellation_policy}
                    onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Describe your cancellation policy..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-[#2FB7EC] text-white rounded-xl font-semibold hover:bg-[#26a5d8] transition-colors disabled:opacity-50 shadow-lg shadow-[#2FB7EC]/25"
                >
                  {submitting ? 'Creating Hotel...' : 'Create Hotel'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
