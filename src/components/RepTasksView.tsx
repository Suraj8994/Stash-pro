import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Area } from '../types/database';
import { computeAreaStatus } from '../utils/areaStatus';
import {
  User,
  Lock,
  KeyRound,
  ShieldAlert,
  MapPin,
  Phone,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  Hourglass,
  ArrowRight,
  LogOut,
  Layers,
  Sparkles,
  RefreshCw,
  FileCheck,
  UserCheck,
} from 'lucide-react';

interface RepTasksViewProps {
  onOpenCheckIn: (area: Area) => void;
  onOpenPasswordReset: (repCode?: string) => void;
}

export const RepTasksView: React.FC<RepTasksViewProps> = ({
  onOpenCheckIn,
  onOpenPasswordReset,
}) => {
  const { currentUser, profiles, login, logout, areas } = useApp();

  // Login form state
  const [repCodeInput, setRepCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Authenticated Rep Tab state
  const [activeTab, setActiveTab] = useState<'urgent' | 'all' | 'completed'>('urgent');

  // Quick select helper
  const handleQuickSelect = (code: string) => {
    setRepCodeInput(code);
    const profile = profiles.find((p) => p.rep_code === code);
    if (profile?.role === 'admin') {
      setPasswordInput('admin123');
    } else {
      setPasswordInput('distritrack123');
    }
    setLoginError(null);
    setIsLocked(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repCodeInput.trim()) return;

    setLoggingIn(true);
    setLoginError(null);
    setIsLocked(false);

    try {
      const res = await login(repCodeInput.trim(), passwordInput);
      if (!res.success) {
        setLoginError(res.error || 'Login failed');
        if (res.isLocked) {
          setIsLocked(true);
        }
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Filter outlets relevant to current logged-in rep
  const repAreas = useMemo(() => {
    if (!currentUser) return [];

    // Admins see all outlets; Sales reps see outlets assigned to them or their territory
    if (currentUser.role === 'admin') {
      return areas;
    }

    return areas.filter((a) => {
      const isAssigned =
        a.assigned_rep_codes.includes(currentUser.rep_code) ||
        a.assigned_rep_ids.includes(currentUser.id);
      const isTerritory = currentUser.territory && a.district === currentUser.territory;
      return isAssigned || isTerritory;
    });
  }, [areas, currentUser]);

  // Tab filtering
  const filteredTasks = useMemo(() => {
    return repAreas.filter((area) => {
      const statusInfo = computeAreaStatus(area);

      if (activeTab === 'urgent') {
        // Delayed, Due Tomorrow, or Pending First Visit
        return (
          statusInfo.status === 'delayed' ||
          statusInfo.status === 'due_tomorrow' ||
          !area.next_visit_due_date
        );
      }
      if (activeTab === 'completed') {
        return statusInfo.isCompletedToday;
      }
      return true; // 'all'
    });
  }, [repAreas, activeTab]);

  // Today completed count
  const todayCompletedCount = useMemo(() => {
    return repAreas.filter((a) => computeAreaStatus(a).isCompletedToday).length;
  }, [repAreas]);

  // Urgent pending count
  const urgentCount = useMemo(() => {
    return repAreas.filter((a) => {
      const s = computeAreaStatus(a);
      return s.status === 'delayed' || s.status === 'due_tomorrow';
    }).length;
  }, [repAreas]);

  // --------------------------------------------------------------------------
  // UNAUTHENTICATED STATE: REP CODE LOGIN
  // --------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="bg-[#062015] border border-[#14532d] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#073822] border border-emerald-500/40 flex items-center justify-center text-[#d99b43] mx-auto shadow-md">
              <UserCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">stāsh-pro Field Rep Portal</h2>
            <p className="text-xs text-emerald-300/80">
              Sign in with your assigned Rep Code to access today's retail outlet route and visit check-in.
            </p>
          </div>

          {/* Quick-select chips (Prompt Requirement: 101-104 and admin) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-400/90 uppercase tracking-wider block text-center">
              Quick-Select Rep Identity:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('100')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  repCodeInput === '100'
                    ? 'bg-[#301f06] border-[#d99b43] text-[#fcd38d] shadow-sm'
                    : 'bg-[#03150d] border-[#14532d] text-emerald-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="font-bold font-mono text-[#d99b43]">#100 Admin</div>
                <div className="text-[11px] text-emerald-300/70 truncate">Vikram Malhotra</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('101')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  repCodeInput === '101'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#03150d] border-[#14532d] text-emerald-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="font-bold font-mono text-emerald-400">#101 Rahul</div>
                <div className="text-[11px] text-emerald-300/70 truncate">North Sector FMCG</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('102')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  repCodeInput === '102'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#03150d] border-[#14532d] text-emerald-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="font-bold font-mono text-emerald-400">#102 Priya</div>
                <div className="text-[11px] text-emerald-300/70 truncate">Central Downtown</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('103')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                  repCodeInput === '103'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#03150d] border-[#14532d] text-emerald-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="font-bold font-mono text-emerald-400">#103 Amit</div>
                <div className="text-[11px] text-emerald-300/70 truncate">Industrial South (New)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('104')}
                className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all col-span-2 ${
                  repCodeInput === '104'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#03150d] border-[#14532d] text-emerald-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="font-bold font-mono text-emerald-400">#104 Sara Khan</div>
                <div className="text-[11px] text-emerald-300/70 truncate">Suburban East Mall Hub</div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{loginError}</span>
                  {isLocked && (
                    <button
                      type="button"
                      onClick={() => onOpenPasswordReset(repCodeInput)}
                      className="mt-1 block text-[#fcd38d] underline font-semibold text-[11px]"
                    >
                      Use Admin Master Key to unlock account →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Rep Code input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                Rep Code
              </label>
              <input
                type="text"
                required
                value={repCodeInput}
                onChange={(e) => setRepCodeInput(e.target.value)}
                placeholder="e.g. 101"
                className="w-full bg-[#03150d] border border-[#175c34] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-emerald-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#d99b43]" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onOpenPasswordReset(repCodeInput)}
                  className="text-[11px] text-[#f6cb82] hover:underline transition-colors"
                >
                  Forgot / Reset Key?
                </button>
              </div>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter account password"
                className="w-full bg-[#03150d] border border-[#175c34] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
              <p className="text-[11px] text-emerald-400/60">
                Default password: <code className="text-emerald-300 font-mono">distritrack123</code> (or{' '}
                <code className="text-[#f6cb82] font-mono">admin123</code> for #100).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition-all disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authenticating Rep...
                </>
              ) : (
                <>
                  <span>Sign In to Field Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED STATE: FIELD REP WORKFLOW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-[#062417] via-[#093522] to-[#041a10] border border-[#14532d] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#073822] border border-emerald-500/50 flex items-center justify-center font-black text-lg text-emerald-200 shrink-0 shadow-md">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white">{currentUser.name}</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#301f06] text-[#fcd38d] border border-[#d99b43]/50">
                  Rep #{currentUser.rep_code}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Operations Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-emerald-300/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#d99b43]" />
                  {currentUser.territory || 'Full Operations Region'}
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1 font-mono text-emerald-200/70">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Logout */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Today's Completions Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-[#06291a] border border-emerald-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                Today Done
              </span>
              <span className="text-lg font-extrabold text-white font-mono">
                {todayCompletedCount}
              </span>
            </div>

            {/* Urgent Tasks Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                Urgent Due
              </span>
              <span className="text-lg font-extrabold text-rose-300 font-mono">{urgentCount}</span>
            </div>

            {/* Logout / Switch */}
            <button
              type="button"
              onClick={logout}
              title="Switch user"
              className="p-2.5 rounded-2xl bg-[#072417] hover:bg-[#0b3320] text-emerald-300 hover:text-rose-400 border border-[#14532d] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-[#062015] p-1.5 rounded-2xl border border-[#14532d] shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('urgent')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'urgent'
              ? 'bg-rose-700 text-white shadow-md'
              : 'text-emerald-300/70 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-200" />
          <span>Today / Urgent ({urgentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40'
              : 'text-emerald-300/70 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Assigned Outlets ({repAreas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-emerald-300/70 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed Today ({todayCompletedCount})</span>
        </button>
      </div>

      {/* Outlets Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-[#03150d] rounded-2xl border border-[#14532d] space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-semibold text-slate-200">
              {activeTab === 'completed'
                ? 'No check-ins completed yet today'
                : 'No pending tasks in this category'}
            </h4>
            <p className="text-xs text-emerald-300/60 max-w-sm mx-auto">
              {activeTab === 'urgent'
                ? 'Great job! All scheduled visits for your territory are on track.'
                : 'Check other tabs to view all accounts or recent completions.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((area) => {
            const statusInfo = computeAreaStatus(area);
            const isCompletedToday = statusInfo.isCompletedToday;

            // Find current rep's priority in this area
            const userIndex = currentUser
              ? area.assigned_rep_codes.indexOf(currentUser.rep_code) !== -1
                ? area.assigned_rep_codes.indexOf(currentUser.rep_code)
                : area.assigned_rep_ids.indexOf(currentUser.id)
              : -1;

            return (
              <div
                key={area.id}
                className={`bg-[#062015] border rounded-2xl p-4 sm:p-5 shadow-xl transition-all ${
                  isCompletedToday
                    ? 'border-emerald-500/50 bg-[#062a1b]'
                    : statusInfo.status === 'delayed'
                    ? 'border-rose-500/40 bg-[#160b0e]'
                    : statusInfo.status === 'due_tomorrow'
                    ? 'border-[#d99b43]/50 bg-[#191307]'
                    : 'border-[#14532d]'
                }`}
              >
                {/* Header Row: Area Name, Code, and Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white break-words">
                        {area.name}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-[#03150d] text-emerald-300 border border-[#14532d] shrink-0">
                        {area.code}
                      </span>
                      {userIndex !== -1 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                            userIndex === 0
                              ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/50'
                              : 'bg-[#03150d] text-emerald-300 border-[#14532d]'
                          }`}
                        >
                          {userIndex === 0 ? '★ P1 Lead' : `P${userIndex + 1} Backup`}
                        </span>
                      )}
                    </div>

                    {area.district && area.district !== area.name && (
                      <p className="text-xs text-emerald-300/70 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{area.district}</span>
                      </p>
                    )}

                    {/* Contact Person & Call link (only if present) */}
                    {(area.client_contact || area.client_phone) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-emerald-200/80 flex-wrap">
                        {area.client_contact && (
                          <span>
                            Contact:{' '}
                            <strong className="text-white">
                              {area.client_contact}
                            </strong>
                          </span>
                        )}
                        {area.client_phone && (
                          <a
                            href={`tel:${area.client_phone}`}
                            className="inline-flex items-center gap-1 text-[#f6cb82] hover:text-white font-mono bg-[#073822] px-2 py-0.5 rounded border border-emerald-500/30"
                          >
                            <Phone className="w-3 h-3 text-[#d99b43]" />
                            {area.client_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Badge with Visual Task Icon */}
                  <div
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold font-mono tracking-tight shrink-0 self-start inline-flex items-center gap-1.5 shadow-sm ${statusInfo.badgeBgClass} ${statusInfo.badgeColorClass} ${statusInfo.badgeBorderClass}`}
                  >
                    {statusInfo.status === 'delayed' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    {statusInfo.status === 'due_tomorrow' && <Clock className="w-3.5 h-3.5 shrink-0" />}
                    {statusInfo.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {statusInfo.status === 'in_progress' && (
                      area.next_visit_due_date ? <Hourglass className="w-3.5 h-3.5 shrink-0" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="whitespace-nowrap">{statusInfo.badgeLabel}</span>
                  </div>
                </div>

                {/* Visit Frequency & Schedule Cadence Strip */}
                <div className="mt-3.5 p-3 bg-[#03150d] rounded-xl border border-[#14532d] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#d99b43]" />
                    <span className="text-emerald-400/80">Frequency:</span>
                    <span className="font-semibold text-white font-mono">
                      Every {area.visit_interval_days} {area.visit_interval_days === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400/80">Schedule:</span>
                    <span className={`font-semibold ${statusInfo.badgeColorClass}`}>
                      {statusInfo.dueText}
                    </span>
                  </div>
                  {area.order_potential && (
                    <div className="flex items-center gap-1 font-mono text-[#fcd38d]">
                      <span className="text-[#d99b43] font-bold text-xs font-mono">₹</span>
                      <span>{area.order_potential}</span>
                    </div>
                  )}
                </div>

                {/* Notes preview if present */}
                {area.notes && (
                  <p className="mt-2.5 text-xs text-emerald-200/80 italic bg-[#03150d]/80 p-2.5 rounded-lg border border-[#14532d] break-words">
                    "{area.notes}"
                  </p>
                )}

                {/* Action Button: Check-In */}
                <div className="mt-3.5 pt-3 border-t border-[#0f4024] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                    <Layers className="w-3.5 h-3.5 text-[#d99b43]" />
                    <span>Area Coverage</span>
                  </div>

                  {isCompletedToday ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 px-3 py-1.5 rounded-xl bg-[#073822] border border-emerald-500/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Visit Completed Today</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenCheckIn(area)}
                      className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/80 border border-emerald-400/40 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Record Check-In</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
