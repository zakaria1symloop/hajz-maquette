'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX, HiOutlineEye, HiOutlineClock, HiOutlineUsers, HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi';
import { FaUtensils } from 'react-icons/fa';

interface Table {
  id: number;
  name: string;
  capacity: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Reservation {
  id: number;
  table: Table;
  user?: User;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  guests_count: number;
  reservation_date: string;
  reservation_time: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_amount: number;
  special_requests?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

interface Stats {
  today: { total: number; pending: number; confirmed: number };
  this_month: { total: number; completed: number; cancelled: number; revenue: number };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TableAvailability {
  table: Table;
  slots: TimeSlot[];
  available_count: number;
}

interface SlotsResponse {
  date: string;
  opening_time: string;
  closing_time: string;
  slot_duration: number;
  tables: TableAvailability[];
}

interface Plat {
  id: number;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
  primary_image_url?: string;
}

interface SelectedPlat {
  plat_id: number;
  quantity: number;
}

export default function TableReservationsPage() {
  const router = useRouter();
  const { restaurantOwner, restaurant, loading, businessType } = useProAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSlotsView, setShowSlotsView] = useState(false);
  const [slotsDate, setSlotsDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotsData, setSlotsData] = useState<SlotsResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [reservationToComplete, setReservationToComplete] = useState<Reservation | null>(null);
  const [billAmount, setBillAmount] = useState('');
  const [commissionRate, setCommissionRate] = useState(10);

  // Plats state
  const [plats, setPlats] = useState<Plat[]>([]);
  const [selectedPlats, setSelectedPlats] = useState<SelectedPlat[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(false);

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    guests_count: 2,
    special_requests: '',
  });

  useEffect(() => {
    if (!loading && (!restaurantOwner || businessType !== 'restaurant')) {
      router.push('/pro/login');
    }
    if (!loading && !restaurant) {
      router.push('/pro/restaurant/create');
    }
  }, [loading, restaurantOwner, restaurant, router, businessType]);

  useEffect(() => {
    if (restaurant) {
      fetchData();
    }
  }, [restaurant, filter, dateFilter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('pro_token');
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (dateFilter) params.append('date', dateFilter);

      const [reservationsRes, statsRes, walletRes] = await Promise.all([
        api.get(`/restaurant-owner/reservations?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/restaurant-owner/reservations/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/restaurant-owner/wallet', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { commission_rate: 10 } }))
      ]);

      setReservations(reservationsRes.data.data || []);
      setStats(statsRes.data);
      setCommissionRate(walletRes.data.commission_rate || 10);
    } catch (err) {
      toast.error('Failed to load reservations');
    } finally {
      setLoadingData(false);
    }
  };

  const getCommissionAmount = (amount: number) => {
    return amount * (commissionRate / 100);
  };

  const getNetAmount = (amount: number) => {
    return amount - getCommissionAmount(amount);
  };

  const fetchSlots = async (date: string) => {
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('pro_token');
      const res = await api.get(`/restaurant-owner/reservations/slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlotsData(res.data);
    } catch (err) {
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchPlats = async () => {
    setLoadingPlats(true);
    try {
      const token = localStorage.getItem('pro_token');
      const res = await api.get('/restaurant-owner/plats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlats(res.data.plats || res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load plats');
    } finally {
      setLoadingPlats(false);
    }
  };

  useEffect(() => {
    if (showCreateModal || showSlotsView) {
      fetchSlots(slotsDate);
    }
    if (showCreateModal) {
      fetchPlats();
    }
  }, [showCreateModal, showSlotsView, slotsDate]);

  const handlePlatQuantityChange = (platId: number, quantity: number) => {
    setSelectedPlats(prev => {
      if (quantity <= 0) {
        return prev.filter(p => p.plat_id !== platId);
      }
      const existing = prev.find(p => p.plat_id === platId);
      if (existing) {
        return prev.map(p => p.plat_id === platId ? { ...p, quantity } : p);
      }
      return [...prev, { plat_id: platId, quantity }];
    });
  };

  const getPlatsTotal = () => {
    return selectedPlats.reduce((total, sp) => {
      const plat = plats.find(p => p.id === sp.plat_id);
      return total + (plat ? plat.price * sp.quantity : 0);
    }, 0);
  };

  const handleAction = async (reservation: Reservation, action: 'confirm' | 'cancel' | 'complete' | 'no-show') => {
    // For complete action, show the modal to enter bill amount
    if (action === 'complete') {
      setReservationToComplete(reservation);
      setBillAmount(reservation.total_amount?.toString() || '');
      setShowCompleteModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/restaurant-owner/reservations/${reservation.id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Reservation ${action === 'no-show' ? 'marked as no-show' : action + 'ed'} successfully!`);
      fetchData();
      setSelectedReservation(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} reservation`);
    }
  };

  const handleCompleteWithBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservationToComplete) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/restaurant-owner/reservations/${reservationToComplete.id}/complete`, {
        bill_amount: parseFloat(billAmount) || 0,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Reservation completed and wallet credited!');
      setShowCompleteModal(false);
      setReservationToComplete(null);
      setBillAmount('');
      setSelectedReservation(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete reservation');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || selectedSlots.length === 0) {
      toast.error('Please select a table and at least one time slot');
      return;
    }

    // Sort slots and get the first one as start time
    const sortedSlots = [...selectedSlots].sort();
    const startTime = sortedSlots[0];
    const slotDuration = slotsData?.slot_duration || 60;
    const totalDuration = selectedSlots.length * slotDuration;

    setCreating(true);
    try {
      const token = localStorage.getItem('pro_token');
      await api.post('/restaurant-owner/reservations', {
        table_id: selectedTable,
        reservation_date: slotsDate,
        reservation_time: startTime,
        duration_minutes: totalDuration,
        plats: selectedPlats.length > 0 ? selectedPlats : undefined,
        ...formData,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Reservation created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setCreating(false);
    }
  };

  const handleTableSelect = (tableId: number) => {
    if (selectedTable === tableId) {
      // Deselect table
      setSelectedTable(null);
      setSelectedSlots([]);
    } else {
      // Select new table and clear slots
      setSelectedTable(tableId);
      setSelectedSlots([]);
    }
  };

  const handleSlotToggle = (slot: string, isAvailable: boolean) => {
    if (!isAvailable || !selectedTable) return;

    setSelectedSlots(prev => {
      if (prev.includes(slot)) {
        return prev.filter(s => s !== slot);
      }
      return [...prev, slot];
    });
  };

  const getSelectedDuration = () => {
    const slotDuration = slotsData?.slot_duration || 60;
    const totalMinutes = selectedSlots.length * slotDuration;
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${totalMinutes} min`;
  };

  const resetForm = () => {
    setSelectedTable(null);
    setSelectedSlots([]);
    setSelectedPlats([]);
    setFormData({
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      guests_count: 2,
      special_requests: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no_show': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pro/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <HiOutlineArrowLeft size={20} />
              Dashboard
            </Link>
            <div className="w-px h-6 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <FaUtensils size={14} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Table Reservations</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSlotsView(true)}
              className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <HiOutlineClock size={18} />
              View Slots
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <HiOutlinePlus size={18} />
              Add Reservation
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Today's Reservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.today.total}</p>
              <p className="text-xs text-orange-600 mt-1">{stats.today.pending} pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.this_month.total}</p>
              <p className="text-xs text-green-600 mt-1">{stats.this_month.completed} completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.this_month.cancelled}</p>
              <p className="text-xs text-gray-500 mt-1">this month</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-green-600">{stats.this_month.revenue?.toLocaleString() || 0} DZD</p>
              <p className="text-xs text-gray-500 mt-1">this month</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reservations List */}
        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCalendar size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations found</h3>
            <p className="text-gray-500 mb-4">No reservations match your current filters</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
            >
              <HiOutlinePlus size={18} />
              Add First Reservation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaUtensils size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {reservation.user?.name || reservation.guest_name || 'Guest'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {reservation.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar size={14} />
                          {new Date(reservation.reservation_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineClock size={14} />
                          {formatTime(reservation.reservation_time)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineUsers size={14} />
                          {reservation.guests_count} guests
                        </span>
                        <span className="text-orange-600 font-medium">
                          {reservation.table?.name}
                        </span>
                      </div>
                      {reservation.special_requests && (
                        <p className="text-sm text-gray-500 mt-2 italic">"{reservation.special_requests}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReservation(reservation)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <HiOutlineEye size={18} />
                    </button>
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(reservation, 'confirm')}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <HiOutlineCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleAction(reservation, 'cancel')}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <HiOutlineX size={18} />
                        </button>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleAction(reservation, 'complete')}
                          className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleAction(reservation, 'no-show')}
                          className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          No Show
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Create Reservation</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="p-6 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={slotsDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSlotsDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Step 1: Select Table */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step 1: Select a Table
                </label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : slotsData && slotsData.tables.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slotsData.tables.map((tableData) => (
                      <button
                        key={tableData.table.id}
                        type="button"
                        onClick={() => handleTableSelect(tableData.table.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedTable === tableData.table.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{tableData.table.name}</div>
                        <div className="text-sm text-gray-500">{tableData.table.capacity} seats</div>
                        <div className="text-xs text-green-600 mt-1">{tableData.available_count} slots free</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No tables available. Please add tables first.
                  </div>
                )}
              </div>

              {/* Step 2: Select Time Slots */}
              {selectedTable && slotsData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Select Time Slot(s) - Click multiple for longer reservations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {slotsData.tables.find(t => t.table.id === selectedTable)?.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => handleSlotToggle(slot.time, slot.available)}
                        className={`px-4 py-2 text-sm rounded-lg transition-all ${
                          selectedSlots.includes(slot.time)
                            ? 'bg-orange-500 text-white shadow-md'
                            : slot.available
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                  {selectedSlots.length > 0 && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <span className="font-medium">Duration:</span> {getSelectedDuration()} ({selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''})
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        From {formatTime([...selectedSlots].sort()[0])} to {formatTime([...selectedSlots].sort()[selectedSlots.length - 1])} + 1h
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Pre-order Plats (Optional) */}
              {selectedTable && selectedSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 3: Pre-order Menu Items (Optional)
                  </label>
                  {loadingPlats ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : plats.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                      {plats.filter(p => p.is_available).map((plat) => {
                        const selected = selectedPlats.find(sp => sp.plat_id === plat.id);
                        return (
                          <div key={plat.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{plat.name}</p>
                              <p className="text-xs text-orange-600">{plat.price.toLocaleString()} DZD</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePlatQuantityChange(plat.id, (selected?.quantity || 0) - 1)}
                                className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium text-sm">{selected?.quantity || 0}</span>
                              <button
                                type="button"
                                onClick={() => handlePlatQuantityChange(plat.id, (selected?.quantity || 0) + 1)}
                                className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No menu items available</p>
                  )}
                  {selectedPlats.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-green-800">Pre-order Total:</span>
                      <span className="font-bold text-green-700">{getPlatsTotal().toLocaleString()} DZD</span>
                    </div>
                  )}
                </div>
              )}

              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter guest name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0555 123 456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="guest@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={formData.guests_count}
                    onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                <textarea
                  rows={3}
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Birthday celebration, dietary requirements, etc."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !selectedTable || selectedSlots.length === 0}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : selectedSlots.length > 0 ? `Create Reservation (${getSelectedDuration()})` : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots View Modal */}
      {showSlotsView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Time Slots Overview</h2>
              <button
                onClick={() => setShowSlotsView(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={slotsDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSlotsDate(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Slots Grid */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : slotsData ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">
                      Hours: {formatTime(slotsData.opening_time)} - {formatTime(slotsData.closing_time)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-green-500"></span>
                        Available
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-red-500"></span>
                        Booked
                      </span>
                    </div>
                  </div>

                  {slotsData.tables.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-3 py-2 bg-gray-50 rounded-l-lg font-medium text-gray-700">Table</th>
                            {slotsData.tables[0]?.slots.map((slot) => (
                              <th key={slot.time} className="px-2 py-2 bg-gray-50 font-medium text-gray-700 text-center text-xs">
                                {formatTime(slot.time)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {slotsData.tables.map((tableData) => (
                            <tr key={tableData.table.id} className="border-t border-gray-100">
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-900">{tableData.table.name}</div>
                                <div className="text-xs text-gray-500">{tableData.table.capacity} seats</div>
                              </td>
                              {tableData.slots.map((slot) => (
                                <td key={slot.time} className="px-2 py-3 text-center">
                                  <span
                                    className={`inline-block w-6 h-6 rounded ${
                                      slot.available ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    title={slot.available ? 'Available' : 'Booked'}
                                  ></span>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No tables available. Please add tables first.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Reservation Details</h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                  {selectedReservation.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Guest Name</span>
                <span className="font-medium text-gray-900">
                  {selectedReservation.user?.name || selectedReservation.guest_name || 'Guest'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Contact</span>
                <span className="text-gray-900">
                  {selectedReservation.user?.phone || selectedReservation.guest_phone || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-gray-900">
                  {selectedReservation.user?.email || selectedReservation.guest_email || 'N/A'}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Table</span>
                  <span className="font-medium text-gray-900">{selectedReservation.table?.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-gray-900">
                    {new Date(selectedReservation.reservation_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Time</span>
                  <span className="text-gray-900">{formatTime(selectedReservation.reservation_time)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-gray-900">{selectedReservation.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Guests</span>
                  <span className="text-gray-900">{selectedReservation.guests_count} people</span>
                </div>
              </div>

              {selectedReservation.special_requests && (
                <div className="border-t border-gray-100 pt-4">
                  <span className="text-sm text-gray-500 block mb-1">Special Requests</span>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3 text-sm">
                    {selectedReservation.special_requests}
                  </p>
                </div>
              )}

              {selectedReservation.total_amount > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <span className="font-bold text-lg text-orange-600">
                      {selectedReservation.total_amount.toLocaleString()} DZD
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 pt-4 flex gap-3">
                {selectedReservation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedReservation, 'confirm')}
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAction(selectedReservation, 'cancel')}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {selectedReservation.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleAction(selectedReservation, 'complete')}
                      className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleAction(selectedReservation, 'no-show')}
                      className="flex-1 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      No Show
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete with Bill Modal */}
      {showCompleteModal && reservationToComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Complete Reservation</h2>
              <button
                onClick={() => { setShowCompleteModal(false); setReservationToComplete(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <form onSubmit={handleCompleteWithBill} className="p-6 space-y-4">
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Guest:</span> {reservationToComplete.guest_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Table:</span> {reservationToComplete.table?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(reservationToComplete.reservation_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Bill Amount (DZD)
                </label>
                <input
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold"
                  placeholder="Enter total bill amount"
                  autoFocus
                />
              </div>

              {/* Commission Breakdown */}
              {billAmount && parseFloat(billAmount) > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Bill:</span>
                    <span className="font-medium">{parseFloat(billAmount).toLocaleString()} DZD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee ({commissionRate}%):</span>
                    <span className="text-red-600">-{getCommissionAmount(parseFloat(billAmount)).toLocaleString()} DZD</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-medium text-gray-900">You'll Receive:</span>
                    <span className="font-bold text-green-600">{getNetAmount(parseFloat(billAmount)).toLocaleString()} DZD</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCompleteModal(false); setReservationToComplete(null); }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  Complete & Credit Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
