import { Area, ComputedAreaStatus, ComputedStatusType } from '../types/database';

/**
 * Pure function Status Engine implementing the 5 strict sequential rules:
 * 1. Completed Today (emerald #10b981)
 * 2. Pending Assignment (sky #0ea5e9)
 * 3. Delayed (rose #f43f5e)
 * 4. Due Tomorrow (amber #f59e0b)
 * 5. In-Progress (sky #0ea5e9)
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

  // 1. Completed Today Check
  if (area.last_completed_date && isSameDay(area.last_completed_date, today)) {
    const repName = area.completed_by_name || 'Assigned Rep';
    const repCode = area.completed_by_rep_code ? ` (${area.completed_by_rep_code})` : '';
    return {
      status: 'completed',
      badgeLabel: 'Completed Today',
      badgeColorClass: 'text-emerald-400',
      badgeBgClass: 'bg-emerald-950/60',
      badgeBorderClass: 'border-emerald-500/40',
      dueText: `Completed today by ${repName}${repCode}`,
      delayDays: 0,
      daysRemaining: 0,
      formattedDueDate: formatShortDate(area.next_visit_due_date),
      isCompletedToday: true,
      canSendReminder: false,
    };
  }

  // 2. Pending Assignment / First Visit Check
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

  // 3. Delayed (diffDays <= 0)
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

  // 4. Due Tomorrow (diffDays === 1)
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

  // 5. In-Progress (diffDays > 1)
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
