import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Area, ComputedStatusType } from '../types/database';
import { computeAreaStatus, getEffectiveAssignee } from '../utils/areaStatus';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Hourglass,
  Search,
  Plus,
  Users,
  Phone,
  MapPin,
  Calendar,
  Send,
  Edit2,
  Trash2,
  Filter,
  Download,
  RefreshCw,
  Tag,
  Check,
  Building2,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface LiveTrackingViewProps {
  onOpenAddArea: () => void;
  onOpenEditArea: (area: Area) => void;
  onOpenManageReps: () => void;
  onOpenCheckIn: (area: Area) => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  onOpenAddArea,
  onOpenEditArea,
  onOpenManageReps,
  onOpenCheckIn,
}) => {
  const {
    areas,
    profiles,
    currentUser,
    statusCounts,
    sendReminder,
    deleteArea,
    refreshData,
    activeFilterStatus,
    setActiveFilterStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const salesReps = profiles.filter((p) => p.role === 'sales_rep');

  // Handle 2x2 metric card click
  const handleMetricCardClick = (statusType: ComputedStatusType) => {
    if (activeFilterStatus === statusType) {
      setActiveFilterStatus('all');
    } else {
      setActiveFilterStatus(statusType);
    }
  };

  // Filter and sort outlets
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const statusInfo = computeAreaStatus(area);

      // Status filter from 2x2 cards
      if (activeFilterStatus !== 'all' && statusInfo.status !== activeFilterStatus) {
        return false;
      }

      // Rep filter
      if (selectedRepFilter !== 'all') {
        const matchesRep =
          area.assigned_rep_codes.includes(selectedRepFilter) ||
          area.assigned_rep_ids.includes(selectedRepFilter);
        if (!matchesRep) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && area.category !== selectedCategory) {
        return false;
      }

      // Search query (store name, code, district, contact)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          area.name.toLowerCase().includes(q) ||
          area.code.toLowerCase().includes(q) ||
          area.district.toLowerCase().includes(q) ||
          area.client_contact.toLowerCase().includes(q) ||
          (area.address && area.address.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [areas, activeFilterStatus, selectedRepFilter, selectedCategory, searchQuery]);

  // Send reminder action
  const handleSendReminder = async (area: Area) => {
    setReminderSending(area.id);
    try {
      const res = await sendReminder(area);
      if (res.success) {
        setReminderSuccess(area.id);
        setTimeout(() => setReminderSuccess(null), 3000);
      }
    } finally {
      setReminderSending(null);
    }
  };

  const handleDeleteArea = async (area: Area) => {
    if (confirm(`Are you sure you want to remove outlet "${area.name}" (${area.code})?`)) {
      await deleteArea(area.id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Outlet Name',
      'Code',
      'Status',
      'Category',
      'District',
      'Address',
      'Contact Name',
      'Phone',
      'Assigned Reps',
      'Visit Interval (Days)',
      'Last Completed Date',
      'Next Due Date',
      'Weekly Order Potential',
    ];

    const rows = filteredAreas.map((area) => {
      const { badgeLabel } = computeAreaStatus(area);
      return [
        `"${area.name.replace(/"/g, '""')}"`,
        `"${area.code}"`,
        `"${badgeLabel}"`,
        `"${area.category}"`,
        `"${area.district}"`,
        `"${(area.address || '').replace(/"/g, '""')}"`,
        `"${(area.client_contact || '').replace(/"/g, '""')}"`,
        `"${area.client_phone || ''}"`,
        `"${area.assigned_rep_names.join(', ')}"`,
        area.visit_interval_days,
        `"${area.last_completed_date || 'None'}"`,
        `"${area.next_visit_due_date || 'Pending'}"`,
        `"${area.order_potential || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `distritrack_outlets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2 truncate">
            Field Coverage & Area Operations
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/70 mt-0.5 truncate">
            Scheduled visit cadences, area priority coverage, and field representative dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshData}
            title="Refresh database"
            className="p-2 sm:p-2.5 rounded-xl bg-[#072417] border border-[#14532d] text-emerald-300 hover:text-white hover:border-emerald-500/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-[#072417] border border-[#14532d] hover:bg-[#0b3320] hover:border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#d99b43]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={onOpenManageReps}
                className="px-3 py-2 rounded-xl bg-[#092e1e] hover:bg-[#0f442d] text-emerald-100 text-xs font-semibold flex items-center gap-1.5 border border-[#175c34] transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-[#d99b43]" />
                <span>Manage Reps</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddArea}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/80 border border-emerald-400/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Area</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2x2 Metric Cards (Prompt Requirement: Filters on Click) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Delayed (Rose #f43f5e) */}
        <button
          type="button"
          onClick={() => handleMetricCardClick('delayed')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeFilterStatus === 'delayed'
              ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40 hover:bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Delayed Visits
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {statusCounts.delayed}
            </span>
            <span className="text-[11px] text-rose-400 font-medium">Overdue accounts</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Past due date • Action required
          </p>
          {activeFilterStatus === 'delayed' && (
            <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-500/40">
              FILTER ACTIVE
            </div>
          )}
        </button>

        {/* 2. Due Tomorrow (Amber #f59e0b) */}
        <button
          type="button"
          onClick={() => handleMetricCardClick('due_tomorrow')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeFilterStatus === 'due_tomorrow'
              ? 'bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:bg-amber-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Due Tomorrow
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {statusCounts.due_tomorrow}
            </span>
            <span className="text-[11px] text-amber-400 font-medium">Reminder eligible</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            1 day remaining • Dispatch ready
          </p>
          {activeFilterStatus === 'due_tomorrow' && (
            <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/40">
              FILTER ACTIVE
            </div>
          )}
        </button>

        {/* 3. Completed Today (Emerald #10b981) */}
        <button
          type="button"
          onClick={() => handleMetricCardClick('completed')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeFilterStatus === 'completed'
              ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Completed Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {statusCounts.completed_today}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Completed check-ins</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Recorded today by field reps
          </p>
          {activeFilterStatus === 'completed' && (
            <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/40">
              FILTER ACTIVE
            </div>
          )}
        </button>

        {/* 4. In-Progress (Sky #0ea5e9) */}
        <button
          type="button"
          onClick={() => handleMetricCardClick('in_progress')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
            activeFilterStatus === 'in_progress'
              ? 'bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/50'
              : 'bg-slate-900/90 border-slate-800 hover:border-sky-500/40 hover:bg-sky-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              In-Progress Cycles
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {statusCounts.in_progress}
            </span>
            <span className="text-[11px] text-sky-400 font-medium">On-track visits</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Within scheduled cycle window
          </p>
          {activeFilterStatus === 'in_progress' && (
            <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-sky-400 bg-sky-950/90 px-1.5 py-0.5 rounded border border-sky-500/40">
              FILTER ACTIVE
            </div>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#062015]/90 p-4 rounded-2xl border border-[#14532d] space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-500" />
            <input
              type="text"
              placeholder="Search store name, outlet code, district, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#03150d] border border-[#175c34] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-emerald-600/70 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-emerald-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#03150d] border border-[#175c34] rounded-xl px-3 py-2 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 transition-all"
            >
              <option value="all">All Categories</option>
              <option value="Supermarket">Supermarket</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Convenience">Convenience</option>
              <option value="Specialty Retail">Specialty Retail</option>
            </select>

            {/* Clear All Filters Button */}
            {(activeFilterStatus !== 'all' || selectedRepFilter !== 'all' || selectedCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilterStatus('all');
                  setSelectedRepFilter('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-3 py-2 rounded-xl bg-[#092e1e] hover:bg-[#0f442d] text-emerald-200 text-xs font-semibold whitespace-nowrap transition-colors border border-[#175c34]"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Rep Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#0f4024]">
          <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider mr-1">
            Filter by Field Rep:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRepFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              selectedRepFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-[#03150d] text-emerald-300/80 border-[#14532d] hover:text-white'
            }`}
          >
            All Reps ({areas.length})
          </button>
          {salesReps.map((rep) => {
            const count = areas.filter(
              (a) => a.assigned_rep_codes.includes(rep.rep_code) || a.assigned_rep_ids.includes(rep.id)
            ).length;
            const isSelected = selectedRepFilter === rep.rep_code;
            const isAbsent = Boolean(rep.is_absent);
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedRepFilter(rep.rep_code)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : isAbsent
                    ? 'bg-[#1a0f12] text-rose-300 border-rose-500/40'
                    : 'bg-[#03150d] text-emerald-200/90 border-[#14532d] hover:border-emerald-500/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAbsent ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}
                />
                <span className="font-mono text-[10px] text-[#f6cb82]">#{rep.rep_code}</span>
                <span>{rep.name}</span>
                {isAbsent && <span className="text-[9px] text-rose-400 font-bold">(Absent)</span>}
                <span className="text-[10px] px-1.5 rounded-full bg-[#092e1e] text-emerald-300 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Outlets Card Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-200">{filteredAreas.length}</strong> of{' '}
            <strong className="text-slate-200">{areas.length}</strong> outlets
            {activeFilterStatus !== 'all' && (
              <span className="ml-2 font-mono text-sky-400">
                (Filtered: {activeFilterStatus.replace('_', ' ').toUpperCase()})
              </span>
            )}
          </span>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No Outlets Match Criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, changing the status card filter, or clearing the field rep filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilterStatus('all');
                setSelectedRepFilter('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAreas.map((area) => {
              const statusInfo = computeAreaStatus(area);
              const isReminderSent = reminderSuccess === area.id;
              const isSending = reminderSending === area.id;

              return (
                <div
                  key={area.id}
                  className={`bg-[#062015] border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#1e7845] ${
                    statusInfo.status === 'delayed'
                      ? 'border-rose-500/40 bg-[#160b0e]'
                      : statusInfo.status === 'due_tomorrow'
                      ? 'border-[#d99b43]/50 bg-[#191307]'
                      : statusInfo.status === 'completed'
                      ? 'border-emerald-500/40 bg-[#062618]'
                      : 'border-[#14532d]'
                  }`}
                >
                  <div>
                    {/* Top Row: Area Name, Code, and Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-100 hover:text-emerald-300 transition-colors break-words">
                            {area.name}
                          </h3>
                          <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-[#03150d] text-emerald-300/80 border border-[#14532d] shrink-0">
                            {area.code}
                          </span>
                        </div>
                        {area.district && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-emerald-300/70 flex-wrap">
                            {area.category && (
                              <span className="px-2 py-0.5 rounded bg-[#03150d] text-emerald-200 border border-[#14532d] font-medium">
                                {area.category}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{area.district}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Engine Badge with Task Icon */}
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

                    {/* Due Date & Visit Cycle Bar */}
                    <div className="mt-3.5 p-3 rounded-xl bg-[#03150d] border border-[#14532d] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-200">
                        <Calendar className="w-3.5 h-3.5 text-[#d99b43]" />
                        <span>
                          Cycle:{' '}
                          <strong className="text-white font-mono">
                            Every {area.visit_interval_days}d
                          </strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400/80">Schedule: </span>
                        <span className={`font-semibold ${statusInfo.badgeColorClass}`}>
                          {statusInfo.dueText}
                        </span>
                      </div>
                    </div>

                    {/* Optional Address & Contact Person if configured */}
                    {(area.client_contact || area.client_phone) && (
                      <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#0f4024]">
                          {area.client_contact && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-500/80">Contact:</span>
                              <span className="text-slate-100 font-medium">
                                {area.client_contact}
                              </span>
                            </div>
                          )}

                          {area.client_phone && (
                            <a
                              href={`tel:${area.client_phone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#073822] text-emerald-200 hover:bg-[#0a4d2e] border border-emerald-500/40 text-xs font-mono font-medium transition-colors"
                            >
                              <Phone className="w-3 h-3 text-[#d99b43]" />
                              {area.client_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Backup Delegation Notice if P1 is absent */}
                    {(() => {
                      const effective = getEffectiveAssignee(area, profiles);
                      if (effective.isBackupActive && effective.activeRepName) {
                        return (
                          <div className="mt-2.5 p-2 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#d99b43] shrink-0" />
                            <span>
                              <strong>Primary Lead Absent:</strong> Task handed over to P{effective.priorityIndex + 1} ({effective.activeRepName})
                            </span>
                          </div>
                        );
                      }
                      if (effective.allAssignedAbsent) {
                        return (
                          <div className="mt-2.5 p-2 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              <strong>All Assigned Reps Absent:</strong> Needs supervisor reassignment.
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Assigned Reps Chips (Priority-wise) & Order Potential */}
                    <div className="mt-3 pt-3 border-t border-[#0f4024] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[11px] text-emerald-400/80 font-medium shrink-0 flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#d99b43]" />
                          Team:
                        </span>
                        {area.assigned_rep_names.length > 0 ? (
                          area.assigned_rep_names.map((name, i) => {
                            const repProfile = profiles.find(
                              (p) =>
                                (area.assigned_rep_codes[i] && p.rep_code === area.assigned_rep_codes[i]) ||
                                (area.assigned_rep_ids[i] && p.id === area.assigned_rep_ids[i])
                            );
                            const isRepAbsent = Boolean(repProfile?.is_absent);

                            return (
                              <span
                                key={i}
                                className={`text-[11px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${
                                  isRepAbsent
                                    ? 'bg-rose-950/40 text-rose-300 border-rose-500/40 opacity-80'
                                    : i === 0
                                    ? 'bg-[#073822] text-[#fcd38d] border-emerald-500/40'
                                    : 'bg-[#03150d] text-emerald-200 border-[#14532d]'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isRepAbsent ? 'bg-rose-500' : 'bg-emerald-400'
                                  }`}
                                  title={isRepAbsent ? 'Absent' : 'Present'}
                                />
                                <span className="text-[10px] font-mono font-bold text-[#d99b43]">
                                  {i === 0 ? 'P1 Primary' : `P${i + 1}`}
                                </span>
                                <span className="truncate max-w-[120px]">{name}</span>
                                {isRepAbsent && <span className="text-[9px] text-rose-400 font-bold">(Absent)</span>}
                                {area.assigned_rep_codes[i] && (
                                  <span className="font-mono text-[#f6cb82] text-[10px]">
                                    #{area.assigned_rep_codes[i]}
                                  </span>
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Unassigned</span>
                        )}
                      </div>

                      {/* Weekly Order Potential badge */}
                      {area.order_potential && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#301f06] text-[#fcd38d] border border-[#d99b43]/50 text-xs font-mono font-bold shrink-0">
                          <span className="text-[#d99b43] font-bold text-xs font-mono">₹</span>
                          <span>{area.order_potential}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes preview if present */}
                    {area.notes && (
                      <p className="mt-2.5 text-[11px] text-emerald-200/80 italic bg-[#03150d]/80 p-2 rounded-lg border border-[#14532d] line-clamp-2 break-words">
                        "{area.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#0f4024] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {statusInfo.canSendReminder ? (
                        <button
                          type="button"
                          disabled={isSending || isReminderSent}
                          onClick={() => handleSendReminder(area)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                            isReminderSent
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-[#2b1b05] hover:bg-[#3d2708] border-[#d99b43]/50 text-[#fcd38d] active:scale-95 shadow-sm'
                          }`}
                        >
                          {isReminderSent ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Reminder Sent
                            </>
                          ) : isSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Dispatching...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 text-[#d99b43]" />
                              Send Reminder
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400/60">
                          {statusInfo.isCompletedToday ? 'Visit logged today' : 'On-schedule cycle'}
                        </span>
                      )}
                    </div>

                    {/* Right action set: Quick Check-in + Admin actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCheckIn(area)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold border border-emerald-400/40 flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        Check-In
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenEditArea(area)}
                            title="Edit outlet"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#0d3b24] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArea(area)}
                            title="Delete outlet"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#0d3b24] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
