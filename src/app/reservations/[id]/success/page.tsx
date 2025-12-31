'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineCheckCircle, HiOutlineCalendar, HiOutlineHome } from 'react-icons/hi';
import api from '@/lib/api';

export default function ReservationSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchReservation();
    }
  }, [params.id]);

  const fetchReservation = async () => {
    try {
      const response = await api.get(`/reservations/${params.id}`);
      setReservation(response.data);
    } catch (err) {
      console.error('Failed to fetch reservation:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2FB7EC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiOutlineCheckCircle size={48} className="text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Your reservation has been successfully confirmed. You will receive a confirmation email shortly.
        </p>

        {reservation && (
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Details</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking ID</span>
                <span className="font-medium text-gray-900">#{reservation.id}</span>
              </div>

              {reservation.reservable && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Property</span>
                  <span className="font-medium text-gray-900">{reservation.reservable.name}</span>
                </div>
              )}

              {reservation.room && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Room</span>
                  <span className="font-medium text-gray-900">{reservation.room.name}</span>
                </div>
              )}

              {reservation.check_in && reservation.check_out && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-medium text-gray-900">{formatDate(reservation.check_in)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-medium text-gray-900">{formatDate(reservation.check_out)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Guests</span>
                <span className="font-medium text-gray-900">{reservation.guests}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total Paid</span>
                <span className="font-bold text-[#2FB7EC]">{reservation.total_price?.toLocaleString()} DZD</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/reservations"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition-colors"
          >
            <HiOutlineCalendar size={20} />
            View Reservations
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <HiOutlineHome size={20} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
