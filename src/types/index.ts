export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

export interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: number;
  rating: number;
  image: string | null;
  amenities: string[] | null;
  rooms_available: number;
  is_active: boolean;
}

export interface Flight {
  id: number;
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  seats_available: number;
  class: string;
  image: string | null;
  is_active: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  cuisine_type: string;
  price_range: number;
  rating: number;
  image: string | null;
  primary_image_url?: string;
  opening_time: string;
  closing_time: string;
  capacity: number;
  total_tables?: number;
  phone?: string;
  email?: string;
  wilaya?: { id: number; name: string; name_ar: string };
  is_active: boolean;
}

export interface Reservation {
  id: number;
  user_id: number;
  reservable_type: string;
  reservable_id: number;
  check_in: string | null;
  check_out: string | null;
  reservation_date: string | null;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_requests: string | null;
  reservable?: Hotel | Flight | Restaurant;
  payment?: Payment;
}

export interface Payment {
  id: number;
  reservation_id: number;
  user_id: number;
  checkout_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CarImage {
  id: number;
  image_path: string;
  url: string;
  is_primary: boolean;
}

export interface Car {
  id: number;
  car_rental_company_id: number;
  brand: string;
  model: string;
  year: number;
  type: string;
  transmission: 'manual' | 'automatic';
  fuel_type: string;
  seats: number;
  doors: number;
  color: string;
  license_plate: string;
  price_per_day: number;
  deposit_amount: number;
  mileage_limit: number | null;
  extra_km_price: number | null;
  min_rental_days: number | null;
  max_rental_days: number | null;
  features: string[] | null;
  is_available: boolean;
  images: CarImage[];
  company?: CarRentalCompany;
}

export interface CarRentalCompany {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  rating: number;
  wilaya_id: number;
  wilaya?: { id: number; name: string; name_ar: string };
  is_active: boolean;
  verification_status: string;
  cars_count?: number;
  min_price?: number;
  images?: CarImage[];
  cars?: Car[];
}

export interface CarBooking {
  id: number;
  car_id: number;
  car_rental_company_id: number;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_id_number: string | null;
  driver_license_number: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  pickup_location: string;
  return_location: string;
  pickup_mileage: number | null;
  return_mileage: number | null;
  km_driven: number | null;
  extra_km: number | null;
  extra_km_charge: number;
  rental_days: number;
  price_per_day: number;
  subtotal: number;
  deposit_amount: number;
  extra_charges: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'completed' | 'cancelled' | 'no_show';
  payment_status: string;
  notes: string | null;
  car?: Car;
  company?: CarRentalCompany;
}
