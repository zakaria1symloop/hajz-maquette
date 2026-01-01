'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineLocationMarker,
  HiChevronLeft,
  HiOutlineAdjustments,
  HiOutlineStar,
} from 'react-icons/hi';
import { IoBedOutline, IoRestaurantOutline, IoCarOutline, IoStarSharp, IoLocationOutline, IoTimeOutline } from 'react-icons/io5';
import { FaWifi, FaParking, FaSwimmingPool, FaDumbbell, FaSpa, FaUtensils, FaConciergeBell, FaShuttleVan, FaSnowflake, FaGlassMartini, FaCoffee, FaDog } from 'react-icons/fa';
import api from '@/lib/api';

type ServiceType = 'hotels' | 'restaurants' | 'cars';

interface Wilaya {
  id: number;
  name: string;
  name_ar: string;
  code: string;
}

interface Hotel {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  star_rating: number;
  min_price?: number;
  amenities?: string[];
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: Wilaya;
  rooms_count?: number;
  rating?: number;
  primary_image_url?: string;
}

interface Restaurant {
  id: number;
  name: string;
  description?: string;
  city: string;
  cuisine_type: string;
  price_range: number;
  opening_time?: string;
  closing_time?: string;
  phone?: string;
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: Wilaya;
  tables_count?: number;
  plats_count?: number;
  rating?: number;
  primary_image_url?: string;
}

interface CarRental {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city: string;
  phone?: string;
  services?: string[];
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: Wilaya;
  cars_count?: number;
  min_price?: number;
  opening_time?: string;
  closing_time?: string;
  rating?: number;
  primary_image_url?: string;
}

const AMENITIES = [
  { id: 'wifi', label: 'Free WiFi', icon: FaWifi },
  { id: 'parking', label: 'Free Parking', icon: FaParking },
  { id: 'pool', label: 'Swimming Pool', icon: FaSwimmingPool },
  { id: 'gym', label: 'Fitness Center', icon: FaDumbbell },
  { id: 'spa', label: 'Spa & Wellness', icon: FaSpa },
  { id: 'restaurant', label: 'Restaurant', icon: FaUtensils },
  { id: 'room_service', label: 'Room Service', icon: FaConciergeBell },
  { id: 'airport_shuttle', label: 'Airport Shuttle', icon: FaShuttleVan },
  { id: 'ac', label: 'Air Conditioning', icon: FaSnowflake },
  { id: 'bar', label: 'Bar/Lounge', icon: FaGlassMartini },
  { id: 'breakfast', label: 'Breakfast Included', icon: FaCoffee },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: FaDog },
];

const CUISINE_TYPES = [
  'Algerian', 'Mediterranean', 'French', 'Italian', 'Asian', 'Fast Food', 'Seafood', 'Grills', 'Pizza', 'International'
];

const PRICE_RANGES = [
  { value: '1', label: 'Budget ($)' },
  { value: '2', label: 'Mid-range ($$)' },
  { value: '3', label: 'Upscale ($$$)' },
  { value: '4', label: 'Fine Dining ($$$$)' },
];

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('explore');

  // Get initial values from URL
  const initialType = (searchParams.get('type') as ServiceType) || 'hotels';
  const initialWilaya = searchParams.get('wilaya') || '';
  const initialQuery = searchParams.get('q') || '';

  const [activeType, setActiveType] = useState<ServiceType>(initialType);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string>(initialWilaya);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Results
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cars, setCars] = useState<CarRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filters, setFilters] = useState({
    // Hotels
    starRating: '',
    minPrice: '',
    maxPrice: '',
    amenities: [] as string[],
    // Restaurants
    cuisineType: '',
    priceRange: '',
    // Common
    sortBy: 'rating',
    sortOrder: 'desc',
  });

  // Fetch wilayas
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

  // Fetch results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '12',
      };

      if (selectedWilaya) params.wilaya = selectedWilaya;
      if (searchQuery) params.q = searchQuery;
      params.sort = filters.sortBy;
      params.order = filters.sortOrder;

      let endpoint = '';

      if (activeType === 'hotels') {
        endpoint = '/hotels';
        if (filters.starRating) params.star_rating = filters.starRating;
        if (filters.minPrice) params.min_price = filters.minPrice;
        if (filters.maxPrice) params.max_price = filters.maxPrice;
        if (filters.amenities.length > 0) params.amenities = filters.amenities.join(',');
      } else if (activeType === 'restaurants') {
        endpoint = '/restaurants';
        if (filters.cuisineType) params.cuisine_type = filters.cuisineType;
        if (filters.priceRange) params.price_range = filters.priceRange;
      } else {
        endpoint = '/car-rentals';
      }

      const response = await api.get(endpoint, { params });
      const data = response.data;

      if (activeType === 'hotels') {
        setHotels(data.data || data);
        setTotalResults(data.total || (data.data || data).length || 0);
        setTotalPages(data.last_page || 1);
      } else if (activeType === 'restaurants') {
        setRestaurants(data.data || data);
        setTotalResults(data.total || (data.data || data).length || 0);
        setTotalPages(data.last_page || 1);
      } else {
        setCars(data.data || data);
        setTotalResults(data.total || (data.data || data).length || 0);
        setTotalPages(data.last_page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  }, [activeType, selectedWilaya, searchQuery, currentPage, filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('type', activeType);
    if (selectedWilaya) params.set('wilaya', selectedWilaya);
    if (searchQuery) params.set('q', searchQuery);
    router.replace(`/explore?${params.toString()}`, { scroll: false });
  }, [activeType, selectedWilaya, searchQuery, router]);

  const getImageUrl = (item: Hotel | Restaurant | CarRental) => {
    if ((item as any).primary_image_url) return (item as any).primary_image_url;
    if (item.images && item.images.length > 0) {
      const img = item.images[0];
      if ((img as any).url) return (img as any).url;
      if (img.image_path?.startsWith('http')) return img.image_path;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
      return `${baseUrl}/storage/${img.image_path}`;
    }
    if (activeType === 'hotels') return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
    if (activeType === 'restaurants') return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
    return 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80';
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const selectedWilayaName = wilayas.find(w => w.id.toString() === selectedWilaya)?.name || '';

  const handleClearFilters = () => {
    setFilters({
      starRating: '',
      minPrice: '',
      maxPrice: '',
      amenities: [],
      cuisineType: '',
      priceRange: '',
      sortBy: 'rating',
      sortOrder: 'desc',
    });
    setSearchQuery('');
    setSelectedWilaya('');
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Back and Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <HiChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedWilayaName ? t('exploreLocation', { location: selectedWilayaName }) : t('exploreAlgeria')}
                </h1>
                <p className="text-sm text-gray-500">{t('resultsFound', { count: totalResults })}</p>
              </div>
            </div>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
            >
              <HiOutlineFilter size={20} />
              {t('filters')}
            </button>
          </div>

          {/* Service Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveType('hotels'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeType === 'hotels'
                  ? 'bg-[#2FB7EC] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IoBedOutline size={18} />
              {t('hotels')}
            </button>
            <button
              onClick={() => { setActiveType('restaurants'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeType === 'restaurants'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IoRestaurantOutline size={18} />
              {t('restaurants')}
            </button>
            <button
              onClick={() => { setActiveType('cars'); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeType === 'cars'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <IoCarOutline size={18} />
              {t('carRentals')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className={`
            fixed lg:static inset-0 z-40 lg:z-0 bg-white lg:bg-transparent
            w-80 lg:w-72 flex-shrink-0 overflow-y-auto
            transform transition-transform duration-300
            ${showMobileFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">{t('filters')}</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2">
                <HiOutlineX size={24} />
              </button>
            </div>

            <div className="p-4 lg:p-0 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineSearch size={18} />
                  {t('search')}
                </h3>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeType === 'hotels' ? t('searchHotels') : activeType === 'restaurants' ? t('searchRestaurants') : t('searchCars')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                />
              </div>

              {/* Wilaya Filter */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineLocationMarker size={18} />
                  {t('location')}
                </h3>
                <select
                  value={selectedWilaya}
                  onChange={(e) => { setSelectedWilaya(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                >
                  <option value="">{t('allWilayas')}</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.id} value={wilaya.id}>{wilaya.name}</option>
                  ))}
                </select>
              </div>

              {/* Hotel Specific Filters */}
              {activeType === 'hotels' && (
                <>
                  {/* Star Rating */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <HiOutlineStar size={18} />
                      {t('starRating')}
                    </h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="starRating"
                            value={stars}
                            checked={filters.starRating === stars.toString()}
                            onChange={(e) => setFilters({ ...filters, starRating: e.target.value })}
                            className="w-4 h-4 text-[#2FB7EC] focus:ring-[#2FB7EC]"
                          />
                          <div className="flex items-center gap-1">
                            {Array.from({ length: stars }).map((_, i) => (
                              <IoStarSharp key={i} size={16} className="text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - stars }).map((_, i) => (
                              <IoStarSharp key={i} size={16} className="text-gray-200" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{t('andUp')}</span>
                        </label>
                      ))}
                      {filters.starRating && (
                        <button
                          onClick={() => setFilters({ ...filters, starRating: '' })}
                          className="text-sm text-[#2FB7EC] hover:underline mt-2"
                        >
                          {t('clear')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('pricePerNight')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t('min')}</label>
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t('max')}</label>
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                          placeholder="Any"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('amenities')}</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {AMENITIES.map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                          <label key={amenity.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.amenities.includes(amenity.id)}
                              onChange={() => toggleAmenity(amenity.id)}
                              className="w-4 h-4 text-[#2FB7EC] rounded focus:ring-[#2FB7EC]"
                            />
                            <Icon size={16} className="text-gray-400 group-hover:text-[#2FB7EC]" />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900">{amenity.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Restaurant Specific Filters */}
              {activeType === 'restaurants' && (
                <>
                  {/* Cuisine Type */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('cuisineType')}</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {CUISINE_TYPES.map((cuisine) => (
                        <label key={cuisine} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="cuisineType"
                            value={cuisine}
                            checked={filters.cuisineType === cuisine}
                            onChange={(e) => setFilters({ ...filters, cuisineType: e.target.value })}
                            className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{cuisine}</span>
                        </label>
                      ))}
                      {filters.cuisineType && (
                        <button
                          onClick={() => setFilters({ ...filters, cuisineType: '' })}
                          className="text-sm text-orange-500 hover:underline mt-2"
                        >
                          {t('clear')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">{t('priceRange')}</h3>
                    <div className="space-y-2">
                      {PRICE_RANGES.map((range) => (
                        <label key={range.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="priceRange"
                            value={range.value}
                            checked={filters.priceRange === range.value}
                            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                            className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{range.label}</span>
                        </label>
                      ))}
                      {filters.priceRange && (
                        <button
                          onClick={() => setFilters({ ...filters, priceRange: '' })}
                          className="text-sm text-orange-500 hover:underline mt-2"
                        >
                          {t('clear')}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Sort By */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <HiOutlineAdjustments size={18} />
                  {t('sortBy')}
                </h3>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters({ ...filters, sortBy, sortOrder });
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                >
                  <option value="rating-desc">{t('ratingHighToLow')}</option>
                  <option value="rating-asc">{t('ratingLowToHigh')}</option>
                  <option value="price-asc">{t('priceLowToHigh')}</option>
                  <option value="price-desc">{t('priceHighToLow')}</option>
                  <option value="name-asc">{t('nameAZ')}</option>
                  <option value="name-desc">{t('nameZA')}</option>
                </select>
              </div>

              {/* Clear All Filters */}
              <button
                onClick={handleClearFilters}
                className="w-full py-3 text-gray-600 font-medium hover:text-red-500 transition-colors"
              >
                {t('clearAllFilters')}
              </button>

              {/* Mobile Apply Button */}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="lg:hidden w-full py-3 bg-[#2FB7EC] text-white font-semibold rounded-xl"
              >
                {t('applyFilters')}
              </button>
            </div>
          </aside>

          {/* Mobile Overlay */}
          {showMobileFilters && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
          )}

          {/* Results Grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
              </div>
            ) : (
              <>
                {/* Results */}
                {activeType === 'hotels' && hotels.length === 0 && (
                  <div className="text-center py-20">
                    <IoBedOutline size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noHotelsFound')}</h3>
                    <p className="text-gray-500">{t('tryAdjustingFilters')}</p>
                  </div>
                )}

                {activeType === 'restaurants' && restaurants.length === 0 && (
                  <div className="text-center py-20">
                    <IoRestaurantOutline size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noRestaurantsFound')}</h3>
                    <p className="text-gray-500">{t('tryAdjustingFilters')}</p>
                  </div>
                )}

                {activeType === 'cars' && cars.length === 0 && (
                  <div className="text-center py-20">
                    <IoCarOutline size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('noCarsFound')}</h3>
                    <p className="text-gray-500">{t('tryAdjustingFilters')}</p>
                  </div>
                )}

                {/* Hotels Grid */}
                {activeType === 'hotels' && hotels.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {hotels.map((hotel) => (
                      <Link
                        key={hotel.id}
                        href={`/hotels/${hotel.id}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2FB7EC]/30 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={getImageUrl(hotel)}
                            alt={hotel.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                            {Array.from({ length: hotel.star_rating || 3 }).map((_, i) => (
                              <IoStarSharp key={i} size={12} className="text-yellow-400" />
                            ))}
                          </div>
                          {hotel.rooms_count !== undefined && hotel.rooms_count > 0 && (
                            <div className="absolute top-3 left-3 bg-[#2FB7EC] text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                              {hotel.rooms_count} {t('rooms')}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {/* Name & Price */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-[#2FB7EC] transition-colors line-clamp-1 flex-1">
                              {hotel.name}
                            </h3>
                            <div className="text-right flex-shrink-0">
                              <span className="text-lg font-bold text-[#2FB7EC]">
                                {(hotel.min_price || 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">DZD</span>
                            </div>
                          </div>

                          {/* Description */}
                          {hotel.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {hotel.description}
                            </p>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                            <IoLocationOutline size={14} className="text-[#2FB7EC] flex-shrink-0" />
                            <span className="truncate">{hotel.city}{hotel.wilaya ? `, ${hotel.wilaya.name}` : ''}</span>
                          </div>

                          {/* Amenities */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                  {amenity}
                                </span>
                              ))}
                              {hotel.amenities.length > 3 && (
                                <span className="text-xs bg-[#2FB7EC]/10 text-[#2FB7EC] px-2 py-1 rounded-md">
                                  {t('more', { count: hotel.amenities.length - 3 })}
                                </span>
                              )}
                            </div>
                          )}

                          {/* CTA */}
                          <button className="w-full bg-[#2FB7EC] group-hover:bg-[#26a5d8] text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                            {t('viewRooms')}
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Restaurants Grid */}
                {activeType === 'restaurants' && restaurants.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {restaurants.map((restaurant) => (
                      <Link
                        key={restaurant.id}
                        href={`/restaurants/${restaurant.id}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={getImageUrl(restaurant)}
                            alt={restaurant.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                            {restaurant.cuisine_type || 'Restaurant'}
                          </div>
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                            <IoStarSharp size={14} className="text-yellow-400" />
                            <span className="text-sm font-bold text-gray-800">{restaurant.rating?.toFixed(1) || '4.5'}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          {/* Name & Price */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 flex-1">
                              {restaurant.name}
                            </h3>
                            <div className="text-right flex-shrink-0">
                              <span className="text-lg font-bold text-orange-600">
                                {restaurant.price_range?.toLocaleString() || 0}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">DZD</span>
                            </div>
                          </div>

                          {/* Description */}
                          {restaurant.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {restaurant.description}
                            </p>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                            <IoLocationOutline size={14} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{restaurant.city}{restaurant.wilaya ? `, ${restaurant.wilaya.name}` : ''}</span>
                          </div>

                          {/* Info Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(restaurant.opening_time || restaurant.closing_time) && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                                <IoTimeOutline size={13} className="text-orange-500" />
                                <span className="text-xs font-medium text-gray-600">
                                  {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
                                </span>
                              </div>
                            )}
                            {restaurant.tables_count !== undefined && restaurant.tables_count > 0 && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                                <IoRestaurantOutline size={13} className="text-orange-500" />
                                <span className="text-xs font-medium text-gray-600">{restaurant.tables_count} {t('tables')}</span>
                              </div>
                            )}
                            {restaurant.plats_count !== undefined && restaurant.plats_count > 0 && (
                              <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-lg">
                                <span className="text-xs font-medium text-orange-600">{restaurant.plats_count} {t('dishes')}</span>
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <button className="w-full bg-orange-500 group-hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                            {t('bookTable')}
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Cars Grid */}
                {activeType === 'cars' && cars.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cars.map((car) => (
                      <Link
                        key={car.id}
                        href={`/car-rentals/${car.id}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={getImageUrl(car)}
                            alt={car.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {car.cars_count !== undefined && car.cars_count > 0 && (
                            <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                              <IoCarOutline size={14} />
                              {car.cars_count} {t('cars')}
                            </div>
                          )}
                          {car.rating && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                              <IoStarSharp size={14} className="text-yellow-400" />
                              <span className="text-sm font-bold text-gray-800">{car.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          {/* Name & Price */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1 flex-1">
                              {car.name}
                            </h3>
                            {car.min_price ? (
                              <div className="text-right flex-shrink-0">
                                <span className="text-lg font-bold text-green-600">
                                  {car.min_price.toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">DZD</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Description */}
                          {car.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {car.description}
                            </p>
                          )}

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                            <IoLocationOutline size={14} className="text-green-500 flex-shrink-0" />
                            <span className="truncate">{car.address || car.city}{car.wilaya ? `, ${car.wilaya.name}` : ''}</span>
                          </div>

                          {/* Info Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(car.opening_time || car.closing_time) && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                                <IoTimeOutline size={13} className="text-green-500" />
                                <span className="text-xs font-medium text-gray-600">
                                  {formatTime(car.opening_time)} - {formatTime(car.closing_time)}
                                </span>
                              </div>
                            )}
                            {car.min_price && (
                              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg">
                                <span className="text-xs font-medium text-green-600">{t('fromPerDay', { price: car.min_price.toLocaleString() })}</span>
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <button className="w-full bg-green-500 group-hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                            {t('viewCars')}
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('previous')}
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium ${
                              currentPage === page
                                ? 'bg-[#2FB7EC] text-white'
                                : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {t('next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
