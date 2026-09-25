import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfileMobileAndName } = useApp();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setMobile(currentUser.phone || '');
    }
    setPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.rep_code === '100';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!mobile.trim()) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your current password to authorize changes.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateProfileMobileAndName(
        currentUser.rep_code,
        password,
        mobile.trim(),
        isAdmin ? name.trim() : undefined
      );

      if (res.success) {
        setSuccessMessage('Profile and mobile number successfully verified and updated!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Failed to update. Please verify your password.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-50 text-base sm:text-lg">
                {isAdmin ? 'Admin Profile & Mobile' : 'Account Security & Mobile'}
              </h3>
              <p className="text-[11px] text-emerald-300/70">
                Authorized identity & contact update
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User Identity Chip */}
          <div className="p-3 rounded-xl bg-[#03150d] border border-[#14532d] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono border ${
                  isAdmin
                    ? 'bg-[#d99b43]/20 text-[#fcd38d] border-[#d99b43]/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-emerald-400/80 font-mono">
                  Rep Code: #{currentUser.rep_code} • {isAdmin ? 'Operations Admin' : 'Field Representative'}
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#072417] text-[#fcd38d] border border-[#d99b43]/30">
              {isAdmin ? 'Admin HQ' : 'Sales Rep'}
            </span>
          </div>

          {/* Name Field (Editable for Admin) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-emerald-200/90 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#d99b43]" />
              <span>Full Name</span>
              {!isAdmin && <span className="text-[10px] text-emerald-500">(Fixed by Admin)</span>}
            </label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anil Sakpal"
              className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {/* Mobile Number Field (Editable for both Admin and Rep) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-emerald-200/90 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#d99b43]" />
                <span>Mobile Number</span>
              </label>
              <span className="text-[10px] text-[#fcd38d] font-mono">Standard 10-digit</span>
            </div>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 8108941215"
              className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-emerald-700/60 font-mono focus:outline-none focus:border-[#d99b43] transition-all"
            />
          </div>

          {/* Password Authorization Field with Eye toggle icon */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-emerald-200/90 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#d99b43]" />
                <span>Verify Current Password</span>
              </label>
              <span className="text-[10px] text-emerald-400/70 font-mono">
                Encrypted
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to authorize change"
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
            <p className="text-[11px] text-emerald-400/60 leading-relaxed">
              To prevent unauthorized changes, confirming your current credentials is required.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#0f4024]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#14532d] hover:bg-[#07291a] text-emerald-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] hover:from-[#e4a852] hover:to-[#c48232] text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify & Save Mobile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
