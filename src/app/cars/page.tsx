'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Car as CarIcon, Filter, ChevronDown } from 'lucide-react';
import CarCard from '@/components/CarCard';
import { getCars } from '@/lib/api';
import type { Car } from '@/types';

const carTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'van', 'truck', 'convertible', 'wagon'];
const transmissions = ['manual', 'automatic'];
const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];

export default function CarsPage() {
  const t = useTranslations('cars');
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [carType, setCarType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSeats, setMinSeats] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async (filters?: Record<string, string | number>) => {
    setLoading(true);
    try {
      const data = await getCars(filters);
      setCars(data.data || []);
    } catch (error) {
      console.error('Failed to load cars:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filters: Record<string, string | number> = {};
    if (carType) filters.type = carType;
    if (transmission) filters.transmission = transmission;
    if (fuelType) filters.fuel_type = fuelType;
    if (minPrice) filters.min_price = minPrice;
    if (maxPrice) filters.max_price = maxPrice;
    if (minSeats) filters.min_seats = minSeats;
    if (pickupDate) filters.pickup_date = pickupDate;
    if (returnDate) filters.return_date = returnDate;
    loadCars(filters);
  };

  const clearFilters = () => {
    setCarType('');
    setTransmission('');
    setFuelType('');
    setMinPrice('');
    setMaxPrice('');
    setMinSeats('');
    setPickupDate('');
    setReturnDate('');
    loadCars();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-xl text-blue-100">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('pickupDate')}</label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('returnDate')}</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={pickupDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-2"
              >
                <Search size={18} />
                <span>{t('search')}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center space-x-2"
              >
                <Filter size={18} />
                <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('carType')}</label>
                  <select
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('allTypes')}</option>
                    {carTypes.map((type) => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('transmission')}</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {transmissions.map((trans) => (
                      <option key={trans} value={trans} className="capitalize">{trans}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('fuel')}</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    {fuelTypes.map((fuel) => (
                      <option key={fuel} value={fuel} className="capitalize">{fuel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('seats')}</label>
                  <select
                    value={minSeats}
                    onChange={(e) => setMinSeats(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="2">2+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                    <option value="7">7+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (DZD)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (DZD)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="lg:col-span-2 flex items-end">
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-[450px] animate-pulse">
                <div className="h-52 bg-gray-100 rounded-t-2xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-100 rounded w-16"></div>
                    <div className="h-8 bg-gray-100 rounded w-20"></div>
                    <div className="h-8 bg-gray-100 rounded w-16"></div>
                  </div>
                  <div className="h-12 bg-gray-100 rounded-xl mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20">
            <CarIcon size={56} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
