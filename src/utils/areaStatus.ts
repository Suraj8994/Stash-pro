import { Area, ComputedAreaStatus, ComputedStatusType, Profile, EffectiveAssigneeResult } from '../types/database';

/**
 * Status Engine implementing the cadence lifecycle:
 * - Once checked in, the outlet remains COMPLETED right till 2 days before the next order date.
 * - At 2 days remaining (diffDays === 2): Transitions to "Due in 2 Days".
 * - At 1 day remaining (diffDays === 1): Transitions to "Due Tomorrow".
 * - At 0 days or less (diffDays <= 0): Transitions to "Delayed / Overdue".
 * - If no previous check-in exists: "First Visit Due" / "In-Progress".
 */

function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(d1: Date | string | null, d2: Date = new Date()): boolean {
  if (!d1) return false;
  const date1 = new Date(d1);
  if (isNaN(date1.getTime())) return false;
  return (
    date1.getFullYear() === d2.getFullYear() &&
    date1.getMonth() === d2.getMonth() &&
    date1.getDate() === d2.getDate()
  );
}

export function formatShortDate(dateInput: Date | string | null): string {
  if (!dateInput) return 'Unscheduled';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function computeAreaStatus(area: Area, referenceDate: Date = new Date()): ComputedAreaStatus {
  const today = toMidnight(referenceDate);

  // 1. Pending Assignment / First Onboarding Visit Check
  if (!area.next_visit_due_date) {
    return {
      status: 'in_progress',
      badgeLabel: 'First Visit Due',
      badgeColorClass: 'text-sky-400',
      badgeBgClass: 'bg-sky-950/60',
      badgeBorderClass: 'border-sky-500/40',
      dueText: 'First onboarding visit required',
      delayDays: 0,
      daysRemaining: 0,
      formattedDueDate: 'Pending',
      isCompletedToday: false,
      canSendReminder: false,
    };
  }

  const dueDate = toMidnight(new Date(area.next_visit_due_date));
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const formattedDueDate = formatShortDate(dueDate);
  const repName = area.completed_by_name || 'Assigned Rep';
  const repCode = area.completed_by_rep_code ? ` (${area.completed_by_rep_code})` : '';

  // 2. Delayed (diffDays <= 0)
  if (diffDays <= 0) {
    const delayDays = diffDays === 0 ? 1 : Math.abs(diffDays) + 1;
    const dueText = diffDays === 0 ? 'Due Today' : `Overdue (${formattedDueDate})`;
    const badgeLabel = delayDays === 1 ? '1d Overdue' : `${delayDays}d Overdue`;

    return {
      status: 'delayed',
      badgeLabel,
      badgeColorClass: 'text-rose-400',
      badgeBgClass: 'bg-rose-950/60',
      badgeBorderClass: 'border-rose-500/40',
      dueText,
      delayDays,
      daysRemaining: 0,
      formattedDueDate,
      isCompletedToday: false,
      canSendReminder: true,
    };
  }

  // 3. Due Tomorrow (diffDays === 1)
  if (diffDays === 1) {
    return {
      status: 'due_tomorrow',
      badgeLabel: 'Due Tomorrow',
      badgeColorClass: 'text-amber-400',
      badgeBgClass: 'bg-amber-950/60',
      badgeBorderClass: 'border-amber-500/40',
      dueText: `Tomorrow (${formattedDueDate})`,
      delayDays: 0,
      daysRemaining: 1,
      formattedDueDate,
      isCompletedToday: false,
      canSendReminder: true,
    };
  }

  // 4. Check-in completed lifecycle rule:
  // "when i click on check in button then it should be marked as completed right till 2 days before next order date."
  // When an area has been completed and diffDays > 2 (i.e. more than 2 days before next order date),
  // it is in the COMPLETED state!
  if (area.last_completed_date && diffDays > 2) {
    const completedToday = isSameDay(area.last_completed_date, today);
    return {
      status: 'completed',
      badgeLabel: completedToday ? 'Completed Today' : 'Completed (On Track)',
      badgeColorClass: 'text-emerald-400',
      badgeBgClass: 'bg-emerald-950/60',
      badgeBorderClass: 'border-emerald-500/40',
      dueText: completedToday
        ? `Completed today by ${repName}${repCode}`
        : `Completed • Next order on ${formattedDueDate}`,
      delayDays: 0,
      daysRemaining: diffDays,
      formattedDueDate,
      isCompletedToday: true,
      canSendReminder: false,
    };
  }

  // 5. At 2 days remaining (diffDays === 2): Order preparation window opens
  if (diffDays === 2) {
    return {
      status: 'due_tomorrow',
      badgeLabel: 'Due in 2 days',
      badgeColorClass: 'text-amber-400',
      badgeBgClass: 'bg-amber-950/60',
      badgeBorderClass: 'border-amber-500/40',
      dueText: `Order due in 2 days (${formattedDueDate})`,
      delayDays: 0,
      daysRemaining: 2,
      formattedDueDate,
      isCompletedToday: false,
      canSendReminder: true,
    };
  }

  // 6. Default In-Progress (for newly added areas with future dates before check-in)
  return {
    status: 'in_progress',
    badgeLabel: `${diffDays}d remaining`,
    badgeColorClass: 'text-sky-400',
    badgeBgClass: 'bg-sky-950/60',
    badgeBorderClass: 'border-sky-500/40',
    dueText: `Due ${formattedDueDate}`,
    delayDays: 0,
    daysRemaining: diffDays,
    formattedDueDate,
    isCompletedToday: false,
    canSendReminder: false,
  };
}

/**
 * Priority-Wise Absenteeism & Delegation Engine:
 * Evaluates assigned reps in priority order (P1 -> P2 -> P3...).
 * If P1 is absent (is_absent === true), the task automatically cascades
 * to the first available present representative (P2).
 */
export function getEffectiveAssignee(area: Area, profiles: Profile[]): EffectiveAssigneeResult {
  if (!area.assigned_rep_ids || area.assigned_rep_ids.length === 0) {
    return {
      activeRepId: null,
      activeRepCode: null,
      activeRepName: null,
      priorityIndex: -1,
      isBackupActive: false,
      absentPredecessors: [],
      allAssignedAbsent: false,
    };
  }

  const absentPredecessors: { name: string; rep_code: string; priority: number }[] = [];

  for (let i = 0; i < area.assigned_rep_ids.length; i++) {
    const repId = area.assigned_rep_ids[i];
    const repCode = area.assigned_rep_codes?.[i];
    const repName = area.assigned_rep_names?.[i] || 'Field Rep';
    const profile = profiles.find((p) => p.id === repId || (repCode && p.rep_code === repCode));

    if (profile?.is_absent) {
      absentPredecessors.push({
        name: profile.name || repName,
        rep_code: profile.rep_code || repCode || '',
        priority: i + 1,
      });
      continue; // Move to next priority person
    }

    // Found the first available present representative!
    return {
      activeRepId: repId,
      activeRepCode: repCode || profile?.rep_code || null,
      activeRepName: profile?.name || repName,
      priorityIndex: i,
      isBackupActive: i > 0,
      absentPredecessors,
      allAssignedAbsent: false,
    };
  }

  // All assigned reps for this area are absent!
  return {
    activeRepId: null,
    activeRepCode: null,
    activeRepName: null,
    priorityIndex: -1,
    isBackupActive: false,
    absentPredecessors,
    allAssignedAbsent: true,
  };
}
