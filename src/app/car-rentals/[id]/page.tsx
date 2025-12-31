'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Check,
  Car,
  Fuel,
  Users,
  Settings,
  Gauge,
  DoorOpen,
  Snowflake,
  Navigation,
  Bluetooth,
  Usb,
  Baby,
  AlertCircle,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CarRentalCompany {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  is_active: boolean;
  wilaya?: { id: number; name: string };
}

interface CarImage {
  id: number;
  image_path: string;
  is_primary: boolean;
}

interface CarType {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
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
  deposit_amount: number;
  mileage_limit: number;
  extra_km_price: number;
  min_rental_days: number;
  max_rental_days: number;
  is_available: boolean;
  images: CarImage[];
  primary_image_url: string | null;
  full_name: string;
}

export default function CarRentalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<CarRentalCompany | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected car for booking
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [carImageIndex, setCarImageIndex] = useState(0);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [rentalDays, setRentalDays] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    id_number: '',
    driver_license: '',
  });
  const [notes, setNotes] = useState('');

  const [bookingSuccess, setBookingSuccess] = useState<{
    show: boolean;
    bookingId?: number;
    carName?: string;
    totalPrice?: number;
  }>({ show: false });

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  useEffect(() => {
    fetchCompanyAndCars();
  }, [params.id]);

  useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    // Reset availability when dates change
    setIsAvailable(null);
  }, [pickupDate, rentalDays, selectedCar]);

  const fetchCompanyAndCars = async () => {
    try {
      const [companyRes, carsRes] = await Promise.all([
        api.get(`/car-rentals/${params.id}`),
        api.get(`/car-rentals/${params.id}/cars`),
      ]);
      setCompany(companyRes.data);
      setCars(carsRes.data.data || carsRes.data || []);
    } catch (error) {
      toast.error('Failed to load car rental company');
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder-car.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
  };

  // Format date as YYYY-MM-DD without timezone conversion
  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateReturnDateTime = () => {
    if (!pickupDate || !pickupTime) return null;

    const pickup = new Date(pickupDate);
    const [hours, minutes] = pickupTime.split(':').map(Number);
    pickup.setHours(hours, minutes, 0, 0);

    // Add rental days
    const returnDate = new Date(pickup);
    returnDate.setDate(returnDate.getDate() + rentalDays);

    // Return 1 hour before pickup time
    returnDate.setHours(returnDate.getHours() - 1);

    return returnDate;
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReturnTime = () => {
    if (!pickupTime) return '';
    const [hours, minutes] = pickupTime.split(':').map(Number);
    let returnHour = hours - 1;
    if (returnHour < 0) returnHour = 23;
    return `${String(returnHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateTotalPrice = () => {
    if (!selectedCar) return 0;
    return selectedCar.price_per_day * rentalDays;
  };

  const calculateTotalKmAllowed = () => {
    if (!selectedCar || !selectedCar.mileage_limit) return null;
    return selectedCar.mileage_limit * rentalDays;
  };

  const checkAvailability = async () => {
    if (!selectedCar || !pickupDate) return;

    setCheckingAvailability(true);
    try {
      const returnDate = calculateReturnDateTime();
      if (!returnDate) return;

      const response = await api.get(`/cars/${selectedCar.id}/check-availability`, {
        params: {
          pickup_date: formatDateForApi(pickupDate),
          return_date: formatDateForApi(returnDate),
        },
      });

      setIsAvailable(response.data.available);
      if (!response.data.available) {
        toast.error('This car is not available for the selected dates');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check availability');
      setIsAvailable(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedCar || !pickupDate) return;

    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone || !guestInfo.driver_license) {
      toast.error('Please fill in all required fields');
      return;
    }

    const returnDate = calculateReturnDateTime();
    if (!returnDate) return;

    setBookingLoading(true);
    try {
      const response = await api.post(`/cars/${selectedCar.id}/book`, {
        pickup_date: formatDateForApi(pickupDate),
        pickup_time: pickupTime,
        return_date: formatDateForApi(returnDate),
        return_time: getReturnTime(),
        customer_name: guestInfo.name,
        customer_email: guestInfo.email,
        customer_phone: guestInfo.phone,
        customer_id_number: guestInfo.id_number,
        driver_license_number: guestInfo.driver_license,
        notes: notes,
      });

      setShowBookingModal(false);
      setBookingSuccess({
        show: true,
        bookingId: response.data.booking?.id,
        carName: selectedCar.full_name,
        totalPrice: response.data.subtotal,
      });
      toast.success('Booking request submitted!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Booking failed';
      toast.error(errorMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  const openBookingModal = (car: CarType) => {
    setSelectedCar(car);
    setCarImageIndex(0);
    setIsAvailable(null);
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Car rental company not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                {company.city}
                {company.wilaya && `, ${company.wilaya.name}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Company Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h2>
              {company.description && (
                <p className="text-gray-600 mb-4">{company.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-green-500" />
                  <span>{company.address}, {company.city}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-green-500" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-green-500" />
                    <span>{company.email}</span>
                  </div>
                )}
              </div>
            </div>
            {!company.is_active && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                Not Available
              </div>
            )}
          </div>
        </div>

        {/* Cars Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Available Cars ({cars.length})
          </h3>

          {cars.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Car size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No cars available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow ${
                    !car.is_available ? 'opacity-75' : ''
                  }`}
                >
                  {/* Car Image */}
                  <div className="relative h-48 bg-gray-100">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={getImageUrl(car.images.find((i) => i.is_primary)?.image_path || car.images[0]?.image_path)}
                        alt={car.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : car.primary_image_url ? (
                      <img
                        src={car.primary_image_url}
                        alt={car.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={48} className="text-gray-300" />
                      </div>
                    )}
                    {!car.is_available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                          Not Available
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {car.type}
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="p-4">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {car.brand} {car.model}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">{car.year} {car.color && `- ${car.color}`}</p>

                    {/* Specs */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Users size={16} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">{car.seats}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Settings size={16} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 capitalize">{car.transmission?.slice(0, 4)}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Fuel size={16} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 capitalize">{car.fuel_type?.slice(0, 4)}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <DoorOpen size={16} className="text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600">{car.doors}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {car.has_ac && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          <Snowflake size={12} /> AC
                        </span>
                      )}
                      {car.has_gps && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                          <Navigation size={12} /> GPS
                        </span>
                      )}
                      {car.has_bluetooth && (
                        <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded">
                          <Bluetooth size={12} />
                        </span>
                      )}
                    </div>

                    {/* Mileage Info */}
                    {car.mileage_limit && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Gauge size={14} />
                        <span>{car.mileage_limit} km/day included</span>
                        {car.extra_km_price && (
                          <span className="text-orange-500">+{car.extra_km_price} DZD/km extra</span>
                        )}
                      </div>
                    )}

                    {/* Price & Book Button */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          {car.price_per_day?.toLocaleString()}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">DZD/day</span>
                      </div>
                      <button
                        onClick={() => openBookingModal(car)}
                        disabled={!car.is_available || !company.is_active}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Book {selectedCar.full_name}</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Car Preview */}
              <div className="relative h-48 rounded-xl overflow-hidden bg-gray-100 mb-6">
                {selectedCar.images && selectedCar.images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(selectedCar.images[carImageIndex]?.image_path)}
                      alt={selectedCar.full_name}
                      className="w-full h-full object-cover"
                    />
                    {selectedCar.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCarImageIndex((i) => (i - 1 + selectedCar.images.length) % selectedCar.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={() => setCarImageIndex((i) => (i + 1) % selectedCar.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={48} className="text-gray-300" />
                  </div>
                )}
              </div>

              {/* Date & Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date *
                  </label>
                  <DatePicker
                    selected={pickupDate}
                    onChange={(date: Date | null) => setPickupDate(date)}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholderText="Select pickup date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Time *
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rental Days */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rental Duration (days)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRentalDays(Math.max(selectedCar.min_rental_days || 1, rentalDays - 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold w-12 text-center">{rentalDays}</span>
                  <button
                    onClick={() => setRentalDays(Math.min(selectedCar.max_rental_days || 30, rentalDays + 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedCar.min_rental_days && `Min: ${selectedCar.min_rental_days} days`}
                    {selectedCar.max_rental_days && ` | Max: ${selectedCar.max_rental_days} days`}
                  </span>
                </div>
              </div>

              {/* Return Date Preview */}
              {pickupDate && (
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Rental Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Pickup</p>
                      <p className="font-medium">{pickupDate.toLocaleDateString()}</p>
                      <p className="text-green-600">{pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Return</p>
                      <p className="font-medium">{calculateReturnDateTime()?.toLocaleDateString()}</p>
                      <p className="text-green-600">{getReturnTime()} (1h before pickup time)</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Price per day</span>
                      <span className="font-medium">{selectedCar.price_per_day?.toLocaleString()} DZD</span>
                    </div>
                    {calculateTotalKmAllowed() && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Total KM allowed</span>
                        <span className="font-medium">{calculateTotalKmAllowed()?.toLocaleString()} km</span>
                      </div>
                    )}
                    {selectedCar.extra_km_price && (
                      <div className="flex justify-between text-sm mt-1 text-orange-600">
                        <span>Extra KM charge</span>
                        <span>{selectedCar.extra_km_price} DZD/km</span>
                      </div>
                    )}
                    {selectedCar.deposit_amount && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Deposit required</span>
                        <span className="font-medium">{selectedCar.deposit_amount?.toLocaleString()} DZD</span>
                      </div>
                    )}
                    <div className="flex justify-between mt-2 pt-2 border-t border-green-200">
                      <span className="font-semibold text-gray-900">Total Rental</span>
                      <span className="text-xl font-bold text-green-600">
                        {calculateTotalPrice().toLocaleString()} DZD
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Check Availability Button */}
              {pickupDate && isAvailable === null && (
                <button
                  onClick={checkAvailability}
                  disabled={checkingAvailability}
                  className="w-full py-3 mb-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>
              )}

              {/* Availability Status */}
              {isAvailable !== null && (
                <div className={`rounded-xl p-4 mb-6 ${isAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="font-medium text-green-700">Car is available for these dates!</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="font-medium text-red-700">Car is not available for these dates</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Guest Info Form - Only show if available */}
              {isAvailable && (
                <>
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-900">Your Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+213 XX XXX XXXX"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                        <input
                          type="text"
                          value={guestInfo.id_number}
                          onChange={(e) => setGuestInfo({ ...guestInfo, id_number: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="National ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver License *</label>
                        <input
                          type="text"
                          value={guestInfo.driver_license}
                          onChange={(e) => setGuestInfo({ ...guestInfo, driver_license: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="License number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Any special requests..."
                        rows={2}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:bg-gray-300"
                  >
                    {bookingLoading ? 'Submitting...' : `Book Now - ${calculateTotalPrice().toLocaleString()} DZD`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccess.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your car rental request has been submitted. The company will confirm your booking shortly.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-medium">#{bookingSuccess.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Car</span>
                  <span className="font-medium">{bookingSuccess.carName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pickup</span>
                  <span className="font-medium">{pickupDate?.toLocaleDateString()} at {pickupTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Return</span>
                  <span className="font-medium">{formatDateTime(calculateReturnDateTime())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{rentalDays} day{rentalDays > 1 ? 's' : ''}</span>
                </div>
                {bookingSuccess.totalPrice && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-green-600">{bookingSuccess.totalPrice.toLocaleString()} DZD</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setBookingSuccess({ show: false });
                setShowBookingModal(false);
                setSelectedCar(null);
                setPickupDate(null);
                setRentalDays(1);
                setIsAvailable(null);
                setNotes('');
              }}
              className="w-full px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
