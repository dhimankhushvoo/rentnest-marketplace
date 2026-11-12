import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';
import {
  AlertTriangle,
  Upload,
  X,
  Package,
  Calendar,
  IndianRupee,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ImagePlus,
} from 'lucide-react';

const MAX_EVIDENCE_FILES = 5;

const RaiseDispute = () => {
  const [searchParams] = useSearchParams();
  const rentalId = searchParams.get('rentalId');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [rental, setRental] = useState(null);
  const [loadingRental, setLoadingRental] = useState(true);
  const [reason, setReason] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch Rental Details on Mount ──
  useEffect(() => {
    const fetchRental = async () => {
      if (!rentalId) {
        setError('No rental ID provided. Please navigate from your bookings list.');
        setLoadingRental(false);
        return;
      }

      try {
        const res = await api.get(`/rentals/${rentalId}`);
        if (res.data.success) {
          setRental(res.data.rental);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch rental details');
      } finally {
        setLoadingRental(false);
      }
    };
    fetchRental();
  }, [rentalId]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
  }, [previews]);

  // ── File Handlers ──
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const available = MAX_EVIDENCE_FILES - evidenceFiles.length;
    if (available <= 0) return;

    const toAdd = files.slice(0, available);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));

    setEvidenceFiles((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit Dispute ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide a detailed reason (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('rentalId', rentalId);
      formData.append('reason', reason.trim());
      evidenceFiles.forEach((f) => formData.append('evidence', f));

      await api.post('/disputes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => navigate('/my-rentals'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit dispute claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRental) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-gray-100 shadow-xl space-y-4">
          <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Dispute Submitted</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your claim and evidence have been forwarded to the Platform Administrator for arbitration. The security
            deposit has been locked in escrow until resolution.
          </p>
          <div className="pt-2">
            <p className="text-xs text-brand-600 font-semibold">Redirecting to My Bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  const item = rental?.item;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/my-rentals"
        className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Bookings</span>
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Raise a Rental Dispute</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Report an issue with equipment condition, missing items, or security deposit disagreements.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Rental Overview Card */}
      {rental && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
            {item?.images?.[0] ? (
              <img
                src={getImageUrl(item.images[0])}
                alt={item?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-xs space-y-1">
            <p className="font-bold text-gray-900 text-sm truncate">{item?.title || 'Rental Item'}</p>
            <p className="text-gray-500">
              Booking Ref: <span className="font-mono text-gray-700 font-semibold">{rental._id}</span>
            </p>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Rental Fee: ₹{rental.totalAmount}</span>
              <span className="text-emerald-700 font-semibold">Deposit: ₹{item?.depositAmount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Claim Reason */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Detailed Reason for Dispute <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what went wrong clearly. Example: Item arrived with broken zippers not mentioned in listing, or owner deducted deposit without valid proof..."
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <p className="text-[11px] text-gray-400">Minimum 10 characters required. Be objective and factual.</p>
        </div>

        {/* Evidence Photos Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Supporting Evidence Photos
            </label>
            <span className="text-[11px] text-gray-400">{evidenceFiles.length}/{MAX_EVIDENCE_FILES} photos</span>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload trigger button */}
          {evidenceFiles.length < MAX_EVIDENCE_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-2xl p-5 flex flex-col items-center justify-center space-y-1.5 text-gray-400 hover:text-orange-600 transition cursor-pointer"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-semibold">Upload photos of damage or proof</span>
              <span className="text-[10px]">JPG, PNG, WEBP (Max {MAX_EVIDENCE_FILES} files)</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Notice Box */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl text-xs text-amber-800 space-y-1">
          <p className="font-bold flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Escrow Protection Notice</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-700">
            Once submitted, the rental status transitions to <strong>Disputed</strong>. Neither party can refund or withdraw
            the deposit until an administrator reviews all statements and evidence.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Link
            to="/my-rentals"
            className="flex-1 py-3 text-center border border-gray-200 rounded-2xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-100 transition disabled:opacity-50"
          >
            {submitting ? 'Filing Claim...' : 'Submit Dispute Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RaiseDispute;

