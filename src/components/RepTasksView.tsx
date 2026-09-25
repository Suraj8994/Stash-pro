import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Area } from '../types/database';
import { computeAreaStatus, getEffectiveAssignee } from '../utils/areaStatus';
import {
  User,
  Lock,
  Eye,
  EyeOff,
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
  Smartphone,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';

interface RepTasksViewProps {
  onOpenCheckIn: (area: Area) => void;
  onOpenPasswordReset: (repCode?: string) => void;
  onOpenUserProfile?: () => void;
}

export const RepTasksView: React.FC<RepTasksViewProps> = ({
  onOpenCheckIn,
  onOpenPasswordReset,
  onOpenUserProfile,
}) => {
  const { currentUser, profiles, login, logout, areas, toggleRepAttendance } = useApp();

  // Login form state
  const [repCodeInput, setRepCodeInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Authenticated Rep Tab state
  // 'urgent': Priority active tasks due today, tomorrow, or overdue
  // 'all_active': All active areas where current user is the current active assignee
  // 'backup_roster': Areas where current user is registered as backup, but primary is present
  // 'completed': Today's visits completed
  const [activeTab, setActiveTab] = useState<'urgent' | 'all_active' | 'backup_roster' | 'completed'>('urgent');

  // Quick select helper
  const handleQuickSelect = (code: string) => {
    setRepCodeInput(code);
    setPasswordInput('');
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

  const handleToggleMyAttendance = async () => {
    if (!currentUser) return;
    await toggleRepAttendance(currentUser.rep_code, !currentUser.is_absent);
  };

  // Filter outlets relevant to current logged-in rep
  // Implements user's requirement:
  // "when i create area and assign 2 person then there are 2 task created based on priority and person.
  //  but we want logic that if first person is absent then that will assign to 2nd person."
  const { activeAreas, backupStandingAreas } = useMemo(() => {
    if (!currentUser) return { activeAreas: [], backupStandingAreas: [] };

    // Admins see all outlets as active
    if (currentUser.role === 'admin') {
      return { activeAreas: areas, backupStandingAreas: [] };
    }

    const activeList: Area[] = [];
    const backupList: Area[] = [];

    areas.forEach((area) => {
      const isAssigned =
        area.assigned_rep_codes.includes(currentUser.rep_code) ||
        area.assigned_rep_ids.includes(currentUser.id);

      if (!isAssigned) return;

      const effective = getEffectiveAssignee(area, profiles);

      // Is current user the active assignee right now (either P1 present, or P2 because P1 is absent)?
      if (
        effective.activeRepId === currentUser.id ||
        (effective.activeRepCode && effective.activeRepCode === currentUser.rep_code)
      ) {
        activeList.push(area);
      } else {
        // User is listed in area, but a higher priority person is present and covering it!
        backupList.push(area);
      }
    });

    return { activeAreas: activeList, backupStandingAreas: backupList };
  }, [areas, currentUser, profiles]);

  // Tab filtering
  const filteredTasks = useMemo(() => {
    if (activeTab === 'backup_roster') {
      return backupStandingAreas;
    }

    return activeAreas.filter((area) => {
      const statusInfo = computeAreaStatus(area);
      if (activeTab === 'urgent') {
        return (
          statusInfo.status === 'delayed' ||
          statusInfo.status === 'due_tomorrow' ||
          !area.next_visit_due_date
        );
      }
      if (activeTab === 'completed') {
        return statusInfo.isCompletedToday;
      }
      return true; // 'all_active'
    });
  }, [activeAreas, backupStandingAreas, activeTab]);

  // Counts
  const todayCompletedCount = useMemo(() => {
    return activeAreas.filter((a) => computeAreaStatus(a).isCompletedToday).length;
  }, [activeAreas]);

  const urgentCount = useMemo(() => {
    return activeAreas.filter((a) => {
      const s = computeAreaStatus(a);
      return s.status === 'delayed' || s.status === 'due_tomorrow';
    }).length;
  }, [activeAreas]);

  // -------------------------------------------------------------
  // Unauthenticated / Rep Login Screen
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-6 sm:py-12 px-3">
        <div className="bg-[#062015] border border-[#175c34] rounded-2xl p-5 sm:p-7 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d] mx-auto mb-3 shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Field Representative Portal</h2>
            <p className="text-xs text-emerald-300/80 mt-1">
              Enter your assigned Rep Code and password to access your field schedule.
            </p>
          </div>

          {/* Quick Select Preset Reps for easy testing */}
          <div className="mb-5 p-3 rounded-xl bg-[#03150d] border border-[#14532d]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2 flex items-center justify-between">
              <span>Quick Login Select:</span>
              <span className="text-[10px] text-emerald-500 font-mono">1-Click Test</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {profiles.map((p) => {
                const isAdmin = p.role === 'admin' || p.rep_code === '100';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickSelect(p.rep_code)}
                    className="p-1.5 rounded-lg border border-[#14532d] bg-[#072417] hover:bg-[#0b3320] hover:border-emerald-500/50 text-left transition-colors flex items-center justify-between"
                  >
                    <span className="text-xs text-emerald-200 truncate font-medium">
                      {p.name.split(' ')[0]} {isAdmin ? '★' : ''}
                    </span>
                    <span className="text-[10px] font-mono text-[#fcd38d]">#{p.rep_code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error / Locked Notification */}
          {loginError && (
            <div
              className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                isLocked
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">{isLocked ? 'Account Locked' : 'Authentication Notice'}</p>
                <p className="mt-0.5 opacity-90">{loginError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-200">Rep Code / Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 (Anil Sakpal) or 101"
                  value={repCodeInput}
                  onChange={(e) => setRepCodeInput(e.target.value)}
                  className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 font-mono focus:outline-none focus:border-[#d99b43] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-200">Password</label>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  Protected
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-[#03150d] border border-[#14532d] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'View password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] hover:from-[#e4a852] hover:to-[#c48232] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In to Field Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Locked rep reset prompt */}
          {isLocked && (
            <div className="mt-4 pt-3 border-t border-[#0f4024] text-center">
              <button
                type="button"
                onClick={() => onOpenPasswordReset(repCodeInput)}
                className="text-xs text-[#fcd38d] hover:underline font-medium inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Unlock with Admin Master Key
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated View: Field Schedule & Task Management
  // -------------------------------------------------------------
  const isAdmin = currentUser.role === 'admin' || currentUser.rep_code === '100';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Rep Welcome Banner & Attendance / Mobile Control Strip */}
      <div className="bg-[#062015] border border-[#14532d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border relative shadow-md ${
              isAdmin
                ? 'bg-[#083822] text-[#fcd38d] border-[#d99b43]/40'
                : 'bg-[#072417] text-emerald-300 border-emerald-500/40'
            }`}
          >
            {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#062015] ${
                currentUser.is_absent ? 'bg-rose-500' : 'bg-emerald-400'
              }`}
              title={currentUser.is_absent ? 'Marked Absent' : 'Present (On Duty)'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white">{currentUser.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-[#03150d] text-[#fcd38d] border border-[#d99b43]/30">
                Rep #{currentUser.rep_code}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#072417] text-emerald-300 border border-emerald-500/30">
                {isAdmin ? 'Operations Admin' : currentUser.territory || 'Field Rep'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-emerald-300/80 flex-wrap">
              <span className="flex items-center gap-1 font-mono text-[#fcd38d]">
                <Phone className="w-3.5 h-3.5 text-[#d99b43]" />
                {currentUser.phone || '8108941215'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                {currentUser.territory || 'HQ Operations Hub'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Strip */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
          {/* Duty Attendance Toggle Button */}
          <button
            type="button"
            onClick={handleToggleMyAttendance}
            title={currentUser.is_absent ? 'Mark as Present' : 'Mark as Absent'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              currentUser.is_absent
                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {currentUser.is_absent ? (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Duty: Absent (Leave)</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Duty: Present (Active)</span>
              </>
            )}
          </button>

          {/* Change Mobile & Profile Button */}
          {onOpenUserProfile && (
            <button
              type="button"
              onClick={onOpenUserProfile}
              className="px-3 py-1.5 rounded-xl bg-[#072417] hover:bg-[#0b3320] border border-[#d99b43]/40 text-[#fcd38d] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#d99b43]" />
              <span>Update Mobile</span>
            </button>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="p-2 rounded-xl bg-[#03150d] border border-[#14532d] text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Attendance Warning Banner if user is currently marked Absent */}
      {currentUser.is_absent && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>You are marked Absent:</strong> Scheduled visits where you are Primary Lead are currently routed to backup personnel. Click "Duty: Absent" above when you resume work.
            </span>
          </div>
        </div>
      )}

      {/* Metric summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-xl bg-[#062015] border border-[#14532d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white leading-tight">{urgentCount}</div>
            <div className="text-[11px] text-emerald-400/80">Urgent Pending</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#062015] border border-[#14532d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white leading-tight">{todayCompletedCount}</div>
            <div className="text-[11px] text-emerald-400/80">Completed Today</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#062015] border border-[#14532d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white leading-tight">{activeAreas.length}</div>
            <div className="text-[11px] text-emerald-400/80">Active Areas</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#062015] border border-[#14532d] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#072417] border border-[#14532d] flex items-center justify-center text-emerald-300">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold font-mono text-white leading-tight">{backupStandingAreas.length}</div>
            <div className="text-[11px] text-emerald-400/80">Backup Roster</div>
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#0f4024] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('urgent')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'urgent'
              ? 'bg-[#d99b43] text-slate-950 font-bold shadow-md shadow-amber-950/60'
              : 'text-emerald-300/80 hover:text-white hover:bg-[#072417]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Priority Action Due ({urgentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all_active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'all_active'
              ? 'bg-[#d99b43] text-slate-950 font-bold shadow-md shadow-amber-950/60'
              : 'text-emerald-300/80 hover:text-white hover:bg-[#072417]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>My Active Assignments ({activeAreas.length})</span>
        </button>

        {backupStandingAreas.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('backup_roster')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'backup_roster'
                ? 'bg-[#d99b43] text-slate-950 font-bold shadow-md shadow-amber-950/60'
                : 'text-emerald-300/80 hover:text-white hover:bg-[#072417]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Standby Backup ({backupStandingAreas.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-[#d99b43] text-slate-950 font-bold shadow-md shadow-amber-950/60'
              : 'text-emerald-300/80 hover:text-white hover:bg-[#072417]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed ({todayCompletedCount})</span>
        </button>
      </div>

      {/* Task Cards Grid / List */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#062015] border border-[#14532d] rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
            <h3 className="font-semibold text-white text-base">No tasks in this category</h3>
            <p className="text-xs text-emerald-300/70 max-w-sm mx-auto">
              {activeTab === 'urgent'
                ? 'All scheduled visits for your territory are on track.'
                : 'Check other tabs to view all accounts or recent completions.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((area) => {
            const statusInfo = computeAreaStatus(area);
            const isCompletedToday = statusInfo.isCompletedToday;
            const effective = getEffectiveAssignee(area, profiles);

            // Is the user covering this because primary is absent?
            const isDelegatedBackup =
              effective.isBackupActive &&
              (effective.activeRepId === currentUser.id ||
                effective.activeRepCode === currentUser.rep_code);

            // Is user in standby backup (primary lead is present)?
            const isStandbyBackup = activeTab === 'backup_roster';

            return (
              <div
                key={area.id}
                className={`bg-[#062015] border rounded-2xl p-4 sm:p-5 shadow-xl transition-all ${
                  isCompletedToday
                    ? 'border-emerald-500/50 bg-[#062a1b]'
                    : isDelegatedBackup
                    ? 'border-amber-500/50 bg-[#161307]'
                    : statusInfo.status === 'delayed'
                    ? 'border-rose-500/40 bg-[#160b0e]'
                    : statusInfo.status === 'due_tomorrow'
                    ? 'border-[#d99b43]/50 bg-[#191307]'
                    : 'border-[#14532d]'
                }`}
              >
                {/* Backup Delegation Alert Banner (User requirement!) */}
                {isDelegatedBackup && (
                  <div className="mb-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-between gap-2 text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#d99b43] shrink-0" />
                      <span>
                        <strong>Backup Active:</strong> Primary Lead (
                        {effective.absentPredecessors.map((p) => p.name).join(', ')}) is <strong>Absent</strong>. This area is assigned to you as Priority #{effective.priorityIndex + 1}.
                      </span>
                    </div>
                  </div>
                )}

                {/* Standby Banner if in standby tab */}
                {isStandbyBackup && (
                  <div className="mb-3 p-2.5 rounded-xl bg-[#03150d] border border-[#14532d] flex items-center justify-between gap-2 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Covered by Primary Lead:</strong> {effective.activeRepName} is Present and handling this cadence. You are registered as Secondary Backup.
                      </span>
                    </div>
                  </div>
                )}

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
                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          effective.priorityIndex === 0
                            ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/50'
                            : 'bg-[#03150d] text-emerald-300 border-[#14532d]'
                        }`}
                      >
                        {effective.priorityIndex === 0 ? '★ P1 Lead' : `P${effective.priorityIndex + 1} Backup`}
                      </span>
                    </div>

                    {area.district && area.district !== area.name && (
                      <p className="text-xs text-emerald-300/70 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{area.district}</span>
                      </p>
                    )}

                    {/* Contact Person & Call link */}
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
                  ) : isStandbyBackup ? (
                    <span className="text-xs text-emerald-400/70 italic">
                      Standing by as Backup
                    </span>
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
