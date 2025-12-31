'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoCheckmarkCircle, IoCloseCircle, IoEyeOutline, IoClose } from 'react-icons/io5';
import toast from 'react-hot-toast';

interface Professional {
  id: string;
  original_id: number;
  type: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  verification_status: string;
  is_active: boolean;
  created_at: string;
}

interface ProfessionalDetail extends Professional {
  business?: {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    wilaya: string | { name: string } | null;
    description: string | null;
    is_active: boolean;
    verification_status: string;
  };
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalDetail | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfessionals();
  }, [page, search, statusFilter, typeFilter]);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('verification_status', statusFilter);
      if (typeFilter) params.set('business_type', typeFilter);

      const response = await api.get(`/admin/professionals?${params.toString()}`);
      setProfessionals(response.data.data);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error('Failed to fetch professionals:', err);
      toast.error('Failed to fetch professionals');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (pro: Professional) => {
    try {
      const response = await api.get(`/admin/professionals/${pro.type}/${pro.original_id}`);
      setSelectedProfessional(response.data);
      setShowViewModal(true);
    } catch (err: any) {
      console.error('Failed to fetch professional details:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to fetch professional details';
      toast.error(errorMsg);
    }
  };

  const handleVerify = async (pro: Professional) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/professionals/${pro.type}/${pro.original_id}/verify`);
      toast.success('Professional verified successfully');
      fetchProfessionals();
    } catch (err) {
      console.error('Failed to verify professional:', err);
      toast.error('Failed to verify professional');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (pro: Professional) => {
    setSelectedProfessional(pro as ProfessionalDetail);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedProfessional || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/professionals/${selectedProfessional.type}/${selectedProfessional.original_id}/reject`, {
        reason: rejectReason
      });
      toast.success('Professional rejected');
      setShowRejectModal(false);
      setSelectedProfessional(null);
      setRejectReason('');
      fetchProfessionals();
    } catch (err) {
      console.error('Failed to reject professional:', err);
      toast.error('Failed to reject professional');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (pro: Professional) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/professionals/${pro.type}/${pro.original_id}/toggle-active`);
      toast.success(pro.is_active ? 'Professional deactivated' : 'Professional activated');
      fetchProfessionals();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Verified</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'hotel':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">Hotel</span>;
      case 'restaurant':
        return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">Restaurant</span>;
      case 'car_rental':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Car Rental</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{type}</span>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Professionals</h1>
        <p className="text-gray-500 mt-1">Manage business owners and professionals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search professionals..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="hotel">Hotel</option>
          <option value="restaurant">Restaurant</option>
          <option value="car_rental">Car Rental</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No professionals found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Professional</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Business</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Type</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Joined</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {professionals.map((pro) => (
                  <tr key={pro.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-gray-900 font-medium">{pro.name}</p>
                        <p className="text-gray-500 text-xs">{pro.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{pro.business_name}</td>
                    <td className="py-4 px-6">{getTypeBadge(pro.business_type)}</td>
                    <td className="py-4 px-6">{getStatusBadge(pro.verification_status)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(pro)}
                        disabled={actionLoading}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          pro.is_active ? 'bg-green-500' : 'bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          pro.is_active ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-gray-500">{formatDate(pro.created_at)}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {pro.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(pro)}
                              disabled={actionLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Verify"
                            >
                              <IoCheckmarkCircle size={18} />
                            </button>
                            <button
                              onClick={() => openRejectModal(pro)}
                              disabled={actionLoading}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <IoCloseCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleView(pro)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <IoEyeOutline size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} professionals
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.last_page}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Professional Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProfessional(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoClose size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Owner Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Owner Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="text-gray-900 font-medium">{selectedProfessional.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{selectedProfessional.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">{selectedProfessional.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    {getTypeBadge(selectedProfessional.business_type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    {getStatusBadge(selectedProfessional.verification_status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Joined</span>
                    <span className="text-gray-900">{formatDate(selectedProfessional.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              {selectedProfessional.business && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Business Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Business Name</span>
                      <span className="text-gray-900 font-medium">{selectedProfessional.business.name}</span>
                    </div>
                    {selectedProfessional.business.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Address</span>
                        <span className="text-gray-900 text-right max-w-[200px]">{selectedProfessional.business.address}</span>
                      </div>
                    )}
                    {selectedProfessional.business.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">City</span>
                        <span className="text-gray-900">{selectedProfessional.business.city}</span>
                      </div>
                    )}
                    {selectedProfessional.business.wilaya && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Wilaya</span>
                        <span className="text-gray-900">
                          {typeof selectedProfessional.business.wilaya === 'object'
                            ? selectedProfessional.business.wilaya.name
                            : selectedProfessional.business.wilaya}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Business Status</span>
                      {getStatusBadge(selectedProfessional.business.verification_status)}
                    </div>
                    {selectedProfessional.business.description && (
                      <div>
                        <span className="text-gray-500 block mb-1">Description</span>
                        <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">{selectedProfessional.business.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedProfessional(null);
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Reject Professional</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedProfessional(null);
                  setRejectReason('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IoClose size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                You are about to reject <span className="font-medium text-gray-900">{selectedProfessional.name}</span>.
                Please provide a reason for rejection.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedProfessional(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
