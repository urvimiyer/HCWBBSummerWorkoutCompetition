-- HCWBB Summer Workout Competition — Database Schema

-- Seasons
create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- Users (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'player' check (role in ('player', 'coach', 'admin')),
  group_id uuid references groups(id) on delete set null,
  invited_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Workout types
create table if not exists workout_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  point_value int not null default 5,
  active boolean default true,
  created_at timestamptz default now()
);

-- Seed workout types
insert into workout_types (name, point_value) values
  ('Lift', 5),
  ('On Court Conditioning', 5),
  ('On Court Skills', 5),
  ('Open Run / Pickup / Summer League', 5),
  ('Yoga / Recovery / PT', 5),
  ('Long Distance Run', 5),
  ('Other Cardio (hike, bike, swim)', 5)
on conflict do nothing;

-- Entries
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  workout_type_id uuid not null references workout_types(id),
  points int not null default 5,
  date date not null,
  note text check (char_length(note) <= 100),
  photo_url text,
  created_at timestamptz default now(),
  edited_at timestamptz
);

-- Reactions
create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (emoji in ('👏', '💪', '🔥', '❤️')),
  created_at timestamptz default now(),
  unique(entry_id, user_id, emoji)
);

-- Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null check (char_length(text) <= 300),
  created_at timestamptz default now()
);

-- Monthly results (set when admin closes a month)
create table if not exists monthly_results (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  group_totals jsonb not null default '{}',
  winner_group_id uuid references groups(id),
  closed_at timestamptz,
  unique(season_id, month, year)
);

-- Invite tokens
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default gen_random_uuid()::text,
  email text,
  created_by uuid references profiles(id),
  used_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table groups enable row level security;
alter table entries enable row level security;
alter table reactions enable row level security;
alter table comments enable row level security;
alter table monthly_results enable row level security;
alter table workout_types enable row level security;
alter table invites enable row level security;
alter table seasons enable row level security;

-- Profiles: any authenticated user can read all profiles; users can update their own
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert" on profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update" on profiles for update to authenticated using (id = auth.uid());

-- Groups: any authenticated user can read
create policy "groups_select" on groups for select to authenticated using (true);
create policy "groups_admin_all" on groups for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Seasons: any authenticated user can read; admin can write
create policy "seasons_select" on seasons for select to authenticated using (true);
create policy "seasons_admin_all" on seasons for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Workout types: any authenticated user can read; admin can write
create policy "workout_types_select" on workout_types for select to authenticated using (true);
create policy "workout_types_admin_all" on workout_types for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Entries: any authenticated user can read all; users can insert/update their own (within 48h); admin can delete any
create policy "entries_select" on entries for select to authenticated using (true);
create policy "entries_insert" on entries for insert to authenticated with check (user_id = auth.uid());
create policy "entries_update_own" on entries for update to authenticated
  using (user_id = auth.uid() and created_at > now() - interval '48 hours');
create policy "entries_delete_admin" on entries for delete to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Reactions: any authenticated user can read; users manage their own
create policy "reactions_select" on reactions for select to authenticated using (true);
create policy "reactions_insert" on reactions for insert to authenticated with check (user_id = auth.uid());
create policy "reactions_delete" on reactions for delete to authenticated using (user_id = auth.uid());

-- Comments: any authenticated user can read; users can insert their own
create policy "comments_select" on comments for select to authenticated using (true);
create policy "comments_insert" on comments for insert to authenticated with check (user_id = auth.uid());
create policy "comments_delete" on comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Monthly results: any authenticated user can read; admin can write
create policy "monthly_results_select" on monthly_results for select to authenticated using (true);
create policy "monthly_results_admin_all" on monthly_results for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Invites: admin can read/write
create policy "invites_admin_all" on invites for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
-- Allow unauthenticated invite token lookup (for signup flow)
create policy "invites_public_select" on invites for select to anon using (true);
