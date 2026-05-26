# Sloss Tech Scheduler

A multi-venue, multi-day conference scheduler built by TechBirmingham for
Sloss Tech and adjacent events. The organizing team uses it to plan and
publish the agenda; the same app will eventually serve attendees as the
public-facing schedule. Today it's gated behind a small allowlist while the
team gets the data into shape.

## Tech stack and why each piece is there

The frontend is **React 18 + TypeScript + Vite**. Vite is the right call for
a small SPA: dev server boots in under a second, HMR is fast, the production
build is a static bundle that Netlify can host without thinking. TypeScript
catches the easy class of "I forgot the schema changed" bug that hits a
loosely-typed app the moment the schema grows.

State lives in **Zustand** rather than Redux or Context. Zustand is barely
more than a useState that lives outside the component tree, which fits the
shape of this app — almost everything is "read the latest from Supabase, let
the UI re-derive." There's exactly one store (`src/store/index.ts`) holding
every entity collection plus the active event id; views select what they
need with hooks.

Data sits in **Supabase** (managed Postgres + Auth + RLS + Storage). The
schema is hand-written SQL in `supabase/schema.sql`. We do all writes
through the Supabase JS client from the browser; there is intentionally no
backend layer. Row Level Security is what keeps that safe — anonymous keys
get nothing, signed-in non-team-members get nothing, signed-in team members
get full read/write on the event data tables.

**TailwindCSS** for all styling. **FullCalendar** with the resource-timegrid
and resource-timeline plugins powers Grid and Timeline views (drag, resize,
snap-to-slot all handled by FullCalendar itself). **react-select** handles
the multi-select dropdowns on the session modal. **dayjs** for date
formatting, **Mapbox GL** for the venue map (with forward geocoding to
resolve venue addresses), **lucide-react** for icons. **React Router** for
the six tabs.

Auth is **Supabase Auth + Google OAuth**. The team's Google accounts sign
in; an `AuthGate` component checks the `team_members` table for that email
and either renders the app or shows a "not authorized" screen.

## Data model

The schema lives in `supabase/schema.sql` and is the source of truth. Eleven
tables, all locked down by RLS.

**`events`** is the top of the hierarchy. One row per conference instance
("Sloss Tech 2026", "Sloss Tech Summit Fall 2026"). Every other entity
except speakers carries an `eventId` FK pointing back here. This is what
makes the app multi-event from day one — you can have past, current, and
upcoming events all in the same database, and the EventPicker in the top
nav switches between them by calling `store.setCurrentEventId(id)`, which
clears stale filter selections and re-fetches all event-scoped data.

**`speakers` is deliberately not event-scoped.** Speakers are global. A
speaker who presents at Sloss Tech 2025 and again at 2026 is one row in the
DB, referenced from sessions of both years. This is the model the team
actually thinks in ("Everette Taylor spoke at Sloss Tech 2026") and it
keeps speaker bios and headshots from drifting across years.

**Event-scoped taxonomy tables** are `venues`, `sessiontypes`, `tracks`,
`programs`, `experiences`, `accesslevels`, and `organizations`. Each row
belongs to exactly one event. They've grown extra metadata as we've used
them: `sessiontypes.category` groups types into Session / Showcase /
Activation / Networking / Other; `tracks.color` drives the visual color of
session cards across the app; `organizations` carries `tier` (the
metallurgy-themed sponsorship ladder — Presenting, Partner, Steel, Iron,
Carbon, Nickel, General — plus non-package roles Community / Organizer /
Media), `cash_amount`, `in_kind_amount`, and free-form `notes`. There's an
older `in_kind` boolean still on the table for back-compat with rows that
predate the amount columns; new edits write the amounts.

**`programs`** has the most relational structure of any taxonomy entity. It
carries `hosted_by_org_ids uuid[]`, `presented_by_org_ids uuid[]`, and
`sponsor_org_ids uuid[]` — separate FK-array columns reflecting that a
program (Sloss Tech Dev, Next In Tech) can have a lead host org, one or two
co-presenters, and a list of contributing sponsors. Optional `host_label`
and `presenter_label` text columns let a specific program override the
default "Hosted by" / "Presented by" wording (e.g., a 501c3 might want
"Supported by" instead of "Presented by" for legal reasons).

**`sessions`** is the heaviest table. It carries the same `hosted_by_org_ids`,
`presented_by_org_ids`, `host_label`, `presenter_label` columns as programs
so a single session can have its own attribution. The pre-existing
`organizationIds uuid[]` column is now used as "other sponsors" — orgs
contributing to the session that aren't the lead host or presenter. Sessions
also reference `venueId`, `sessionTypeId`, `accessLevelId` (single FK
columns), and `speakerIds`, `trackIds`, `programIds`, `experienceIds`
(uuid arrays). A `gating` text column ('public' / 'invitation_only' /
'private') controls visibility. Dates and times are `text` rather than
proper `date`/`time` types — this matched what the existing app was already
sending and changing it would have meant rewriting every form and view; it
remains a tightening opportunity for later.

**Why uuid arrays instead of join tables.** Sessions reference speakers
(and tracks, programs, etc.) as `uuid[]` columns rather than via dedicated
join tables. The trade-off: we lose the ability to attach metadata to the
relationship (e.g., "this person is a moderator on this session, not a
speaker"), and we lose Postgres FK integrity on array elements (orphaned ids
can sit in the array if an org is deleted; nothing cleans them up
automatically). What we gain: simpler queries, fewer round-trips, no extra
schema to maintain. When the team needs per-relationship role typing
(speaker vs moderator vs judge vs mentor vs volunteer), the upgrade path is
to introduce a `session_speakers` join table with a `role` column. Same for
`session_organizations` when single-flat-sponsors-array becomes too coarse.

**`team_members`** is both the sign-in allowlist and the "who" attributed to
changes in the audit trail. Each row has `email` (the Google email), `name`,
and `role` ('admin' or 'editor'). The `is_team_member()` and `is_admin()`
SQL functions (security definer, so they bypass RLS to read the table) are
what the row-level security policies consult. The admin/editor distinction
exists in the DB but isn't yet enforced in the UI — every signed-in member
sees the same surface.

**`audit_log`** is append-only, written automatically by triggers on every
insert/update/delete on every audited table. Each row captures the table
name, record id, action, the user id and email of whoever was signed in,
timestamp, and the full old and new JSONB. Nothing in the app writes to
this table directly (no write policy); the triggers run with `SECURITY
DEFINER` to bypass that. There is no audit log viewer in the app yet — the
data is captured for future surfacing.

## Auth and security

Browser → Supabase Auth → Google OAuth → callback → Supabase issues a JWT.
The Supabase JS client stores the token in localStorage and attaches it to
every subsequent request. RLS policies on every table check
`is_team_member()` (which compares the JWT's email against `team_members`)
before permitting a read or write. Anonymous traffic gets nothing.

`AuthGate` (`src/components/AuthGate.tsx`) wraps the app and surfaces the
allowlist check in the UI. It's not a security boundary — RLS is — it's a
UX layer. Without it, an unauthorized signed-in user would see a working
app that fetches no data. With it, they see "Not authorized — ask an admin
to add you." It also handles the cold-start hang we saw early on, where the
first PostgREST query against the new Supabase project would occasionally
take ~10 seconds; AuthGate races the lookup against a 10-second timeout and
surfaces the failure as a recoverable "Sign-in problem" screen with a
Reload button.

After the lookup succeeds, AuthGate stashes the email and role into the
Zustand store. Every view consumes `useIsAdmin()` to gate destructive UI —
delete buttons in SessionModal, the sidebar filter lists, Settings rows,
Organizations, Map, Speakers, and ListView are all hidden for editors.
The header chip in `Layout.tsx` reads the same store fields to show the
signed-in identity and role, plus a sign-out button. RLS still gates the
underlying data — an editor who bypasses the UI would still be blocked by
the database — but the role-gating keeps the surface honest.

Secrets to be aware of: the Supabase URL and **publishable** key are in the
client bundle by design (they're public; RLS is what keeps the data safe).
The Mapbox token in the client is also public, but it's URL-restricted in
the Mapbox dashboard to `localhost:5173` and `st-agenda.netlify.app`. The
Google OAuth client secret is *not* in the client — it lives only in
Supabase's auth provider config.

## Major decisions

**Extended the existing codebase rather than starting from scratch.** When
the project landed in our laps it already had ~6 views, a Zustand store,
and a partial Supabase integration with hardcoded credentials. We chose to
keep the structure and migrate it forward — Bolt-era artifacts cleaned up,
secrets moved to env vars, schema extended, types tightened — rather than
rebuild and import. Lower risk, faster to value, preserved muscle memory
the team had built around the existing UI.

**Kept camelCase column names like `eventId`, `startTime`, `speakerIds`.**
Postgres usually wants snake_case, and using camelCase means every reference
needs double quotes (`WHERE "eventId" = ...`). We accepted that because the
existing store code was already destructuring camelCase fields from
Supabase responses; renaming would have meant rewriting every query and
every form.

**Multi-event from day one, picker UI deferred briefly then added.** The
schema has had `events` and `eventId` columns since the first migration;
the store has had `currentEventId` and event filtering since the same time.
The EventPicker came in later (early visual polish phase) but was always
the plan. Building events into the schema from the start was cheap and
avoided a much-painful schema migration later when "Sloss Tech Summit Fall
2026" actually exists.

**Hosted_by / presented_by as uuid[] (not single FKs).** Real-world
co-presenting happens — Street Party is presented by BIG *and* NASCAR. We
went with uuid arrays from the start rather than single-FK columns we'd
have to widen later. Lose FK enforcement on array elements, gain
flexibility.

**Tier ranges hardcoded as a constant, not in the DB.** The metallurgy
ladder has been stable across Sloss Tech years. Putting ranges in the DB
would mean a `sponsor_tiers` table plus a UI to edit it — premature for a
value that hasn't shifted. The constant lives in `OrganizationsView` and
`SettingsView`; if it becomes editable per event, the migration path is to
move it to a per-event table and FK from `organizations.tier`.

**Gating column on sessions instead of multiple visibility flags.** Three
values cover what we need: `public` (most sessions), `invitation_only` (MVP
Dinner, Taste of Innovation), `private` (TTWW Meeting, internal). The
private state is intentionally loud in the UI (red badge) to keep
not-for-public sessions from accidentally shipping to attendees.

**Track color drives session color across the app, not session type
color.** Tracks come from the team with hex codes already; session types
mostly don't. Using track color produced an immediately legible calendar
without anyone having to assign colors to types. Session type still wins
if a track isn't set; neutral indigo is the final fallback.

## Local dev setup

Prerequisites: Node 18+ (we used 24.16 LTS via the nodejs.org installer)
and a Supabase project. The repo has no Docker setup; everything runs
against the hosted Supabase.

```bash
git clone https://github.com/techbirmingham/scheduler.git
cd scheduler
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN
npm run dev
```

`.env` is gitignored. Vite serves at <http://localhost:5173>. The dev
server picks up `.env` changes on save. The Mapbox token should be
URL-restricted to your local origin in the Mapbox dashboard so a leak is
inert anywhere else.

For Supabase setup on a fresh project: run `supabase/schema.sql` top to
bottom in the SQL Editor (it's idempotent and safe to re-run). Then add at
least one row to `events` (the conference) and one row to `team_members`
(your email, role 'admin'). Without those two seeds, RLS will return
nothing and the app will look broken.

Production deploys to Netlify on every push to `main`. The three `VITE_*`
env vars need to be set in **Site configuration → Environment variables**
(All scopes, All deploy contexts) or the build will throw the same
missing-env error at runtime.

## Known gaps and what's next

Mostly polish and reach, not blockers. In rough priority order:

- **Map view polish.** Untouched in the current pass; functional but doesn't
  match the density and chip patterns the other views adopted.
- **Programs inline editor.** Adding/removing host/presenter/sponsor orgs on
  a program is SQL-only today. Needs a mini multi-org picker UI in Settings.
- **Speaker headshot upload via Supabase Storage.** Today headshots are URL
  fields; nobody is going to paste 60 URLs. Sketched two paths: admin-only
  uploader (~1–2 hours) and a tokenized public link per speaker so the
  speakers themselves upload (~1 day).
- **Create new event flow.** EventPicker has a "Create new event (coming
  soon)" stub. The flow needs a small modal that inserts an `events` row
  and then triggers a re-fetch.
- **Drag/drop reordering** of taxonomy items, especially Tracks (color
  ordering matters). Needs a library like `dnd-kit`.
- **Filter sidebar "Only" link** on hover, so power users can solo-select
  one venue or track without unchecking everything else.
- **Mobile responsiveness.** The Grid and Timeline don't work at narrow
  widths; the rest mostly does. Needs a mobile-first pass.
- **Old `organizations.in_kind` boolean** can be dropped once we verify
  every previously-in-kind row has a non-null `in_kind_amount`. Trivial
  cleanup, just sequencing.
- **Tier display order centralized.** Lives in two files
  (`OrganizationsView.tsx` and `SettingsView.tsx`) today.
- **Team management UI.** Adding/removing rows in `team_members` is SQL-only
  today. A small admin-only "Team" section in Settings would replace it
  with email + role + remove. Schema is already done; just store actions
  plus a view. Worth doing if the team grows past a handful or if
  non-technical admins start needing to add people.

## File map

The pieces worth knowing about, by what they do.

**Top-level wiring.** `src/App.tsx` mounts AuthGate around the router and
declares routes. `src/main.tsx` is the Vite entry. `src/index.css` is
Tailwind plus a few targeted FullCalendar overrides (resource header sizing,
event wrapping, time axis density).

**Layout and navigation.** `src/components/Layout.tsx` is the chrome — top
header with EventPicker on the left and nav tabs on the right, plus the
sidebar slot below for views that have filters. `src/components/Sidebar.tsx`
is the filter panel with its single floating collapse toggle.
`src/components/EventPicker.tsx` is the event dropdown.
`src/components/AuthGate.tsx` is the allowlist gate.
`src/components/DateNavigator.tsx` is the chevron + date picker bar.

**Modals.** `src/components/SessionModal.tsx` is the big one — section
grouping for Basics / Schedule / People / Categorization / Attribution /
Access, with multi-select pickers backed by react-select.
`src/components/ConfirmDialog.tsx` is the themed confirm modal plus the
`useConfirm()` hook, mounted once via `ConfirmProvider` at the app root.
Every destructive action (delete, restore, anything irreversible) routes
through it instead of `window.confirm`. Destructive variant is red; Enter
confirms, Esc cancels.

**Views** live in `src/views/`: `GridView` (FullCalendar resource-timegrid),
`TimelineView` (resource-timeline), `ListView` (sessions grouped by date in
tables, with track chips and gating badges), `MapView` (Mapbox + venue
list), `SpeakersView` (grid/list with the SpeakerAvatar initials component),
`OrganizationsView` (sponsor directory with the full cash/in-kind editor),
`SettingsView` (collapsible taxonomy sections plus the admin-only Change
History panel that reads from `audit_log` and offers per-row Restore).

**Store and types.** `src/store/index.ts` defines the Zustand state shape,
the CRUD actions for each entity, `loadAll()` and the extracted
`loadScopedData(eid)`, and the `setCurrentEventId` action that drives event
switching. `src/types/index.ts` defines the entity interfaces — keep this
in sync with the schema as new columns land.

**Utilities.** `src/utils/supabaseClient.ts` creates the Supabase client
from env vars and throws fast if they're missing.
`src/utils/dates.ts` has `getInitialDate(sessions, eventStartDate)` for the
"what date should this view land on" logic. `src/utils/geocode.ts` calls
the Mapbox forward geocoding API for venue addresses.

**Schema.** `supabase/schema.sql` is the database. Read it for the
authoritative answer on any column or constraint.
