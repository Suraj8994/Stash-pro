import React, { useState, useEffect } from 'react';
import { Area } from '../../types/database';
import { useApp } from '../../context/AppContext';
import { computeAreaStatus } from '../../utils/areaStatus';
import {
  MapPin,
  CheckCircle2,
  X,
  FileText,
  Building2,
  RefreshCw,
  Phone,
} from 'lucide-react';

interface CheckInModalProps {
  area: Area;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ area, isOpen, onClose }) => {
  const { currentUser, checkIn } = useApp();
  const [notes, setNotes] = useState('');
  const [orderPotential, setOrderPotential] = useState(area.order_potential || '₹12,000 / week');
  const [submitting, setSubmitting] = useState(false);

  const statusInfo = computeAreaStatus(area);

  useEffect(() => {
    if (!isOpen) return;
    setNotes('');
    setOrderPotential(area.order_potential || '₹12,000 / week');
  }, [isOpen, area]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    try {
      const res = await checkIn(area.id, notes, orderPotential);
      if (res.success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#073822] border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white text-base sm:text-lg truncate">{area.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-[#062015] text-[#fcd38d] border border-[#d99b43]/40 shrink-0">
                  {area.code}
                </span>
              </div>
              <p className="text-xs text-emerald-300/70 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{area.address}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-[#0d3b24] transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Outlet Summary Strip */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-[#03150d] p-3 rounded-xl border border-[#14532d]">
            <div>
              <span className="text-emerald-500/80 block">Territory & Category</span>
              <span className="text-emerald-100 font-medium truncate block">{area.district} • {area.category}</span>
            </div>
            <div>
              <span className="text-emerald-500/80 block">Current Status</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${statusInfo.badgeColorClass}`}>
                {statusInfo.badgeLabel}
              </span>
            </div>
          </div>

          {/* Contact Details */}
          {area.client_contact && (
            <div className="p-3 bg-[#03150d] rounded-xl border border-[#14532d] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400/80">Store Contact:</span>
                <span className="text-emerald-100 font-semibold">{area.client_contact}</span>
              </div>
              {area.client_phone && (
                <a
                  href={`tel:${area.client_phone}`}
                  className="inline-flex items-center gap-1 text-[#fcd38d] font-mono hover:underline"
                >
                  <Phone className="w-3 h-3 text-[#d99b43]" />
                  {area.client_phone}
                </a>
              )}
            </div>
          )}

          {/* Notes & Stock Replenishment field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#d99b43]" />
              Visit Notes & Stock Replenishment
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Restocked stāsh-pro rolling papers counter display, audited shelf packs, retailer confirmed payment..."
              rows={3}
              className="w-full bg-[#03150d] border border-[#175c34] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-emerald-700/80 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none transition-all"
            />
          </div>

          {/* Order Potential / Bill Value Input in Indian Rupees */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
              <span className="text-[#d99b43] font-bold text-sm font-mono">₹</span>
              Order Potential / Weekly Bill Value (INR)
            </label>
            <div className="relative">
              <input
                type="text"
                value={orderPotential}
                onChange={(e) => setOrderPotential(e.target.value)}
                placeholder="e.g. ₹15,000 / week"
                className="w-full bg-[#03150d] border border-[#175c34] rounded-xl pl-3.5 pr-4 py-2.5 text-sm text-[#fcd38d] placeholder-emerald-700/80 focus:outline-none focus:border-[#d99b43] focus:ring-1 focus:ring-[#d99b43] font-medium transition-all"
              />
            </div>
            <p className="text-[11px] text-emerald-400/60">
              Estimated weekly purchase volume or current order value recorded in Indian Rupees (₹).
            </p>
          </div>

          {/* Visit Cycle Info */}
          <div className="p-3 bg-[#03150d] rounded-xl border border-[#14532d] flex items-center justify-between text-xs">
            <span className="text-emerald-400/80">Scheduled Cadence Cycle:</span>
            <span className="text-white font-semibold font-mono">Every {area.visit_interval_days} Days</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#0f4024]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#14532d] hover:bg-[#0b3320] text-emerald-200 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Recording Visit...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Visit Check-In
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
