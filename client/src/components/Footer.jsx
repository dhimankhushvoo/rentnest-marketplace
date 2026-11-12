import React from 'react';
import { Package, ShieldCheck, Clock, RefreshCw, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-gray-900">RentNest</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Peer-to-peer neighborhood rental marketplace for cameras, trekking gear, tools, and shared resources.
            </p>
          </div>

          {/* Value Props */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Safety & Trust</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Security Deposit Escrow</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Automatic Overdue Tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-brand-600" />
                <span>Fair Admin Dispute Arbitration</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Marketplace</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>Camping & Trekking</li>
              <li>DSLR & Action Cameras</li>
              <li>Power Tools & Hardware</li>
              <li>Academic Books & Calculators</li>
            </ul>
          </div>

          {/* Project Details for Viva */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Project Info</h4>
            <p className="text-xs text-gray-500">
              Full Stack-II Capstone Project built with the MERN stack (MongoDB, Express, React, Node.js).
            </p>
            <div className="pt-2 text-xs text-gray-400">
              Role-Based Access • Double-Booking Prevention • JWT Authentication
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RentNest Marketplace. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with care for Full Stack-II Viva Defense</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

