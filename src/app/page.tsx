'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUserGroup, HiChevronDown } from 'react-icons/hi';
import { IoCarOutline, IoBedOutline, IoStarSharp, IoLocationOutline, IoPersonOutline, IoSettingsOutline, IoRestaurantOutline, IoTimeOutline } from 'react-icons/io5';
import { BsBuilding } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';

// Algerian Heritage Places
const heroImages = [
  'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=1920&q=80', // Casbah of Algiers
  'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1920&q=80', // Santa Cruz Oran
  'https://images.unsplash.com/photo-1583425921686-c5daf5f49e4a?w=1920&q=80', // Constantine Bridges
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1920&q=80', // Ghardaia M'zab Valley
  'https://images.unsplash.com/photo-1581889470536-467bdbe30cd0?w=1920&q=80', // Sahara Desert
];

const bestCars = [
  {
    name: 'Mercedes C-Class',
    company: 'Europcar Algeria',
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
    type: 'Luxury',
    seats: 5,
    transmission: 'Automatic',
    price: 12000,
  },
  {
    name: 'Toyota Corolla',
    company: 'Hertz DZ',
    image: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=800&q=80',
    type: 'Sedan',
    seats: 5,
    transmission: 'Automatic',
    price: 6500,
  },
  {
    name: 'Hyundai Tucson',
    company: 'Avis Algeria',
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
    type: 'SUV',
    seats: 5,
    transmission: 'Automatic',
    price: 9000,
  },
  {
    name: 'Renault Clio',
    company: 'Sixt Rent',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
    type: 'Economy',
    seats: 5,
    transmission: 'Manual',
    price: 4500,
  },
];

const bestHotels = [
  {
    name: 'Sofitel Algiers Hamma Garden',
    location: 'Algiers',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    rating: 4.9,
    reviews: 324,
    price: 25000,
  },
  {
    name: 'Sheraton Oran Hotel',
    location: 'Oran',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    rating: 4.8,
    reviews: 256,
    price: 22000,
  },
  {
    name: 'Marriott Constantine',
    location: 'Constantine',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    rating: 4.7,
    reviews: 189,
    price: 18000,
  },
  {
    name: 'Royal Hotel Oran',
    location: 'Oran',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    rating: 4.6,
    reviews: 142,
    price: 15000,
  },
];

const bestRestaurants = [
  {
    name: 'La Maison Blanche',
    location: 'Algiers',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    cuisine: 'French',
    rating: 4.9,
    reviews: 186,
    priceRange: '$$$$',
    openHours: '12:00 - 23:00',
  },
  {
    name: 'El Djazair Restaurant',
    location: 'Oran',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
    cuisine: 'Algerian',
    rating: 4.8,
    reviews: 234,
    priceRange: '$$$',
    openHours: '11:00 - 22:00',
  },
  {
    name: 'Le Tantra',
    location: 'Constantine',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    cuisine: 'Mediterranean',
    rating: 4.7,
    reviews: 142,
    priceRange: '$$$',
    openHours: '12:00 - 00:00',
  },
  {
    name: 'Sushi Master',
    location: 'Algiers',
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=800&q=80',
    cuisine: 'Japanese',
    rating: 4.8,
    reviews: 198,
    priceRange: '$$$$',
    openHours: '12:00 - 23:30',
  },
];

const wilayas = [
  {
    name: 'Algiers',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
    hotels: 124,
    cars: 89,
  },
  {
    name: 'Oran',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    hotels: 87,
    cars: 65,
  },
  {
    name: 'Constantine',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    hotels: 56,
    cars: 42,
  },
  {
    name: 'Annaba',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    hotels: 43,
    cars: 31,
  },
  {
    name: 'Tlemcen',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80',
    hotels: 38,
    cars: 28,
  },
  {
    name: 'Setif',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
    hotels: 45,
    cars: 35,
  },
  {
    name: 'Bejaia',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
    hotels: 52,
    cars: 40,
  },
  {
    name: 'Ghardaia',
    image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=800&q=80',
    hotels: 29,
    cars: 22,
  },
];

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'hotels' | 'cars'>('hotels');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState('2 Guests');
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [destinationFocused, setDestinationFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const guestOptions = ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '5+ Guests'];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen">
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
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 pt-32 sm:pt-28 md:pt-24">
          {/* Title & Slogan */}
          <div className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Slogan */}
            <h1
              className={`text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6 transition-all duration-1000 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              dir="rtl"
            >
              <span className="text-[#2FB7EC]">حجز:</span>{' '}
              <span className="text-white">قرر تسافر والباقي خليه علينا</span>
            </h1>
            <p
              className={`text-white/70 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 transition-all duration-1000 delay-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              Discover the best hotels, restaurants, and car rentals across Algeria
            </p>
          </div>

          {/* Features Bar */}
          <div className={`flex flex-wrap justify-center gap-4 sm:gap-8 mb-6 sm:mb-8 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} dir="rtl">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">عروض متعددة</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-sm font-medium">مدفوعات آمنة</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-8 h-8 rounded-full bg-[#2FB7EC]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FB7EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">دعم على مدار الساعة 24/7</span>
            </div>
          </div>

          {/* Search Card */}
          <div className={`w-full transition-all duration-500 ease-out ${destinationFocused ? 'max-w-5xl' : 'max-w-4xl'} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Tabs */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex bg-white/10 backdrop-blur-md rounded-full p-1 sm:p-1.5">
                <button
                  onClick={() => setActiveTab('hotels')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 ${
                    activeTab === 'hotels'
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  <IoBedOutline size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Hotels
                </button>
                <button
                  onClick={() => setActiveTab('cars')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 ${
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
                {/* Location */}
                <div className={`transition-all duration-500 ease-out p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl ${
                  destinationFocused ? 'flex-[2] bg-[#2FB7EC]/5' : 'flex-1'
                }`}>
                  <label className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2 transition-colors duration-300 ${
                    destinationFocused ? 'text-[#2FB7EC]' : 'text-gray-400'
                  }`}>
                    {activeTab === 'hotels' ? 'Destination' : 'Pick-up Location'}
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HiOutlineLocationMarker className={`flex-shrink-0 transition-all duration-300 ${
                      destinationFocused ? 'text-[#2FB7EC] scale-110' : 'text-[#2FB7EC] group-hover:scale-110'
                    }`} size={20} />
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base bg-transparent"
                      onFocus={() => setDestinationFocused(true)}
                      onBlur={() => setDestinationFocused(false)}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="flex-1 p-3 sm:p-4 border-b md:border-b-0 md:border-r border-gray-100 group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                  <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                    {activeTab === 'hotels' ? 'Check-in / Check-out' : 'Pick-up / Return'}
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HiOutlineCalendar className="text-[#2FB7EC] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => setDateRange(update)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select dates"
                      className="w-full text-gray-800 font-medium placeholder-gray-400 outline-none text-sm sm:text-base cursor-pointer bg-transparent"
                      minDate={new Date()}
                      monthsShown={1}
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="flex-1 p-3 sm:p-4 relative group hover:bg-gray-50/50 rounded-lg sm:rounded-xl transition-colors duration-300">
                  <label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 sm:mb-2">
                    {activeTab === 'hotels' ? 'Guests' : 'Passengers'}
                  </label>
                  <div
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => setGuestsOpen(!guestsOpen)}
                  >
                    <HiOutlineUserGroup className="text-[#2FB7EC] flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                    <span className="text-gray-800 font-medium text-sm sm:text-base flex-1">{guests}</span>
                    <HiChevronDown
                      className={`text-gray-400 transition-transform duration-300 ${guestsOpen ? 'rotate-180' : ''}`}
                      size={16}
                    />
                  </div>

                  {guestsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                      {guestOptions.map((opt, index) => (
                        <button
                          key={opt}
                          onClick={() => { setGuests(opt); setGuestsOpen(false); }}
                          className={`w-full px-4 py-2.5 sm:py-3 text-left text-sm font-medium transition-all duration-200 ${
                            guests === opt
                              ? 'bg-[#2FB7EC]/10 text-[#2FB7EC]'
                              : 'text-gray-600 hover:bg-gray-50 hover:pl-6'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <div className="p-1.5 sm:p-2">
                  <button className="group w-full md:w-auto h-full bg-[#2FB7EC] hover:bg-[#26a5d8] text-white px-6 sm:px-8 py-3.5 sm:py-4 md:py-0 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] sm:min-w-[140px] hover:shadow-lg hover:shadow-[#2FB7EC]/30 hover:-translate-y-0.5 active:translate-y-0">
                    <FiSearch size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    Search
                  </button>
                </div>
              </div>
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
          {/* Section Header */}
          <div className="text-center mb-12">
            <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
              Explore Algeria
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Destinations
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Discover the best hotels and car rentals across Algeria's most beautiful wilayas
            </p>
          </div>

          {/* Wilayas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wilayas.map((wilaya, index) => (
              <div
                key={wilaya.name}
                className="group relative h-72 rounded-2xl overflow-hidden cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Image
                  src={wilaya.image}
                  alt={wilaya.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2FB7EC] transition-colors duration-300">
                    {wilaya.name}
                  </h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1.5">
                      <IoBedOutline size={16} />
                      <span>{wilaya.hotels} Hotels</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IoCarOutline size={16} />
                      <span>{wilaya.cars} Cars</span>
                    </div>
                  </div>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#2FB7EC]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <button className="inline-flex items-center gap-2 bg-white text-gray-800 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-[#2FB7EC] hover:text-[#2FB7EC] transition-all duration-300 hover:shadow-lg">
              View All Wilayas
              <HiChevronDown className="-rotate-90" size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Best Hotels Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Top Rated
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Best Hotels
              </h2>
              <p className="text-gray-500">
                Handpicked hotels with excellent reviews and amenities
              </p>
            </div>
            <button className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Hotels
              <HiChevronDown className="-rotate-90" size={20} />
            </button>
          </div>

          {/* Hotels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestHotels.map((hotel, index) => (
              <div
                key={hotel.name}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2FB7EC]/30 hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <IoStarSharp className="text-yellow-400" size={16} />
                    <span className="text-sm font-bold text-gray-900">{hotel.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                    <IoLocationOutline size={16} />
                    <span>{hotel.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#2FB7EC] transition-colors duration-300 line-clamp-1">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#2FB7EC]">{hotel.price.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm ml-1">DZD/night</span>
                    </div>
                    <span className="text-gray-400 text-sm">{hotel.reviews} reviews</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Restaurants Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Fine Dining
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Best Restaurants
              </h2>
              <p className="text-gray-500">
                Reserve your table at the finest restaurants in Algeria
              </p>
            </div>
            <button className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Restaurants
              <HiChevronDown className="-rotate-90" size={20} />
            </button>
          </div>

          {/* Restaurants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestRestaurants.map((restaurant, index) => (
              <div
                key={restaurant.name}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2FB7EC]/30 hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Cuisine Badge */}
                  <div className="absolute top-4 left-4 bg-[#2FB7EC] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {restaurant.cuisine}
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <IoStarSharp className="text-yellow-400" size={16} />
                    <span className="text-sm font-bold text-gray-900">{restaurant.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                    <IoLocationOutline size={16} />
                    <span>{restaurant.location}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#2FB7EC] transition-colors duration-300 line-clamp-1">
                    {restaurant.name}
                  </h3>

                  {/* Info */}
                  <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                    <div className="flex items-center gap-1.5">
                      <IoTimeOutline size={16} />
                      <span>{restaurant.openHours}</span>
                    </div>
                    <span className="text-[#2FB7EC] font-semibold">{restaurant.priceRange}</span>
                  </div>

                  {/* Reserve Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-gray-400 text-sm">{restaurant.reviews} reviews</span>
                    <button className="bg-[#2FB7EC]/10 text-[#2FB7EC] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#2FB7EC] hover:text-white transition-all duration-300">
                      Reserve Table
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Cars Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <p className="text-[#2FB7EC] font-semibold text-sm tracking-widest uppercase mb-3">
                Premium Fleet
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Best Car Rentals
              </h2>
              <p className="text-gray-500">
                Choose from our selection of quality vehicles from trusted companies
              </p>
            </div>
            <button className="mt-6 md:mt-0 inline-flex items-center gap-2 text-[#2FB7EC] font-semibold hover:gap-3 transition-all duration-300">
              View All Cars
              <HiChevronDown className="-rotate-90" size={20} />
            </button>
          </div>

          {/* Cars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestCars.map((car, index) => (
              <div
                key={car.name}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2FB7EC]/30 hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Type Badge */}
                  <div className="absolute top-4 left-4 bg-[#2FB7EC] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {car.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Company */}
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                    <BsBuilding size={14} />
                    <span>{car.company}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#2FB7EC] transition-colors duration-300">
                    {car.name}
                  </h3>

                  {/* Features */}
                  <div className="flex items-center gap-4 text-gray-500 text-sm mb-4">
                    <div className="flex items-center gap-1.5">
                      <IoPersonOutline size={16} />
                      <span>{car.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IoSettingsOutline size={16} />
                      <span>{car.transmission}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-2xl font-bold text-[#2FB7EC]">{car.price.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm ml-1">DZD/day</span>
                    </div>
                    <button className="bg-[#2FB7EC]/10 text-[#2FB7EC] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#2FB7EC] hover:text-white transition-all duration-300">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
