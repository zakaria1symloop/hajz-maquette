'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapPin, Star, Wifi, Car, Dumbbell, UtensilsCrossed, Waves, Shield, Calendar, Users, ArrowLeft, Bed, Check, Tv, Snowflake, Wine, Lock, Home, Eye, Mountain, Bath, Droplets, Wind, Coffee, Bell, Egg, Shirt, Briefcase, Package, X, Phone, Mail, User, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Room {
  id: number;
  name: string;
  type: string;
  description: string;
  price_per_night: number;
  capacity: number;
  bed_configuration: string;
  size_sqm: number;
  amenities: string[];
  is_active: boolean;
  images?: { id: number; image_path: string; is_primary: boolean }[];
}

interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  star_rating: number;
  rating: number;
  price_per_night: number;
  rooms_available: number;
  amenities: string[];
  images?: { id: number; url: string; is_primary: boolean }[];
  rooms?: Room[];
}

const amenityIcons: Record<string, React.ReactNode> = {
  // Hotel amenities
  wifi: <Wifi size={20} />,
  parking: <Car size={20} />,
  gym: <Dumbbell size={20} />,
  restaurant: <UtensilsCrossed size={20} />,
  pool: <Waves size={20} />,
  spa: <Shield size={20} />,
  room_service: <Bell size={20} />,
  airport_shuttle: <Car size={20} />,
  ac: <Snowflake size={20} />,
  bar: <Wine size={20} />,
  breakfast: <Egg size={20} />,
  pet_friendly: <Shield size={20} />,
  // Room amenities
  tv: <Tv size={20} />,
  mini_bar: <Wine size={20} />,
  safe: <Lock size={20} />,
  balcony: <Home size={20} />,
  sea_view: <Eye size={20} />,
  city_view: <Eye size={20} />,
  mountain_view: <Mountain size={20} />,
  bathtub: <Bath size={20} />,
  shower: <Droplets size={20} />,
  hair_dryer: <Wind size={20} />,
  coffee_maker: <Coffee size={20} />,
  iron: <Shirt size={20} />,
  desk: <Briefcase size={20} />,
  closet: <Package size={20} />,
};

const amenityLabels: Record<string, string> = {
  wifi: 'Free WiFi',
  parking: 'Free Parking',
  gym: 'Fitness Center',
  restaurant: 'Restaurant',
  pool: 'Swimming Pool',
  spa: 'Spa & Wellness',
  room_service: 'Room Service',
  airport_shuttle: 'Airport Shuttle',
  ac: 'Air Conditioning',
  bar: 'Bar/Lounge',
  breakfast: 'Breakfast Included',
  pet_friendly: 'Pet Friendly',
  tv: 'TV',
  mini_bar: 'Mini Bar',
  safe: 'Safe',
  balcony: 'Balcony',
  sea_view: 'Sea View',
  city_view: 'City View',
  mountain_view: 'Mountain View',
  bathtub: 'Bathtub',
  shower: 'Shower',
  hair_dryer: 'Hair Dryer',
  coffee_maker: 'Coffee Maker',
  iron: 'Iron & Ironing Board',
  desk: 'Work Desk',
  closet: 'Closet',
};

export default function HotelDetailPage() {
  const t = useTranslations('hotels');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [bookingSuccess, setBookingSuccess] = useState<{
    show: boolean;
    reservationId?: number;
  }>({ show: false });

  useEffect(() => {
    if (params.id) {
      fetchHotelDetails();
    }
  }, [params.id]);

  // Fetch booked dates when room is selected
  useEffect(() => {
    if (selectedRoom) {
      fetchBookedDates(selectedRoom.id);
      // Reset dates and availability when room changes
      setCheckInDate(null);
      setCheckOutDate(null);
      setIsAvailable(null);
    }
  }, [selectedRoom?.id]);

  // Check availability when dates change
  useEffect(() => {
    if (selectedRoom && checkInDate && checkOutDate) {
      checkAvailability();
    } else {
      setIsAvailable(null);
    }
  }, [checkInDate, checkOutDate, selectedRoom?.id]);

  const fetchBookedDates = async (roomId: number) => {
    try {
      const response = await api.get(`/rooms/${roomId}/booked-dates`);
      const dates = response.data.booked_dates.map((d: string) => new Date(d));
      setBookedDates(dates);
    } catch (error) {
      console.error('Failed to fetch booked dates:', error);
      setBookedDates([]);
    }
  };

  const checkAvailability = async () => {
    if (!selectedRoom || !checkInDate || !checkOutDate) return;

    setCheckingAvailability(true);
    try {
      const response = await api.post(`/rooms/${selectedRoom.id}/check-availability`, {
        check_in: checkInDate.toISOString().split('T')[0],
        check_out: checkOutDate.toISOString().split('T')[0],
      });
      setIsAvailable(response.data.is_available);
    } catch (error) {
      console.error('Failed to check availability:', error);
      setIsAvailable(false);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    );
  };

  const fetchHotelDetails = async () => {
    try {
      const response = await api.get(`/hotels/${params.id}`);
      const hotelData = response.data.hotel || response.data;
      setHotel(hotelData);

      // Fetch rooms for this hotel
      const roomsResponse = await api.get(`/hotels/${params.id}/rooms`);
      const roomsData = roomsResponse.data.rooms || roomsResponse.data.data || roomsResponse.data || [];
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error('Failed to fetch hotel:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomImageUrl = (room: Room) => {
    if (!room.images || room.images.length === 0) return null;
    const primary = room.images.find(img => img.is_primary) || room.images[0];
    if (primary.image_path?.startsWith('http')) return primary.image_path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${primary.image_path}`;
  };

  const getHotelImageUrl = () => {
    if (!hotel?.images || hotel.images.length === 0) {
      return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920';
    }
    const primary = hotel.images.find(img => img.is_primary) || hotel.images[0];
    return primary.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920';
  };

  const openBookingModal = () => {
    if (!selectedRoom) {
      toast.error(t('pleaseSelectRoom'));
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error(t('selectDates'));
      return;
    }

    if (isAvailable === false) {
      toast.error(t('datesNotAvailable'));
      return;
    }

    if (guests > selectedRoom.capacity) {
      toast.error(t('maxGuests', { count: selectedRoom.capacity }));
      return;
    }

    // Pre-fill guest info if user is logged in
    if (user) {
      setGuestInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }

    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    // Validate guest info
    if (!guestInfo.name.trim()) {
      toast.error(t('pleaseEnterName'));
      return;
    }
    if (!guestInfo.email.trim()) {
      toast.error(t('pleaseEnterEmail'));
      return;
    }
    if (!guestInfo.phone.trim()) {
      toast.error(t('pleaseEnterPhone'));
      return;
    }

    setBooking(true);
    try {
      const bookingData: any = {
        type: 'hotel',
        item_id: hotel!.id,
        room_id: selectedRoom!.id,
        check_in: checkInDate!.toISOString().split('T')[0],
        check_out: checkOutDate!.toISOString().split('T')[0],
        guests,
        special_requests: specialRequests,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
      };

      // Use different endpoints based on authentication
      const endpoint = user ? '/reservations' : '/reservations/guest';
      const response = await api.post(endpoint, bookingData);

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        // Payment simulated - show success
        setShowBookingModal(false);
        setBookingSuccess({
          show: true,
          reservationId: response.data.reservation?.id
        });
        toast.success('Booking confirmed successfully!');
      }
    } catch (error: any) {
      console.error('Booking failed:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t('notFound')}</p>
      </div>
    );
  }

  const nights = checkInDate && checkOutDate ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const totalPrice = selectedRoom ? nights * selectedRoom.price_per_night : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-[400px] md:h-[500px]">
        <Image
          src={getHotelImageUrl()}
          alt={hotel.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 bg-white p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
                  <div className="flex items-center text-gray-500 mt-2">
                    <MapPin size={18} className="mr-1" />
                    <span>{hotel.address}, {hotel.city}, {hotel.state}</span>
                  </div>
                </div>
                <div className="flex items-center bg-[#2FB7EC]/10 px-3 py-1.5 rounded-xl border border-[#2FB7EC]/20">
                  <Star className="text-yellow-500 fill-yellow-500 mr-1" size={18} />
                  <span className="font-semibold text-[#2FB7EC]">{hotel.star_rating}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">{hotel.description}</p>

              {/* Amenities */}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">{t('amenities')}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                        {amenityIcons[amenity.toLowerCase()] || <Shield size={20} />}
                        <span>{amenityLabels[amenity.toLowerCase()] || amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rooms Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-semibold mb-6">{t('availableRooms')}</h2>

              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bed size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>{t('noRoomsAvailable')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.filter(room => room.is_active).map((room) => {
                    const roomImage = getRoomImageUrl(room);
                    const isSelected = selectedRoom?.id === room.id;

                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`border rounded-xl p-3 sm:p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#2FB7EC] bg-[#2FB7EC]/5 ring-2 ring-[#2FB7EC]/20'
                            : 'border-gray-200 hover:border-[#2FB7EC]/50'
                        }`}
                      >
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex gap-3 mb-3">
                            {/* Room Image */}
                            <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {roomImage ? (
                                <Image src={roomImage} alt={room.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Bed size={24} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                                  <p className="text-xs text-gray-500 capitalize">{room.type} Room</p>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 bg-[#2FB7EC] rounded-full flex items-center justify-center flex-shrink-0">
                                    <Check size={12} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="mt-2">
                                <p className="text-lg font-bold text-[#2FB7EC]">
                                  {room.price_per_night.toLocaleString()} <span className="text-xs font-normal text-gray-400">DZD/night</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Users size={12} />
                              {room.capacity}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                              <Bed size={12} />
                              {room.bed_configuration}
                            </span>
                            {room.size_sqm && <span className="bg-gray-100 px-2 py-1 rounded">{room.size_sqm} sqm</span>}
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex gap-4">
                          {/* Room Image */}
                          <div className="w-32 h-24 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {roomImage ? (
                              <Image src={roomImage} alt={room.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Bed size={32} className="text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Room Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{room.name}</h3>
                                <p className="text-sm text-gray-500 capitalize">{room.type} Room</p>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 bg-[#2FB7EC] rounded-full flex items-center justify-center">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={14} />
                                {room.capacity} guests
                              </span>
                              <span className="flex items-center gap-1">
                                <Bed size={14} />
                                {room.bed_configuration}
                              </span>
                              {room.size_sqm && <span>{room.size_sqm} sqm</span>}
                            </div>

                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {room.amenities.slice(0, 4).map(amenity => (
                                  <span key={amenity} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                                    {amenityIcons[amenity.toLowerCase()] && <span className="scale-75">{amenityIcons[amenity.toLowerCase()]}</span>}
                                    {amenityLabels[amenity.toLowerCase()] || amenity}
                                  </span>
                                ))}
                                {room.amenities.length > 4 && (
                                  <span className="text-xs text-gray-400">+{room.amenities.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#2FB7EC]">
                              {room.price_per_night.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400">DZD/night</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              {selectedRoom ? (
                <>
                  <div className="text-center mb-4 pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">{selectedRoom.name}</p>
                    <span className="text-3xl font-bold text-[#2FB7EC]">
                      {selectedRoom.price_per_night.toLocaleString()} DZD
                    </span>
                    <span className="text-gray-500"> / night</span>
                  </div>
                </>
              ) : (
                <div className="text-center mb-6 py-4 bg-gray-50 rounded-xl">
                  <Bed size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm">{t('selectRoom')}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    {t('checkIn')}
                  </label>
                  <DatePicker
                    selected={checkInDate}
                    onChange={(date: Date | null) => {
                      setCheckInDate(date);
                      if (date && checkOutDate && date >= checkOutDate) {
                        setCheckOutDate(null);
                      }
                    }}
                    excludeDates={bookedDates}
                    minDate={new Date()}
                    dateFormat="MMM dd, yyyy"
                    placeholderText={t('selectCheckIn')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent cursor-pointer text-base"
                    calendarClassName="!shadow-xl !border-0 !rounded-xl !font-sans"
                    wrapperClassName="w-full"
                    popperClassName="!z-50"
                    popperPlacement="bottom-start"
                    dayClassName={(date) =>
                      isDateBooked(date)
                        ? 'bg-red-100 text-red-400 cursor-not-allowed'
                        : ''
                    }
                    disabled={!selectedRoom}
                    withPortal
                    portalId="datepicker-portal"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    {t('checkOut')}
                  </label>
                  <DatePicker
                    selected={checkOutDate}
                    onChange={(date: Date | null) => setCheckOutDate(date)}
                    excludeDates={bookedDates}
                    minDate={checkInDate || new Date()}
                    dateFormat="MMM dd, yyyy"
                    placeholderText={t('selectCheckOut')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent cursor-pointer text-base"
                    calendarClassName="!shadow-xl !border-0 !rounded-xl !font-sans"
                    wrapperClassName="w-full"
                    popperClassName="!z-50"
                    popperPlacement="bottom-start"
                    dayClassName={(date) =>
                      isDateBooked(date)
                        ? 'bg-red-100 text-red-400 cursor-not-allowed'
                        : ''
                    }
                    disabled={!selectedRoom || !checkInDate}
                    withPortal
                    portalId="datepicker-portal"
                  />
                </div>

                {/* Availability Status */}
                {selectedRoom && checkInDate && checkOutDate && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 ${
                    checkingAvailability
                      ? 'bg-gray-50 text-gray-600'
                      : isAvailable === true
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : isAvailable === false
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {checkingAvailability ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">{t('checkingAvailability')}</span>
                      </>
                    ) : isAvailable === true ? (
                      <>
                        <Check size={18} />
                        <span className="text-sm font-medium">{t('availableForDates')}</span>
                      </>
                    ) : isAvailable === false ? (
                      <>
                        <AlertCircle size={18} />
                        <span className="text-sm font-medium">{t('notAvailableForDates')}</span>
                      </>
                    ) : null}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    <Users size={16} className="inline mr-1" />
                    {t('guests')}
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} {n > 1 ? t('guests') : t('guest')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    {t('specialRequests')}
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent resize-none"
                    placeholder={t('specialRequestsPlaceholder')}
                  />
                </div>
              </div>

              {nights > 0 && selectedRoom && (
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="flex justify-between text-gray-600 mb-2">
                    <span>{selectedRoom.price_per_night.toLocaleString()} DZD x {nights} {t('nights')}</span>
                    <span>{totalPrice.toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}</span>
                    <span className="text-[#2FB7EC]">{totalPrice.toLocaleString()} DZD</span>
                  </div>
                </div>
              )}

              <button
                onClick={openBookingModal}
                disabled={!checkInDate || !checkOutDate || !selectedRoom || isAvailable === false || checkingAvailability}
                className="w-full bg-[#2FB7EC] text-white py-4 rounded-xl font-semibold hover:bg-[#26a5d8] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingAvailability ? t('checking') : isAvailable === false ? t('notAvailable') : t('bookNow')}
              </button>

              {selectedRoom && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Max {selectedRoom.capacity} guests
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('confirmBooking')}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('bookingSummary')}</h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('room')}</span>
                    <span className="font-medium text-right">{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('checkIn')}</span>
                    <span className="font-medium">{checkInDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('checkOut')}</span>
                    <span className="font-medium">{checkOutDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('nights')}</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('guests')}</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">{t('total')}</span>
                    <span className="font-bold text-[#2FB7EC]">{totalPrice.toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                  {user ? t('yourInformation') : t('guestInformation')}
                </h3>
                {user && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 sm:p-3 mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-amber-700">
                      <AlertCircle size={14} className="inline mr-1 -mt-0.5" />
                      {t('ensureInfoAccurate')}
                    </p>
                  </div>
                )}
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                      <User size={14} className="inline mr-1" />
                      {t('fullNameRequired')}
                    </label>
                    <input
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      placeholder={t('enterFullName')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                      <Mail size={14} className="inline mr-1" />
                      {t('emailRequired')}
                    </label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      placeholder={t('enterEmail')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                      <Phone size={14} className="inline mr-1" />
                      {t('phoneRequired')}
                    </label>
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      placeholder={t('enterPhone')}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2FB7EC] focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {specialRequests && (
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{t('specialRequests')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{specialRequests}</p>
                </div>
              )}

              {!user && (
                <p className="text-center text-xs sm:text-sm text-gray-500">
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-[#2FB7EC] hover:underline"
                  >
                    {t('signIn')}
                  </button>
                </p>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="p-4 sm:p-6 border-t border-gray-100 flex-shrink-0 bg-white">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex-1 px-4 py-3 bg-[#2FB7EC] text-white rounded-xl hover:bg-[#26a5d8] transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
                >
                  {booking ? t('processing') : t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccess.show && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 sm:p-8 text-center max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Check size={32} className="text-green-600 sm:hidden" />
              <Check size={40} className="text-green-600 hidden sm:block" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('bookingConfirmed')}</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {t('reservationConfirmed')} {user ? t('viewBookingsAccount') : t('confirmationEmailSent')}
            </p>

            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('reservationId')}</span>
                  <span className="font-medium">#{bookingSuccess.reservationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('hotel')}</span>
                  <span className="font-medium text-right">{hotel?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('room')}</span>
                  <span className="font-medium">{selectedRoom?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('checkIn')}</span>
                  <span className="font-medium">{checkInDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('checkOut')}</span>
                  <span className="font-medium">{checkOutDate?.toLocaleDateString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold">{t('totalPaid')}</span>
                  <span className="font-bold text-[#2FB7EC]">{totalPrice.toLocaleString()} DZD</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {user ? (
                <button
                  onClick={() => router.push('/reservations')}
                  className="flex-1 px-4 py-3 bg-[#2FB7EC] text-white rounded-xl hover:bg-[#26a5d8] transition-colors text-sm sm:text-base font-medium"
                >
                  {t('viewReservations')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setBookingSuccess({ show: false });
                    setSelectedRoom(null);
                    setCheckInDate(null);
                    setCheckOutDate(null);
                    setGuests(1);
                    setSpecialRequests('');
                    setGuestInfo({ name: '', email: '', phone: '' });
                    setIsAvailable(null);
                  }}
                  className="flex-1 px-4 py-3 bg-[#2FB7EC] text-white rounded-xl hover:bg-[#26a5d8] transition-colors text-sm sm:text-base font-medium"
                >
                  {t('done')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date picker portal container */}
      <div id="datepicker-portal" />

      {/* Custom styles for date picker */}
      <style jsx global>{`
        .react-datepicker__portal {
          background-color: rgba(0, 0, 0, 0.5) !important;
        }
        .react-datepicker__portal .react-datepicker {
          border: none !important;
          border-radius: 1rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          font-family: inherit !important;
        }
        .react-datepicker__header {
          background-color: white !important;
          border-bottom: 1px solid #f1f5f9 !important;
          border-radius: 1rem 1rem 0 0 !important;
          padding: 1rem !important;
        }
        .react-datepicker__current-month {
          font-weight: 600 !important;
          font-size: 1rem !important;
          color: #1f2937 !important;
        }
        .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 500 !important;
          width: 2.5rem !important;
          line-height: 2.5rem !important;
        }
        .react-datepicker__day {
          width: 2.5rem !important;
          line-height: 2.5rem !important;
          border-radius: 0.5rem !important;
          color: #1f2937 !important;
        }
        .react-datepicker__day:hover {
          background-color: #e0f2fe !important;
        }
        .react-datepicker__day--selected {
          background-color: #2FB7EC !important;
          color: white !important;
        }
        .react-datepicker__day--selected:hover {
          background-color: #26a5d8 !important;
        }
        .react-datepicker__day--disabled {
          color: #d1d5db !important;
        }
        .react-datepicker__navigation {
          top: 1rem !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #6b7280 !important;
        }
        @media (max-width: 640px) {
          .react-datepicker__portal .react-datepicker {
            width: calc(100vw - 2rem) !important;
            max-width: 320px !important;
          }
          .react-datepicker__day-name,
          .react-datepicker__day {
            width: 2.25rem !important;
            line-height: 2.25rem !important;
            margin: 0.1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
