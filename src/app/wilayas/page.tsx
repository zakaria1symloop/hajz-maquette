'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiOutlineSearch, HiOutlineLocationMarker, HiChevronLeft, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { IoBedOutline, IoRestaurantOutline, IoCarOutline } from 'react-icons/io5';
import api from '@/lib/api';

interface Wilaya {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  description?: string;
  image?: string;
  image_url?: string;
  hotels_count: number;
  restaurants_count: number;
  car_rentals_count: number;
  total_services_count: number;
}

export default function WilayasPage() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [filteredWilayas, setFilteredWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);

  useEffect(() => {
    fetchWilayas();
  }, []);

  useEffect(() => {
    let filtered = wilayas;

    // Filter by search
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(searchLower) ||
          w.name_ar.includes(search) ||
          w.code.includes(search)
      );
    }

    // Filter empty wilayas
    if (!showEmpty) {
      filtered = filtered.filter((w) => w.total_services_count > 0);
    }

    setFilteredWilayas(filtered);
  }, [search, wilayas, showEmpty]);

  const fetchWilayas = async () => {
    try {
      const response = await api.get('/wilayas');
      const data = response.data;
      if (Array.isArray(data)) {
        setWilayas(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setWilayas(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wilayas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWilayaImage = (wilaya: Wilaya) => {
    if (wilaya.image_url) return wilaya.image_url;
    if (wilaya.image) {
      if (wilaya.image.startsWith('http')) return wilaya.image;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
      return `${baseUrl}/storage/${wilaya.image}`;
    }
    // Default placeholder based on wilaya code
    const placeholders: Record<string, string> = {
      '16': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80', // Algiers
      '31': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80', // Oran
      '25': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80', // Constantine
      '23': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // Annaba
      '47': 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=800&q=80', // Ghardaia
    };
    return placeholders[wilaya.code] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80';
  };

  const emptyWilayasCount = wilayas.filter((w) => w.total_services_count === 0).length;
  const totalHotels = wilayas.reduce((acc, w) => acc + w.hotels_count, 0);
  const totalRestaurants = wilayas.reduce((acc, w) => acc + w.restaurants_count, 0);
  const totalCarRentals = wilayas.reduce((acc, w) => acc + w.car_rentals_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#2FB7EC] to-[#1a8fc2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <HiChevronLeft size={20} />
            Back to Home
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <HiOutlineLocationMarker size={28} />
                <span className="text-white/80 font-medium">Explore Algeria</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                All Wilayas
              </h1>
              <p className="text-white/80 text-lg max-w-xl">
                Discover hotels, restaurants, and car rentals across all 58 wilayas of Algeria
              </p>
            </div>

            {/* Search Box */}
            <div className="w-full md:w-96">
              <div className="relative">
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wilayas..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredWilayas.length}</span> wilayas
              </p>
              {emptyWilayasCount > 0 && (
                <button
                  onClick={() => setShowEmpty(!showEmpty)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showEmpty
                      ? 'bg-[#2FB7EC]/10 text-[#2FB7EC]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showEmpty ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                  {showEmpty ? 'Hide' : 'Show'} empty ({emptyWilayasCount})
                </button>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <IoBedOutline size={18} className="text-[#2FB7EC]" />
                <span>{totalHotels} Hotels</span>
              </div>
              <div className="flex items-center gap-2">
                <IoRestaurantOutline size={18} className="text-orange-500" />
                <span>{totalRestaurants} Restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <IoCarOutline size={18} className="text-green-500" />
                <span>{totalCarRentals} Car Rentals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wilayas Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
          </div>
        ) : filteredWilayas.length === 0 ? (
          <div className="text-center py-20">
            <HiOutlineLocationMarker size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No wilayas found</h3>
            <p className="text-gray-500">
              {search ? 'Try adjusting your search term' : 'No wilayas with services available'}
            </p>
            {!showEmpty && emptyWilayasCount > 0 && (
              <button
                onClick={() => setShowEmpty(true)}
                className="mt-4 text-[#2FB7EC] font-medium hover:underline"
              >
                Show all {wilayas.length} wilayas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredWilayas.map((wilaya) => (
              <Link
                key={wilaya.id}
                href={`/explore?wilaya=${wilaya.id}`}
                className={`group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 ${
                  wilaya.total_services_count === 0 ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <img
                  src={getWilayaImage(wilaya)}
                  alt={wilaya.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Wilaya Code Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                  {wilaya.code}
                </div>

                {/* No Services Badge */}
                {wilaya.total_services_count === 0 && (
                  <div className="absolute top-4 right-4 bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Coming Soon
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#2FB7EC] transition-colors duration-300">
                    {wilaya.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-3" dir="rtl">{wilaya.name_ar}</p>

                  <div className="flex items-center gap-3 text-white/80 text-xs">
                    <div className="flex items-center gap-1">
                      <IoBedOutline size={14} />
                      <span>{wilaya.hotels_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IoRestaurantOutline size={14} />
                      <span>{wilaya.restaurants_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IoCarOutline size={14} />
                      <span>{wilaya.car_rentals_count}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#2FB7EC]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
