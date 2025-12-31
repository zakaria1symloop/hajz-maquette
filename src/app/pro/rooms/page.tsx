'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useProAuth } from '@/context/ProAuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineX, HiOutlinePhotograph, HiOutlineUpload, HiOutlineCalendar, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { IoBedOutline } from 'react-icons/io5';

interface RoomImage {
  id: number;
  image_path: string;
  is_primary: boolean;
  url?: string;
}

interface Room {
  id: number;
  name: string;
  description: string;
  room_type: string;
  type?: string;
  price_per_night: number;
  capacity: number;
  bed_type: string;
  bed_configuration?: string;
  size_sqm: number;
  amenities: string[];
  is_active: boolean;
  status: string;
  images?: RoomImage[];
}

const ROOM_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'twin', label: 'Twin' },
  { value: 'triple', label: 'Triple' },
  { value: 'quad', label: 'Quad' },
  { value: 'suite', label: 'Suite' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'presidential', label: 'Presidential' },
];
const BED_TYPES = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'queen', label: 'Queen' },
  { value: 'king', label: 'King' },
  { value: 'twin', label: 'Twin' },
  { value: 'bunk', label: 'Bunk' },
];
const ROOM_AMENITIES = [
  { id: 'wifi', label: 'Free WiFi' },
  { id: 'tv', label: 'TV' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'mini_bar', label: 'Mini Bar' },
  { id: 'safe', label: 'Safe' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'sea_view', label: 'Sea View' },
  { id: 'city_view', label: 'City View' },
  { id: 'mountain_view', label: 'Mountain View' },
  { id: 'bathtub', label: 'Bathtub' },
  { id: 'shower', label: 'Shower' },
  { id: 'hair_dryer', label: 'Hair Dryer' },
  { id: 'coffee_maker', label: 'Coffee Maker' },
  { id: 'room_service', label: 'Room Service' },
  { id: 'breakfast', label: 'Breakfast Included' },
  { id: 'iron', label: 'Iron & Ironing Board' },
  { id: 'desk', label: 'Work Desk' },
  { id: 'closet', label: 'Closet' },
];

export default function RoomsPage() {
  const router = useRouter();
  const { hotelOwner, hotel, loading } = useProAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, { status: string; price?: number }>>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    room_type: 'double',
    price_per_night: '',
    capacity: '2',
    bed_type: 'double',
    size_sqm: '',
    amenities: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    if (!loading && !hotelOwner) {
      router.push('/pro/login');
    }
    if (!loading && !hotel) {
      router.push('/pro/hotel/create');
    }
    if (hotel) {
      fetchRooms();
    }
  }, [loading, hotelOwner, hotel, router]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('pro_token');
      const response = await api.get('/hotel-owner/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      console.log('Rooms API response:', data);
      if (Array.isArray(data)) {
        console.log('Data is array, rooms:', data);
        setRooms(data);
      } else if (data?.rooms && Array.isArray(data.rooms)) {
        console.log('Using data.rooms:', data.rooms);
        setRooms(data.rooms);
      } else if (data?.data && Array.isArray(data.data)) {
        console.log('Using data.data:', data.data);
        setRooms(data.data);
      } else {
        console.log('No valid rooms array found, setting empty');
        setRooms([]);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      description: '',
      room_type: 'double',
      price_per_night: '',
      capacity: '2',
      bed_type: 'double',
      size_sqm: '',
      amenities: [],
      is_active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || '',
      room_type: room.room_type || room.type || 'double',
      price_per_night: room.price_per_night.toString(),
      capacity: room.capacity.toString(),
      bed_type: room.bed_type || room.bed_configuration || 'double',
      size_sqm: room.size_sqm?.toString() || '',
      amenities: room.amenities || [],
      is_active: room.is_active,
    });
    setShowModal(true);
  };

  const openImageModal = (room: Room) => {
    setSelectedRoom(room);
    setShowImageModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('pro_token');
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.room_type,
        price_per_night: parseFloat(formData.price_per_night),
        capacity: parseInt(formData.capacity),
        bed_configuration: formData.bed_type,
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
        amenities: formData.amenities,
        is_active: formData.is_active,
      };

      if (editingRoom) {
        await api.put(`/hotel-owner/rooms/${editingRoom.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Room updated successfully!');
      } else {
        await api.post('/hotel-owner/rooms', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Room created successfully!');
      }

      setShowModal(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/hotel-owner/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room deleted successfully!');
      fetchRooms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedRoom) return;

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images[]', file);
    });

    try {
      const token = localStorage.getItem('pro_token');
      await api.post(`/hotel-owner/rooms/${selectedRoom.id}/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      toast.success('Images uploaded successfully!');
      fetchRooms();
      // Update selected room with new images
      const response = await api.get(`/hotel-owner/rooms/${selectedRoom.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRoom(response.data.room || response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;

    try {
      const token = localStorage.getItem('pro_token');
      await api.delete(`/hotel-owner/rooms/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Image deleted!');
      fetchRooms();
      if (selectedRoom) {
        setSelectedRoom({
          ...selectedRoom,
          images: selectedRoom.images?.filter(img => img.id !== imageId)
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete image');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getImageUrl = (image: RoomImage) => {
    // Use the URL from backend if available
    if (image.url) {
      console.log('Using backend URL:', image.url);
      return image.url;
    }
    // Fallback: construct URL manually
    if (image.image_path?.startsWith('http')) {
      console.log('Using http image_path:', image.image_path);
      return image.image_path;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://192.168.100.36:8000';
    const url = `${baseUrl}/storage/${image.image_path}`;
    console.log('Using fallback URL:', url);
    return url;
  };

  const getRoomPrimaryImage = (room: Room) => {
    if (!room.images || room.images.length === 0) return null;
    const primary = room.images.find(img => img.is_primary);
    return primary || room.images[0];
  };

  const openAvailabilityModal = async (room: Room) => {
    setSelectedRoom(room);
    setShowAvailabilityModal(true);
    setSelectedDates([]);
    await fetchCalendar(room.id);
  };

  const fetchCalendar = async (roomId: number, month?: Date) => {
    setLoadingCalendar(true);
    try {
      const token = localStorage.getItem('pro_token');
      const targetMonth = month || calendarMonth;
      const startDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 2, 0);

      const response = await api.get(`/hotel-owner/rooms/${roomId}/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }
      });

      const calendar = response.data.calendar || {};
      setCalendarData(calendar);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
      setCalendarData({});
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleMonthChange = async (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCalendarMonth(newMonth);
    if (selectedRoom) {
      await fetchCalendar(selectedRoom.id, newMonth);
    }
  };

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const handleBlockDates = async () => {
    if (!selectedRoom || selectedDates.length === 0) return;

    try {
      const token = localStorage.getItem('pro_token');

      await api.put(`/hotel-owner/rooms/${selectedRoom.id}/availability`, {
        dates: selectedDates,
        action: 'block'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Dates blocked successfully!');
      setSelectedDates([]);
      await fetchCalendar(selectedRoom.id, calendarMonth);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to block dates');
    }
  };

  const handleUnblockDates = async () => {
    if (!selectedRoom || selectedDates.length === 0) return;

    try {
      const token = localStorage.getItem('pro_token');

      await api.put(`/hotel-owner/rooms/${selectedRoom.id}/availability`, {
        dates: selectedDates,
        action: 'unblock'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Dates unblocked successfully!');
      setSelectedDates([]);
      await fetchCalendar(selectedRoom.id, calendarMonth);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unblock dates');
    }
  };

  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date; dateStr: string; inMonth: boolean }[] = [];

    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        inMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        inMonth: true
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
        inMonth: false
      });
    }

    return days;
  };

  const getDayStatus = (dateStr: string) => {
    const dayData = calendarData[dateStr];
    if (!dayData) return 'available';
    return dayData.status || 'available';
  };

  if (loading || loadingRooms) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
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
              <div className="w-8 h-8 bg-[#2FB7EC] rounded-lg flex items-center justify-center">
                <IoBedOutline size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">Rooms</span>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#2FB7EC] text-white rounded-lg hover:bg-[#26a5d8] transition-colors"
          >
            <HiOutlinePlus size={18} />
            Add Room
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoBedOutline size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Yet</h3>
            <p className="text-gray-500 mb-6">Add your first room to start receiving bookings</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition-colors"
            >
              <HiOutlinePlus size={20} />
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const primaryImage = getRoomPrimaryImage(room);
              return (
                <div key={room.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Room Image */}
                  <div
                    className="h-40 bg-gradient-to-br from-[#2FB7EC]/20 to-[#2FB7EC]/5 flex items-center justify-center relative cursor-pointer group"
                    onClick={() => openImageModal(room)}
                  >
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(primaryImage)}
                        alt={room.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image load error for:', getImageUrl(primaryImage));
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <IoBedOutline size={48} className="text-[#2FB7EC]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white flex items-center gap-2">
                        <HiOutlinePhotograph size={24} />
                        <span className="font-medium">
                          {room.images?.length || 0} photos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                        <span className="text-sm text-gray-500 capitalize">{room.room_type || room.type}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {room.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <HiOutlineUsers size={16} />
                        <span>{room.capacity} guests</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoBedOutline size={16} />
                        <span className="capitalize">{room.bed_type || room.bed_configuration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-[#2FB7EC]">{room.price_per_night?.toLocaleString()}</span>
                        <span className="text-gray-400 text-sm ml-1">DZD/night</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openAvailabilityModal(room)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Availability Calendar"
                        >
                          <HiOutlineCalendar size={18} />
                        </button>
                        <button
                          onClick={() => openImageModal(room)}
                          className="p-2 text-gray-400 hover:text-[#2FB7EC] hover:bg-[#2FB7EC]/10 rounded-lg transition-colors"
                          title="Manage Images"
                        >
                          <HiOutlinePhotograph size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-2 text-gray-400 hover:text-[#2FB7EC] hover:bg-[#2FB7EC]/10 rounded-lg transition-colors"
                          title="Edit Room"
                        >
                          <HiOutlinePencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Room"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                  placeholder="e.g., Deluxe Ocean View"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Type</label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bed Type</label>
                  <select
                    value={formData.bed_type}
                    onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                  >
                    {BED_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per Night (DZD) *</label>
                  <input
                    type="number"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    placeholder="10000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity (Guests)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Size (sqm)</label>
                <input
                  type="number"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC]"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2FB7EC] resize-none"
                  placeholder="Describe the room..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_AMENITIES.map(amenity => (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.amenities.includes(amenity.id)
                          ? 'bg-[#2FB7EC] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {amenity.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[#2FB7EC] focus:ring-[#2FB7EC]"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Room is available for booking</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-[#2FB7EC] text-white rounded-xl hover:bg-[#26a5d8] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingRoom ? 'Update Room' : 'Add Room')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {showImageModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Room Images</h2>
                <p className="text-sm text-gray-500">{selectedRoom.name}</p>
              </div>
              <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Upload Section */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="room-images"
                />
                <label
                  htmlFor="room-images"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#2FB7EC] transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2FB7EC]"></div>
                  ) : (
                    <>
                      <HiOutlineUpload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload images</span>
                      <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 5MB</span>
                    </>
                  )}
                </label>
              </div>

              {/* Images Grid */}
              {selectedRoom.images && selectedRoom.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedRoom.images.map((image) => (
                    <div key={image.id} className="relative aspect-video rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(image)}
                        alt="Room"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Modal image load error:', getImageUrl(image));
                        }}
                      />
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#2FB7EC] text-white text-xs font-medium rounded">
                          Primary
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <HiOutlinePhotograph size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No images uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Availability Calendar Modal */}
      {showAvailabilityModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Room Availability</h2>
                <p className="text-sm text-gray-500">{selectedRoom.name}</p>
              </div>
              <button onClick={() => setShowAvailabilityModal(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => handleMonthChange('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => handleMonthChange('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineChevronRight size={20} />
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-gray-600">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#2FB7EC] rounded"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
              </div>

              {/* Calendar Grid */}
              {loadingCalendar ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2FB7EC]"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map(({ date, dateStr, inMonth }) => {
                      const status = getDayStatus(dateStr);
                      const isSelected = selectedDates.includes(dateStr);
                      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                      let bgColor = 'bg-green-50 hover:bg-green-100 border-green-200';
                      if (status === 'blocked') bgColor = 'bg-red-50 hover:bg-red-100 border-red-200';
                      if (status === 'booked') bgColor = 'bg-blue-50 border-blue-200 cursor-not-allowed';
                      if (isSelected) bgColor = 'bg-[#2FB7EC] text-white border-[#2FB7EC]';
                      if (!inMonth) bgColor = 'bg-gray-50 text-gray-300 border-gray-100';
                      if (isPast && inMonth) bgColor = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';

                      return (
                        <button
                          key={dateStr}
                          onClick={() => {
                            if (inMonth && !isPast && status !== 'booked') {
                              toggleDateSelection(dateStr);
                            }
                          }}
                          disabled={!inMonth || isPast || status === 'booked'}
                          className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg border transition-colors ${bgColor}`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              {selectedDates.length > 0 && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleBlockDates}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                  >
                    Block Selected ({selectedDates.length})
                  </button>
                  <button
                    onClick={handleUnblockDates}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    Unblock Selected ({selectedDates.length})
                  </button>
                </div>
              )}

              <p className="mt-4 text-xs text-gray-400 text-center">
                Click on dates to select them, then use the buttons to block or unblock
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
