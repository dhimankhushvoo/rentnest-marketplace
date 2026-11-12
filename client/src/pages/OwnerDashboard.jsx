import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';
import {
  Package,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Truck,
  RefreshCw,
  Clock,
  AlertCircle,
  Star,
  IndianRupee,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  Ban,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

// Status badge config for rentals
const STATUS_CONFIG = {
  Requested:     { label: 'Requested',    color: 'bg-blue-100 text-blue-800 border-blue-200',       icon: Clock },
  Approved:      { label: 'Approved',     color: 'bg-green-100 text-green-800 border-green-200',     icon: CheckCircle2 },
  'Handed Over': { label: 'Handed Over',  color: 'bg-purple-100 text-purple-800 border-purple-200',  icon: Truck },
  Returned:      { label: 'Returned',     color: 'bg-gray-100 text-gray-700 border-gray-200',        icon: RefreshCw },
  Rejected:      { label: 'Rejected',     color: 'bg-red-100 text-red-800 border-red-200',           icon: XCircle },
  Cancelled:     { label: 'Cancelled',    color: 'bg-gray-100 text-gray-500 border-gray-200',        icon: Ban },
  Overdue:       { label: 'Overdue ⚠️',  color: 'bg-orange-100 text-orange-800 border-orange-200',  icon: AlertCircle },
  Disputed:      { label: 'Disputed',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200',  icon: AlertCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Requested'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      <span>{cfg.label}</span>
    </span>
  );
};

// ─── Process Return Modal ────────────────────────────────────────────────────
// Owner uses this to mark an item as returned and optionally enter damage cost.

const ReturnModal = ({ rental, onClose, onSuccess }) => {
  const [damageAmount, setDamageAmount] = useState(0);
  const [damageReason, setDamageReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put(`/rentals/${rental._id}/return`, {
        damageAmount: Number(damageAmount),
        damageReason,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  const depositAmount = rental.item?.depositAmount || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Process Return</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Item: <span className="font-medium">{rental.item?.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Deposit Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
          <p className="text-blue-800 font-semibold">Security Deposit: ₹{depositAmount}</p>
          <p className="text-blue-600 text-xs">
            If you enter a damage amount, it will be deducted from the deposit and the
            remainder will be marked as refunded to the renter.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Damage Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Damage / Deduction Amount (₹)
            </label>
            <input
              type="number"
              min={0}
              max={depositAmount}
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="0 — enter 0 if no damage"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {damageAmount > 0 && (
              <p className="mt-1.5 text-xs text-orange-600 font-medium">
                Renter will be refunded ₹{Math.max(0, depositAmount - Number(damageAmount))}
              </p>
            )}
          </div>

          {/* Damage Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Reason (optional — required if damage amount &gt; 0)
            </label>
            <textarea
              rows={3}
              value={damageReason}
              onChange={(e) => setDamageReason(e.target.value)}
              placeholder="Describe any damage to the item..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reject Modal ────────────────────────────────────────────────────────────

const RejectModal = ({ rental, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason for rejection.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.put(`/rentals/${rental._id}/reject`, { rejectionReason: reason });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject rental');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Reject Request</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Item: <span className="font-medium">{rental.item?.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Reason for Rejection
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Item is already booked for those dates, Item under maintenance..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
              {loading ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Rental Request Card ─────────────────────────────────────────────────────

const RentalCard = ({ rental, onActionComplete }) => {
  const [loading, setLoading] = useState({ approve: false, handover: false });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const item = rental.item;
  const renter = rental.renter;
  const durationDays = rental.startDate && rental.endDate
    ? Math.max(1, Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24)))
    : 0;

  // Approve the rental request
  const handleApprove = async () => {
    setLoading((p) => ({ ...p, approve: true }));
    try {
      await api.put(`/rentals/${rental._id}/approve`);
      onActionComplete();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve rental');
    } finally {
      setLoading((p) => ({ ...p, approve: false }));
    }
  };

  // Mark item as handed over to renter
  const handleHandover = async () => {
    if (!window.confirm('Confirm that you have physically handed over the item to the renter?')) return;
    setLoading((p) => ({ ...p, handover: true }));
    try {
      await api.put(`/rentals/${rental._id}/handover`);
      onActionComplete();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark handover');
    } finally {
      setLoading((p) => ({ ...p, handover: false }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
        {/* Main Row */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
          {/* Item Thumbnail */}
          <Link to={`/items/${item?._id}`} className="flex-shrink-0">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
              {item?.images?.[0] ? (
                <img
                  src={getImageUrl(item.images[0])}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link to={`/items/${item?._id}`} className="font-bold text-gray-900 hover:text-brand-600 transition text-sm line-clamp-1">
                  {item?.title || 'Item Removed'}
                </Link>
                {/* Renter Info */}
                <p className="text-xs text-gray-500 mt-0.5">
                  Renter: <span className="font-semibold text-gray-700">{renter?.name}</span>
                  {renter?.email && (
                    <span className="ml-1 text-gray-400">· {renter.email}</span>
                  )}
                  {renter?.phone && (
                    <span className="ml-1 text-gray-400">· {renter.phone}</span>
                  )}
                </p>
              </div>
              <StatusBadge status={rental.status} />
            </div>

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                </span>
              </div>
              <span className="text-gray-400">({durationDays} day{durationDays !== 1 ? 's' : ''})</span>
            </div>

            {/* Financial */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-semibold">
              <span className="text-gray-700">
                <span className="text-gray-400 font-normal">Rental: </span>₹{rental.totalAmount}
              </span>
              <span className="text-emerald-700">
                <span className="text-gray-400 font-normal">Deposit: </span>₹{item?.depositAmount || 0}
              </span>
              {rental.penaltyAmount > 0 && (
                <span className="text-orange-700">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-0.5" />
                  Late Penalty: ₹{rental.penaltyAmount}
                </span>
              )}
            </div>

            {/* Renter note — expandable */}
            {rental.renterNote && (
              <div>
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="flex items-center space-x-1 text-xs text-brand-600 hover:text-brand-800 transition"
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{expanded ? 'Hide renter note' : 'View renter note'}</span>
                </button>
                {expanded && (
                  <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    {rental.renterNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-gray-100 px-5 sm:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center gap-2">

          {/* Requested → Approve or Reject */}
          {rental.status === 'Requested' && (
            <>
              <button
                onClick={handleApprove}
                disabled={loading.approve}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading.approve ? 'Approving...' : 'Approve'}</span>
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Approved → Mark Handed Over */}
          {rental.status === 'Approved' && (
            <button
              onClick={handleHandover}
              disabled={loading.handover}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{loading.handover ? 'Marking...' : 'Mark Handed Over'}</span>
            </button>
          )}

          {/* Handed Over or Overdue → Process Return */}
          {(rental.status === 'Handed Over' || rental.status === 'Overdue') && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Process Return</span>
            </button>
          )}

          {/* Booking ID */}
          <div className="ml-auto text-xs text-gray-400">
            ID: <span className="font-mono font-semibold text-gray-600">{rental._id.slice(-8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReturnModal && (
        <ReturnModal
          rental={rental}
          onClose={() => setShowReturnModal(false)}
          onSuccess={onActionComplete}
        />
      )}
      {showRejectModal && (
        <RejectModal
          rental={rental}
          onClose={() => setShowRejectModal(false)}
          onSuccess={onActionComplete}
        />
      )}
    </>
  );
};

// ─── My Items Section ────────────────────────────────────────────────────────

const MyItemsSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/items/my-items');
        if (res.data.success) setItems(res.data.items);
      } catch (err) {
        console.error('Failed to load my items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse space-y-3">
            <div className="w-full h-36 bg-gray-200 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 text-center space-y-3">
        <div className="w-14 h-14 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
          <Package className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-gray-800">No items listed yet</h3>
        <p className="text-sm text-gray-500">Create your first listing to start earning from your gear.</p>
        <Link
          to="/owner/create-item"
          className="inline-flex items-center space-x-2 mt-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>List an Item</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link
          key={item._id}
          to={`/items/${item._id}`}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group"
        >
          {/* Image */}
          <div className="w-full h-36 bg-gray-100 overflow-hidden">
            {item.images?.[0] ? (
              <img
                src={getImageUrl(item.images[0])}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="w-10 h-10" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-2">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-brand-600 transition">
              {item.title}
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-600 font-bold">₹{item.pricePerDay}/day</span>
              <span className="text-gray-500 flex items-center space-x-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.averageRating?.toFixed(1) || 'New'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  item.isAvailable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.isAvailable ? 'Available' : 'Not Available'}
              </span>
              <span>{item.category?.name || '—'}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

const OwnerDashboard = () => {
  const [rentals, setRentals] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'active' | 'history' | 'items'
  const [filterStatus, setFilterStatus] = useState('All');

  // Fetch all rental requests directed at this owner's items
  const fetchRentals = useCallback(async () => {
    setLoadingRentals(true);
    try {
      const res = await api.get('/rentals/owner-requests');
      if (res.data.success) {
        setRentals(res.data.rentals);
      }
    } catch (err) {
      console.error('Failed to fetch owner rentals:', err);
    } finally {
      setLoadingRentals(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // Split rentals into groups
  const pendingRequests = rentals.filter((r) => r.status === 'Requested');
  const activeRentals   = rentals.filter((r) => ['Approved', 'Handed Over', 'Overdue'].includes(r.status));
  const history         = rentals.filter((r) => ['Returned', 'Rejected', 'Cancelled', 'Disputed'].includes(r.status));

  // Filter for history tab
  const historyFilters = ['All', 'Returned', 'Rejected', 'Cancelled', 'Disputed'];
  const filteredHistory =
    filterStatus === 'All' ? history : history.filter((r) => r.status === filterStatus);

  // KPI Stats
  const stats = [
    { label: 'Pending Requests', value: pendingRequests.length, color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Clock },
    { label: 'Active Rentals',   value: activeRentals.length,   color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck },
    { label: 'Completed',        value: history.filter((r) => r.status === 'Returned').length, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
    {
      label: 'Revenue Earned',
      value: `₹${history.filter((r) => r.status === 'Returned').reduce((sum, r) => sum + (r.totalAmount || 0), 0)}`,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      icon: IndianRupee,
    },
  ];

  const tabs = [
    { key: 'requests', label: 'New Requests', count: pendingRequests.length, alert: pendingRequests.length > 0 },
    { key: 'active',   label: 'Active Rentals', count: activeRentals.length },
    { key: 'history',  label: 'History',         count: history.length },
    { key: 'items',    label: 'My Listings',     count: null },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Owner Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your listings and rental requests</p>
        </div>
        <Link
          to="/owner/create-item"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>List New Item</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 space-y-2`}>
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-600 font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab.alert
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* ── New Requests Tab ── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loadingRentals ? (
            <SkeletonCards />
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No pending requests"
              description="New rental requests from renters will appear here."
            />
          ) : (
            pendingRequests.map((r) => (
              <RentalCard key={r._id} rental={r} onActionComplete={fetchRentals} />
            ))
          )}
        </div>
      )}

      {/* ── Active Rentals Tab ── */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {loadingRentals ? (
            <SkeletonCards />
          ) : activeRentals.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No active rentals"
              description="Approved and handed-over rentals will show here."
            />
          ) : (
            activeRentals.map((r) => (
              <RentalCard key={r._id} rental={r} onActionComplete={fetchRentals} />
            ))
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Sub-filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {historyFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f}
                {f !== 'All' && (
                  <span className="ml-1.5 opacity-60">
                    ({history.filter((r) => r.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {loadingRentals ? (
            <SkeletonCards />
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="No history yet"
              description="Completed, rejected, and cancelled rentals appear here."
            />
          ) : (
            filteredHistory.map((r) => (
              <RentalCard key={r._id} rental={r} onActionComplete={fetchRentals} />
            ))
          )}
        </div>
      )}

      {/* ── My Listings Tab ── */}
      {activeTab === 'items' && <MyItemsSection />}
    </div>
  );
};

// ─── Small Shared Components ─────────────────────────────────────────────────

const SkeletonCards = () => (
  <div className="space-y-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
        <div className="flex space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-3">
    <div className="w-16 h-16 mx-auto bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

export default OwnerDashboard;

