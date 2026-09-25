import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Radio,
  CheckCircle2,
  Bell,
  Clock,
  Search,
  Building2,
  Shield,
} from 'lucide-react';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, isRealtimeActive } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'reminder'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((notif) => {
    if (filterType !== 'all' && notif.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        notif.area_name.toLowerCase().includes(q) ||
        notif.rep_name.toLowerCase().includes(q) ||
        notif.rep_code.toLowerCase().includes(q) ||
        notif.message.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-full max-w-md bg-[#062015] border-l border-[#14532d] shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
                  <Radio className="w-4 h-4" />
                </div>
                {isRealtimeActive && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-emerald-50 text-base">Activity & Audit Feed</h3>
                <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Supabase Realtime Stream Active
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-[#0d3b24] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-[#14532d] bg-[#03150d]/80 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-500/70" />
              <input
                type="text"
                placeholder="Search audit log, stores, reps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#062015] border border-[#14532d] rounded-xl pl-9 pr-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
              />
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filterType === 'all'
                    ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/60'
                    : 'bg-[#062015] text-emerald-300/70 border-[#14532d] hover:text-emerald-100'
                }`}
              >
                All Events ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                  filterType === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-[#062015] text-emerald-300/70 border-[#14532d] hover:text-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Completed Visits
              </button>
              <button
                type="button"
                onClick={() => setFilterType('reminder')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                  filterType === 'reminder'
                    ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/50'
                    : 'bg-[#062015] text-emerald-300/70 border-[#14532d] hover:text-emerald-100'
                }`}
              >
                <Bell className="w-3 h-3 text-[#d99b43]" />
                Reminders
              </button>
            </div>
          </div>

          {/* Activity Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="py-12 text-center text-emerald-500/70 text-xs">
                No activity records found matching filters.
              </div>
            ) : (
              filteredNotifs.map((item) => {
                const isCompleted = item.type === 'completed';
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-[#031c11] border-emerald-500/30'
                        : 'bg-[#081e13] border-[#d99b43]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-[#d99b43]/20 border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d] shrink-0">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-emerald-100 text-xs block leading-tight">
                            {item.area_name}
                          </span>
                          <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-0.5 font-mono">
                            <Shield className="w-2.5 h-2.5 text-emerald-500" />
                            Rep #{item.rep_code} • {item.rep_name}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400/70 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {getRelativeTime(item.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-emerald-200/90 leading-relaxed bg-[#03150d] p-2.5 rounded-lg border border-[#14532d]">
                      {item.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#0f4024] bg-[#03150d] flex items-center justify-between text-xs text-emerald-300/70">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#d99b43]" />
              Remix DistriTrack Telemetry
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#083822] hover:bg-[#0d4a2d] text-emerald-100 text-xs font-medium transition-colors border border-[#14532d]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
