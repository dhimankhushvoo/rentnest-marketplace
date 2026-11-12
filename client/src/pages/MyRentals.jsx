import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';
import {
  Package,
  Calendar,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Truck,
  Ban,
} from 'lucide-react';

// Status badge config
const STATUS_CONFIG = {
  Requested:   { label: 'Requested',   color: 'bg-blue-100 text-blue-800 border-blue-200',     icon: Clock },
  Approved:    { label: 'Approved',    color: 'bg-brand-100 text-brand-800 border-brand-200',  icon: CheckCircle2 },
  'Handed Over': { label: 'Handed Over', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
  Returned:    { label: 'Returned',    color: 'bg-gray-100 text-gray-700 border-gray-200',     icon: RefreshCw },
  Rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-800 border-red-200',        icon: XCircle },
  Cancelled:   { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500 border-gray-200',     icon: Ban },
  Overdue:     { label: 'Overdue ⚠️', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
  Disputed:    { label: 'Disputed',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
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

// Write Review Modal
const ReviewModal = ({ rental, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { rentalId: rental._id, rating, comment });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
            <p className="text-xs text-gray-500">
              For: <span className="font-medium">{rental.item?.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Your Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-amber-600">{rating}.0 / 5</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Your Feedback
            </label>
            <textarea
              required
              minLength={2}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience renting this item. Was it in good condition? Was the owner helpful?"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

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
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [reviewModalRental, setReviewModalRental] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const filters = ['All', 'Requested', 'Approved', 'Handed Over', 'Returned', 'Overdue', 'Rejected', 'Cancelled'];

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rentals/my-rentals');
      if (res.data.success) {
        setRentals(res.data.rentals);
      }
    } catch (err) {
      console.error('Failed to fetch rentals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleCancel = async (rentalId) => {
    if (!window.confirm('Are you sure you want to cancel this rental request?')) return;
    setCancellingId(rentalId);
    try {
      await api.put(`/rentals/${rentalId}/cancel`, { cancellationReason: 'Cancelled by renter' });
      fetchRentals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel rental');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRentals =
    activeFilter === 'All'
      ? rentals
      : rentals.filter((r) => r.status === activeFilter);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">My Rental Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Track all your rental requests, approvals, and deposit statuses</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brand-700 transition"
        >
          <Package className="w-4 h-4" />
          <span>Rent More Gear</span>
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition ${
              activeFilter === f
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({rentals.filter((r) => r.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rentals List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-3">
              <div className="flex space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {activeFilter === 'All' ? 'No rental bookings yet' : `No ${activeFilter} bookings`}
          </h3>
          <p className="text-sm text-gray-500">
            {activeFilter === 'All'
              ? 'Start by browsing the marketplace and requesting your first rental!'
              : 'Try selecting a different filter.'}
          </p>
          <Link
            to="/"
            className="mt-2 inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRentals.map((rental) => {
            const item = rental.item;
            const owner = item?.owner;
            const durationDays = rental.startDate && rental.endDate
              ? Math.max(1, Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / (1000 * 60 * 60 * 24)))
              : 0;

            return (
              <div
                key={rental._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
                  {/* Item Thumbnail */}
                  <Link to={`/items/${item?._id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      {item?.images?.[0] ? (
                        <img
                          src={getImageUrl(item.images[0])}
                          alt={item.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Core Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link to={`/items/${item?._id}`} className="font-bold text-gray-900 hover:text-brand-600 transition text-base line-clamp-1">
                          {item?.title || 'Item Removed'}
                        </Link>
                        {owner && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Owner: <span className="font-semibold text-gray-700">{owner.name}</span>
                            {owner.phone && ` · ${owner.phone}`}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={rental.status} />
                    </div>

                    {/* Date Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        <span>
                          {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                        </span>
                      </div>
                      <span className="text-gray-400">({durationDays} day{durationDays !== 1 ? 's' : ''})</span>
                      {rental.returnedOn && (
                        <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Returned {formatDate(rental.returnedOn)}</span>
                        </span>
                      )}
                    </div>

                    {/* Financial Details */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                      <div className="flex items-center space-x-1.5 text-gray-700 font-semibold">
                        <span className="text-gray-400 font-normal">Rental:</span>
                        <span>₹{rental.totalAmount}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-gray-400 font-normal">Deposit:</span>
                        <span>₹{item?.depositAmount || '—'}</span>
                      </div>
                      {rental.penaltyAmount > 0 && (
                        <div className="flex items-center space-x-1 text-orange-700 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Late Penalty: ₹{rental.penaltyAmount}</span>
                        </div>
                      )}
                    </div>

                    {/* Rejection / Cancellation Reasons */}
                    {rental.rejectionReason && (
                      <p className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                        <strong>Reason:</strong> {rental.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="border-t border-gray-100 px-5 sm:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center gap-2">
                  {/* Cancel Button (only for Requested status) */}
                  {rental.status === 'Requested' && (
                    <button
                      onClick={() => handleCancel(rental._id)}
                      disabled={cancellingId === rental._id}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{cancellingId === rental._id ? 'Cancelling...' : 'Cancel Request'}</span>
                    </button>
                  )}

                  {/* Write Review Button (only for Returned status) */}
                  {rental.status === 'Returned' && (
                    <button
                      onClick={() => setReviewModalRental(rental)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Write Review</span>
                    </button>
                  )}

                  {/* Raise Dispute Button (for Returned or Overdue) */}
                  {(rental.status === 'Returned' || rental.status === 'Overdue' || rental.status === 'Handed Over') && (
                    <Link
                      to={`/disputes/raise?rentalId=${rental._id}`}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Raise Dispute</span>
                    </Link>
                  )}

                  {/* View Deposit Button */}
                  {(rental.status === 'Handed Over' || rental.status === 'Returned' || rental.status === 'Overdue' || rental.status === 'Disputed') && (
                    <Link
                      to="/my-deposits"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Deposit</span>
                    </Link>
                  )}

                  <div className="ml-auto text-xs text-gray-400">
                    Booking ID: <span className="font-mono font-semibold text-gray-600">{rental._id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalRental && (
        <ReviewModal
          rental={reviewModalRental}
          onClose={() => setReviewModalRental(null)}
          onSubmitted={() => {
            setReviewModalRental(null);
            fetchRentals();
          }}
        />
      )}
    </div>
  );
};

export default MyRentals;

