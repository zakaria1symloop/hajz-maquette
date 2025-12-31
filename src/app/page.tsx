'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUserGroup, HiChevronDown, HiOutlineX } from 'react-icons/hi';
import { IoCarOutline, IoBedOutline, IoStarSharp, IoLocationOutline, IoPersonOutline, IoSettingsOutline, IoRestaurantOutline, IoTimeOutline } from 'react-icons/io5';
import { BsBuilding } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';
import api from '@/lib/api';

// Algerian Heritage Places for hero background
const heroImages = [
  'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=1920&q=80',
  'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1920&q=80',
  'https://images.unsplash.com/photo-1583425921686-c5daf5f49e4a?w=1920&q=80',
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1920&q=80',
  'https://images.unsplash.com/photo-1581889470536-467bdbe30cd0?w=1920&q=80',
];

interface Hotel {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  star_rating: number;
  price_per_night?: number;
  min_price?: number;
  amenities?: string[];
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: { id: number; name: string; name_ar: string };
  rooms_count?: number;
  reviews_count?: number;
  average_rating?: number;
  primary_image_url?: string;
}

interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city: string;
  cuisine_type: string;
  price_range: number;
  rating?: number;
  opening_time?: string;
  closing_time?: string;
  phone?: string;
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: { id: number; name: string; name_ar: string };
  tables_count?: number;
  plats_count?: number;
  primary_image_url?: string;
}

interface Wilaya {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  image?: string;
  image_url?: string;
  hotels_count: number;
  restaurants_count: number;
  car_rentals_count: number;
}

interface CarRental {
  id: number;
  name: string;
  description?: string;
  city: string;
  address: string;
  phone?: string;
  cars_count?: number;
  min_price?: number;
  opening_time?: string;
  closing_time?: string;
  images?: { id: number; image_path: string; url?: string }[];
  wilaya?: { id: number; name: string; name_ar: string };
  average_rating?: number;
  reviews_count?: number;
  primary_image_url?: string;
}

export default function Home() {
  const router = useRouter();
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'hotels' | 'cars' | 'restaurants'>('hotels');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [restaurantDate, setRestaurantDate] = useState<Date | null>(null);
  const [restaurantTime, setRestaurantTime] = useState('19:00');
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState('2 Guests');
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [showWilayaDropdown, setShowWilayaDropdown] = useState(false);

  // Real data from API
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [carRentals, setCarRentals] = useState<CarRental[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Wilaya[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingCarRentals, setLoadingCarRentals] = useState(true);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingPopularDestinations, setLoadingPopularDestinations] = useState(true);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    // Fetch real data
    fetchHotels();
    fetchRestaurants();
    fetchCarRentals();
    fetchWilayas();
    fetchPopularDestinations();

    return () => clearInterval(interval);
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await api.get('/hotels/featured');
      const data = response.data;
      if (Array.isArray(data)) {
        setHotels(data.slice(0, 4));
      } else if (data?.data && Array.isArray(data.data)) {
        setHotels(data.data.slice(0, 4));
      } else if (data?.hotels && Array.isArray(data.hotels)) {
        setHotels(data.hotels.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/featured');
      const data = response.data;
      if (Array.isArray(data)) {
        setRestaurants(data.slice(0, 4));
      } else if (data?.data && Array.isArray(data.data)) {
        setRestaurants(data.data.slice(0, 4));
      } else if (data?.restaurants && Array.isArray(data.restaurants)) {
        setRestaurants(data.restaurants.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const fetchCarRentals = async () => {
    try {
      const response = await api.get('/car-rentals/featured');
      const data = response.data;
      console.log('Car rentals response:', data);
      if (Array.isArray(data)) {
        setCarRentals(data.slice(0, 4));
      } else if (data?.data && Array.isArray(data.data)) {
        setCarRentals(data.data.slice(0, 4));
      } else if (data?.car_rentals && Array.isArray(data.car_rentals)) {
        setCarRentals(data.car_rentals.slice(0, 4));
      } else {
        console.warn('Unexpected car rentals data format:', data);
      }
    } catch (err) {
      console.error('Failed to fetch car rentals:', err);
    } finally {
      setLoadingCarRentals(false);
    }
  };

  const fetchWilayas = async () => {
    try {
      // Fetch all wilayas for the search dropdown
      const response = await api.get('/wilayas');
      const data = response.data;
      if (data?.wilayas && Array.isArray(data.wilayas)) {
        setWilayas(data.wilayas);
      } else if (Array.isArray(data)) {
        setWilayas(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setWilayas(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wilayas:', err);
    } finally {
      setLoadingWilayas(false);
    }
  };

  const fetchPopularDestinations = async () => {
    try {
      const response = await api.get('/wilayas/popular');
      const data = response.data;
      if (Array.isArray(data)) {
        setPopularDestinations(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setPopularDestinations(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch popular destinations:', err);
    } finally {
      setLoadingPopularDestinations(false);
    }
  };

  // Filter wilayas based on search query
  const filteredWilayas = wilayas.filter((wilaya) => {
    if (!destinationQuery.trim()) return true;
    const query = destinationQuery.toLowerCase();
    return (
      wilaya.name.toLowerCase().includes(query) ||
      wilaya.name_ar?.includes(destinationQuery) ||
      wilaya.code?.includes(query)
    );
  }).slice(0, 8); // Limit to 8 suggestions

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

  const getHotelImage = (hotel: Hotel) => {
    if (hotel.primary_image_url) return hotel.primary_image_url;
    if (hotel.images && hotel.images.length > 0) {
      const img = hotel.images[0];
      if (img.url) return img.url;
      if (img.image_path?.startsWith('http')) return img.image_path;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
      return `${baseUrl}/storage/${img.image_path}`;
    }
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  };

  const getRestaurantImage = (restaurant: Restaurant) => {
    if (restaurant.primary_image_url) return restaurant.primary_image_url;
    if (restaurant.images && restaurant.images.length > 0) {
      const img = restaurant.images[0];
      if (img.url) return img.url;
      if (img.image_path?.startsWith('http')) return img.image_path;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
      return `${baseUrl}/storage/${img.image_path}`;
    }
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getCarRentalImage = (carRental: CarRental) => {
    if (carRental.primary_image_url) return carRental.primary_image_url;
    if (carRental.images && carRental.images.length > 0) {
      const img = carRental.images[0];
      if (img.url) return img.url;
      if (img.image_path?.startsWith('http')) return img.image_path;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
      return `${baseUrl}/storage/${img.image_path}`;
    }
    return 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80';
  };

  const handleSearch = () => {
    const formatDateForSearch = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (activeTab === 'hotels') {
      const params = new URLSearchParams();
      params.set('type', 'hotels');
      if (selectedWilaya) params.set('wilaya', selectedWilaya.id.toString());
      if (checkInDate) params.set('check_in', formatDateForSearch(checkInDate));
      if (checkOutDate) params.set('check_out', formatDateForSearch(checkOutDate));
      if (guests) params.set('guests', guests.replace(/\D/g, '') || '2');
      router.push(`/explore?${params.toString()}`);
    } else if (activeTab === 'restaurants') {
      const params = new URLSearchParams();
      params.set('type', 'restaurants');
      if (selectedWilaya) params.set('wilaya', selectedWilaya.id.toString());
      if (restaurantDate) params.set('date', formatDateForSearch(restaurantDate));
      if (restaurantTime) params.set('time', restaurantTime);
      if (guests) params.set('guests', guests.replace(/\D/g, '') || '2');
      router.push(`/explore?${params.toString()}`);
    } else if (activeTab === 'cars') {
      const params = new URLSearchParams();
      params.set('type', 'cars');
      if (selectedWilaya) params.set('wilaya', selectedWilaya.id.toString());
      if (pickupDate) params.set('pickup_date', formatDateForSearch(pickupDate));
      if (returnDate) params.set('return_date', formatDateForSearch(returnDate));
      router.push(`/explore?${params.toString()}`);
    }
  };

  const handleSelectWilaya = (wilaya: Wilaya) => {
    setSelectedWilaya(wilaya);
    setDestinationQuery(wilaya.name);
    setShowWilayaDropdown(false);
  };

  const handleClearWilaya = () => {
    setSelectedWilaya(null);
    setDestinationQuery('');
  };

  const guestOptions = ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '5+ Guests'];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen">
        {/* Background */}
        {heroImages.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ${
              i === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image src={img} alt="" fill sizes="100vw" className="object-cover" priority={i === 0} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32">
          {/* Title & Slogan */}
          <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div
              className={`transition-all duration-1000 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              dir="rtl"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-[#2FB7EC] mb-1 sm:mb-4">
                حجز
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-semibold text-white">
                قرر تسافر والباقي خليه علينا
              </p>
            </div>
            <p
              className={`text-white/70 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 mt-4 sm:mt-6 transition-all duration-1000 delay-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              Discover the best hotels and restaurants across Algeria
            </p>
          </div>

          {/* Search Card */}
          <div className={`w-full transition-all duration-500 ease-out ${destinationFocused ? 'max-w-5xl' : 'max-w-4xl'} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Tabs */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex bg-white/10 backdrop-blur-md rounded-full p-1 sm:p-1.5">
                <button
                  onClick={() => setActiveTab('hotels')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 ${
                    activeTab === 'hotels'
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  <IoBedOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Hotels
                </button>
                <button
                  onClick={() => setActiveTab('restaurants')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 ${
                    activeTab === 'restaurants'
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  <IoRestaurantOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Restaurants
                </button>
                <button
                  onClick={() => setActiveTab('cars')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 ${
                    activeTab === 'cars'
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  <IoCarOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Car Rental
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-1.5 sm:p-2 shadow-2xl shadow-black/20 transition-all duration-500">
              <div className="flex flex-col md:flex-row">
                {/* Location/Wilaya */}
                <div className={`relative transition-all duration-500 ease-out p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl ${
                  destinationFocused
                    ? `flex-[2] ${activeTab === 'hotels' ? 'bg-[#2FB7EC]/5' : activeTab === 'restaurants' ? 'bg-orange-50' : 'bg-green-50'}`
                    : 'flex-1'
                }`}>
                  <label className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2 transition-colors duration-300 ${
                    destinationFocused
                      ? activeTab === 'hotels' ? 'text-[#2FB7EC]' : activeTab === 'restaurants' ? 'text-orange-500' : 'text-green-500'
                      : 'text-gray-400'
                  }`}>
                    Wilaya
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HiOutlineLocationMarker className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${
                      activeTab === 'hotels' ? 'text-[#2FB7EC]' : activeTab === 'restaurants' ? 'text-orange-500' : 'text-green-500'
                    } ${destinationFocused ? 'scale-110' : ''}`} size={20} />
                    <input
                      type="text"
                      value={destinationQuery}
                      onChange={(e) => {
                        setDestinationQuery(e.target.value);
                        setSelectedWilaya(null);
                        setShowWilayaDropdown(true);
                      }}
                      placeholder="Select a wilaya..."
                      className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base bg-transparent"
                      onFocus={() => {
                        setDestinationFocused(true);
                        setShowWilayaDropdown(true);
                      }}
                      onBlur={() => {
                        setDestinationFocused(false);
                        // Delay hiding to allow click on dropdown
                        setTimeout(() => setShowWilayaDropdown(false), 200);
                      }}
                    />
                    {selectedWilaya && (
                      <button
                        onClick={handleClearWilaya}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HiOutlineX size={16} />
                      </button>
                    )}
                  </div>

                  {/* Wilaya Dropdown */}
                  {showWilayaDropdown && filteredWilayas.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-64 overflow-y-auto">
                      {filteredWilayas.map((wilaya) => (
                        <button
                          key={wilaya.id}
                          onClick={() => handleSelectWilaya(wilaya)}
                          className={`w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 ${
                            selectedWilaya?.id === wilaya.id
                              ? activeTab === 'hotels'
                                ? 'bg-[#2FB7EC]/10 text-[#2FB7EC]'
                                : activeTab === 'restaurants'
                                ? 'bg-orange-50 text-orange-500'
                                : 'bg-green-50 text-green-500'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <HiOutlineLocationMarker className={`flex-shrink-0 ${
                            activeTab === 'hotels' ? 'text-[#2FB7EC]' : activeTab === 'restaurants' ? 'text-orange-500' : 'text-green-500'
                          }`} size={16} />
                          <div>
                            <span className="block">{wilaya.name}</span>
                            {wilaya.name_ar && (
                              <span className="block text-xs text-gray-400">{wilaya.name_ar}</span>
                            )}
                          </div>
                          <span className="ml-auto text-xs text-gray-400">{wilaya.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dates - Hotels */}
                {activeTab === 'hotels' && (
                  <>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Check-in
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HiOutlineCalendar className="text-[#2FB7EC] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <DatePicker
                          selected={checkInDate}
                          onChange={(date: Date | null) => setCheckInDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Check-out
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HiOutlineCalendar className="text-[#2FB7EC] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <DatePicker
                          selected={checkOutDate}
                          onChange={(date: Date | null) => setCheckOutDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                          minDate={checkInDate || new Date()}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Dates - Restaurants */}
                {activeTab === 'restaurants' && (
                  <>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Date
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HiOutlineCalendar className="text-orange-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <DatePicker
                          selected={restaurantDate}
                          onChange={(date: Date | null) => setRestaurantDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Time
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <IoTimeOutline className="text-orange-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <input
                          type="time"
                          value={restaurantTime}
                          onChange={(e) => setRestaurantTime(e.target.value)}
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Dates - Car Rental */}
                {activeTab === 'cars' && (
                  <>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Pickup Date
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HiOutlineCalendar className="text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <DatePicker
                          selected={pickupDate}
                          onChange={(date: Date | null) => setPickupDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                    <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                      <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                        Return Date
                      </label>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HiOutlineCalendar className="text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                        <DatePicker
                          selected={returnDate}
                          onChange={(date: Date | null) => setReturnDate(date)}
                          dateFormat="yyyy-MM-dd"
                          placeholderText="Select date"
                          className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                          minDate={pickupDate || new Date()}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Guests - Only for hotels and restaurants */}
                {activeTab !== 'cars' && (
                  <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 relative group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                    <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                      Guests
                    </label>
                    <div
                      className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                      onClick={() => setGuestsOpen(!guestsOpen)}
                    >
                      <HiOutlineUserGroup className={`flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ${activeTab === 'restaurants' ? 'text-orange-500' : 'text-[#2FB7EC]'}`} size={20} />
                      <span className="text-gray-800 font-medium text-sm sm:text-base flex-1">{guests}</span>
                      <HiChevronDown
                        className={`text-gray-400 transition-transform duration-300 ${guestsOpen ? 'rotate-180' : ''}`}
                        size={16}
                      />
                    </div>

                    {guestsOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                        {guestOptions.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setGuests(opt); setGuestsOpen(false); }}
                            className={`w-full px-4 py-2.5 sm:py-3 text-left text-sm font-medium transition-all duration-200 ${
                              guests === opt
                                ? `${activeTab === 'restaurants' ? 'bg-orange-50 text-orange-500' : 'bg-[#2FB7EC]/10 text-[#2FB7EC]'}`
                                : 'text-gray-600 hover:bg-gray-50 hover:pl-6'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Search Button */}
                <div className="p-1.5 sm:p-2">
                  <button
                    onClick={handleSearch}
                    className={`group w-full md:w-auto h-full text-white px-6 sm:px-8 py-3.5 sm:py-4 md:py-0 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] sm:min-w-[140px] hover:-translate-y-0.5 active:translate-y-0 ${
                      activeTab === 'hotels'
                        ? 'bg-[#2FB7EC] hover:bg-[#26a5d8] hover:shadow-lg hover:shadow-[#2FB7EC]/30'
                        : activeTab === 'restaurants'
                        ? 'bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/30'
                        : 'bg-green-500 hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30'
                    }`}
                  >
                    <FiSearch size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Bar */}
          <div className={`flex flex-wrap justify-center gap-4 sm:gap-8 mt-6 sm:mt-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} dir="rtl">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Best Prices</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
          </div>

          {/* Indicators */}
          <div className={`flex gap-2 mt-8 sm:mt-12 transition-all duration-1000 delay-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`h-1.5 rounded-full transition-all duration-500 hover:bg-white/80 ${
                  i === currentImage ? 'w-8 bg-[#2FB7EC]' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Wilayas Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
              Explore Algeria
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Discover the best hotels and restaurants across Algeria's most beautiful wilayas
            </p>
          </div>

          {loadingPopularDestinations ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
            </div>
          ) : popularDestinations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No destinations available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularDestinations.map((wilaya) => (
                <Link
                  key={wilaya.id}
                  href={`/explore?wilaya=${wilaya.id}`}
                  className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getWilayaImage(wilaya)}
                    alt={wilaya.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#2FB7EC] transition-colors duration-300">
                      {wilaya.name}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">{wilaya.name_ar}</p>
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

                  <div className="absolute inset-0 bg-[#2FB7EC]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/wilayas"
              className="inline-flex items-center gap-2 bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-[#2FB7EC] hover:text-[#2FB7EC] transition-all duration-300 hover:shadow-lg"
            >
              View All Wilayas
              <HiChevronDown className="-rotate-90" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Best Hotels Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Top Rated
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Hotels
              </h2>
              <p className="text-gray-500">
                Handpicked hotels with excellent reviews and amenities
              </p>
            </div>
            <Link href="/explore?type=hotels" className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Hotels
              <HiChevronDown className="-rotate-90" size={20} />
            </Link>
          </div>

          {loadingHotels ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hotels available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  href={`/hotels/${hotel.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2FB7EC]/30 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getHotelImage(hotel)}
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
                        {hotel.rooms_count} rooms
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
                          {(hotel.min_price || hotel.price_per_night || 0).toLocaleString()}
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
                      <span className="truncate">{hotel.city}{hotel.wilaya ? `, ${hotel.wilaya.name}` : hotel.state ? `, ${hotel.state}` : ''}</span>
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
                            +{hotel.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <button className="w-full bg-[#2FB7EC] group-hover:bg-[#26a5d8] text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                      View Rooms
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Restaurants Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Fine Dining
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Restaurants
              </h2>
              <p className="text-gray-500">
                Reserve your table at the finest restaurants in Algeria
              </p>
            </div>
            <Link href="/explore?type=restaurants" className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Restaurants
              <HiChevronDown className="-rotate-90" size={20} />
            </Link>
          </div>

          {loadingRestaurants ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No restaurants available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all duration-500 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getRestaurantImage(restaurant)}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                      {restaurant.cuisine_type}
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <IoStarSharp className="text-yellow-400" size={14} />
                      <span className="text-sm font-bold text-gray-900">{restaurant.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Name & Price */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 line-clamp-1 flex-1">
                        {restaurant.name}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-lg font-bold text-orange-600">{restaurant.price_range?.toLocaleString()}</span>
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
                      <span className="truncate">
                        {restaurant.city}
                        {restaurant.wilaya && `, ${restaurant.wilaya.name}`}
                      </span>
                    </div>

                    {/* Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
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
                          <span className="text-xs font-medium text-gray-600">{restaurant.tables_count} tables</span>
                        </div>
                      )}
                      {restaurant.plats_count !== undefined && restaurant.plats_count > 0 && (
                        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-lg">
                          <span className="text-xs font-medium text-orange-600">{restaurant.plats_count} dishes</span>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button className="w-full bg-orange-500 group-hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all duration-300">
                      Book a Table
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Car Rentals Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Rent a Car
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Car Rental Services
              </h2>
              <p className="text-gray-500">
                Find the perfect vehicle for your journey across Algeria
              </p>
            </div>
            <Link href="/cars" className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Cars
              <HiChevronDown className="-rotate-90" size={20} />
            </Link>
          </div>

          {loadingCarRentals ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
            </div>
          ) : carRentals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No car rental services available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {carRentals.map((carRental) => (
                <Link
                  key={carRental.id}
                  href={`/car-rentals/${carRental.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getCarRentalImage(carRental)}
                      alt={carRental.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {carRental.cars_count !== undefined && carRental.cars_count > 0 && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <IoCarOutline size={14} />
                        {carRental.cars_count} cars
                      </div>
                    )}
                    {carRental.average_rating && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        <IoStarSharp className="text-yellow-400" size={14} />
                        <span className="text-sm font-bold text-gray-900">{carRental.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Name & Price */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1 flex-1">
                        {carRental.name}
                      </h3>
                      {carRental.min_price ? (
                        <div className="text-right flex-shrink-0">
                          <span className="text-lg font-bold text-green-600">
                            {carRental.min_price.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">DZD</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Description */}
                    {carRental.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {carRental.description}
                      </p>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
                      <IoLocationOutline size={14} className="text-green-500 flex-shrink-0" />
                      <span className="truncate">{carRental.address || carRental.city}{carRental.wilaya ? `, ${carRental.wilaya.name}` : ''}</span>
                    </div>

                    {/* Info Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(carRental.opening_time || carRental.closing_time) && (
                        <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                          <IoTimeOutline size={13} className="text-green-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {formatTime(carRental.opening_time)} - {formatTime(carRental.closing_time)}
                          </span>
                        </div>
                      )}
                      {carRental.min_price && (
                        <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg">
                          <span className="text-xs font-medium text-green-600">From {carRental.min_price.toLocaleString()} DZD/day</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <button className="w-full bg-green-500 group-hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-all">
                      View Cars
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
