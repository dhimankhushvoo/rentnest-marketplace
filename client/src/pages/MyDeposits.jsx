import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Package,
} from 'lucide-react';

const DEPOSIT_STATUS_CONFIG = {
  held:      { label: 'Held in Escrow', color: 'bg-blue-100 text-blue-800 border-blue-200',     icon: Clock },
  refunded:  { label: 'Refunded',       color: 'bg-brand-100 text-brand-800 border-brand-200',  icon: CheckCircle2 },
  deducted:  { label: 'Partially Deducted', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle },
};

const MyDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeposits = async () => {
      setLoading(true);
      try {
        const res = await api.get('/deposits/my-deposits');
        if (res.data.success) {
          setDeposits(res.data.deposits);
        }
      } catch (err) {
        console.error('Failed to fetch deposits:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeposits();
  }, []);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Security Deposit Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all security deposits held, refunded, or deducted across your rentals
        </p>
      </div>

      {deposits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">No deposit records found</h3>
          <p className="text-sm text-gray-500">
            Deposits appear here once your rental has been handed over by the owner.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => {
            const cfg = DEPOSIT_STATUS_CONFIG[deposit.status] || DEPOSIT_STATUS_CONFIG['held'];
            const Icon = cfg.icon;
            const rental = deposit.rental;
            const item = rental?.item;

            return (
              <div key={deposit._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Top Row: Item & Status */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                    {item?.images?.[0] ? (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                          {item?.title || 'Rental Item'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Rental period: {formatDate(rental?.startDate)} → {formatDate(rental?.endDate)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[11px] text-gray-500 font-medium mb-1">Deposit Held</p>
                        <p className="text-sm font-bold text-gray-900">₹{deposit.amount}</p>
                      </div>
                      <div className={`rounded-xl p-3 text-center ${deposit.deductedAmount > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                        <p className="text-[11px] text-gray-500 font-medium mb-1">Deducted</p>
                        <p className={`text-sm font-bold ${deposit.deductedAmount > 0 ? 'text-orange-700' : 'text-gray-400'}`}>
                          ₹{deposit.deductedAmount}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 text-center ${deposit.refundAmount > 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        <p className="text-[11px] text-gray-500 font-medium mb-1">Refunded</p>
                        <p className={`text-sm font-bold ${deposit.refundAmount > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                          ₹{deposit.refundAmount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Footer (if deducted) */}
                {deposit.reason && deposit.reason.trim() !== '' && (
                  <div className="border-t border-gray-100 px-5 sm:px-6 py-3 bg-gray-50/50">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Note: </span>
                      {deposit.reason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDeposits;

