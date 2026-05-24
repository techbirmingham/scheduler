-- ============================================================================
-- Sloss Tech Scheduler — database schema
-- ============================================================================
-- Run this once, top to bottom, in the SQL Editor of a NEW Supabase project.
-- It is safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE / DROP-then-CREATE).
--
-- WHAT THIS SETS UP
--   * The 9 entity tables your app already uses, plus a new `events` parent
--     so the tool can hold multiple years at once (Sloss Tech 2025, 2026, ...).
--   * A `team_members` table that is BOTH the sign-in allowlist AND the list of
--     people the audit trail can attribute changes to.
--   * An `audit_log` that records every insert/update/delete automatically.
--   * Row Level Security on every table, so the database is locked down.
--
-- DESIGN NOTES (deliberate choices, so nothing surprises you later)
--   * Table and column names match what the app's store already expects
--     (e.g. `sessiontypes`, `"startTime"`). Matching the code = nothing breaks.
--   * Relationships between sessions and speakers/tracks/etc. are kept as
--     ARRAY columns (uuid[]), exactly as the current app uses them. The only
--     enforced foreign key is `eventId` -> events, which is the new backbone.
--   * `startTime` / `endTime` / `date` are kept as TEXT to exactly match the
--     current app. Once the data backup is loaded we can tighten these.
--   * `speakers` has NO eventId — it is a master list shared across all years
--     (your single-source-of-truth goal). Speakers link to a year via sessions.
--
-- IMPORTANT — read the BOOTSTRAP section at the very bottom before you finish.
-- ============================================================================

create extension if not exists "pgcrypto";   -- provides gen_random_uuid()


-- ============================================================================
-- 1. EVENTS  — the new top-level container (one row per conference year)
-- ============================================================================
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  "startDate" date not null,
  "endDate"   date not null,
  timezone    text not null default 'America/Chicago',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null
);


-- ============================================================================
-- 2. SPEAKERS  — global master list (intentionally NOT scoped to one event)
-- ============================================================================
create table if not exists speakers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  title       text default '',
  company     text default '',
  bio         text default '',
  "photoUrl"  text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null
);


-- ============================================================================
-- 3. EVENT-SCOPED TAXONOMY  — venues, session types, tracks, etc.
--    Each row belongs to exactly one event via "eventId".
-- ============================================================================
create table if not exists venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text,
  capacity   integer,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists sessiontypes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists tracks (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists programs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists experiences (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists accesslevels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  "eventId"  uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);


-- ============================================================================
-- 4. SESSIONS  — the agenda items themselves
-- ============================================================================
create table if not exists sessions (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text default '',
  date              text,                       -- 'YYYY-MM-DD' (kept as text)
  "startTime"       text,                        -- kept as text to match app
  "endTime"         text,                        -- kept as text to match app
  "venueId"         uuid,                        -- loose ref (no FK), as today
  "sessionTypeId"   uuid,                        -- loose ref (no FK), as today
  "accessLevelId"   uuid,                        -- loose ref (no FK), as today
  "speakerIds"      uuid[] not null default '{}',
  "trackIds"        uuid[] not null default '{}',
  "organizationIds" uuid[] not null default '{}',
  "programIds"      uuid[] not null default '{}',
  "experienceIds"   uuid[] not null default '{}',
  "eventId"         uuid not null references events(id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id) on delete set null,
  updated_by        uuid references auth.users(id) on delete set null
);


-- ============================================================================
-- 5. TEAM_MEMBERS  — sign-in allowlist + the "who" for the audit trail
--    A Google/email login only works if that email exists here (see RLS below).
-- ============================================================================
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text default '',
  role       text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);


-- ============================================================================
-- 6. AUDIT_LOG  — append-only history of every change
--    Written automatically by triggers. Not editable through the app (no
--    write policy), so the history cannot be tampered with via the API.
-- ============================================================================
create table if not exists audit_log (
  id              uuid primary key default gen_random_uuid(),
  "tableName"     text not null,
  "recordId"      uuid,
  action          text not null check (action in ('INSERT','UPDATE','DELETE')),
  "changedBy"     uuid,
  "changedByEmail" text,
  "changedAt"     timestamptz not null default now(),
  "oldData"       jsonb,
  "newData"       jsonb
);


-- ============================================================================
-- 7. HELPER FUNCTIONS  — used by the Row Level Security policies
--    SECURITY DEFINER lets them read team_members without tripping RLS
--    (which would otherwise cause infinite recursion).
-- ============================================================================
create or replace function is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from team_members
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from team_members
    where lower(email) = lower(auth.jwt() ->> 'email')
      and role = 'admin'
  );
$$;


-- ============================================================================
-- 8. TRIGGER FUNCTIONS
-- ============================================================================

-- Stamps created_by / updated_by / updated_at automatically on every write,
-- using the id of whoever is signed in (auth.uid()).
create or replace function app_set_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- Writes one audit_log row for every insert / update / delete.
create or replace function app_record_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid  := auth.uid();
  v_email text  := (auth.jwt() ->> 'email');
begin
  if (tg_op = 'DELETE') then
    insert into audit_log ("tableName","recordId",action,"changedBy","changedByEmail","oldData","newData")
    values (tg_table_name, old.id, tg_op, v_actor, v_email, to_jsonb(old), null);
    return old;
  elsif (tg_op = 'UPDATE') then
    insert into audit_log ("tableName","recordId",action,"changedBy","changedByEmail","oldData","newData")
    values (tg_table_name, new.id, tg_op, v_actor, v_email, to_jsonb(old), to_jsonb(new));
    return new;
  else  -- INSERT
    insert into audit_log ("tableName","recordId",action,"changedBy","changedByEmail","oldData","newData")
    values (tg_table_name, new.id, tg_op, v_actor, v_email, null, to_jsonb(new));
    return new;
  end if;
end;
$$;


-- ============================================================================
-- 9. ATTACH TRIGGERS  — both triggers on every data table
-- ============================================================================
do $$
declare
  t text;
  audited_tables text[] := array[
    'events','speakers','venues','sessiontypes','tracks','organizations',
    'programs','experiences','accesslevels','sessions','team_members'
  ];
begin
  foreach t in array audited_tables loop
    execute format('drop trigger if exists %1$s_set_audit on %1$s;', t);
    execute format(
      'create trigger %1$s_set_audit before insert or update on %1$s '
      || 'for each row execute function app_set_audit_fields();', t);

    execute format('drop trigger if exists %1$s_audit on %1$s;', t);
    execute format(
      'create trigger %1$s_audit after insert or update or delete on %1$s '
      || 'for each row execute function app_record_audit();', t);
  end loop;
end;
$$;


-- ============================================================================
-- 10. ROW LEVEL SECURITY
--     With RLS on and these policies, ONLY signed-in users whose email is in
--     team_members can read or write. Anonymous visitors get nothing.
-- ============================================================================
alter table events        enable row level security;
alter table speakers      enable row level security;
alter table venues        enable row level security;
alter table sessiontypes  enable row level security;
alter table tracks        enable row level security;
alter table organizations enable row level security;
alter table programs      enable row level security;
alter table experiences   enable row level security;
alter table accesslevels  enable row level security;
alter table sessions      enable row level security;
alter table team_members  enable row level security;
alter table audit_log     enable row level security;

-- Full read/write for team members on the event data tables.
do $$
declare
  t text;
  data_tables text[] := array[
    'events','speakers','venues','sessiontypes','tracks','organizations',
    'programs','experiences','accesslevels','sessions'
  ];
begin
  foreach t in array data_tables loop
    execute format('drop policy if exists "team members full access" on %1$s;', t);
    execute format(
      'create policy "team members full access" on %1$s for all to authenticated '
      || 'using (is_team_member()) with check (is_team_member());', t);
  end loop;
end;
$$;

-- team_members: any team member can see the roster; only admins can change it.
drop policy if exists "team can read roster" on team_members;
create policy "team can read roster" on team_members
  for select to authenticated using (is_team_member());

drop policy if exists "admins manage roster" on team_members;
create policy "admins manage roster" on team_members
  for all to authenticated using (is_admin()) with check (is_admin());

-- audit_log: team members can READ history; nobody can write it via the API
-- (only the SECURITY DEFINER trigger writes here — that is intentional).
drop policy if exists "team can read audit" on audit_log;
create policy "team can read audit" on audit_log
  for select to authenticated using (is_team_member());


-- ============================================================================
-- 11. INDEXES  — keep per-event filtering and audit lookups fast
-- ============================================================================
create index if not exists idx_venues_event        on venues ("eventId");
create index if not exists idx_sessiontypes_event   on sessiontypes ("eventId");
create index if not exists idx_tracks_event         on tracks ("eventId");
create index if not exists idx_organizations_event  on organizations ("eventId");
create index if not exists idx_programs_event       on programs ("eventId");
create index if not exists idx_experiences_event    on experiences ("eventId");
create index if not exists idx_accesslevels_event   on accesslevels ("eventId");
create index if not exists idx_sessions_event       on sessions ("eventId");
create index if not exists idx_sessions_date        on sessions (date);
create index if not exists idx_audit_record         on audit_log ("tableName","recordId");
create index if not exists idx_audit_changed_at     on audit_log ("changedAt" desc);


-- ============================================================================
-- 12. BOOTSTRAP  — !! YOU MUST DO THIS OR THE APP STAYS LOCKED FOR EVERYONE !!
-- ----------------------------------------------------------------------------
-- RLS above means nobody can read or write until their email is in
-- team_members. Edit the values below, uncomment the two statements, and run
-- them. (You can also do this any time from the Table Editor.)
--
-- insert into events (name, "startDate", "endDate", timezone)
-- values ('Sloss Tech 2026', '2026-07-17', '2026-07-18', 'America/Chicago');
--
-- insert into team_members (email, name, role)
-- values ('YOUR-EMAIL@example.com', 'Your Name', 'admin');
--
-- Add the rest of the team the same way (use role 'editor' for non-admins).
-- ============================================================================
