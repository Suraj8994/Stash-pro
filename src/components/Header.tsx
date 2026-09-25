import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { StashProLogo } from './StashProLogo';
import {
  Bell,
  Database,
  User,
  Shield,
  LogOut,
  ChevronDown,
  Layers,
  LayoutDashboard,
  Smartphone,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'live_tracking' | 'rep_tasks';
  onViewChange: (view: 'live_tracking' | 'rep_tasks') => void;
  onOpenActivityLog: () => void;
  onOpenSupabaseModal: () => void;
  onOpenPasswordReset: (repCode?: string) => void;
  onOpenUserProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenActivityLog,
  onOpenSupabaseModal,
  onOpenPasswordReset,
  onOpenUserProfile,
}) => {
  const { currentUser, profiles, logout, setCurrentUser, notifications, toggleRepAttendance } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleSelectRep = (repCode: string) => {
    const selected = profiles.find((p) => p.rep_code === repCode);
    if (selected) {
      setCurrentUser(selected);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dt_active_rep_code', selected.rep_code);
      }
    }
    setUserDropdownOpen(false);
  };

  const handleToggleMyAttendance = async () => {
    if (!currentUser) return;
    const newAbsentState = !currentUser.is_absent;
    await toggleRepAttendance(currentUser.rep_code, newAbsentState);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#03150d]/95 backdrop-blur-md border-b border-[#0f4024] shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <StashProLogo />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white font-sans">
                  DistriTrack
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold bg-[#d99b43]/20 text-[#fcd38d] border border-[#d99b43]/40">
                  Field Ops
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-400/80 truncate hidden xs:block">
                Area Visit Cadence & Operations
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center bg-[#072417] p-1 rounded-xl border border-[#14532d] shadow-inner">
            <button
              type="button"
              onClick={() => onViewChange('live_tracking')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'live_tracking'
                  ? 'bg-[#d99b43] text-slate-950 shadow-md shadow-amber-950/60 font-bold'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#0d3b24]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manager HQ</span>
              <span className="sm:hidden text-[11px]">HQ</span>
            </button>

            <button
              type="button"
              onClick={() => onViewChange('rep_tasks')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'rep_tasks'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#0d3b24]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rep Tasks</span>
              <span className="sm:hidden text-[11px]">Tasks</span>
            </button>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Supabase Status Pill */}
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              title="Click to check Supabase connection status"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                isConnected
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-[#08281a] border-[#165030] text-emerald-200 hover:border-emerald-500/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConnected ? 'Supabase Live' : 'Database Ready'}</span>
            </button>

            {/* Live Activity Drawer Trigger */}
            <button
              type="button"
              onClick={onOpenActivityLog}
              title="Open Activity & Audit Log"
              className="relative p-2 rounded-xl bg-[#072417] border border-[#14532d] text-emerald-200 hover:text-white hover:border-emerald-500/60 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#d99b43] text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-sm">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Profile Pill & Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#072417] border border-[#14532d] hover:border-emerald-500/60 transition-all text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border relative ${
                      currentUser.role === 'admin'
                        ? 'bg-[#d99b43]/20 text-[#fbd795] border-[#d99b43]/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                    {/* Attendance indicator dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#072417] ${
                        currentUser.is_absent ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                      title={currentUser.is_absent ? 'Absent / On Leave' : 'Present / On Duty'}
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-emerald-100 leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.is_absent && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 border border-rose-500/50 text-rose-300 font-bold">
                          Absent
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono">
                      #{currentUser.rep_code} • {currentUser.role === 'admin' ? 'HQ Admin' : 'Field Rep'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#062015] border border-[#175c34] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-[#0f4024]">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-emerald-400/80">Active User</p>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#03150d] text-[#fcd38d] border border-[#d99b43]/30">
                          {currentUser.role === 'admin' ? 'Admin' : 'Field Rep'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5">{currentUser.name}</p>
                      <p className="text-xs text-emerald-300/80 font-mono">
                        Mobile: {currentUser.phone || 'Not set'}
                      </p>
                      <p className="text-[11px] text-emerald-400/60 font-mono">
                        Rep Code #{currentUser.rep_code} • {currentUser.territory || 'Operations HQ'}
                      </p>
                    </div>

                    {/* Attendance Toggle */}
                    <div className="p-2 border-b border-[#0f4024]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-200">Duty Status:</span>
                        <button
                          type="button"
                          onClick={handleToggleMyAttendance}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                            currentUser.is_absent
                              ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                              : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          {currentUser.is_absent ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Absent (On Leave)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Present (On Duty)</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-400/60 mt-1">
                        {currentUser.is_absent
                          ? 'Your assigned areas are delegated to backup personnel.'
                          : 'You are handling primary scheduled area visits.'}
                      </p>
                    </div>

                    {/* Quick Switch */}
                    <div className="py-2">
                      <p className="text-[10px] uppercase font-bold text-emerald-400/70 px-2 pb-1 tracking-wider">
                        Switch Active Identity
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1">
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectRep(p.rep_code)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              currentUser.rep_code === p.rep_code
                                ? 'bg-emerald-600/30 text-emerald-200 font-semibold border border-emerald-500/40'
                                : 'text-slate-300 hover:bg-[#0b3320]'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  p.is_absent ? 'bg-rose-500' : 'bg-emerald-400'
                                }`}
                              />
                              {p.name} {p.role === 'admin' ? '(Admin)' : ''}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">#{p.rep_code}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Account Settings & Mobile Update */}
                    <div className="pt-2 border-t border-[#0f4024] flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenUserProfile();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#fbd795] hover:bg-[#0b3320] flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#d99b43]" />
                        {currentUser.role === 'admin' ? 'Change Admin Name & Mobile' : 'Update Mobile & Profile'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPasswordReset(currentUser.rep_code);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-emerald-300 hover:bg-[#0b3320] flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Admin Password Reset
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-[#0b3320] flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out (Switch to Rep Login)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onViewChange('rep_tasks')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Rep Login
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
