'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineXCircle, HiOutlineRefresh, HiOutlineHome } from 'react-icons/hi';

export default function ReservationFailurePage() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiOutlineXCircle size={48} className="text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-500 mb-6">
          We couldn't process your payment. This could be due to insufficient funds,
          card issues, or a temporary problem. Please try again.
        </p>

        <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-medium text-red-800 mb-2">What happened?</h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Your payment was not completed</li>
            <li>• Your reservation is not confirmed</li>
            <li>• No charges have been made to your account</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Link
            href="/hotels"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2FB7EC] text-white rounded-xl font-medium hover:bg-[#26a5d8] transition-colors"
          >
            <HiOutlineRefresh size={20} />
            Try Again
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <HiOutlineHome size={20} />
            Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}
