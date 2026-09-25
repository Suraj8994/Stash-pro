/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LiveTrackingView } from './components/LiveTrackingView';
import { RepTasksView } from './components/RepTasksView';
import { CheckInModal } from './components/modals/CheckInModal';
import { AdminAreaModal } from './components/modals/AdminAreaModal';
import { AdminRepModal } from './components/modals/AdminRepModal';
import { PasswordResetModal } from './components/modals/PasswordResetModal';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { ActivityLogDrawer } from './components/modals/ActivityLogDrawer';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { Area } from './types/database';
import { RefreshCw } from 'lucide-react';

function MainLayout() {
  const { loading } = useApp();

  const [currentView, setCurrentView] = useState<'live_tracking' | 'rep_tasks'>('live_tracking');

  // Modals state
  const [activeCheckInArea, setActiveCheckInArea] = useState<Area | null>(null);
  const [adminAreaModalOpen, setAdminAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [adminRepModalOpen, setAdminRepModalOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [targetPasswordResetRepCode, setTargetPasswordResetRepCode] = useState<string | undefined>(undefined);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);

  const handleOpenAddArea = () => {
    setEditingArea(null);
    setAdminAreaModalOpen(true);
  };

  const handleOpenEditArea = (area: Area) => {
    setEditingArea(area);
    setAdminAreaModalOpen(true);
  };

  const handleOpenPasswordReset = (repCode?: string) => {
    setTargetPasswordResetRepCode(repCode);
    setPasswordResetOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#04130b] text-slate-100 flex flex-col font-sans selection:bg-[#d99b43]/30 selection:text-[#fde68a]">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenActivityLog={() => setActivityLogOpen(true)}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenPasswordReset={handleOpenPasswordReset}
        onOpenUserProfile={() => setUserProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Synchronizing distributor field operations database...
            </p>
          </div>
        ) : (
          <>
            {currentView === 'live_tracking' ? (
              <LiveTrackingView
                onOpenAddArea={handleOpenAddArea}
                onOpenEditArea={handleOpenEditArea}
                onOpenManageReps={() => setAdminRepModalOpen(true)}
                onOpenCheckIn={(area) => setActiveCheckInArea(area)}
              />
            ) : (
              <RepTasksView
                onOpenCheckIn={(area) => setActiveCheckInArea(area)}
                onOpenPasswordReset={handleOpenPasswordReset}
                onOpenUserProfile={() => setUserProfileModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      {activeCheckInArea && (
        <CheckInModal
          area={activeCheckInArea}
          isOpen={Boolean(activeCheckInArea)}
          onClose={() => setActiveCheckInArea(null)}
        />
      )}

      {adminAreaModalOpen && (
        <AdminAreaModal
          area={editingArea}
          isOpen={adminAreaModalOpen}
          onClose={() => {
            setAdminAreaModalOpen(false);
            setEditingArea(null);
          }}
        />
      )}

      {adminRepModalOpen && (
        <AdminRepModal
          isOpen={adminRepModalOpen}
          onClose={() => setAdminRepModalOpen(false)}
          onOpenPasswordReset={(code) => {
            setAdminRepModalOpen(false);
            handleOpenPasswordReset(code);
          }}
          onOpenUserProfile={() => setUserProfileModalOpen(true)}
        />
      )}

      {passwordResetOpen && (
        <PasswordResetModal
          initialRepCode={targetPasswordResetRepCode}
          isOpen={passwordResetOpen}
          onClose={() => {
            setPasswordResetOpen(false);
            setTargetPasswordResetRepCode(undefined);
          }}
        />
      )}

      {userProfileModalOpen && (
        <UserProfileModal
          isOpen={userProfileModalOpen}
          onClose={() => setUserProfileModalOpen(false)}
        />
      )}

      {activityLogOpen && (
        <ActivityLogDrawer
          isOpen={activityLogOpen}
          onClose={() => setActivityLogOpen(false)}
        />
      )}

      {supabaseModalOpen && (
        <SupabaseConfigModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
