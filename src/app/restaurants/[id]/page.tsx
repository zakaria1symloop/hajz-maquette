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
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Check,
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  cuisine_type: string;
  price_range: number;
  rating: number;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
  images: { id: number; image_path: string; is_primary: boolean }[];
  tables: RestaurantTable[];
  plats: Plat[];
}

interface RestaurantTable {
  id: number;
  name: string;
  capacity: number;
  price_per_hour: number;
  location: string;
  is_available: boolean;
}

interface Plat {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  primary_image_url: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  preparation_time: number | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  tables_available: number;
}

interface SelectedPlat {
  plat: Plat;
  quantity: number;
}

export default function RestaurantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [platsByCategory, setPlatsByCategory] = useState<Record<string, Plat[]>>({});
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reservationDate, setReservationDate] = useState<Date | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [bookingSuccess, setBookingSuccess] = useState<{
    show: boolean;
    reservationId?: number;
    tableName?: string;
    totalPrice?: number;
  }>({ show: false });

  // Food selection
  const [selectedPlats, setSelectedPlats] = useState<SelectedPlat[]>([]);
  const [showFoodModal, setShowFoodModal] = useState(false);

  // Active menu category
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    fetchRestaurant();
  }, [params.id]);

  useEffect(() => {
    if (reservationDate && guests) {
      fetchTimeSlots();
    }
  }, [reservationDate, guests]);

  useEffect(() => {
    if (reservationDate && selectedTimes.length > 0 && guests) {
      fetchAvailableTables();
    } else {
      setAvailableTables([]);
    }
  }, [reservationDate, selectedTimes, guests]);

  useEffect(() => {
    if (user) {
      setGuestInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/restaurants/${params.id}`);
      setRestaurant(response.data.restaurant);
      setPlatsByCategory(response.data.plats_by_category || {});

      // Set first category as active
      const categories = Object.keys(response.data.plats_by_category || {});
      if (categories.length > 0) {
        setActiveCategory(categories[0]);
      }
    } catch (error) {
      toast.error('Failed to load restaurant');
      router.push('/explore?type=restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (!reservationDate) return;

    setLoadingSlots(true);
    try {
      const response = await api.get(`/restaurants/${params.id}/slots`, {
        params: {
          date: reservationDate.toISOString().split('T')[0],
          guests_count: guests,
        },
      });
      setTimeSlots(response.data.slots || []);
    } catch (error) {
      toast.error('Failed to load available times');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchAvailableTables = async () => {
    if (!reservationDate || selectedTimes.length === 0) return;

    setLoadingTables(true);
    setSelectedTable(null);
    try {
      const response = await api.get(`/restaurants/${params.id}/available-tables`, {
        params: {
          date: reservationDate.toISOString().split('T')[0],
          start_time: selectedTimes[0],
          duration_hours: selectedTimes.length,
          guests_count: guests,
        },
      });
      setAvailableTables(response.data.tables || []);
    } catch (error: any) {
      toast.error('Failed to load available tables');
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const addPlat = (plat: Plat) => {
    setSelectedPlats((prev) => {
      const existing = prev.find((p) => p.plat.id === plat.id);
      if (existing) {
        return prev.map((p) =>
          p.plat.id === plat.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { plat, quantity: 1 }];
    });
  };

  const removePlat = (platId: number) => {
    setSelectedPlats((prev) => {
      const existing = prev.find((p) => p.plat.id === platId);
      if (existing && existing.quantity > 1) {
        return prev.map((p) =>
          p.plat.id === platId ? { ...p, quantity: p.quantity - 1 } : p
        );
      }
      return prev.filter((p) => p.plat.id !== platId);
    });
  };

  const getPlatQuantity = (platId: number): number => {
    return selectedPlats.find((p) => p.plat.id === platId)?.quantity || 0;
  };

  const getTotalPrice = (): number => {
    return selectedPlats.reduce((sum, item) => sum + item.plat.price * item.quantity, 0);
  };

  const getTotalItems = (): number => {
    return selectedPlats.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTableTotal = (): number => {
    if (!selectedTable) return 0;
    return (selectedTable.price_per_hour || 0) * (selectedTimes.length || 1);
  };

  const getGrandTotal = (): number => {
    return getTableTotal() + getTotalPrice();
  };

  const toggleTimeSlot = (time: string) => {
    setSelectedTimes((prev) => {
      if (prev.includes(time)) {
        return prev.filter((t) => t !== time);
      }
      return [...prev, time].sort();
    });
    // Table will be reset by useEffect when selectedTimes changes
  };

  const getSelectedDuration = (): number => {
    return selectedTimes.length || 1;
  };

  const getEndTime = (): string => {
    if (selectedTimes.length === 0) return '';
    const lastTime = selectedTimes[selectedTimes.length - 1];
    const [h, m] = lastTime.split(':').map(Number);
    return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleBooking = async () => {
    if (!reservationDate || selectedTimes.length === 0) {
      toast.error('Please select date and at least one time slot');
      return;
    }

    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      toast.error('Please fill in all guest information');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post(`/restaurants/${params.id}/reserve`, {
        reservation_date: reservationDate.toISOString().split('T')[0],
        reservation_time: selectedTimes[0],
        duration_hours: selectedTimes.length,
        guests_count: guests,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
        special_requests: specialRequests,
        table_id: selectedTable?.id,
        plats: selectedPlats.map((item) => ({
          plat_id: item.plat.id,
          quantity: item.quantity,
        })),
      });

      setShowBookingModal(false);
      setBookingSuccess({
        show: true,
        reservationId: response.data.reservation?.id,
        tableName: response.data.reservation?.table?.name,
        totalPrice: response.data.total_price || response.data.reservation?.total_amount,
      });
      toast.success('Reservation confirmed!');
      // Refresh time slots to show updated availability
      fetchTimeSlots();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Booking failed';
      toast.error(errorMsg);
      // Refresh slots in case availability changed
      fetchTimeSlots();
    } finally {
      setBookingLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder-restaurant.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/storage/${path}`;
  };

  const nextImage = () => {
    if (restaurant?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % restaurant.images.length);
    }
  };

  const prevImage = () => {
    if (restaurant?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + restaurant.images.length) % restaurant.images.length);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Restaurant not found</p>
      </div>
    );
  }

  const categories = Object.keys(platsByCategory);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                <p className="text-sm text-gray-500">{restaurant.cuisine_type}</p>
              </div>
            </div>
            {/* Cart Button */}
            {getTotalItems() > 0 && (
              <button
                onClick={() => setShowFoodModal(true)}
                className="relative bg-orange-500 text-white px-4 py-2 rounded-full flex items-center gap-2"
              >
                <ShoppingBag size={20} />
                <span>{getTotalPrice().toLocaleString()} DZD</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {getTotalItems()}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="relative h-72 md:h-96 bg-gray-200">
        {restaurant.images && restaurant.images.length > 0 ? (
          <>
            <img
              src={getImageUrl(restaurant.images[currentImageIndex]?.image_path)}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            {restaurant.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                >
                  <ChevronRight size={24} />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {restaurant.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Utensils size={64} className="text-gray-300" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                  <p className="text-orange-600 font-medium">{restaurant.cuisine_type}</p>
                </div>
                {restaurant.rating && (
                  <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full">
                    <Star size={18} className="text-orange-500 fill-orange-500" />
                    <span className="font-semibold">{restaurant.rating}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-6">{restaurant.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={20} className="text-orange-500 flex-shrink-0" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={20} className="text-orange-500 flex-shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={20} className="text-orange-500 flex-shrink-0" />
                    <span>{restaurant.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={20} className="text-orange-500 flex-shrink-0" />
                  <span>{restaurant.opening_time?.slice(0, 5)} - {restaurant.closing_time?.slice(0, 5)}</span>
                </div>
              </div>
            </div>

            {/* Menu Section */}
            {categories.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Menu</h3>
                  <span className="text-sm text-gray-500">Select items to pre-order</span>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                        activeCategory === category
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Plats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platsByCategory[activeCategory]?.map((plat) => {
                    const quantity = getPlatQuantity(plat.id);
                    return (
                      <div
                        key={plat.id}
                        className={`flex gap-4 p-4 rounded-xl transition-colors ${
                          quantity > 0 ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          {plat.primary_image_url ? (
                            <img
                              src={plat.primary_image_url}
                              alt={plat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils size={24} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900">{plat.name}</h4>
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              {plat.is_halal && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Halal</span>
                              )}
                              {plat.is_vegetarian && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">V</span>
                              )}
                              {plat.is_vegan && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">VG</span>
                              )}
                            </div>
                          </div>
                          {plat.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{plat.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-orange-600">{plat.price?.toLocaleString()} DZD</p>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              {quantity > 0 ? (
                                <>
                                  <button
                                    onClick={() => removePlat(plat.id)}
                                    className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <span className="w-6 text-center font-semibold">{quantity}</span>
                                  <button
                                    onClick={() => addPlat(plat)}
                                    className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => addPlat(plat)}
                                  className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm hover:bg-orange-600 flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reserve a Table</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <DatePicker
                    selected={reservationDate}
                    onChange={(date: Date | null) => {
                      setReservationDate(date);
                      setSelectedTimes([]);
                      setSelectedTable(null);
                    }}
                    minDate={new Date()}
                    dateFormat="MMMM d, yyyy"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholderText="Select date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        setGuests(Math.max(1, guests - 1));
                        setSelectedTable(null);
                      }}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-gray-400" />
                      <span className="font-medium">{guests}</span>
                    </div>
                    <button
                      onClick={() => {
                        setGuests(Math.min(20, guests + 1));
                        setSelectedTable(null);
                      }}
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {reservationDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time <span className="text-xs text-gray-400">(select multiple for longer stay)</span>
                    </label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
                      </div>
                    ) : timeSlots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && toggleTimeSlot(slot.time)}
                              disabled={!slot.available}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors relative ${
                                selectedTimes.includes(slot.time)
                                  ? 'bg-orange-500 text-white'
                                  : slot.available
                                  ? 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                              {selectedTimes.includes(slot.time) && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedTimes.length > 1 && (
                          <p className="text-sm text-orange-600 mt-2">
                            Duration: {selectedTimes.length} hours ({selectedTimes[0]} - {getEndTime()})
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">No tables available for this date</p>
                    )}
                  </div>
                )}

                {/* Table Selection */}
                {selectedTimes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
                    {loadingTables ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
                      </div>
                    ) : availableTables.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availableTables.map((table) => (
                          <button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            className={`w-full p-3 rounded-xl text-left transition-colors ${
                              selectedTable?.id === table.id
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{table.name}</span>
                              <span className={`text-sm font-semibold ${selectedTable?.id === table.id ? 'text-white' : 'text-orange-600'}`}>
                                {table.price_per_hour?.toLocaleString()} DZD/h
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-sm ${selectedTable?.id === table.id ? 'text-orange-100' : 'text-gray-400'}`}>
                                {table.capacity} seats {table.location && `• ${table.location}`}
                              </span>
                              {selectedTimes.length > 0 && (
                                <span className={`text-xs ${selectedTable?.id === table.id ? 'text-orange-100' : 'text-gray-500'}`}>
                                  = {((table.price_per_hour || 0) * selectedTimes.length).toLocaleString()} DZD
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-500 text-sm py-2">No tables available for the selected time slots</p>
                    )}
                  </div>
                )}

                {/* Price Breakdown */}
                {(selectedTable || getTotalItems() > 0) && (
                  <div className="bg-orange-50 rounded-xl p-4 space-y-2">
                    <h4 className="font-medium text-gray-900 mb-2">Price Summary</h4>

                    {selectedTable && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {selectedTable.name} × {selectedTimes.length}h
                        </span>
                        <span className="font-medium">{getTableTotal().toLocaleString()} DZD</span>
                      </div>
                    )}

                    {getTotalItems() > 0 && (
                      <div className="flex justify-between text-sm">
                        <button
                          onClick={() => setShowFoodModal(true)}
                          className="text-gray-600 hover:text-orange-600 flex items-center gap-1"
                        >
                          Food ({getTotalItems()} items)
                          <span className="text-xs text-orange-500">View</span>
                        </button>
                        <span className="font-medium">{getTotalPrice().toLocaleString()} DZD</span>
                      </div>
                    )}

                    <div className="border-t border-orange-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-orange-600">{getGrandTotal().toLocaleString()} DZD</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowBookingModal(true)}
                  disabled={!reservationDate || selectedTimes.length === 0 || !selectedTable}
                  className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {selectedTable
                    ? `Reserve Now - ${getGrandTotal().toLocaleString()} DZD`
                    : 'Select a Table to Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Food Order Modal */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
              <button onClick={() => setShowFoodModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedPlats.map((item) => (
                <div key={item.plat.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {item.plat.primary_image_url ? (
                      <img src={item.plat.primary_image_url} alt={item.plat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.plat.name}</h4>
                    <p className="text-orange-600 font-semibold">{item.plat.price.toLocaleString()} DZD</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removePlat(item.plat.id)}
                      className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => addPlat(item.plat)}
                      className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Total</span>
                <span className="text-xl font-bold text-orange-600">{getTotalPrice().toLocaleString()} DZD</span>
              </div>
              <button
                onClick={() => setShowFoodModal(false)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Confirm Reservation</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Reservation Summary */}
              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{restaurant.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{reservationDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                      {selectedTimes.length === 1
                        ? selectedTimes[0]
                        : `${selectedTimes[0]} - ${getEndTime()} (${selectedTimes.length}h)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{guests} guests</span>
                  </div>
                  {selectedTable && (
                    <div className="flex items-center gap-2">
                      <Utensils size={16} />
                      <span>{selectedTable.name}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-orange-200 space-y-1">
                  {selectedTable && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{selectedTable.name} × {selectedTimes.length}h</span>
                      <span className="font-medium">{getTableTotal().toLocaleString()} DZD</span>
                    </div>
                  )}
                  {getTotalItems() > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Food ({getTotalItems()} items)</span>
                      <span className="font-medium">{getTotalPrice().toLocaleString()} DZD</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-orange-600">{getGrandTotal().toLocaleString()} DZD</span>
                  </div>
                </div>
              </div>

              {/* Guest Info Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+213 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Any special requests or dietary requirements..."
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300"
              >
                {bookingLoading ? 'Confirming...' : 'Confirm Reservation'}
              </button>

              {!user && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-orange-500 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your table has been reserved. A confirmation will be sent to your email.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reservation ID</span>
                  <span className="font-medium">#{bookingSuccess.reservationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Restaurant</span>
                  <span className="font-medium">{restaurant?.name}</span>
                </div>
                {bookingSuccess.tableName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Table</span>
                    <span className="font-medium">{bookingSuccess.tableName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{reservationDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">
                    {selectedTimes.length === 1
                      ? selectedTimes[0]
                      : `${selectedTimes[0]} - ${getEndTime()} (${selectedTimes.length}h)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Guests</span>
                  <span className="font-medium">{guests} people</span>
                </div>
                {bookingSuccess.totalPrice && bookingSuccess.totalPrice > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-500">Pre-order Total</span>
                    <span className="font-bold text-orange-600">{bookingSuccess.totalPrice.toLocaleString()} DZD</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setBookingSuccess({ show: false });
                setReservationDate(null);
                setSelectedTimes([]);
                setSelectedTable(null);
                setGuests(2);
                setSpecialRequests('');
                setSelectedPlats([]);
                if (!user) {
                  setGuestInfo({ name: '', email: '', phone: '' });
                }
              }}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
