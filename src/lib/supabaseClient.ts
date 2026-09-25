import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Support checking custom runtime setting if user enters in UI modal
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('dt_custom_supabase_url')?.trim() : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('dt_custom_supabase_anon_key')?.trim() : null;

const effectiveUrl = storedUrl || envUrl || '';
const effectiveKey = storedKey || envKey || '';

export const isSupabaseConfigured = (): boolean => {
  if (!effectiveUrl || !effectiveKey) return false;
  try {
    const url = new URL(effectiveUrl);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !effectiveUrl.includes('your-project-ref') &&
      !effectiveUrl.includes('example.com')
    );
  } catch {
    return false;
  }
};

// Fallback safe client url to prevent createClient constructor from throwing on invalid URL in preview
const safeUrl = isSupabaseConfigured() ? effectiveUrl : 'https://placeholder-distritrack.supabase.co';
const safeKey = isSupabaseConfigured() ? effectiveKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const getSupabaseConfig = () => ({
  url: effectiveUrl,
  hasKey: Boolean(effectiveKey),
  isConfigured: isSupabaseConfigured(),
  source: storedUrl ? 'manual_override' : (envUrl ? 'env' : 'demo_mode'),
});

export const setCustomSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('dt_custom_supabase_url', url.trim());
      localStorage.setItem('dt_custom_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('dt_custom_supabase_url');
      localStorage.removeItem('dt_custom_supabase_anon_key');
    }
    window.location.reload();
  }
};
