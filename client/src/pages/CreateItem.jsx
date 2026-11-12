import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  Upload,
  X,
  Package,
  IndianRupee,
  ShieldCheck,
  Tag,
  FileText,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
} from 'lucide-react';

const MAX_IMAGES = 5;

const CreateItem = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── Form State ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',       // category _id
    pricePerDay: '',
    depositAmount: '',
    location: '',
    isAvailable: true,
  });

  // Categories fetched from API
  const [categories, setCategories] = useState([]);

  // Selected image files + preview URLs
  const [images, setImages] = useState([]);     // Array of File objects
  const [previews, setPreviews] = useState([]); // Array of object URL strings

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Fetch Categories on Mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) setCategories(res.data.categories);
      } catch (err) {
        console.error('Could not load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Cleanup object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear individual field error on typing
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // When user selects images from file picker
  const handleImageSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const toAdd = newFiles.slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));

    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Reset file input so the same file can be re-selected if removed
    e.target.value = '';
  };

  // Remove an image by index
  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.category) errors.category = 'Please select a category';
    if (!form.pricePerDay || Number(form.pricePerDay) <= 0)
      errors.pricePerDay = 'Enter a valid price per day';
    if (!form.depositAmount || Number(form.depositAmount) < 0)
      errors.depositAmount = 'Enter a valid deposit amount';
    if (images.length === 0) errors.images = 'Upload at least one image';
    return errors;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Run validation
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // Build FormData — required because we're sending files (images)
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('pricePerDay', Number(form.pricePerDay));
      formData.append('depositAmount', Number(form.depositAmount));
      if (form.location.trim()) formData.append('location', form.location.trim());
      formData.append('isAvailable', form.isAvailable);

      // Append each image file under the key 'images' (matches Multer field name)
      images.forEach((file) => formData.append('images', file));

      await api.post('/items', formData, {
        // Tell axios NOT to set Content-Type — the browser will set it
        // automatically with the correct multipart boundary
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);

      // After 2 seconds, redirect to owner dashboard
      setTimeout(() => navigate('/owner/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Item Listed! 🎉</h2>
          <p className="text-gray-500 text-sm">
            Your item is now live on the marketplace. Redirecting to your dashboard...
          </p>
          <div className="animate-spin inline-block rounded-full h-6 w-6 border-t-2 border-b-2 border-brand-600" />
        </div>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">List a New Item</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to list your item on RentNest
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Image Upload Section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <ImagePlus className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">Item Photos</h2>
            <span className="text-xs text-gray-400 ml-auto">{images.length}/{MAX_IMAGES} uploaded</span>
          </div>

          {/* Image Previews Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group aspect-square">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* First image label */}
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-brand-400 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm font-semibold">Click to upload photos</span>
              <span className="text-xs">JPG, PNG, WEBP · Max {MAX_IMAGES} photos</span>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Image validation error */}
          {fieldErrors.images && (
            <p className="text-xs text-red-600 font-medium">{fieldErrors.images}</p>
          )}
        </div>

        {/* ── Basic Details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">Item Details</h2>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              placeholder="e.g. Quechua 3-Person Waterproof Camping Tent"
              className={`w-full p-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                fieldErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              maxLength={2000}
              placeholder="Describe the item — condition, dimensions, what's included, any usage tips..."
              className={`w-full p-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none ${
                fieldErrors.description ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
              }`}
            />
            <div className="flex justify-between mt-1">
              {fieldErrors.description ? (
                <p className="text-xs text-red-600 font-medium">{fieldErrors.description}</p>
              ) : <span />}
              <p className="text-xs text-gray-400">{form.description.length}/2000</p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={`w-full p-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none ${
                fieldErrors.category ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
              }`}
            >
              <option value="">— Select a category —</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.category}</p>
            )}
          </div>

          {/* Location (optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Location <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Koramangala, Bengaluru"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center space-x-2">
            <IndianRupee className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-gray-900">Pricing & Deposit</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Price Per Day */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Price per Day (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  name="pricePerDay"
                  value={form.pricePerDay}
                  onChange={handleChange}
                  min={1}
                  placeholder="250"
                  className={`w-full pl-7 pr-3 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    fieldErrors.pricePerDay ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                />
              </div>
              {fieldErrors.pricePerDay && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.pricePerDay}</p>
              )}
            </div>

            {/* Deposit Amount */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                Security Deposit (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  name="depositAmount"
                  value={form.depositAmount}
                  onChange={handleChange}
                  min={0}
                  placeholder="500"
                  className={`w-full pl-7 pr-3 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    fieldErrors.depositAmount ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  }`}
                />
              </div>
              {fieldErrors.depositAmount && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.depositAmount}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Held in escrow during rental, refunded on return.
              </p>
            </div>
          </div>

          {/* Live Price Preview */}
          {form.pricePerDay > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm space-y-1">
              <p className="font-semibold text-brand-800">💡 Renter will see:</p>
              <p className="text-brand-700">
                ₹{form.pricePerDay}/day · Deposit: ₹{form.depositAmount || 0}
              </p>
              <p className="text-xs text-brand-500">
                Example: 3-day rental = ₹{(Number(form.pricePerDay) * 3).toLocaleString('en-IN')} + ₹{form.depositAmount || 0} deposit
              </p>
            </div>
          )}
        </div>

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-brand-200 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
              <span>Publishing Listing...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Publish Listing</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          Your listing will be visible to renters immediately after publishing.
        </p>
      </form>
    </div>
  );
};

export default CreateItem;

