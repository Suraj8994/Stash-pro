import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Profile } from '../../types/database';
import {
  X,
  UserPlus,
  Users,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  AlertTriangle,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Pencil,
  Save,
  Check,
} from 'lucide-react';

interface AdminRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPasswordReset: (repCode: string) => void;
  onOpenUserProfile?: () => void;
}

export const AdminRepModal: React.FC<AdminRepModalProps> = ({
  isOpen,
  onClose,
  onOpenPasswordReset,
  onOpenUserProfile,
}) => {
  const { profiles, addRep, updateRep, toggleRepLock, deleteRep, toggleRepAttendance } = useApp();

  // Create form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [repCode, setRepCode] = useState('');
  const [territory, setTerritory] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit / Reassign state (User requirement: edit old employee and give same code to anyone else)
  const [editingRep, setEditingRep] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRepCode, setEditRepCode] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTerritory, setEditTerritory] = useState('');
  const [editResetPassword, setEditResetPassword] = useState(true);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !repCode.trim()) {
      setErrorMsg('Name and Rep Code are required.');
      return;
    }

    if (profiles.some((p) => p.rep_code === repCode.trim())) {
      setErrorMsg(`Rep Code #${repCode} is already assigned. Please choose another code.`);
      return;
    }

    const res = await addRep({
      name: name.trim(),
      rep_code: repCode.trim(),
      territory: territory.trim() || 'General Territory',
      phone: phone.trim() || '+91 98765 00000',
    });

    if (res.success) {
      setName('');
      setRepCode('');
      setTerritory('');
      setPhone('');
      setShowAddForm(false);
    } else {
      setErrorMsg(res.error || 'Failed to create sales rep.');
    }
  };

  const handleStartEdit = (rep: Profile) => {
    setEditingRep(rep);
    setEditName(rep.name);
    setEditRepCode(rep.rep_code);
    setEditPhone(rep.phone || '');
    setEditTerritory(rep.territory || '');
    setEditResetPassword(true);
    setEditErrorMsg(null);
    setEditSuccessMsg(null);
    setShowAddForm(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRep) return;
    setEditErrorMsg(null);
    setEditSuccessMsg(null);

    if (!editName.trim() || !editRepCode.trim()) {
      setEditErrorMsg('Name and Rep Code are required.');
      return;
    }

    const res = await updateRep(editingRep.id, {
      name: editName.trim(),
      rep_code: editRepCode.trim(),
      phone: editPhone.trim(),
      territory: editTerritory.trim(),
      is_password_set: editResetPassword ? false : editingRep.is_password_set,
      is_locked: false,
      failed_login_attempts: 0,
    });

    if (res.success) {
      setEditSuccessMsg(`Representative successfully updated! Rep Code #${editRepCode} reassigned to ${editName}.`);
      setTimeout(() => {
        setEditingRep(null);
        setEditSuccessMsg(null);
      }, 1500);
    } else {
      setEditErrorMsg(res.error || 'Failed to update employee.');
    }
  };

  const handleToggleLock = async (code: string, currentLocked: boolean) => {
    await toggleRepLock(code, !currentLocked);
  };

  const handleToggleAttendance = async (code: string, currentAbsent: boolean | undefined) => {
    await toggleRepAttendance(code, !currentAbsent);
  };

  const handleDeleteRep = async (id: string, repName: string) => {
    if (confirm(`Remove representative "${repName}" from the team?`)) {
      await deleteRep(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-50 text-base sm:text-lg">
                Field Personnel & Attendance Directory
              </h3>
              <p className="text-xs text-emerald-300/70">
                Manage roster, attendance status, and reassign employee codes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-emerald-400 hover:text-white hover:bg-[#0d3b24] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Header Action Strip */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h4 className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Workforce Personnel ({profiles.length})
              </h4>
              <p className="text-[11px] text-emerald-400/70">
                You can edit any employee to reassign the same Rep Code to someone new without losing area links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingRep(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950/40 hover:from-[#e4a852] hover:to-[#c48232] transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Add New Person'}</span>
            </button>
          </div>

          {/* Edit / Reassign Employee Form (User Requirement!) */}
          {editingRep && (
            <form
              onSubmit={handleSaveEdit}
              className="p-4 rounded-xl bg-[#082216] border border-[#d99b43]/50 shadow-lg space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#fcd38d] flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-[#d99b43]" />
                  Edit / Reassign Employee #{editingRep.rep_code} ({editingRep.name})
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingRep(null)}
                  className="text-xs text-emerald-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                💡 <strong>Keep Same Rep Code:</strong> Giving this Rep Code to a new employee will automatically transfer all previously assigned areas to them!
              </p>

              {editErrorMsg && (
                <div className="p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
                  {editErrorMsg}
                </div>
              )}
              {editSuccessMsg && (
                <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{editSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-emerald-200">New Employee Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Sunil Deshmukh)"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#03150d] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-emerald-200">Rep Code (Keep Same Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rep Code"
                    value={editRepCode}
                    onChange={(e) => setEditRepCode(e.target.value)}
                    className="w-full bg-[#03150d] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 font-mono focus:outline-none focus:border-[#d99b43]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-emerald-200">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="Mobile Number (e.g. 9820011223)"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#03150d] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-emerald-200">Territory Base</label>
                  <input
                    type="text"
                    placeholder="Assigned Territory (e.g. South Hub)"
                    value={editTerritory}
                    onChange={(e) => setEditTerritory(e.target.value)}
                    className="w-full bg-[#03150d] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-emerald-200">
                <input
                  type="checkbox"
                  id="resetPassCheckbox"
                  checked={editResetPassword}
                  onChange={(e) => setEditResetPassword(e.target.checked)}
                  className="rounded border-[#14532d] text-[#d99b43] focus:ring-0"
                />
                <label htmlFor="resetPassCheckbox" className="cursor-pointer">
                  Reset credentials so the new person chooses their permanent password on first login
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#14532d]">
                <button
                  type="button"
                  onClick={() => setEditingRep(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#14532d] text-xs text-emerald-400 hover:text-emerald-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#d99b43] hover:bg-[#c98b33] text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save & Reassign Rep Code #{editRepCode}
                </button>
              </div>
            </form>
          )}

          {/* Add Rep Inline Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateRep}
              className="p-4 rounded-xl bg-[#03150d] border border-[#14532d] space-y-3 animate-in fade-in duration-150"
            >
              <h4 className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-[#d99b43]" />
                Onboard New Field Representative
              </h4>

              {errorMsg && (
                <div className="p-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Ramesh Joshi)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#062015] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                />
                <input
                  type="text"
                  required
                  placeholder="Rep Code (e.g. 105)"
                  value={repCode}
                  onChange={(e) => setRepCode(e.target.value)}
                  className="bg-[#062015] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 font-mono focus:outline-none focus:border-[#d99b43]"
                />
                <input
                  type="text"
                  placeholder="Assigned Territory (e.g. West Hub)"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="bg-[#062015] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#062015] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#14532d] text-xs text-emerald-400 hover:text-emerald-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#d99b43] hover:bg-[#c98b33] text-slate-950 text-xs font-bold"
                >
                  Save Person (Persisted)
                </button>
              </div>
            </form>
          )}

          {/* Rep Directory Table / List */}
          <div className="space-y-2.5">
            {profiles.map((p) => {
              const isAdmin = p.role === 'admin' || p.rep_code === '100';
              const isAbsent = Boolean(p.is_absent);

              return (
                <div
                  key={p.id}
                  className={`p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    p.is_locked
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isAbsent
                      ? 'bg-[#180e12] border-rose-500/30'
                      : isAdmin
                      ? 'bg-[#03150d] border-[#14532d]'
                      : 'bg-[#03150d]/60 border-[#14532d]/70 hover:border-[#1e7845]'
                  }`}
                >
                  {/* Person Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border relative ${
                        isAdmin
                          ? 'bg-[#083822] text-[#fcd38d] border-[#d99b43]/40'
                          : 'bg-[#072417] text-emerald-300 border-[#14532d]'
                      }`}
                    >
                      {p.avatar || p.name.slice(0, 2).toUpperCase()}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#062015] ${
                          isAbsent ? 'bg-rose-500' : 'bg-emerald-400'
                        }`}
                        title={isAbsent ? 'Absent (On Leave)' : 'Present (On Duty)'}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-emerald-100 text-sm truncate">{p.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#072417] text-[#fcd38d] border border-[#d99b43]/30">
                          #{p.rep_code}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#d99b43]/20 text-[#fcd38d] border border-[#d99b43]/40">
                            HQ Admin
                          </span>
                        )}
                        {/* Attendance Chip */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                            isAbsent
                              ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                              : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                          }`}
                        >
                          {isAbsent ? (
                            <>
                              <XCircle className="w-3 h-3 text-rose-400" /> Absent
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-400" /> Present
                            </>
                          )}
                        </span>
                        {p.is_locked && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-300/70">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {p.territory || 'Operations HQ'}
                        </span>
                        {p.phone && (
                          <span className="flex items-center gap-1 font-mono text-[#f6cb82]">
                            <Phone className="w-3 h-3 text-[#d99b43]" />
                            {p.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Attendance toggle */}
                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-center shrink-0">
                    {/* Attendance quick switch button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAttendance(p.rep_code, isAbsent)}
                      title={isAbsent ? 'Mark as Present' : 'Mark as Absent'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                        isAbsent
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
                      }`}
                    >
                      {isAbsent ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Mark Present
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> Mark Absent
                        </>
                      )}
                    </button>

                    {isAdmin && onOpenUserProfile && (
                      <button
                        type="button"
                        onClick={onOpenUserProfile}
                        className="px-2.5 py-1.5 rounded-lg bg-[#072417] hover:bg-[#0a3020] text-[#fcd38d] text-xs font-medium border border-[#d99b43]/30 flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#d99b43]" />
                        Edit Admin Info
                      </button>
                    )}

                    {!isAdmin && (
                      <>
                        {/* Edit & Reassign Employee button (User requirement!) */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          title="Edit employee and reassign this Rep Code to someone new"
                          className="px-2.5 py-1.5 rounded-lg bg-[#072417] hover:bg-[#0a3020] text-[#fcd38d] text-xs font-semibold border border-[#d99b43]/40 flex items-center gap-1 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#d99b43]" />
                          <span>Edit / Reassign</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLock(p.rep_code, p.is_locked)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                            p.is_locked
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-[#072417] hover:bg-[#0a3020] text-emerald-200 border-[#14532d]'
                          }`}
                        >
                          {p.is_locked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Unlock
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-emerald-500/70" /> Lock
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenPasswordReset(p.rep_code)}
                          title="Reset rep password with Admin Master Key"
                          className="px-2 py-1.5 rounded-lg bg-[#072417] hover:bg-[#0a3020] text-emerald-200 text-xs font-medium border border-[#14532d] flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#d99b43]" />
                          Reset
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRep(p.id, p.name)}
                          className="p-1.5 rounded-lg text-emerald-500/70 hover:text-rose-400 hover:bg-[#072417] transition-colors"
                          title="Delete Rep"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#0f4024] bg-[#03150d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#083822] hover:bg-[#0d4a2d] text-emerald-100 text-xs font-semibold transition-colors border border-[#14532d]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
