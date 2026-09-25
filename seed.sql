-- ==============================================================================
-- Remix DistriTrack: Seed Data
-- ==============================================================================

-- Clear existing data
truncate table activity_notifications cascade;
truncate table areas cascade;
delete from profiles;

-- Insert Profiles (Admin and Field Sales Reps)
insert into profiles (id, rep_code, username, name, role, phone, avatar, territory, failed_login_attempts, is_locked, is_password_set)
values
  ('11111111-1111-1111-1111-111111111100', '100', 'admin', 'Vikram Malhotra', 'admin', '+91 98201 00100', 'VM', 'Operations HQ', 0, false, true),
  ('11111111-1111-1111-1111-111111111101', '101', 'rahul.sharma', 'Rahul Sharma', 'sales_rep', '+91 98192 10101', 'RS', 'North Sector FMCG', 0, false, true),
  ('11111111-1111-1111-1111-111111111102', '102', 'priya.patel', 'Priya Patel', 'sales_rep', '+91 98214 10202', 'PP', 'Central Downtown Market', 0, false, true),
  ('11111111-1111-1111-1111-111111111103', '103', 'amit.kumar', 'Amit Kumar', 'sales_rep', '+91 98118 10303', 'AK', 'Industrial Corridor South', 0, false, false),
  ('11111111-1111-1111-1111-111111111104', '104', 'sara.khan', 'Sara Khan', 'sales_rep', '+91 98312 10404', 'SK', 'Suburban East Mall Hub', 0, false, true);

-- Insert 8 Outlets / Areas across diverse territories and categories
-- Mix of: Completed Today, Due Tomorrow, Delayed, and In-Progress
insert into areas (
  id, name, code, district, category, address, client_contact, client_phone,
  assigned_rep_ids, assigned_rep_codes, assigned_rep_names,
  visit_interval_days, last_completed_date, completed_by_name, completed_by_rep_code,
  next_visit_due_date, notes, order_potential
)
values
  -- 1. Completed Today (North FMCG, Rahul Sharma)
  (
    '22222222-2222-2222-2222-222222222201',
    'Apex Grand Hypermarket',
    'OUT-N-101',
    'North Sector FMCG',
    'Supermarket',
    '742 North Boulevard, Metro Sector 14',
    'Rajesh Singhania',
    '+91 98201 83911',
    array['11111111-1111-1111-1111-111111111101'::uuid],
    array['101'],
    array['Rahul Sharma'],
    5,
    now(),
    'Rahul Sharma',
    '101',
    now() + interval '5 days',
    'Restocked rolling papers display & confectionery endcap. High festival demand expected.',
    '₹14,500 / week'
  ),

  -- 2. Delayed by 2 days (North FMCG, Rahul Sharma)
  (
    '22222222-2222-2222-2222-222222222202',
    'Evergreen Grocery & Dairy',
    'OUT-N-102',
    'North Sector FMCG',
    'Convenience',
    '19 Pine Crest Way, Sector 9',
    'Harish Verma',
    '+91 98450 43288',
    array['11111111-1111-1111-1111-111111111101'::uuid],
    array['101'],
    array['Rahul Sharma'],
    4,
    now() - interval '6 days',
    'Rahul Sharma',
    '101',
    now() - interval '2 days',
    'Shopkeeper requested bulk discount on counter cartons. Payment cleared.',
    '₹3,200 / week'
  ),

  -- 3. Due Tomorrow (Central Downtown, Priya Patel)
  (
    '22222222-2222-2222-2222-222222222203',
    'City Centre Wholesale Hub',
    'OUT-C-201',
    'Central Downtown Market',
    'Wholesale',
    '500 Commercial Lane, Suite 4B',
    'Naveen Gupta',
    '+91 98112 90123',
    array['11111111-1111-1111-1111-111111111102'::uuid],
    array['102'],
    array['Priya Patel'],
    7,
    now() - interval '6 days',
    'Priya Patel',
    '102',
    now() + interval '1 day',
    'Quarterly reorder due. Check display stand in main aisle.',
    '₹28,000 / week'
  ),

  -- 4. In Progress (Central Downtown, Priya Patel)
  (
    '22222222-2222-2222-2222-222222222204',
    'Metro Care Pharmacy & Wellness',
    'OUT-C-202',
    'Central Downtown Market',
    'Pharmacy',
    '88 Victoria Plaza, 1st Cross',
    'Dr. Sunita Rao',
    '+91 98765 23456',
    array['11111111-1111-1111-1111-111111111102'::uuid],
    array['102'],
    array['Priya Patel'],
    6,
    now() - interval '3 days',
    'Priya Patel',
    '102',
    now() + interval '3 days',
    'OTC nutrition supplements shelf audit required. High turn-around.',
    '₹8,400 / week'
  ),

  -- 5. Delayed by 1 day (Industrial South, Amit Kumar)
  (
    '22222222-2222-2222-2222-222222222205',
    'Southgate Bulk Mart',
    'OUT-S-301',
    'Industrial Corridor South',
    'Wholesale',
    '14 Logistics Parkway, Gate 3',
    'Gopal Krishnan',
    '+91 98920 78901',
    array['11111111-1111-1111-1111-111111111103'::uuid],
    array['103'],
    array['Amit Kumar'],
    7,
    now() - interval '8 days',
    'Amit Kumar',
    '103',
    now() - interval '1 day',
    'High priority: inventory shortage in packaging units.',
    '₹35,000 / week'
  ),

  -- 6. In Progress (Pending First Visit) (Industrial South, Amit Kumar)
  (
    '22222222-2222-2222-2222-222222222206',
    'Corridor Express Mart',
    'OUT-S-302',
    'Industrial Corridor South',
    'Convenience',
    '33 Factory Road, Unit 12',
    'Manoj Tiwari',
    '+91 98670 67890',
    array['11111111-1111-1111-1111-111111111103'::uuid],
    array['103'],
    array['Amit Kumar'],
    4,
    null,
    null,
    null,
    null,
    'Newly onboarded retail partner. Introduce catalog and promotional scheme.',
    '₹4,500 / week'
  ),

  -- 7. Completed Today (Suburban East, Sara Khan)
  (
    '22222222-2222-2222-2222-222222222207',
    'Galleria Super Fresh Store',
    'OUT-E-401',
    'Suburban East Mall Hub',
    'Supermarket',
    'Mall Level 1, Galleria Promenade',
    'Farhan Akhtar',
    '+91 98230 34567',
    array['11111111-1111-1111-1111-111111111104'::uuid],
    array['104'],
    array['Sara Khan'],
    4,
    now(),
    'Sara Khan',
    '104',
    now() + interval '4 days',
    'Placed POS poster standee. Product display stands fully replenished.',
    '₹19,200 / week'
  ),

  -- 8. Due Tomorrow (Suburban East, Sara Khan)
  (
    '22222222-2222-2222-2222-222222222208',
    'Eastfield Family Chemist',
    'OUT-E-402',
    'Suburban East Mall Hub',
    'Pharmacy',
    '102 Eastfield High Street',
    'Anjali Mehta',
    '+91 98401 45678',
    array['11111111-1111-1111-1111-111111111104'::uuid],
    array['104'],
    array['Sara Khan'],
    5,
    now() - interval '4 days',
    'Sara Khan',
    '104',
    now() + interval '1 day',
    'Confirm receipt of new product batch #892.',
    '₹6,100 / week'
  );

-- Insert Sample Activity Notifications
insert into activity_notifications (
  area_id, area_name, rep_id, rep_name, rep_code, type, message, created_at
)
values
  (
    '22222222-2222-2222-2222-222222222201',
    'Apex Grand Hypermarket',
    '11111111-1111-1111-1111-111111111101',
    'Rahul Sharma',
    '101',
    'completed',
    'Completed 5-day cycle store visit and recorded ₹14,500 order.',
    now() - interval '42 minutes'
  ),
  (
    '22222222-2222-2222-2222-222222222207',
    'Galleria Super Fresh Store',
    '11111111-1111-1111-1111-111111111104',
    'Sara Khan',
    '104',
    'completed',
    'Checked in and completed scheduled 4-day cycle visit. Promos active.',
    now() - interval '2 hours'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'Evergreen Grocery & Dairy',
    '11111111-1111-1111-1111-111111111100',
    'Vikram Malhotra',
    '100',
    'reminder',
    'Dispatched visit reminder: 2 days delayed in North Sector.',
    now() - interval '3 hours'
  );
