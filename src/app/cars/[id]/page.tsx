'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  MapPin, Users, Fuel, Settings2, Calendar, Clock, Gauge, DollarSign,
  Check, AlertCircle, Building2, Phone, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getCar, checkCarAvailability, bookCar } from '@/lib/api';
import type { Car } from '@/types';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('cars');
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking state
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('18:00');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [notes, setNotes] = useState('');

  const [availability, setAvailability] = useState<{
    available: boolean;
    rental_days: number;
    subtotal: number;
    total_km_allowed: number;
  } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadCar();
  }, [params.id]);

  const loadCar = async () => {
    setLoading(true);
    try {
      const data = await getCar(Number(params.id));
      setCar(data);
    } catch (error) {
      console.error('Failed to load car:', error);
      toast.error('Car not found');
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!pickupDate || !returnDate) {
      toast.error('Please select pickup and return dates');
      return;
    }

    setCheckingAvailability(true);
    try {
      const result = await checkCarAvailability(Number(params.id), pickupDate, returnDate);
      setAvailability(result);
      if (result.available) {
        setShowBookingForm(true);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBook = async () => {
    if (!customerName || !customerEmail || !customerPhone || !driverLicense) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      await bookCar(Number(params.id), {
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        return_date: returnDate,
        return_time: returnTime,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        driver_license_number: driverLicense,
        notes: notes || undefined,
      });
      toast.success(t('bookingSuccess'));
      router.push('/cars');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || t('bookingFailed'));
    } finally {
      setBooking(false);
    }
  };

  const nextImage = () => {
    if (car?.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = () => {
    if (car?.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!car) {
    return null;
  }

  const isAvailable = car.is_available !== false && car.company?.is_active !== false;
  const imageUrl = car.images?.[currentImageIndex]?.url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with image */}
      <div className="relative h-[400px] bg-gray-900">
        <Image
          src={imageUrl}
          alt={`${car.brand} ${car.model}`}
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Image navigation */}
        {car.images && car.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition"
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
              {car.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Car title */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold capitalize">
                {car.type}
              </span>
              <span className="bg-white/90 text-gray-800 px-4 py-1.5 rounded-full text-sm font-bold">
                {car.year}
              </span>
              {!isAvailable && (
                <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                  {t('notAvailable')}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black text-white">
              {car.brand} {car.model}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Car Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Users className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-2xl font-bold text-gray-900">{car.seats}</p>
                  <p className="text-sm text-gray-500">{t('seats')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Settings2 className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-lg font-bold text-gray-900 capitalize">{car.transmission}</p>
                  <p className="text-sm text-gray-500">{t('transmission')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Fuel className="mx-auto text-blue-500 mb-2" size={24} />
                  <p className="text-lg font-bold text-gray-900 capitalize">{car.fuel_type}</p>
                  <p className="text-sm text-gray-500">{t('fuel')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <span className="text-blue-500 text-2xl font-bold">{car.doors}</span>
                  <p className="text-sm text-gray-500 mt-2">{t('doors')}</p>
                </div>
              </div>
            </div>

            {/* Mileage Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Mileage & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <Gauge className="text-green-600" size={32} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {car.mileage_limit ? `${car.mileage_limit} km` : t('unlimited')}
                    </p>
                    <p className="text-sm text-gray-600">{t('mileageLimit')}</p>
                  </div>
                </div>
                {car.extra_km_price && (
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                    <DollarSign className="text-orange-600" size={32} />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{car.extra_km_price} DZD</p>
                      <p className="text-sm text-gray-600">{t('extraKmPrice')}</p>
                    </div>
                  </div>
                )}
              </div>

              {(car.min_rental_days || car.max_rental_days) && (
                <div className="mt-4 flex gap-4">
                  {car.min_rental_days && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{t('minDays')}:</span> {car.min_rental_days} {t('days')}
                    </div>
                  )}
                  {car.max_rental_days && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{t('maxDays')}:</span> {car.max_rental_days} {t('days')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('features')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {car.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="text-green-500" size={18} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Info */}
            {car.company && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('company')}</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="text-blue-600" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{car.company.name}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin size={16} />
                      <span>{car.company.address}, {car.company.city}</span>
                    </div>
                    <div className="flex gap-4 mt-3">
                      {car.company.phone && (
                        <a href={`tel:${car.company.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <Phone size={16} />
                          <span>{car.company.phone}</span>
                        </a>
                      )}
                      {car.company.email && (
                        <a href={`mailto:${car.company.email}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <Mail size={16} />
                          <span>{car.company.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Booking */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              {/* Price */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-gray-900">{car.price_per_day?.toLocaleString()}</span>
                  <span className="text-gray-500 font-bold">DZD{t('perDay')}</span>
                </div>
                {car.deposit_amount > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('deposit')}: {car.deposit_amount?.toLocaleString()} DZD
                  </p>
                )}
              </div>

              {isAvailable ? (
                <>
                  {/* Date selection */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar size={16} className="inline mr-2" />
                        {t('pickupDate')}
                      </label>
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => {
                          setPickupDate(e.target.value);
                          setAvailability(null);
                          setShowBookingForm(false);
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar size={16} className="inline mr-2" />
                        {t('returnDate')}
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => {
                          setReturnDate(e.target.value);
                          setAvailability(null);
                          setShowBookingForm(false);
                        }}
                        min={pickupDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock size={16} className="inline mr-2" />
                          {t('pickupTime')}
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock size={16} className="inline mr-2" />
                          {t('returnTime')}
                        </label>
                        <input
                          type="time"
                          value={returnTime}
                          onChange={(e) => setReturnTime(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check availability button */}
                  {!showBookingForm && (
                    <button
                      onClick={handleCheckAvailability}
                      disabled={checkingAvailability || !pickupDate || !returnDate}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkingAvailability ? 'Checking...' : t('checkAvailability')}
                    </button>
                  )}

                  {/* Availability result */}
                  {availability && (
                    <div className={`mt-4 p-4 rounded-xl ${availability.available ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {availability.available ? (
                          <>
                            <Check className="text-green-600" size={20} />
                            <span className="font-bold text-green-700">{t('available')}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="text-red-600" size={20} />
                            <span className="font-bold text-red-700">{t('notAvailable')}</span>
                          </>
                        )}
                      </div>
                      {availability.available && (
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>{t('rentalDays')}: <span className="font-bold">{availability.rental_days}</span></p>
                          <p>{t('subtotal')}: <span className="font-bold">{availability.subtotal?.toLocaleString()} DZD</span></p>
                          {car.mileage_limit && (
                            <p>{t('totalKmAllowed')}: <span className="font-bold">{availability.total_km_allowed} km</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Booking form */}
                  {showBookingForm && availability?.available && (
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                      <h3 className="font-bold text-gray-900">{t('customerInfo')}</h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')} *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')} *</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} *</label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('driverLicense')} *</label>
                        <input
                          type="text"
                          value={driverLicense}
                          onChange={(e) => setDriverLicense(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <button
                        onClick={handleBook}
                        disabled={booking}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {booking ? 'Processing...' : `${t('bookNow')} - ${availability.subtotal?.toLocaleString()} DZD`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">{t('notAvailable')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
