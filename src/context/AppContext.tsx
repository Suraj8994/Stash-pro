import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Area, Profile, ActivityNotification, ComputedStatusType } from '../types/database';
import { databaseService } from '../lib/databaseService';
import { computeAreaStatus } from '../utils/areaStatus';
import { INITIAL_PROFILES } from '../data/initialData';

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
  setCurrentUser: (profile: Profile | null) => void;
  checkIn: (areaId: string, notes: string, orderPotential?: string) => Promise<{ success: boolean; error?: string }>;
  sendReminder: (area: Area) => Promise<{ success: boolean; error?: string }>;
  createArea: (data: Partial<Area>) => Promise<{ success: boolean; error?: string }>;
  updateArea: (id: string, data: Partial<Area>) => Promise<{ success: boolean; error?: string }>;
  deleteArea: (id: string) => Promise<{ success: boolean; error?: string }>;
  addRep: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  toggleRepLock: (repCode: string, isLocked: boolean) => Promise<{ success: boolean; error?: string }>;
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
  // Default logged-in user: Admin (Vikram Malhotra #100)
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const savedCode = localStorage.getItem('dt_active_rep_code');
    if (savedCode) {
      const match = INITIAL_PROFILES.find((p) => p.rep_code === savedCode);
      if (match) return match;
    }
    return INITIAL_PROFILES[0]; // Admin 100
  });

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

      // Keep current user updated
      if (currentUser) {
        const updatedSelf = fetchedProfiles.find((p) => p.id === currentUser.id || p.rep_code === currentUser.rep_code);
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
        }
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = databaseService.subscribeRealtime(
      () => {
        // Areas changed
        databaseService.fetchAreas().then(setAreas);
      },
      (newNotif) => {
        // New notification inserted
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Compute status counts for 2x2 metric cards
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
      localStorage.setItem('dt_active_rep_code', res.user.rep_code);
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
    localStorage.removeItem('dt_active_rep_code');
  };

  // Field check-in
  const checkIn = async (areaId: string, notes: string, orderPotential?: string) => {
    if (!currentUser) return { success: false, error: 'User not logged in' };
    const res = await databaseService.checkInArea(areaId, currentUser, notes, orderPotential);
    if (res.success) {
      // Refresh areas
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
    return { success: false, error: res.error || 'Failed to create outlet' };
  };

  const updateArea = async (id: string, data: Partial<Area>) => {
    const res = await databaseService.updateArea(id, data);
    if (res.data) {
      setAreas((prev) => prev.map((a) => (a.id === id ? res.data! : a)));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update outlet' };
  };

  const deleteArea = async (id: string) => {
    const res = await databaseService.deleteArea(id);
    if (res.success) {
      setAreas((prev) => prev.filter((a) => a.id !== id));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to delete outlet' };
  };

  const addRep = async (data: Partial<Profile>) => {
    const res = await databaseService.addRep(data);
    if (res.data) {
      setProfiles((prev) => [...prev, res.data!]);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to add sales rep' };
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
        toggleRepLock,
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
