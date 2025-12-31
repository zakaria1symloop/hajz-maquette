'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

export type BusinessType = 'hotel' | 'restaurant' | 'car_rental';

interface ProOwner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  business_license?: string;
  status?: string;
  is_active?: boolean;
  created_at: string;
  hotel?: any;
  restaurant?: any;
  company?: any;
}

interface ProAuthContextType {
  owner: ProOwner | null;
  businessType: BusinessType | null;
  loading: boolean;
  login: (email: string, password: string, type: BusinessType) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  // Legacy support
  hotelOwner: ProOwner | null;
  hotel: any;
  refreshHotel: () => Promise<void>;
  // Restaurant support
  restaurantOwner: ProOwner | null;
  restaurant: any;
  refreshRestaurant: () => Promise<void>;
  // Car rental support
  companyOwner: ProOwner | null;
  company: any;
  refreshCompany: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  business_license?: string;
  password: string;
  password_confirmation: string;
  type: BusinessType;
}

const ProAuthContext = createContext<ProAuthContextType | undefined>(undefined);

const getApiPrefix = (type: BusinessType): string => {
  switch (type) {
    case 'hotel': return 'hotel-owner';
    case 'restaurant': return 'restaurant-owner';
    case 'car_rental': return 'company-owner';
  }
};

const getOwnerKey = (type: BusinessType): string => {
  switch (type) {
    case 'hotel': return 'hotel_owner';
    case 'restaurant': return 'restaurant_owner';
    case 'car_rental': return 'company_owner';
  }
};

const getBusinessKey = (type: BusinessType): string => {
  switch (type) {
    case 'hotel': return 'hotel';
    case 'restaurant': return 'restaurant';
    case 'car_rental': return 'company';
  }
};

export function ProAuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<ProOwner | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const proToken = localStorage.getItem('pro_token');
    const savedType = localStorage.getItem('pro_type') as BusinessType;
    if (proToken && savedType) {
      setBusinessType(savedType);
      fetchOwner(savedType);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOwner = async (type: BusinessType) => {
    try {
      const token = localStorage.getItem('pro_token');
      const apiPrefix = getApiPrefix(type);
      const ownerKey = getOwnerKey(type);

      const response = await api.get(`/${apiPrefix}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ownerData = response.data[ownerKey] || response.data;
      setOwner(ownerData);
      setBusinessType(type);
    } catch {
      localStorage.removeItem('pro_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_type');
      setOwner(null);
      setBusinessType(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshBusiness = async () => {
    if (!businessType) return;
    const token = localStorage.getItem('pro_token');
    if (!token) return;

    const apiPrefix = getApiPrefix(businessType);
    const businessKey = getBusinessKey(businessType);

    try {
      const response = await api.get(`/${apiPrefix}/${businessKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const businessData = response.data[businessKey] || response.data;
      setOwner(prev => prev ? { ...prev, [businessKey]: businessData } : null);
    } catch {
      // Business not created yet
    }
  };

  const login = async (email: string, password: string, type: BusinessType) => {
    // Use the unified pro login endpoint
    const response = await api.post('/pro/login', { email, password, type });
    const ownerKey = getOwnerKey(type);
    const ownerData = response.data[ownerKey];

    localStorage.setItem('pro_token', response.data.token);
    localStorage.setItem('pro_user', JSON.stringify(ownerData));
    localStorage.setItem('pro_type', type);

    setOwner(ownerData);
    setBusinessType(type);
  };

  const register = async (data: RegisterData) => {
    const response = await api.post('/pro/register', data);
    const ownerKey = getOwnerKey(data.type);
    const ownerData = response.data[ownerKey];

    localStorage.setItem('pro_token', response.data.token);
    localStorage.setItem('pro_user', JSON.stringify(ownerData));
    localStorage.setItem('pro_type', data.type);

    setOwner(ownerData);
    setBusinessType(data.type);
  };

  const logout = async () => {
    try {
      if (businessType) {
        const token = localStorage.getItem('pro_token');
        const apiPrefix = getApiPrefix(businessType);
        await api.post(`/${apiPrefix}/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      localStorage.removeItem('pro_token');
      localStorage.removeItem('pro_user');
      localStorage.removeItem('pro_type');
      setOwner(null);
      setBusinessType(null);
    }
  };

  // Legacy support - map to old interface
  const hotelOwner = businessType === 'hotel' ? owner : null;
  const hotel = owner?.hotel || null;
  const refreshHotel = refreshBusiness;

  // Restaurant support
  const restaurantOwner = businessType === 'restaurant' ? owner : null;
  const restaurant = owner?.restaurant || null;
  const refreshRestaurant = refreshBusiness;

  // Car rental support
  const companyOwner = businessType === 'car_rental' ? owner : null;
  const company = owner?.company || null;
  const refreshCompany = refreshBusiness;

  return (
    <ProAuthContext.Provider value={{
      owner,
      businessType,
      loading,
      login,
      register,
      logout,
      refreshBusiness,
      // Legacy support
      hotelOwner,
      hotel,
      refreshHotel,
      // Restaurant support
      restaurantOwner,
      restaurant,
      refreshRestaurant,
      // Car rental support
      companyOwner,
      company,
      refreshCompany,
    }}>
      {children}
    </ProAuthContext.Provider>
  );
}

export function useProAuth() {
  const context = useContext(ProAuthContext);
  if (!context) {
    throw new Error('useProAuth must be used within ProAuthProvider');
  }
  return context;
}
