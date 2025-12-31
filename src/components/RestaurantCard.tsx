'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin, Star, Clock, Users, ArrowRight, XCircle, Phone, UtensilsCrossed } from 'lucide-react';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const t = useTranslations('restaurants');
  const isAvailable = restaurant.is_active !== false;

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const getImageUrl = () => {
    if (restaurant.primary_image_url) return restaurant.primary_image_url;
    if (restaurant.image) return restaurant.image;
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
  };

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className={`bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 ${!isAvailable ? 'opacity-75' : ''}`}>
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={getImageUrl()}
            alt={restaurant.name}
            fill
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${!isAvailable ? 'grayscale-[30%]' : ''}`}
          />

          {/* Not Available badge */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg font-semibold">
                <XCircle size={18} />
                Not Available
              </div>
            </div>
          )}

          {/* Cuisine badge */}
          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-md">
            {restaurant.cuisine_type}
          </div>

          {/* Rating badge */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
            <Star className="text-amber-500 fill-amber-500" size={14} />
            <span className="text-sm font-bold text-gray-800">{restaurant.rating || '4.5'}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Name & Price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 flex-1">
              {restaurant.name}
            </h3>
            <div className="text-right flex-shrink-0">
              <span className="text-lg font-bold text-orange-600">{restaurant.price_range?.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">DZD</span>
            </div>
          </div>

          {/* Description */}
          {restaurant.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {restaurant.description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
            <MapPin size={14} className="text-orange-500 flex-shrink-0" />
            <span className="truncate">
              {restaurant.address || restaurant.city}
              {restaurant.wilaya && `, ${restaurant.wilaya.name}`}
            </span>
          </div>

          {/* Info Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
              <Clock size={13} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-600">
                {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
              <Users size={13} className="text-orange-500" />
              <span className="text-xs font-medium text-gray-600">{restaurant.capacity} seats</span>
            </div>
            {restaurant.total_tables && (
              <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                <UtensilsCrossed size={13} className="text-orange-500" />
                <span className="text-xs font-medium text-gray-600">{restaurant.total_tables} tables</span>
              </div>
            )}
          </div>

          {/* Phone */}
          {restaurant.phone && (
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
              <Phone size={14} className="text-orange-500" />
              <span>{restaurant.phone}</span>
            </div>
          )}

          {/* CTA Button */}
          {isAvailable ? (
            <button className="w-full bg-orange-500 group-hover:bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
              {t('bookTable')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button className="w-full bg-gray-300 text-gray-500 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
              <XCircle size={16} />
              Not Accepting Bookings
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
