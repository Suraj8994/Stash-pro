import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Users,
  Lock,
  Unlock,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertTriangle,
  Phone,
  MapPin,
  KeyRound,
} from 'lucide-react';

interface AdminRepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPasswordReset: (repCode?: string) => void;
}

export const AdminRepModal: React.FC<AdminRepModalProps> = ({
  isOpen,
  onClose,
  onOpenPasswordReset,
}) => {
  const { profiles, toggleRepLock, addRep, deleteRep, resetToSeed } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [repCode, setRepCode] = useState('');
  const [territory, setTerritory] = useState('');
  const [phone, setPhone] = useState('+91 98765 00000');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repCode.trim()) return;

    const res = await addRep({
      name: name.trim(),
      rep_code: repCode.trim(),
      territory: territory.trim() || 'General Territory',
      phone: phone.trim(),
    });

    if (res.success) {
      setName('');
      setRepCode('');
      setTerritory('');
      setShowAddForm(false);
      setActionSuccess('Sales representative added successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleToggleLock = async (code: string, currentLock: boolean) => {
    await toggleRepLock(code, !currentLock);
    setActionSuccess(`Rep #${code} ${currentLock ? 'unlocked' : 'locked'}.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDeleteRep = async (id: string, nameStr: string) => {
    if (confirm(`Remove sales representative "${nameStr}" from directory?`)) {
      await deleteRep(id);
    }
  };

  const handleResetData = async () => {
    if (confirm('Reset entire system data back to default FMCG outlets and rep profiles?')) {
      await resetToSeed();
      setActionSuccess('System reset to default seed successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-50 text-lg">Sales Workforce & Rep Directory</h3>
              <p className="text-xs text-emerald-300/70">
                Manage field representative access, monitor account lockouts, and reset credentials.
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              {actionSuccess}
            </div>
          )}

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#14532d]">
            <div className="text-xs text-emerald-300/70 font-medium">
              Total Personnel: <span className="text-emerald-100 font-bold">{profiles.length}</span> (
              {profiles.filter((p) => p.is_locked).length} locked)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d99b43] to-[#b47528] text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddForm ? 'Close Form' : 'Add Sales Rep'}
              </button>
              <button
                type="button"
                onClick={handleResetData}
                title="Reset demo data"
                className="px-3 py-1.5 rounded-lg border border-[#14532d] hover:bg-[#08301e] text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#d99b43]" />
                Reset Seed Data
              </button>
            </div>
          </div>

          {/* Add Rep Form Drawer */}
          {showAddForm && (
            <form onSubmit={handleCreateRep} className="p-4 rounded-xl bg-[#03150d] border border-[#d99b43]/40 space-y-3">
              <h4 className="text-xs font-semibold text-[#fcd38d] uppercase tracking-wider">
                Enroll New Field Sales Representative
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Maya Roy)"
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
                  placeholder="Assigned Territory (e.g. West Highway Hub)"
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  className="bg-[#062015] border border-[#14532d] rounded-lg px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (+91 98765 43210)"
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
                  className="px-4 py-1.5 rounded-lg bg-[#d99b43] hover:bg-[#c98b33] text-slate-950 text-xs font-semibold"
                >
                  Save Representative
                </button>
              </div>
            </form>
          )}

          {/* Rep Directory Table / List */}
          <div className="space-y-2.5">
            {profiles.map((p) => {
              const isAdmin = p.role === 'admin';
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    p.is_locked
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isAdmin
                      ? 'bg-[#03150d] border-[#14532d]'
                      : 'bg-[#03150d]/60 border-[#14532d]/70 hover:border-[#1e7845]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isAdmin
                          ? 'bg-[#083822] text-[#fcd38d] border-[#d99b43]/40'
                          : 'bg-[#072417] text-emerald-300 border-[#14532d]'
                      }`}
                    >
                      {p.avatar || p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-100 text-sm">{p.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#072417] text-[#fcd38d] border border-[#d99b43]/30">
                          #{p.rep_code}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#d99b43]/20 text-[#fcd38d] border border-[#d99b43]/40">
                            HQ Admin
                          </span>
                        )}
                        {p.is_locked && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Locked (3 Fails)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-emerald-300/70">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {p.territory || 'Operations HQ'}
                        </span>
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {p.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleLock(p.rep_code, p.is_locked)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
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
                          className="px-2.5 py-1.5 rounded-lg bg-[#072417] hover:bg-[#0a3020] text-emerald-200 text-xs font-medium border border-[#14532d] flex items-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-[#d99b43]" />
                          Reset Key
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
