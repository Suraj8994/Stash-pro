import React, { useState, useEffect } from 'react';
import { Area } from '../../types/database';
import { useApp } from '../../context/AppContext';
import {
  X,
  MapPin,
  Clock,
  Save,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Layers,
  Award,
} from 'lucide-react';

interface AdminAreaModalProps {
  area?: Area | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAreaModal: React.FC<AdminAreaModalProps> = ({ area, isOpen, onClose }) => {
  const { profiles, createArea, updateArea } = useApp();

  const isEditing = Boolean(area);

  // ONLY 3 core state fields requested by user:
  // 1. Area name
  // 2. Visit interval frequency
  // 3. Priority-wise assigned field representatives (multiple persons per area)
  const [areaName, setAreaName] = useState('');
  const [visitIntervalDays, setVisitIntervalDays] = useState(7);
  const [prioritizedRepIds, setPrioritizedRepIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salesReps = profiles.filter((p) => p.role === 'sales_rep');

  useEffect(() => {
    if (area) {
      setAreaName(area.name);
      setVisitIntervalDays(area.visit_interval_days || 7);
      // Populate priority list preserving order
      const existingIds = area.assigned_rep_ids || [];
      setPrioritizedRepIds(existingIds);
    } else {
      setAreaName('');
      setVisitIntervalDays(7);
      // Default to first available sales rep as Priority #1
      setPrioritizedRepIds(salesReps[0] ? [salesReps[0].id] : []);
    }
    setError(null);
  }, [area, isOpen]);

  if (!isOpen) return null;

  // Add a rep to the end of priority list
  const handleAddRep = (repId: string) => {
    if (!prioritizedRepIds.includes(repId)) {
      setPrioritizedRepIds([...prioritizedRepIds, repId]);
    }
  };

  // Remove a rep from priority list
  const handleRemoveRep = (repId: string) => {
    setPrioritizedRepIds(prioritizedRepIds.filter((id) => id !== repId));
  };

  // Move rep up in priority
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...prioritizedRepIds];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setPrioritizedRepIds(updated);
  };

  // Move rep down in priority
  const handleMoveDown = (index: number) => {
    if (index === prioritizedRepIds.length - 1) return;
    const updated = [...prioritizedRepIds];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setPrioritizedRepIds(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) {
      setError('Please provide an Area Name.');
      return;
    }

    if (prioritizedRepIds.length === 0) {
      setError('Please assign at least one field sales representative.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Map rep IDs to codes and names strictly preserving priority order
    const repCodes: string[] = [];
    const repNames: string[] = [];
    for (const repId of prioritizedRepIds) {
      const found = profiles.find((p) => p.id === repId);
      if (found) {
        repCodes.push(found.rep_code);
        repNames.push(found.name);
      }
    }

    const trimmedName = areaName.trim();
    const generatedCode = area?.code || `AREA-${Math.floor(100 + Math.random() * 900)}`;

    try {
      if (isEditing && area) {
        const res = await updateArea(area.id, {
          name: trimmedName,
          code: area.code || generatedCode,
          district: area.district || trimmedName,
          category: area.category || 'Retail Coverage',
          address: area.address || trimmedName,
          client_contact: area.client_contact || '',
          client_phone: area.client_phone || '',
          visit_interval_days: visitIntervalDays,
          order_potential: area.order_potential || '',
          assigned_rep_ids: prioritizedRepIds,
          assigned_rep_codes: repCodes,
          assigned_rep_names: repNames,
        });
        if (res.success) onClose();
        else setError(res.error || 'Failed to update area.');
      } else {
        const res = await createArea({
          name: trimmedName,
          code: generatedCode,
          district: trimmedName,
          category: 'Retail Coverage',
          address: trimmedName,
          client_contact: '',
          client_phone: '',
          visit_interval_days: visitIntervalDays,
          order_potential: '',
          assigned_rep_ids: prioritizedRepIds,
          assigned_rep_codes: repCodes,
          assigned_rep_names: repNames,
        });
        if (res.success) onClose();
        else setError(res.error || 'Failed to create area.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Find reps not yet assigned to this area
  const unassignedReps = salesReps.filter((r) => !prioritizedRepIds.includes(r.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-emerald-50 text-base sm:text-lg truncate">
                {isEditing ? 'Edit Coverage Area' : 'Add Area'}
              </h3>
              <p className="text-xs text-emerald-300/70 truncate">
                Configure area, visit cadence, and priority-wise field team.
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

        {/* Form Body - Contains ONLY Area, Visit Interval Frequency, and Priority-wise Reps */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* 1. AREA INPUT FIELD */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#d99b43]" />
              Area / Territory Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. North Sector FMCG Zone, Downtown Retail Hub..."
              className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/70 focus:outline-none focus:border-[#d99b43] transition-all"
            />
            <p className="text-[11px] text-emerald-400/60">
              Enter the designated sales region, market beat, or retail cluster.
            </p>
          </div>

          {/* 2. VISIT INTERVAL FREQUENCY */}
          <div className="p-4 bg-[#03150d] rounded-xl border border-[#14532d] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#d99b43]" />
                Visit Interval Frequency (Cadence)
              </label>
              <span className="text-xs sm:text-sm font-bold text-[#fcd38d] font-mono px-2.5 py-0.5 rounded bg-[#073822] border border-[#d99b43]/40">
                Every {visitIntervalDays} {visitIntervalDays === 1 ? 'day' : 'days'}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={visitIntervalDays}
              onChange={(e) => setVisitIntervalDays(Number(e.target.value))}
              className="w-full accent-[#d99b43] cursor-pointer"
            />

            {/* Quick frequency presets */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {[2, 3, 4, 5, 7, 10, 14].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setVisitIntervalDays(d)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                    visitIntervalDays === d
                      ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/60'
                      : 'bg-[#062015] text-emerald-300/70 border-[#14532d] hover:bg-[#0a3020] hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* 3. ASSIGN FIELD PERSONNEL (PRIORITY-WISE MULTIPLE PERSONS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#d99b43]" />
                Assign Field Personnel (Priority-Wise)
              </label>
              <span className="text-[11px] text-emerald-400/80 font-mono">
                {prioritizedRepIds.length} Assigned
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/70">
              One area can be covered by multiple personnel. Set order of priority below (Priority 1 = Primary Lead).
            </p>

            {/* Priority Queue List */}
            {prioritizedRepIds.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#03150d] border border-dashed border-[#14532d] text-center text-xs text-emerald-500/70">
                No personnel assigned yet. Choose from the available team members below.
              </div>
            ) : (
              <div className="space-y-2">
                {prioritizedRepIds.map((repId, index) => {
                  const rep = profiles.find((p) => p.id === repId);
                  if (!rep) return null;

                  const isFirst = index === 0;
                  const isLast = index === prioritizedRepIds.length - 1;

                  return (
                    <div
                      key={rep.id}
                      className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isFirst
                          ? 'bg-[#073822] border-emerald-500/50 shadow-md'
                          : 'bg-[#03150d] border-[#14532d]'
                      }`}
                    >
                      {/* Priority Tag & Person details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono border ${
                            isFirst
                              ? 'bg-[#d99b43] text-slate-950 border-[#fde68a]'
                              : 'bg-[#072417] text-[#fcd38d] border-[#14532d]'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-emerald-100 truncate">
                              {rep.name}
                            </span>
                            <span className="text-[10px] text-[#fcd38d] font-mono px-1.5 py-0.2 rounded bg-[#03150d] border border-[#d99b43]/30 shrink-0">
                              Rep #{rep.rep_code}
                            </span>
                            {isFirst && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#d99b43]/20 text-[#fcd38d] border border-[#d99b43]/40 shrink-0">
                                Primary Lead
                              </span>
                            )}
                            {index === 1 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-medium uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0">
                                Secondary
                              </span>
                            )}
                            {index > 1 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-medium uppercase tracking-wider bg-[#062015] text-emerald-400/80 border border-[#14532d] shrink-0">
                                Backup #{index - 1}
                              </span>
                            )}
                          </div>
                          {rep.territory && (
                            <p className="text-[10px] text-emerald-400/70 truncate mt-0.5">
                              Base: {rep.territory}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reorder and Delete Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveUp(index)}
                          title="Increase Priority (Move Up)"
                          className="p-1.5 rounded-lg border border-[#14532d] bg-[#062015] text-emerald-300 hover:text-white hover:bg-[#0a3020] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveDown(index)}
                          title="Decrease Priority (Move Down)"
                          className="p-1.5 rounded-lg border border-[#14532d] bg-[#062015] text-emerald-300 hover:text-white hover:bg-[#0a3020] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRep(rep.id)}
                          title="Remove from Area"
                          className="p-1.5 rounded-lg border border-[#14532d] bg-[#062015] text-emerald-400/70 hover:text-rose-400 hover:border-rose-500/40 transition-colors ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add More Personnel section */}
            {unassignedReps.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-emerald-300/80 block mb-1.5">
                  + Add More Personnel to this Area:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedReps.map((rep) => (
                    <button
                      type="button"
                      key={rep.id}
                      onClick={() => handleAddRep(rep.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-[#14532d] bg-[#03150d] hover:bg-[#073822] hover:border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3 h-3 text-[#d99b43]" />
                      <span>{rep.name}</span>
                      <span className="text-[10px] text-emerald-400/70 font-mono">
                        (#{rep.rep_code})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#0f4024]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#14532d] hover:bg-[#07291a] text-emerald-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] hover:from-[#e4a852] hover:to-[#c48232] text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Area Changes' : 'Create Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
