import axios from 'axios';
import type { Hotel, Flight, Restaurant, Reservation, PaginatedResponse, User, Car, CarRentalCompany, CarBooking } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://hajz-project.symloop.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Don't overwrite Authorization header if already set
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Get locale from document or localStorage
    const locale = document.documentElement.lang || localStorage.getItem('locale') || 'en';
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post<{ user: User; token: string }>('/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string, password_confirmation: string) => {
  const response = await api.post<{ user: User; token: string }>('/register', {
    name, email, password, password_confirmation
  });
  return response.data;
};

export const logout = async () => {
  await api.post('/logout');
};

export const getUser = async () => {
  const response = await api.get<User>('/user');
  return response.data;
};

// Hotels
export const getHotels = async (params?: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Hotel>>('/hotels', { params });
  return response.data;
};

export const getFeaturedHotels = async () => {
  const response = await api.get<Hotel[]>('/hotels/featured');
  return response.data;
};

export const getHotel = async (id: number) => {
  const response = await api.get<Hotel>(`/hotels/${id}`);
  return response.data;
};

export const searchHotels = async (params: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Hotel>>('/hotels/search', { params });
  return response.data;
};

// Flights
export const getFlights = async (params?: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Flight>>('/flights', { params });
  return response.data;
};

export const getFeaturedFlights = async () => {
  const response = await api.get<Flight[]>('/flights/featured');
  return response.data;
};

export const getFlight = async (id: number) => {
  const response = await api.get<Flight>(`/flights/${id}`);
  return response.data;
};

export const searchFlights = async (params: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Flight>>('/flights/search', { params });
  return response.data;
};

// Restaurants
export const getRestaurants = async (params?: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Restaurant>>('/restaurants', { params });
  return response.data;
};

export const getFeaturedRestaurants = async () => {
  const response = await api.get<Restaurant[]>('/restaurants/featured');
  return response.data;
};

export const getRestaurant = async (id: number) => {
  const response = await api.get<Restaurant>(`/restaurants/${id}`);
  return response.data;
};

export const getCuisineTypes = async () => {
  const response = await api.get<string[]>('/restaurants/cuisine-types');
  return response.data;
};

// Reservations
export const getReservations = async () => {
  const response = await api.get<PaginatedResponse<Reservation>>('/reservations');
  return response.data;
};

export const createReservation = async (data: {
  type: 'hotel' | 'flight' | 'restaurant';
  item_id: number;
  check_in?: string;
  check_out?: string;
  reservation_date?: string;
  guests: number;
  special_requests?: string;
}) => {
  const response = await api.post<{ reservation: Reservation; checkout_url: string }>('/reservations', data);
  return response.data;
};

export const getReservation = async (id: number) => {
  const response = await api.get<Reservation>(`/reservations/${id}`);
  return response.data;
};

export const cancelReservation = async (id: number) => {
  const response = await api.post(`/reservations/${id}/cancel`);
  return response.data;
};

// Car Rentals
export const getCars = async (params?: Record<string, string | number>) => {
  const response = await api.get<PaginatedResponse<Car>>('/cars', { params });
  return response.data;
};

export const getCar = async (id: number) => {
  const response = await api.get<Car>(`/cars/${id}`);
  return response.data;
};

export const checkCarAvailability = async (carId: number, pickupDate: string, returnDate: string) => {
  const response = await api.get(`/cars/${carId}/check-availability`, {
    params: { pickup_date: pickupDate, return_date: returnDate }
  });
  return response.data;
};

export const bookCar = async (carId: number, data: {
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  pickup_location?: string;
  return_location?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id_number?: string;
  driver_license_number: string;
  notes?: string;
}) => {
  const response = await api.post<{ message: string; booking: CarBooking }>(`/cars/${carId}/book`, data);
  return response.data;
};

export const getCarRentalCompanies = async (params?: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<CarRentalCompany>>('/car-rentals', { params });
  return response.data;
};

export const getCarRentalCompany = async (id: number) => {
  const response = await api.get<CarRentalCompany>(`/car-rentals/${id}`);
  return response.data;
};

export const getCompanyCars = async (companyId: number, params?: Record<string, string>) => {
  const response = await api.get<PaginatedResponse<Car>>(`/car-rentals/${companyId}/cars`, { params });
  return response.data;
};

export default api;
