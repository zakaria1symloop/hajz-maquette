'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin, Star, Wifi, Car, Dumbbell, ArrowRight, Sparkles, XCircle } from 'lucide-react';
import type { Hotel } from '@/types';

interface HotelCardProps {
  hotel: Hotel;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={14} />,
  parking: <Car size={14} />,
  gym: <Dumbbell size={14} />,
};

export default function HotelCard({ hotel }: HotelCardProps) {
  const t = useTranslations('hotels');

  const isAvailable = hotel.is_active !== false;

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className={`bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 group hover:-translate-y-1 ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="relative h-52 overflow-hidden">
          <Image
            src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
            alt={hotel.name}
            fill
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${!isAvailable ? 'grayscale-[30%]' : ''}`}
          />

          {/* Not Available badge */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg font-bold">
                <XCircle size={18} />
                Not Available
              </div>
            </div>
          )}

          {/* Rating badge */}
          <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
            <Star className="text-amber-500 fill-amber-500" size={16} />
            <span className="text-sm font-black text-gray-800">{hotel.rating}</span>
          </div>

          {/* Rooms badge */}
          {isAvailable && (
            <div className="absolute top-4 right-4">
              <span className="bg-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg">
                <Sparkles size={14} />
                {hotel.rooms_available} {t('roomsLeft')}
              </span>
            </div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{hotel.price_per_night?.toLocaleString()}</span>
              <span className="text-gray-500 font-bold text-sm">DZD{t('perNight')}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-black text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-3 line-clamp-1">
            {hotel.name}
          </h3>

          <div className="flex items-center text-gray-500 text-sm mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
              <MapPin size={14} className="text-blue-600" />
            </div>
            <span className="truncate font-medium">{hotel.city}, {hotel.country}</span>
          </div>

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex items-center gap-2 mb-5">
              {hotel.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded-xl font-bold"
                >
                  {amenityIcons[amenity] || null}
                  <span className="capitalize">{amenity}</span>
                </span>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {isAvailable ? (
            <button className="w-full bg-blue-500 group-hover:bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30">
              {t('bookNow')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button className="w-full bg-gray-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
              <XCircle size={18} />
              Not Accepting Bookings
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
