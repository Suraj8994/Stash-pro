import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Area, Profile, ActivityNotification, ComputedStatusType } from '../types/database';
import { databaseService } from '../lib/databaseService';
import { computeAreaStatus } from '../utils/areaStatus';

interface AppContextType {
  profiles: Profile[];
  areas: Area[];
  notifications: ActivityNotification[];
  currentUser: Profile | null;
  loading: boolean;
  isRealtimeActive: boolean;
  statusCounts: {
    delayed: number;
    due_tomorrow: number;
    completed_today: number;
    in_progress: number;
    total: number;
  };
  login: (repCode: string, passwordInput: string) => Promise<{ success: boolean; error?: string; isLocked?: boolean }>;
  logout: () => void;
  setCurrentUser: (user: Profile | null) => void;
  checkIn: (areaId: string, notes: string, orderPotential?: string) => Promise<{ success: boolean; error?: string }>;
  sendReminder: (area: Area) => Promise<{ success: boolean; error?: string }>;
  createArea: (data: Partial<Area>) => Promise<{ success: boolean; error?: string }>;
  updateArea: (id: string, data: Partial<Area>) => Promise<{ success: boolean; error?: string }>;
  deleteArea: (id: string) => Promise<{ success: boolean; error?: string }>;
  addRep: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  updateRep: (id: string, updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  toggleRepLock: (repCode: string, isLocked: boolean) => Promise<{ success: boolean; error?: string }>;
  toggleRepAttendance: (repCode: string, isAbsent: boolean) => Promise<{ success: boolean; error?: string }>;
  updateProfileMobileAndName: (
    repCodeOrUsername: string,
    currentPassword: string,
    newMobile: string,
    newName?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteRep: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetRepPassword: (repCode: string, newPass: string, masterKey: string) => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<void>;
  resetToSeed: () => Promise<void>;
  activeFilterStatus: ComputedStatusType | 'all';
  setActiveFilterStatus: (status: ComputedStatusType | 'all') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);
  const [activeFilterStatus, setActiveFilterStatus] = useState<ComputedStatusType | 'all'>('all');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [fetchedProfiles, fetchedAreas, fetchedNotifs] = await Promise.all([
        databaseService.fetchProfiles(),
        databaseService.fetchAreas(),
        databaseService.fetchActivityLog(),
      ]);

      setProfiles(fetchedProfiles);
      setAreas(fetchedAreas);
      setNotifications(fetchedNotifs);

      // Restore active user from localStorage or keep current user in sync
      const savedCode = typeof window !== 'undefined' ? localStorage.getItem('dt_active_rep_code') : null;
      if (savedCode) {
        const match = fetchedProfiles.find((p) => p.rep_code === savedCode);
        if (match) {
          setCurrentUser(match);
        } else if (fetchedProfiles.length > 0) {
          setCurrentUser(fetchedProfiles[0]);
        }
      } else {
        // Default to Admin (Anil Sakpal)
        const adminProfile = fetchedProfiles.find((p) => p.role === 'admin') || fetchedProfiles[0];
        if (adminProfile) {
          setCurrentUser(adminProfile);
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = databaseService.subscribeRealtime(
      () => {
        databaseService.fetchAreas().then(setAreas);
        databaseService.fetchProfiles().then(setProfiles);
      },
      (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Compute status counts
  const statusCounts = useMemo(() => {
    let delayed = 0;
    let due_tomorrow = 0;
    let completed_today = 0;
    let in_progress = 0;

    areas.forEach((area) => {
      const { status } = computeAreaStatus(area);
      if (status === 'delayed') delayed++;
      else if (status === 'due_tomorrow') due_tomorrow++;
      else if (status === 'completed') completed_today++;
      else if (status === 'in_progress') in_progress++;
    });

    return {
      delayed,
      due_tomorrow,
      completed_today,
      in_progress,
      total: areas.length,
    };
  }, [areas]);

  // Auth: Login
  const login = async (repCode: string, passwordInput: string) => {
    const res = await databaseService.authenticateRep(repCode, passwordInput);
    if (res.user) {
      setCurrentUser(res.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dt_active_rep_code', res.user.rep_code);
      }
      await loadData();
      return { success: true };
    }
    return {
      success: false,
      error: res.error || 'Authentication failed',
      isLocked: res.isLocked,
    };
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dt_active_rep_code');
    }
  };

  // Field check-in
  const checkIn = async (areaId: string, notes: string, orderPotential?: string) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    const res = await databaseService.checkInArea(areaId, currentUser, notes, orderPotential);
    if (res.success) {
      const updated = await databaseService.fetchAreas();
      setAreas(updated);
      const notifs = await databaseService.fetchActivityLog();
      setNotifications(notifs);
    }
    return res;
  };

  // Send reminder
  const sendReminder = async (area: Area) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    const res = await databaseService.sendReminder(area, currentUser);
    if (res.success) {
      const notifs = await databaseService.fetchActivityLog();
      setNotifications(notifs);
    }
    return res;
  };

  const createArea = async (data: Partial<Area>) => {
    const res = await databaseService.createArea(data);
    if (res.data) {
      setAreas((prev) => [...prev, res.data!]);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create area' };
  };

  const updateArea = async (id: string, data: Partial<Area>) => {
    const res = await databaseService.updateArea(id, data);
    if (res.data) {
      setAreas((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update area' };
  };

  const deleteArea = async (id: string) => {
    const res = await databaseService.deleteArea(id);
    if (res.success) {
      setAreas((prev) => prev.filter((a) => a.id !== id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to delete area' };
  };

  const addRep = async (data: Partial<Profile>) => {
    const res = await databaseService.addRep(data);
    if (res.data) {
      setProfiles((prev) => [...prev, res.data!]);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to add sales rep' };
  };

  const updateRep = async (id: string, updates: Partial<Profile>) => {
    const res = await databaseService.updateRep(id, updates);
    if (res.data) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? res.data! : p)));
      if (currentUser?.id === id) {
        setCurrentUser(res.data);
      }
      // Re-sync areas because area assignments might have updated names/codes
      const updatedAreas = await databaseService.fetchAreas();
      setAreas(updatedAreas);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update employee' };
  };

  const toggleRepLock = async (repCode: string, isLocked: boolean) => {
    const res = await databaseService.toggleRepLock(repCode, isLocked);
    if (res.success) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.rep_code === repCode ? { ...p, is_locked: isLocked, failed_login_attempts: isLocked ? 3 : 0 } : p
        )
      );
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update lock status' };
  };

  const toggleRepAttendance = async (repCode: string, isAbsent: boolean) => {
    const res = await databaseService.toggleRepAttendance(repCode, isAbsent);
    if (res.success && res.profile) {
      setProfiles((prev) =>
        prev.map((p) => (p.rep_code === repCode ? { ...p, is_absent: isAbsent } : p))
      );
      if (currentUser?.rep_code === repCode) {
        setCurrentUser((prev) => (prev ? { ...prev, is_absent: isAbsent } : null));
      }
      return { success: true };
    }
    return { success: false, error: 'Failed to update attendance' };
  };

  const updateProfileMobileAndName = async (
    repCodeOrUsername: string,
    currentPassword: string,
    newMobile: string,
    newName?: string
  ) => {
    const res = await databaseService.updateProfileMobileAndName(
      repCodeOrUsername,
      currentPassword,
      newMobile,
      newName
    );
    if (res.success && res.profile) {
      setProfiles((prev) =>
        prev.map((p) => (p.rep_code === res.profile!.rep_code ? res.profile! : p))
      );
      if (currentUser?.rep_code === res.profile.rep_code) {
        setCurrentUser(res.profile);
      }
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update profile' };
  };

  const deleteRep = async (id: string) => {
    const res = await databaseService.deleteRep(id);
    if (res.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to delete rep' };
  };

  const resetRepPassword = async (repCode: string, newPass: string, masterKey: string) => {
    const res = await databaseService.adminResetPassword(repCode, newPass, masterKey);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const refreshData = async () => {
    setLoading(true);
    await loadData();
    setLoading(false);
  };

  const resetToSeed = async () => {
    setLoading(true);
    await databaseService.resetDemoData();
    await loadData();
    setLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        areas,
        notifications,
        currentUser,
        loading,
        isRealtimeActive,
        statusCounts,
        login,
        logout,
        setCurrentUser,
        checkIn,
        sendReminder,
        createArea,
        updateArea,
        deleteArea,
        addRep,
        updateRep,
        toggleRepLock,
        toggleRepAttendance,
        updateProfileMobileAndName,
        deleteRep,
        resetRepPassword,
        refreshData,
        resetToSeed,
        activeFilterStatus,
        setActiveFilterStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
