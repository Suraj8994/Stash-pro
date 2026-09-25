export type UserRole = 'admin' | 'sales_rep';

export interface Profile {
  id: string;
  rep_code: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  territory?: string | null;
  failed_login_attempts: number;
  is_locked: boolean;
  is_password_set: boolean;
  created_at?: string;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  district: string;
  category: string; // Supermarket | Wholesale | Pharmacy | Convenience | Retail
  address: string;
  client_contact: string;
  client_phone: string;
  assigned_rep_ids: string[];
  assigned_rep_codes: string[];
  assigned_rep_names: string[];
  visit_interval_days: number;
  last_completed_date: string | null;
  completed_by_name: string | null;
  completed_by_rep_code: string | null;
  next_visit_due_date: string | null;
  notes: string | null;
  order_potential: string | null;
  created_at?: string;
}

export interface ActivityNotification {
  id: string;
  area_id: string;
  area_name: string;
  rep_id: string | null;
  rep_name: string;
  rep_code: string;
  type: 'completed' | 'reminder';
  message: string;
  created_at: string;
}

export type ComputedStatusType = 'completed' | 'in_progress' | 'due_tomorrow' | 'delayed';

export interface ComputedAreaStatus {
  status: ComputedStatusType;
  badgeLabel: string;
  badgeColorClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  dueText: string;
  delayDays: number;
  daysRemaining: number;
  formattedDueDate: string;
  isCompletedToday: boolean;
  canSendReminder: boolean;
}
