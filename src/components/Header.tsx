import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { StashProLogo } from './StashProLogo';
import {
  Building2,
  Bell,
  Database,
  User,
  ChevronDown,
  LogOut,
  Shield,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'live_tracking' | 'rep_tasks';
  onViewChange: (view: 'live_tracking' | 'rep_tasks') => void;
  onOpenActivityLog: () => void;
  onOpenSupabaseModal: () => void;
  onOpenPasswordReset: (repCode?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenActivityLog,
  onOpenSupabaseModal,
  onOpenPasswordReset,
}) => {
  const { currentUser, profiles, logout, setCurrentUser, notifications } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isConnected = isSupabaseConfigured();

  const handleSelectRep = (repCode: string) => {
    const target = profiles.find((p) => p.rep_code === repCode);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('dt_active_rep_code', target.rep_code);
    }
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#03150d]/95 border-b border-[#0f4024]/80 backdrop-blur-md shadow-lg shadow-black/40 w-full max-w-full">
      <div className="max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Stash-pro Product Inspired Logo */}
          <div className="shrink-0">
            <StashProLogo showTagline={false} size="sm" />
          </div>

          {/* Navigation View Switcher (Manager HQ vs Rep Tasks) */}
          <div className="flex items-center bg-[#072417] p-1 rounded-xl border border-[#14532d]/80 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => onViewChange('live_tracking')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'live_tracking'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/80 border border-emerald-400/40'
                  : 'text-emerald-300/80 hover:text-white hover:bg-[#0d3b24]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Supabase Status Pill */}
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              title="Click to check Supabase Postgres connection status"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                isConnected
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-[#08281a] border-[#165030] text-emerald-200 hover:border-emerald-500/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConnected ? 'Supabase Live' : 'Supabase Ready'}</span>
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isConnected ? 'bg-emerald-400' : 'bg-[#d99b43]'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isConnected ? 'bg-emerald-500' : 'bg-[#d99b43]'
                  }`}
                />
              </span>
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

            {/* Profile Pill & Quick Role Switch Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#072417] border border-[#14532d] hover:border-emerald-500/60 transition-all text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${
                      currentUser.role === 'admin'
                        ? 'bg-[#d99b43]/20 text-[#fbd795] border-[#d99b43]/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-emerald-100 leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 font-mono">
                      #{currentUser.rep_code} • {currentUser.role === 'admin' ? 'HQ Admin' : 'Field Rep'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#062015] border border-[#175c34] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-[#0f4024]">
                      <p className="text-xs text-emerald-400/80">Logged in as:</p>
                      <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-emerald-300/70 font-mono">
                        Rep #{currentUser.rep_code} • {currentUser.territory || 'Operations HQ'}
                      </p>
                    </div>

                    <div className="py-2">
                      <p className="text-[10px] uppercase font-bold text-emerald-400/70 px-2 pb-1 tracking-wider">
                        Switch Active Rep Identity
                      </p>
                      <div className="max-h-44 overflow-y-auto space-y-1">
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
                            <span className="truncate">
                              {p.name} {p.role === 'admin' ? '(Admin)' : ''}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">#{p.rep_code}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#0f4024] flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenPasswordReset(currentUser.rep_code);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#fbd795] hover:bg-[#0b3320] flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#d99b43]" />
                        Admin Reset Password
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
