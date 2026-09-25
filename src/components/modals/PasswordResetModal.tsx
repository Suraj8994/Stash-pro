import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface PasswordResetModalProps {
  initialRepCode?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  initialRepCode = '',
  isOpen,
  onClose,
}) => {
  const { profiles, resetRepPassword } = useApp();

  const [repCode, setRepCode] = useState(initialRepCode);
  const [newPassword, setNewPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (initialRepCode) {
      setRepCode(initialRepCode);
    }
    setNewPassword('');
    setMasterKey('');
    setStatusMessage(null);
  }, [initialRepCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repCode.trim()) {
      setStatusMessage({ text: 'Please enter a valid Rep Code.', isError: true });
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setStatusMessage({ text: 'New password must be at least 4 characters.', isError: true });
      return;
    }
    if (masterKey.trim() !== 'admin123') {
      setStatusMessage({ text: 'Invalid Admin Master Key. Must be "admin123".', isError: true });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await resetRepPassword(repCode.trim(), newPassword.trim(), masterKey.trim());
      if (res.success) {
        setStatusMessage({ text: res.message, isError: false });
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-50 text-lg">Admin Password Reset</h3>
              <p className="text-xs text-emerald-300/70">Master Key Authorization Flow</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Field representatives locked out after 3 failed attempts or forgotten credentials can have their password reset using the Operations Admin Master Key (<code className="text-[#fcd38d] font-mono bg-[#03150d] px-1.5 py-0.5 rounded border border-[#d99b43]/40">admin123</code>).
          </p>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {statusMessage.isError ? (
                <ShieldAlert className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Rep Code selector or input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-emerald-200/90">Target Rep Code</label>
            <select
              value={repCode}
              onChange={(e) => setRepCode(e.target.value)}
              className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 focus:outline-none focus:border-[#d99b43] font-mono transition-all"
            >
              <option value="">Select Rep Code...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.rep_code} className="bg-[#062015] text-white">
                  #{p.rep_code} — {p.name} {p.is_locked ? '(LOCKED)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-emerald-200/90">New Rep Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new permanent password (e.g. distritrack123)"
                className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43] transition-all"
              />
            </div>
          </div>

          {/* Admin Master Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-emerald-200/90 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d99b43]" />
                Admin Master Key
              </label>
              <span className="text-[10px] text-[#fcd38d] font-mono">Default: admin123</span>
            </div>
            <input
              type="password"
              required
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              placeholder="Enter master key (admin123)"
              className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 font-mono focus:outline-none focus:border-[#d99b43] transition-all"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#0f4024]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#14532d] hover:bg-[#07291a] text-emerald-300 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Authorizing & Resetting...' : 'Reset Rep Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
