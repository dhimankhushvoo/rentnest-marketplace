import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="space-y-2">
        <span className="text-6xl font-black text-brand-600">404</span>
        <h1 className="text-2xl font-extrabold text-gray-900">Page Not Found</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          The page or equipment listing you are looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-100 transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Marketplace</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

