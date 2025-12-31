'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { IoWalletOutline, IoCheckmarkCircle, IoCloseCircle, IoCheckmarkDone, IoBusinessOutline, IoCarSportOutline, IoRestaurantOutline } from 'react-icons/io5';
import { HiOutlineHome } from 'react-icons/hi';

interface Withdrawal {
  id: number;
  business_type?: string;
  business_name?: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_holder_name?: string;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

interface WalletSummary {
  type: string;
  business_name: string;
  pending_balance: number;
  available_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface Totals {
  total_pending: number;
  total_available: number;
  total_earned: number;
  total_withdrawn: number;
}

export default function AdminWalletPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [totals, setTotals] = useState<Totals>({ total_pending: 0, total_available: 0, total_earned: 0, total_withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'wallets'>('withdrawals');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [withdrawalsRes, walletsRes] = await Promise.all([
        api.get('/admin/withdrawals', { headers, params: { status: statusFilter !== 'all' ? statusFilter : undefined } }),
        api.get('/admin/wallets', { headers })
      ]);

      const wdData = withdrawalsRes.data.withdrawals?.data || withdrawalsRes.data.withdrawals || withdrawalsRes.data.data || [];
      setWithdrawals(Array.isArray(wdData) ? wdData : []);

      setWallets(walletsRes.data.wallets || []);
      setTotals(walletsRes.data.totals || { total_pending: 0, total_available: 0, total_earned: 0, total_withdrawn: 0 });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      await api.post(`/admin/withdrawals/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Withdrawal approved');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('admin_token');
      await api.post(`/admin/withdrawals/${id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Withdrawal rejected');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this withdrawal as completed? This will deduct funds from the wallet.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      await api.post(`/admin/withdrawals/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Withdrawal completed');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 ${colors[status] || colors.pending} rounded-lg text-xs font-medium uppercase`}>{status}</span>;
  };

  const getBusinessIcon = (type?: string) => {
    switch (type) {
      case 'hotel': return <HiOutlineHome className="text-blue-600" size={16} />;
      case 'restaurant': return <IoRestaurantOutline className="text-orange-600" size={16} />;
      case 'car_rental': return <IoCarSportOutline className="text-green-600" size={16} />;
      default: return <IoBusinessOutline className="text-gray-500" size={16} />;
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-DZ').format(amount) + ' DZD';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet & Withdrawals</h1>
        <p className="text-gray-500 mt-1">Manage wallet balances and withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Total Pending</p>
          <p className="text-xl font-bold text-yellow-600">{formatCurrency(totals.total_pending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Total Available</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.total_available)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Total Earned</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.total_earned)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-gray-500 text-sm">Total Withdrawn</p>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(totals.total_withdrawn)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'withdrawals' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Withdrawal Requests
        </button>
        <button onClick={() => setActiveTab('wallets')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'wallets' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All Wallets
        </button>
      </div>

      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div></div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No withdrawal requests</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Business</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Amount</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Bank Details</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Status</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Date</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getBusinessIcon(w.business_type)}
                          <div>
                            <p className="text-gray-900">{w.business_name || 'Unknown'}</p>
                            <p className="text-gray-500 text-xs capitalize">{w.business_type?.replace('_', ' ') || 'Unknown'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-900 font-bold">{formatCurrency(w.amount)}</td>
                      <td className="py-4 px-6">
                        <p className="text-gray-700">{w.bank_name}</p>
                        <p className="text-gray-500 text-xs">{w.account_number}</p>
                        {w.account_holder_name && <p className="text-gray-500 text-xs">{w.account_holder_name}</p>}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(w.status)}</td>
                      <td className="py-4 px-6 text-gray-500 text-sm">{formatDate(w.created_at)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {w.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(w.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><IoCheckmarkCircle size={18} /></button>
                              <button onClick={() => handleReject(w.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Reject"><IoCloseCircle size={18} /></button>
                            </>
                          )}
                          {w.status === 'approved' && (
                            <button onClick={() => handleComplete(w.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Mark Completed"><IoCheckmarkDone size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'wallets' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Business Wallets</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div></div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No wallets found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Business</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Pending</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Available</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Total Earned</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Withdrawn</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {wallets.map((w, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getBusinessIcon(w.type)}
                          <div>
                            <p className="text-gray-900">{w.business_name}</p>
                            <p className="text-gray-500 text-xs capitalize">{w.type?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-yellow-600">{formatCurrency(w.pending_balance)}</td>
                      <td className="py-4 px-6 text-right text-green-600">{formatCurrency(w.available_balance)}</td>
                      <td className="py-4 px-6 text-right text-blue-600">{formatCurrency(w.total_earned)}</td>
                      <td className="py-4 px-6 text-right text-purple-600">{formatCurrency(w.total_withdrawn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
