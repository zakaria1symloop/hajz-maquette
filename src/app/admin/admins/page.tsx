'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { IoSearchOutline, IoAddOutline, IoTrashOutline, IoCreateOutline } from 'react-icons/io5';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });

  useEffect(() => {
    fetchAdmins();
  }, [search]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await api.get(`/admin/admins?${params.toString()}`);
      setAdmins(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/admins', formData);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      console.error('Failed to create admin:', err);
      alert('Failed to create admin');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.post(`/admin/admins/${id}/toggle-active`);
      fetchAdmins();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      console.error('Failed to delete admin:', err);
      alert('Failed to delete admin');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">Super Admin</span>;
      case 'admin':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">Admin</span>;
      case 'moderator':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">Moderator</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{role}</span>;
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
          <p className="text-gray-500 mt-1">Manage admin accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
        >
          <IoAddOutline size={20} />
          Add Admin
        </button>
      </div>

      <div className="relative">
        <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No admins found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Admin</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Role</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Last Login</th>
                  <th className="text-left py-4 px-6 text-gray-600 font-medium text-sm">Active</th>
                  <th className="text-right py-4 px-6 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{admin.name}</p>
                          <p className="text-gray-500 text-xs">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getRoleBadge(admin.role)}</td>
                    <td className="py-4 px-6 text-gray-500">{formatDate(admin.last_login_at)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(admin.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${admin.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${admin.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <IoCreateOutline size={18} />
                        </button>
                        <button onClick={() => handleDelete(admin.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <IoTrashOutline size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Admin</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
