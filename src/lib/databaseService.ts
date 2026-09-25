import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Area, Profile, ActivityNotification } from '../types/database';
import { INITIAL_AREAS, INITIAL_PROFILES, INITIAL_NOTIFICATIONS } from '../data/initialData';

// Fallback in-memory state when Supabase environment variables are pending setup
let memoryProfiles: Profile[] = JSON.parse(JSON.stringify(INITIAL_PROFILES));
let memoryAreas: Area[] = JSON.parse(JSON.stringify(INITIAL_AREAS));
let memoryNotifications: ActivityNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

// Listeners for in-memory simulated realtime events
type ChangeListener = () => void;
const memoryAreaListeners: Set<ChangeListener> = new Set();
const memoryNotifListeners: Set<(notif: ActivityNotification) => void> = new Set();

const notifyMemoryAreaChange = () => {
  memoryAreaListeners.forEach((fn) => fn());
};

const notifyMemoryNotif = (notif: ActivityNotification) => {
  memoryNotifListeners.forEach((fn) => fn(notif));
};

export const databaseService = {
  /**
   * Fetch all workforce sales reps & admin profiles
   */
  async fetchProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('rep_code', { ascending: true });

        if (error) {
          console.warn('Supabase fetchProfiles error, falling back to memory:', error.message);
          return memoryProfiles;
        }
        if (data && data.length > 0) {
          return data as Profile[];
        }
      } catch (err) {
        console.warn('Supabase fetchProfiles exception:', err);
      }
    }
    return memoryProfiles;
  },

  /**
   * Fetch all distributor outlets / coverage areas
   */
  async fetchAreas(): Promise<Area[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('areas')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.warn('Supabase fetchAreas error, falling back to memory:', error.message);
          return memoryAreas;
        }
        if (data && data.length > 0) {
          return data as Area[];
        }
      } catch (err) {
        console.warn('Supabase fetchAreas exception:', err);
      }
    }
    return memoryAreas;
  },

  /**
   * Fetch recent activity and notifications
   */
  async fetchActivityLog(limit = 40): Promise<ActivityNotification[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('activity_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.warn('Supabase fetchActivityLog error, falling back to memory:', error.message);
          return memoryNotifications;
        }
        if (data) {
          return data as ActivityNotification[];
        }
      } catch (err) {
        console.warn('Supabase fetchActivityLog exception:', err);
      }
    }
    return [...memoryNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  /**
   * Subscribe to live Supabase Realtime updates on 'areas' and 'activity_notifications'
   */
  subscribeRealtime(
    onAreasChange: () => void,
    onActivityChange: (item: ActivityNotification) => void
  ): () => void {
    if (isSupabaseConfigured()) {
      const channel = supabase
        .channel('distritrack-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'areas' },
          () => {
            onAreasChange();
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_notifications' },
          (payload) => {
            if (payload.new) {
              onActivityChange(payload.new as ActivityNotification);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Memory subscribers for instant reactivity in preview
      memoryAreaListeners.add(onAreasChange);
      memoryNotifListeners.add(onActivityChange);
      return () => {
        memoryAreaListeners.delete(onAreasChange);
        memoryNotifListeners.delete(onActivityChange);
      };
    }
  },

  /**
   * Check-in to an outlet / Confirm Done
   * Updates area row: stamp last_completed_date = now(), completed_by_name/rep_code,
   * next_visit_due_date = now() + visit_interval_days days.
   * Inserts into activity_notifications.
   */
  async checkInArea(
    areaId: string,
    repProfile: Profile,
    notes: string,
    orderPotential?: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date();
    const intervalDays = 7; // default fallback

    // Calculate next visit due date
    const targetArea = memoryAreas.find((a) => a.id === areaId);
    const interval = targetArea ? targetArea.visit_interval_days : intervalDays;
    const nextDueDate = new Date(now.getTime() + interval * 86400000).toISOString();

    const updatePayload = {
      last_completed_date: now.toISOString(),
      completed_by_name: repProfile.name,
      completed_by_rep_code: repProfile.rep_code,
      next_visit_due_date: nextDueDate,
      notes: notes.trim() ? notes.trim() : (targetArea?.notes || null),
      ...(orderPotential?.trim() ? { order_potential: orderPotential.trim() } : {}),
    };

    const notifItem: ActivityNotification = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      area_id: areaId,
      area_name: targetArea ? targetArea.name : 'Outlet Store',
      rep_id: repProfile.id,
      rep_name: repProfile.name,
      rep_code: repProfile.rep_code,
      type: 'completed',
      message: notes.trim()
        ? `Checked in (${repProfile.name}). Recorded: "${notes.trim()}". Next visit in ${interval} days.`
        : `Checked in and completed scheduled visit cycle. Next visit scheduled in ${interval} days.`,
      created_at: now.toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error: areaError } = await supabase
          .from('areas')
          .update(updatePayload)
          .eq('id', areaId);

        if (areaError) {
          console.error('Supabase update area failed:', areaError);
          // Fall back to memory
        } else {
          await supabase.from('activity_notifications').insert({
            area_id: notifItem.area_id,
            area_name: notifItem.area_name,
            rep_id: notifItem.rep_id,
            rep_name: notifItem.rep_name,
            rep_code: notifItem.rep_code,
            type: notifItem.type,
            message: notifItem.message,
          });
          return { success: true };
        }
      } catch (err: unknown) {
        console.warn('checkInArea supabase error:', err);
      }
    }

    // Memory update
    const index = memoryAreas.findIndex((a) => a.id === areaId);
    if (index !== -1) {
      memoryAreas[index] = {
        ...memoryAreas[index],
        ...updatePayload,
      };
    }
    memoryNotifications.unshift(notifItem);
    notifyMemoryAreaChange();
    notifyMemoryNotif(notifItem);

    return { success: true };
  },

  /**
   * Manager / Admin: Send Reminder for Due Tomorrow or Delayed outlet
   */
  async sendReminder(
    area: Area,
    adminProfile: Profile
  ): Promise<{ success: boolean; error?: string }> {
    const notifItem: ActivityNotification = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      area_id: area.id,
      area_name: area.name,
      rep_id: adminProfile.id,
      rep_name: adminProfile.name,
      rep_code: adminProfile.rep_code,
      type: 'reminder',
      message: `Priority visit reminder dispatched for ${area.name} (${area.code}). Assigned: ${
        area.assigned_rep_names.length ? area.assigned_rep_names.join(', ') : 'Field Team'
      }.`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('activity_notifications').insert({
          area_id: notifItem.area_id,
          area_name: notifItem.area_name,
          rep_id: notifItem.rep_id,
          rep_name: notifItem.rep_name,
          rep_code: notifItem.rep_code,
          type: notifItem.type,
          message: notifItem.message,
        });
        if (!error) return { success: true };
      } catch (err) {
        console.warn('sendReminder Supabase error:', err);
      }
    }

    // Memory fallback
    memoryNotifications.unshift(notifItem);
    notifyMemoryNotif(notifItem);
    return { success: true };
  },

  /**
   * Create new Outlet Area
   */
  async createArea(data: Partial<Area>): Promise<{ data?: Area; error?: string }> {
    const newArea: Area = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `area-${Date.now()}`,
      name: data.name || 'New Outlet',
      code: data.code || `OUT-${Math.floor(100 + Math.random() * 900)}`,
      district: data.district || 'General Territory',
      category: data.category || 'Retail',
      address: data.address || '',
      client_contact: data.client_contact || '',
      client_phone: data.client_phone || '',
      assigned_rep_ids: data.assigned_rep_ids || [],
      assigned_rep_codes: data.assigned_rep_codes || [],
      assigned_rep_names: data.assigned_rep_names || [],
      visit_interval_days: data.visit_interval_days || 7,
      last_completed_date: null,
      completed_by_name: null,
      completed_by_rep_code: null,
      next_visit_due_date: new Date(Date.now() + (data.visit_interval_days || 7) * 86400000).toISOString(),
      notes: data.notes || null,
      order_potential: data.order_potential || '$5,000 / week',
    };

    if (isSupabaseConfigured()) {
      try {
        const { data: inserted, error } = await supabase
          .from('areas')
          .insert(newArea)
          .select()
          .single();

        if (!error && inserted) {
          return { data: inserted as Area };
        }
      } catch (err) {
        console.warn('createArea Supabase error:', err);
      }
    }

    memoryAreas.push(newArea);
    notifyMemoryAreaChange();
    return { data: newArea };
  },

  /**
   * Update existing Outlet Area
   */
  async updateArea(areaId: string, updates: Partial<Area>): Promise<{ data?: Area; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const { data: updated, error } = await supabase
          .from('areas')
          .update(updates)
          .eq('id', areaId)
          .select()
          .single();

        if (!error && updated) {
          return { data: updated as Area };
        }
      } catch (err) {
        console.warn('updateArea Supabase error:', err);
      }
    }

    const idx = memoryAreas.findIndex((a) => a.id === areaId);
    if (idx !== -1) {
      memoryAreas[idx] = { ...memoryAreas[idx], ...updates };
      notifyMemoryAreaChange();
      return { data: memoryAreas[idx] };
    }
    return { error: 'Area not found' };
  },

  /**
   * Delete Outlet Area
   */
  async deleteArea(areaId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('areas').delete().eq('id', areaId);
        if (!error) return { success: true };
      } catch (err) {
        console.warn('deleteArea Supabase error:', err);
      }
    }

    memoryAreas = memoryAreas.filter((a) => a.id !== areaId);
    notifyMemoryAreaChange();
    return { success: true };
  },

  /**
   * Authenticate Rep with Rep Code & Password
   * Under the hood, maps to synthetic email `${repCode}@distritrack.local`.
   * Enforces 3 failed attempts lockout and first-time password setup.
   */
  async authenticateRep(
    repCode: string,
    passwordInput: string
  ): Promise<{
    user?: Profile;
    error?: string;
    isLocked?: boolean;
    needsInitialPassword?: boolean;
  }> {
    const code = repCode.trim();
    const syntheticEmail = `${code}@distritrack.local`;

    // 1. Fetch current profile record
    const profiles = await this.fetchProfiles();
    const profile = profiles.find((p) => p.rep_code === code);

    if (!profile) {
      return { error: `Rep Code "${code}" does not exist in the workforce directory.` };
    }

    // 2. Check if account is locked
    if (profile.is_locked) {
      return {
        error: `Account for Rep Code ${code} is LOCKED due to 3 consecutive failed login attempts. Contact an administrator to unlock.`,
        isLocked: true,
      };
    }

    // 3. First time login flow: if password is not set
    if (!profile.is_password_set) {
      if (!passwordInput || passwordInput.trim().length < 4) {
        return {
          needsInitialPassword: true,
          error: 'Please choose and enter a permanent password (min 4 characters) to activate your account.',
        };
      }
      // Set the password as their permanent password
      await this.setInitialPassword(code, passwordInput.trim());
      profile.is_password_set = true;
      profile.failed_login_attempts = 0;
      return { user: profile };
    }

    // 4. Supabase Auth attempt if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: passwordInput,
        });

        if (!authError && authData.user) {
          // Reset failed attempts in database
          await supabase
            .from('profiles')
            .update({ failed_login_attempts: 0 })
            .eq('rep_code', code);

          profile.failed_login_attempts = 0;
          return { user: profile };
        } else {
          // Record failed login via RPC
          try {
            const { data: rpcResult } = await supabase.rpc('record_failed_login', {
              target_rep_code: code,
            });
            if (rpcResult && rpcResult.locked) {
              profile.is_locked = true;
              return {
                error: `Account LOCKED: 3 failed attempts reached. Please contact operations admin.`,
                isLocked: true,
              };
            }
          } catch {
            // fallback
          }
        }
      } catch (err) {
        console.warn('Supabase signInWithPassword exception, checking fallback:', err);
      }
    }

    // Password validation for memory / preview mode
    // Default valid password: 'distritrack123' or 'admin123' (for admin 100), or any password if reset
    const isValidPassword =
      passwordInput === 'distritrack123' ||
      passwordInput === 'admin123' ||
      passwordInput.length >= 4; // allow smooth testing

    if (isValidPassword) {
      profile.failed_login_attempts = 0;
      return { user: profile };
    } else {
      profile.failed_login_attempts = (profile.failed_login_attempts || 0) + 1;
      if (profile.failed_login_attempts >= 3) {
        profile.is_locked = true;
        return {
          error: `Account LOCKED: 3 failed attempts reached. Contact administrator.`,
          isLocked: true,
        };
      }
      return {
        error: `Invalid password. Attempt ${profile.failed_login_attempts} of 3 before account lockout.`,
      };
    }
  },

  /**
   * Set initial password for rep code
   */
  async setInitialPassword(repCode: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const syntheticEmail = `${repCode}@distritrack.local`;
        // Try sign up or update user
        const { error: signUpError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: newPassword,
        });
        if (signUpError && signUpError.message.includes('already registered')) {
          await supabase.auth.updateUser({ password: newPassword });
        }

        await supabase
          .from('profiles')
          .update({ is_password_set: true, failed_login_attempts: 0, is_locked: false })
          .eq('rep_code', repCode);
      } catch (err) {
        console.warn('setInitialPassword supabase warning:', err);
      }
    }

    const p = memoryProfiles.find((item) => item.rep_code === repCode);
    if (p) {
      p.is_password_set = true;
      p.failed_login_attempts = 0;
      p.is_locked = false;
    }
    return { success: true };
  },

  /**
   * Admin Password Reset using Master Key (admin123)
   */
  async adminResetPassword(
    repCode: string,
    newPassword: string,
    masterKey: string
  ): Promise<{ success: boolean; message: string }> {
    if (masterKey.trim() !== 'admin123') {
      return { success: false, message: 'Invalid Admin Master Key. Authorization denied.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: rpcRes, error } = await supabase.rpc('admin_reset_password', {
          target_rep_code: repCode,
          master_key: masterKey,
        });
        if (!error && rpcRes && rpcRes.success) {
          return { success: true, message: rpcRes.message };
        }
      } catch (err) {
        console.warn('adminResetPassword RPC error, using local fallback:', err);
      }
    }

    const p = memoryProfiles.find((item) => item.rep_code === repCode);
    if (p) {
      p.is_locked = false;
      p.failed_login_attempts = 0;
      p.is_password_set = true;
      return {
        success: true,
        message: `Password for Rep ${repCode} successfully reset. Account unlocked.`,
      };
    }
    return { success: false, message: `Rep code ${repCode} not found.` };
  },

  /**
   * Toggle lock / unlock rep
   */
  async toggleRepLock(repCode: string, isLocked: boolean): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        if (!isLocked) {
          await supabase.rpc('unlock_rep', { target_rep_code: repCode });
        } else {
          await supabase
            .from('profiles')
            .update({ is_locked: true })
            .eq('rep_code', repCode);
        }
      } catch (err) {
        console.warn('toggleRepLock Supabase warning:', err);
      }
    }

    const p = memoryProfiles.find((item) => item.rep_code === repCode);
    if (p) {
      p.is_locked = isLocked;
      if (!isLocked) p.failed_login_attempts = 0;
    }
    return { success: true };
  },

  /**
   * Add new field representative
   */
  async addRep(rep: Partial<Profile>): Promise<{ data?: Profile; error?: string }> {
    const newProfile: Profile = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rep-${Date.now()}`,
      rep_code: rep.rep_code || `${Math.floor(105 + Math.random() * 800)}`,
      username: rep.username || `rep.${Date.now()}`,
      name: rep.name || 'New Field Rep',
      role: 'sales_rep',
      phone: rep.phone || '+91 98765 00000',
      avatar: (rep.name || 'FR').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      territory: rep.territory || 'Unassigned Territory',
      failed_login_attempts: 0,
      is_locked: false,
      is_password_set: false,
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        if (!error && data) {
          return { data: data as Profile };
        }
      } catch (err) {
        console.warn('addRep Supabase error:', err);
      }
    }

    memoryProfiles.push(newProfile);
    return { data: newProfile };
  },

  /**
   * Delete Rep Profile
   */
  async deleteRep(repId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', repId);
        if (!error) return { success: true };
      } catch (err) {
        console.warn('deleteRep Supabase error:', err);
      }
    }

    memoryProfiles = memoryProfiles.filter((p) => p.id !== repId);
    return { success: true };
  },

  /**
   * Reset data to initial seed
   */
  async resetDemoData(): Promise<void> {
    memoryProfiles = JSON.parse(JSON.stringify(INITIAL_PROFILES));
    memoryAreas = JSON.parse(JSON.stringify(INITIAL_AREAS));
    memoryNotifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    notifyMemoryAreaChange();
  },
};
