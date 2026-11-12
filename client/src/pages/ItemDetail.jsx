import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import {
  Package,
  Calendar,
  ShieldCheck,
  Star,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch item details, reviews, and booked dates
  useEffect(() => {
    const fetchItemData = async () => {
      setLoading(true);
      try {
        const [itemRes, reviewsRes, datesRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/reviews/item/${id}`),
          api.get(`/rentals/item/${id}/booked-dates`),
        ]);

        if (itemRes.data.success) {
          setItem(itemRes.data.item);
        }
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.reviews);
          setAverageRating(reviewsRes.data.averageRating || 0);
        }
        if (datesRes.data.success) {
          setBookedDates(datesRes.data.bookedRanges || []);
        }
      } catch (err) {
        console.error('Failed to load item:', err);
        setError('Failed to load item details. It may have been removed.');
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [id]);

  // Calculate rental duration & total price
  const calculateDurationAndCost = () => {
    if (!startDate || !endDate || !item) {
      return { days: 0, rentalTotal: 0, totalPayable: 0 };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return { days: 0, rentalTotal: 0, totalPayable: 0 };
    }
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const rentalTotal = days * item.pricePerDay;
    const totalPayable = rentalTotal + item.depositAmount;
    return { days, rentalTotal, totalPayable };
  };

  const { days, rentalTotal, totalPayable } = calculateDurationAndCost();

  // Check if selected range conflicts with existing bookings
  const checkOverlapConflict = () => {
    if (!startDate || !endDate) return false;
    const s = new Date(startDate);
    const e = new Date(endDate);

    for (const b of bookedDates) {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      // Overlap formula: s <= bEnd && e >= bStart
      if (s <= bEnd && e >= bStart) {
        return true;
      }
    }
    return false;
  };

  const hasConflict = checkOverlapConflict();

  // Handle Rental Request Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess(null);

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (hasConflict) {
      setBookingError(
        'Selected dates overlap with an existing reservation. Please select different dates.'
      );
      return;
    }

    setBookingLoading(true);

    try {
      const res = await api.post('/rentals', {
        itemId: item._id,
        startDate,
        endDate,
      });

      if (res.data.success) {
        setBookingSuccess(res.data);
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Failed to submit rental request.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-900">{error || 'Item not found'}</h2>
        <Link
          to="/"
          className="mt-4 inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = user && item.owner && user._id === item.owner._id;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-brand-600">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-400">{item.category?.name || 'Category'}</span>
        <span>/</span>
        <span className="text-gray-900 font-semibold truncate max-w-xs">{item.title}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Photo Gallery & Item Info */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] rounded-3xl bg-gray-100 overflow-hidden border border-gray-100 shadow-sm">
            {item.images && item.images.length > 0 ? (
              <img
                src={getImageUrl(item.images[activeImageIndex])}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-16 h-16 stroke-1" />
              </div>
            )}

            {/* Category Badge */}
            <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {item.category?.name || 'Equipment'}
            </span>

            {/* Availability Badge */}
            <span
              className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${
                item.isAvailable
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {item.isAvailable ? 'Ready for Rent' : 'Currently Unavailable'}
            </span>
          </div>

          {/* Thumbnails Row */}
          {item.images && item.images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-brand-600 ring-2 ring-brand-500/20'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Item Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {item.title}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{averageRating > 0 ? averageRating : 'New'}</span>
                <span className="text-gray-400 font-normal">({reviews.length} reviews)</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1 text-gray-600">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Verified Deposit Escrow</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                About this Equipment
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </div>

          {/* Owner Profile Card */}
          <div className="bg-gradient-to-r from-gray-50 to-emerald-50/40 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
                {item.owner?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Listed by Neighbor</p>
                <h4 className="text-base font-bold text-gray-900">{item.owner?.name}</h4>
                <p className="text-xs text-gray-500">{item.owner?.address || 'Local Campus Resident'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-white text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
                Verified Owner
              </span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Booking Card & Calculator */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80 space-y-6">
            {/* Price Header */}
            <div className="flex items-baseline justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">₹{item.pricePerDay}</span>
                <span className="text-sm text-gray-500 font-medium"> / day</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Security Deposit</p>
                <p className="text-sm font-bold text-emerald-700">₹{item.depositAmount} (Refundable)</p>
              </div>
            </div>

            {/* Reserved Dates Alert Banner */}
            {bookedDates.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-800">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Already Booked Intervals:</span>
                </div>
                <div className="space-y-1 pl-5">
                  {bookedDates.map((b, idx) => (
                    <div key={idx} className="list-disc">
                      {new Date(b.startDate).toLocaleDateString()} to{' '}
                      {new Date(b.endDate).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Conflict Warning */}
              {hasConflict && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>The selected dates overlap with an existing booking. Please pick another range.</span>
                </div>
              )}

              {/* Error Alert */}
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {bookingError}
                </div>
              )}

              {/* Success Alert */}
              {bookingSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-800">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rental Requested Successfully!</span>
                  </div>
                  <p>
                    Your request has been sent to <strong>{item.owner?.name}</strong> for approval.
                  </p>
                  <Link
                    to="/my-rentals"
                    className="inline-flex items-center space-x-1 text-brand-700 font-bold hover:underline pt-1"
                  >
                    <span>View in My Bookings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Price Calculation Breakdown */}
              {days > 0 && !hasConflict && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>
                      ₹{item.pricePerDay} × {days} day{days > 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold text-gray-900">₹{rentalTotal}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Refundable Deposit</span>
                    </span>
                    <span className="font-semibold">₹{item.depositAmount}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Estimated Due</span>
                    <span className="text-brand-700 text-base">₹{totalPayable}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pt-1">
                    * The security deposit is held securely during the rental and refunded upon safe return.
                  </p>
                </div>
              )}

              {/* Action Button */}
              {isOwner ? (
                <div className="p-3 bg-gray-100 rounded-xl text-center text-xs font-semibold text-gray-600">
                  You are the owner of this listing
                </div>
              ) : !isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center space-x-2"
                >
                  <span>Sign In to Request Rental</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={bookingLoading || hasConflict || !startDate || !endDate}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <span>{bookingLoading ? 'Submitting Request...' : 'Request Rental'}</span>
                  {!bookingLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-gray-400">
                Protected by RentNest Fair Rental Guarantee & Late Overdue Tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customer Reviews & Ratings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified feedback from previous campus renters
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-200">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <div>
              <span className="text-xl font-extrabold text-amber-900">
                {averageRating > 0 ? averageRating : '0.0'}
              </span>
              <span className="text-xs text-amber-700 font-medium"> / 5.0</span>
            </div>
            <span className="text-xs text-amber-600 font-medium">
              ({reviews.length} total review{reviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No reviews submitted yet for this item. Be the first to rent and leave a review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {rev.reviewer?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{rev.reviewer?.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ItemDetail;

