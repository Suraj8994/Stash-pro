-- ==============================================================================
-- Remix DistriTrack: Database Schema & Functions for Supabase
-- ==============================================================================

-- 1. Profiles table (extends Supabase auth.users with rep-specific workforce fields)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  rep_code text unique not null,
  username text not null,
  name text not null,
  role text not null check (role in ('admin', 'sales_rep')),
  phone text,
  avatar text,
  territory text,
  failed_login_attempts int default 0,
  is_locked boolean default false,
  is_password_set boolean default false,
  created_at timestamptz default now()
);

-- 2. Areas / Outlets
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  district text,
  category text,
  address text,
  client_contact text,
  client_phone text,
  assigned_rep_ids uuid[] default '{}',
  assigned_rep_codes text[] default '{}',
  assigned_rep_names text[] default '{}',
  visit_interval_days int not null default 7,
  last_completed_date timestamptz,
  completed_by_name text,
  completed_by_rep_code text,
  next_visit_due_date timestamptz,
  notes text,
  order_potential text,
  created_at timestamptz default now()
);

-- 3. Activity / Notification Log
create table if not exists activity_notifications (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references areas(id) on delete cascade,
  area_name text,
  rep_id uuid references profiles(id),
  rep_name text,
  rep_code text,
  type text check (type in ('completed', 'reminder')),
  message text,
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table areas enable row level security;
alter table activity_notifications enable row level security;

-- 5. Policies
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles for select using (true);

drop policy if exists "read areas" on areas;
create policy "read areas" on areas for select using (true);

drop policy if exists "read log" on activity_notifications;
create policy "read log" on activity_notifications for select using (true);

drop policy if exists "manage areas" on areas;
create policy "manage areas" on areas for all using (true) with check (true);

drop policy if exists "manage profiles" on profiles;
create policy "manage profiles" on profiles for all using (true) with check (true);

drop policy if exists "insert log" on activity_notifications;
create policy "insert log" on activity_notifications for insert with check (true);

-- 6. RPC functions for safe authentication & workforce management

-- Record failed login and auto-lock after 3 attempts
create or replace function record_failed_login(target_rep_code text)
returns json
language plpgsql
security definer
as $$
declare
  current_fails int;
  profile_row profiles%rowtype;
begin
  select * into profile_row from profiles where rep_code = target_rep_code;
  if not found then
    return json_build_object('success', false, 'message', 'Rep code not found');
  end if;

  current_fails := coalesce(profile_row.failed_login_attempts, 0) + 1;

  if current_fails >= 3 then
    update profiles
    set failed_login_attempts = current_fails,
        is_locked = true
    where rep_code = target_rep_code;
    return json_build_object('success', true, 'locked', true, 'attempts', current_fails);
  else
    update profiles
    set failed_login_attempts = current_fails
    where rep_code = target_rep_code;
    return json_build_object('success', true, 'locked', false, 'attempts', current_fails);
  end if;
end;
$$;

-- Unlock rep code
create or replace function unlock_rep(target_rep_code text)
returns json
language plpgsql
security definer
as $$
begin
  update profiles
  set failed_login_attempts = 0,
      is_locked = false
  where rep_code = target_rep_code;

  return json_build_object('success', true, 'message', 'Rep unlocked successfully');
end;
$$;

-- Reset password with Admin Master Key (admin123)
create or replace function admin_reset_password(target_rep_code text, master_key text)
returns json
language plpgsql
security definer
as $$
begin
  if master_key <> 'admin123' then
    return json_build_object('success', false, 'message', 'Invalid Admin Master Key');
  end if;

  update profiles
  set failed_login_attempts = 0,
      is_locked = false,
      is_password_set = false
  where rep_code = target_rep_code;

  return json_build_object('success', true, 'message', 'Password reset. Rep can set new password on next login.');
end;
$$;
