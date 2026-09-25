import React, { useState } from 'react';
import {
  getSupabaseConfig,
  setCustomSupabaseCredentials,
  isSupabaseConfigured,
} from '../../lib/supabaseClient';
import {
  X,
  Database,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const config = getSupabaseConfig();
  const isConfigured = isSupabaseConfigured();
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(inputUrl, inputKey);
  };

  const handleClear = () => {
    setCustomSupabaseCredentials('', '');
    setInputUrl('');
    setInputKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#062015] border border-[#175c34] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#0f4024] bg-[#03150d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#083822] border border-[#d99b43]/40 flex items-center justify-center text-[#fcd38d]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-50 text-lg">Supabase Cloud Connection</h3>
              <p className="text-xs text-emerald-300/70">Postgres Database, RLS Policies & Realtime Engine</p>
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
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConfigured
                ? 'bg-[#031c11] border-emerald-500/40 text-emerald-200'
                : 'bg-[#081e13] border-[#d99b43]/40 text-[#fcd38d]'
            }`}
          >
            {isConfigured ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#d99b43] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {isConfigured
                  ? 'Connected to Live Supabase Project'
                  : 'Running in Standby / Interactive Local Mode'}
              </div>
              <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                {isConfigured
                  ? `Your app is syncing directly with Supabase Postgres at ${config.url}. Realtime updates and RLS are active.`
                  : 'DistriTrack is currently running with full interactive local storage (Admin Anil Sakpal & sales reps, live areas). All data persists across page refresh.'}
              </p>
            </div>
          </div>

          {/* Quick Steps Guide */}
          <div className="bg-[#03150d] p-4 rounded-xl border border-[#14532d] space-y-2 text-xs">
            <h4 className="font-semibold text-emerald-100 flex items-center justify-between">
              <span>Production Deployment Steps (Netlify / GitHub):</span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#fcd38d] hover:text-amber-200 inline-flex items-center gap-1 text-[11px]"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-emerald-300/70 leading-relaxed">
              <li>Create a new Supabase project (Postgres).</li>
              <li>Paste & run <code className="text-[#fcd38d] font-mono">schema.sql</code> and <code className="text-[#fcd38d] font-mono">seed.sql</code> in the SQL Editor.</li>
              <li>Under Database → Replication, enable Realtime on <code className="text-[#fcd38d] font-mono">areas</code> and <code className="text-[#fcd38d] font-mono">activity_notifications</code>.</li>
              <li>Push this repo to GitHub and import into Netlify.</li>
              <li>Add Netlify Environment Variables: <code className="text-emerald-400 font-mono">VITE_SUPABASE_URL</code> and <code className="text-emerald-400 font-mono">VITE_SUPABASE_ANON_KEY</code>.</li>
            </ol>
          </div>

          {/* Connect Custom Project in Preview form */}
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#d99b43]" />
              Test Direct Supabase Connection (Optional)
            </h4>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-emerald-300/80">VITE_SUPABASE_URL</label>
              <input
                type="url"
                placeholder="https://your-project-ref.supabase.co"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-[#03150d] border border-[#14532d] rounded-xl px-3 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-emerald-300/80">VITE_SUPABASE_ANON_KEY</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-[#03150d] border border-[#14532d] rounded-xl pl-3 pr-10 py-2 text-xs text-emerald-100 placeholder-emerald-700/60 focus:outline-none focus:border-[#d99b43] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide key' : 'Show key'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-emerald-400/60 hover:text-emerald-300 transition-colors"
              >
                Reset to Default Demo Mode
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d99b43] to-[#b47528] text-slate-950 text-xs font-semibold shadow-md transition-colors"
              >
                Apply & Connect
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#0f4024] bg-[#03150d] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#083822] hover:bg-[#0d4a2d] text-emerald-100 text-xs font-semibold transition-colors border border-[#14532d]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
