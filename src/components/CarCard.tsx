'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MapPin, Users, Fuel, Settings2, ArrowRight, XCircle, Gauge, DollarSign } from 'lucide-react';
import type { Car } from '@/types';

interface CarCardProps {
  car: Car;
}

export default function CarCard({ car }: CarCardProps) {
  const t = useTranslations('cars');
  const isAvailable = car.is_available !== false && car.company?.is_active !== false;

  const primaryImage = car.images?.find(img => img.is_primary) || car.images?.[0];
  const imageUrl = primaryImage?.url || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800';

  return (
    <Link href={`/cars/${car.id}`}>
      <div className={`bg-white rounded-3xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 group hover:-translate-y-1 ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="relative h-52 overflow-hidden">
          <Image
            src={imageUrl}
            alt={`${car.brand} ${car.model}`}
            fill
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${!isAvailable ? 'grayscale-[30%]' : ''}`}
          />

          {/* Not Available badge */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
              <div className="bg-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg font-bold">
                <XCircle size={18} />
                {t('notAvailable')}
              </div>
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-1.5 rounded-xl text-sm font-bold shadow-lg capitalize">
            {car.type}
          </div>

          {/* Year badge */}
          <div className="absolute top-4 right-4 bg-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="text-sm font-black text-gray-800">{car.year}</span>
          </div>

          {/* Price overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{car.price_per_day?.toLocaleString()}</span>
              <span className="text-gray-500 font-bold text-sm">DZD{t('perDay')}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-black text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
            {car.brand} {car.model}
          </h3>

          {car.company && (
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg mr-2">
                <MapPin size={14} className="text-blue-600" />
              </div>
              <span className="truncate font-medium">{car.company.name} • {car.company.city}</span>
            </div>
          )}

          {/* Car specs row */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl">
              <Users size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-gray-600">{car.seats} {t('seats')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl">
              <Settings2 size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-gray-600 capitalize">{car.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl">
              <Fuel size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-gray-600 capitalize">{car.fuel_type}</span>
            </div>
          </div>

          {/* Mileage info */}
          {car.mileage_limit && (
            <div className="flex items-center gap-4 mb-5 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Gauge size={14} className="text-green-500" />
                <span className="font-medium">{car.mileage_limit} {t('mileageLimit')}</span>
              </div>
              {car.extra_km_price && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <DollarSign size={14} className="text-orange-500" />
                  <span className="font-medium">{car.extra_km_price} DZD {t('extraKmPrice')}</span>
                </div>
              )}
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
              {t('notAvailable')}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
