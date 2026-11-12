import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';
import {
  Users,
  Package,
  CalendarCheck,
  AlertTriangle,
  IndianRupee,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  UserCheck,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

// Color palette for charts
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const AdminDashboard = () => {
  // Main Data States
  const [analytics, setAnalytics] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], totalUsers: 0, totalPages: 1, currentPage: 1 });
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'disputes'

  // User Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Dispute Filter & Resolution Modal
  const [disputeFilter, setDisputeFilter] = useState('All');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundToRenter, setRefundToRenter] = useState(0);
  const [payoutToOwner, setPayoutToOwner] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // ── Fetch Analytics ──────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    }
  }, []);

  // ── Fetch Users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const params = { page: userPage, limit: 8 };
      if (userSearch.trim()) params.keyword = userSearch.trim();
      if (userRoleFilter) params.role = userRoleFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsersData({
          users: res.data.users,
          totalUsers: res.data.totalUsers,
          totalPages: res.data.totalPages,
          currentPage: res.data.currentPage,
        });
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [userPage, userSearch, userRoleFilter]);

  // ── Fetch Disputes ───────────────────────────────────────────────────────────
  const fetchDisputes = useCallback(async () => {
    try {
      const params = disputeFilter !== 'All' ? { status: disputeFilter } : {};
      const res = await api.get('/disputes', { params });
      if (res.data.success) {
        setDisputes(res.data.disputes);
      }
    } catch (err) {
      console.error('Failed to load disputes:', err);
    }
  }, [disputeFilter]);

  // Initial Load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAnalytics(), fetchUsers(), fetchDisputes()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchAnalytics, fetchUsers, fetchDisputes]);

  // Reload users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reload disputes when filter changes
  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // ── User Management Actions ──────────────────────────────────────────────────
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setActionMessage({ type: 'success', text: `User role updated to ${newRole}` });
      fetchUsers();
      fetchAnalytics();
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update role' });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete account: "${userName}"?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setActionMessage({ type: 'success', text: `User "${userName}" was deleted` });
      fetchUsers();
      fetchAnalytics();
      setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    }
  };

  // ── Dispute Resolution ───────────────────────────────────────────────────────
  const openResolveModal = (dispute) => {
    setSelectedDispute(dispute);
    const depositAmt = dispute.rental?.item?.depositAmount || 0;
    setRefundToRenter(depositAmt);
    setPayoutToOwner(0);
    setResolutionNotes('');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    try {
      await api.put(`/disputes/${selectedDispute._id}/resolve`, {
        resolutionNotes,
        refundToRenter: Number(refundToRenter),
        payoutToOwner: Number(payoutToOwner),
        status: 'Resolved',
      });
      setSelectedDispute(null);
      setActionMessage({ type: 'success', text: 'Dispute arbitrated and resolved successfully!' });
      fetchDisputes();
      fetchAnalytics();
      setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold text-gray-500">Loading Admin Intelligence Hub...</p>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const charts = analytics?.charts || {};

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-gray-900">Admin Operations & Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
              Platform Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time platform metrics, user access controls, and dispute arbitration
          </p>
        </div>
        <button
          onClick={() => {
            fetchAnalytics();
            fetchUsers();
            fetchDisputes();
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Toast Alert */}
      {actionMessage.text && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center space-x-2 transition ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* ── Top KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-gray-900">{summary.totalUsers || 0}</p>
          <p className="text-xs font-medium text-gray-500">Registered Users</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-gray-900">{summary.totalItems || 0}</p>
          <p className="text-xs font-medium text-gray-500">Listed Items</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-gray-900">{summary.totalRentals || 0}</p>
          <p className="text-xs font-medium text-gray-500">Total Bookings</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-gray-900">₹{(summary.grossRentalVolume || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs font-medium text-gray-500">Gross Volume</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-600">₹{(summary.grossLatePenalties || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs font-medium text-gray-500">Late Fees Collected</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-1">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              summary.pendingDisputes > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <p className={`text-2xl font-black ${summary.pendingDisputes > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {summary.pendingDisputes || 0}
          </p>
          <p className="text-xs font-medium text-gray-500">Open Disputes</p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Visuals</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-gray-200 text-gray-600">
            {usersData.totalUsers}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'disputes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disputes Resolution</span>
          {summary.pendingDisputes > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-500 text-white animate-pulse">
              {summary.pendingDisputes}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab 1: Visuals & Analytics ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Rental Volume Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Rental Volume & Revenue Trend</h3>
                  <p className="text-xs text-gray-400">Monthly booking count and gross transaction value</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg">Last 6 Months</span>
              </div>
              <div className="h-64 w-full">
                {charts.monthlyTrends && charts.monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.monthlyTrends}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val, name) => [
                          name === 'revenueVolume' ? `₹${val.toLocaleString('en-IN')}` : val,
                          name === 'revenueVolume' ? 'Gross Revenue' : 'Rentals',
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenueVolume"
                        name="Gross Volume (₹)"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />
                      <Area
                        type="monotone"
                        dataKey="rentalCount"
                        name="Rental Count"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="transparent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No rental activity logged in the past 6 months
                  </div>
                )}
              </div>
            </div>

            {/* Rental Status Breakdown (Donut Chart) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Rental Status Distribution</h3>
                <p className="text-xs text-gray-400">All-time booking status breakdown</p>
              </div>
              <div className="h-64 w-full">
                {charts.rentalStatus && charts.rentalStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.rentalStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {charts.rentalStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    No status data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Chart: Items By Category */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Inventory Distribution by Category</h3>
                <p className="text-xs text-gray-400">Number of active item listings grouped by category</p>
              </div>
            </div>
            <div className="h-64 w-full">
              {charts.itemsByCategory && charts.itemsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.itemsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => [val, 'Listed Items']} />
                    <Bar dataKey="itemCount" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No categories have listed items yet
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed: Recent Transactions */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Recent Marketplace Transactions</h3>
            <div className="divide-y divide-gray-100">
              {analytics?.recentRentals && analytics.recentRentals.length > 0 ? (
                analytics.recentRentals.map((r) => (
                  <div key={r._id} className="py-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-gray-900">{r.item?.title || 'Unknown Item'}</p>
                      <p className="text-xs text-gray-500">
                        Rented by <span className="font-medium text-gray-700">{r.renter?.name}</span> ({r.renter?.email})
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-bold text-gray-900">₹{r.totalAmount}</p>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-4">No recent bookings recorded</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: User Management ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value);
                setUserPage(1);
              }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              <option value="renter">Renter</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/75 rounded-xl">
                <tr>
                  <th className="py-3 px-4 font-bold rounded-l-xl">User Details</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Phone</th>
                  <th className="py-3 px-4 font-bold">Joined</th>
                  <th className="py-3 px-4 font-bold text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersData.users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'owner'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {/* Change Role Dropdown */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 font-semibold focus:outline-none"
                        >
                          <option value="renter">Renter</option>
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                Page {usersData.currentPage} of {usersData.totalPages} ({usersData.totalUsers} users)
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={userPage >= usersData.totalPages}
                  onClick={() => setUserPage((p) => Math.min(usersData.totalPages, p + 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Disputes Resolution ── */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          {/* Dispute Status Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {['All', 'Open', 'Under Review', 'Resolved', 'Dismissed'].map((status) => (
              <button
                key={status}
                onClick={() => setDisputeFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  disputeFilter === status
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Disputes List */}
          {disputes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No disputes found</h3>
              <p className="text-sm text-gray-500">
                {disputeFilter === 'All'
                  ? 'All rental transactions are running smoothly with zero disputes.'
                  : `There are currently no disputes marked as '${disputeFilter}'.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => {
                const item = d.rental?.item;
                const isOpen = d.status === 'Open' || d.status === 'Under Review';

                return (
                  <div
                    key={d._id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isOpen
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {d.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            Raised on {new Date(d.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mt-1">
                          Item: {item?.title || 'Unknown Rental Item'}
                        </h4>
                      </div>

                      {isOpen && (
                        <button
                          onClick={() => openResolveModal(d)}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Arbitrate & Settle</span>
                        </button>
                      )}
                    </div>

                    {/* Parties Involved */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-2xl text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Raised By ({d.raisedBy?.role || 'User'}):</p>
                        <p className="font-bold text-gray-900 mt-0.5">{d.raisedBy?.name}</p>
                        <p className="text-gray-500">{d.raisedBy?.email} · {d.raisedBy?.phone || 'No phone'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Against ({d.against?.role || 'User'}):</p>
                        <p className="font-bold text-gray-900 mt-0.5">{d.against?.name}</p>
                        <p className="text-gray-500">{d.against?.email} · {d.against?.phone || 'No phone'}</p>
                      </div>
                    </div>

                    {/* Claim Reason */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Claim Details:</p>
                      <p className="text-sm text-gray-700 bg-red-50/30 p-3 rounded-xl border border-red-100">
                        {d.reason}
                      </p>
                    </div>

                    {/* Evidence Photo Thumbnails */}
                    {d.evidence && d.evidence.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Uploaded Evidence:</p>
                        <div className="flex flex-wrap gap-2">
                          {d.evidence.map((imgUrl, idx) => (
                            <a
                              key={idx}
                              href={getImageUrl(imgUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200"
                            >
                              <img
                                src={getImageUrl(imgUrl)}
                                alt={`Evidence ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <ExternalLink className="w-4 h-4" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If Already Resolved: Show Decision Summary */}
                    {d.status === 'Resolved' && d.adminDecision && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs space-y-1">
                        <p className="font-bold text-emerald-800">Admin Arbitrated Settlement:</p>
                        <p className="text-emerald-700">{d.adminDecision.resolutionNotes}</p>
                        <div className="flex space-x-4 pt-1 font-semibold text-emerald-800">
                          <span>Refunded to Renter: ₹{d.adminDecision.refundToRenter}</span>
                          <span>Compensated to Owner: ₹{d.adminDecision.payoutToOwner}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Resolve Dispute Modal ── */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Arbitrate Rental Dispute</h3>
                <p className="text-xs text-gray-500">
                  Item: {selectedDispute.rental?.item?.title || 'Rental Item'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Escrow Deposit Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs space-y-1">
              <p className="font-bold text-blue-900">
                Security Deposit in Escrow: ₹{selectedDispute.rental?.item?.depositAmount || 0}
              </p>
              <p className="text-blue-700">
                Allocate how much of the escrow deposit should be refunded to the renter vs paid to the owner for
                damages/inconvenience.
              </p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Refund to Renter (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={refundToRenter}
                    onChange={(e) => setRefundToRenter(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Payout to Owner (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={payoutToOwner}
                    onChange={(e) => setPayoutToOwner(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Arbitration Decision / Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain the reason for this decision (e.g. photos showed minor tent tear, awarded ₹200 to owner and refunded balance)..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {resolving ? 'Arbitrating...' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

