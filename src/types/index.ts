import { EventInput } from '@fullcalendar/core';

// ---------------------------------------------------------------------------
// Entity types — the single source of truth for the app's data shapes.
// The Zustand store (src/store/index.ts) imports and re-exports these, so
// existing imports like `import { Session } from '../store'` keep working.
// ---------------------------------------------------------------------------

/** A conference event (e.g. "Sloss Tech 2025"). Top-level container that
 *  most other records belong to via `eventId`. Named ConferenceEvent to
 *  avoid colliding with the built-in DOM `Event` type. */
export interface ConferenceEvent {
  id: string;
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  timezone: string;  // e.g. 'America/Chicago'
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  photoUrl: string;
}

export interface Venue {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  eventId?: string;
}

export interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  venueId: string;
  date: string;
  speakerIds: string[];
  sessionTypeId: string;
  trackIds: string[];
  /** Sponsors of the session, beyond the dedicated host/presenter roles. */
  organizationIds: string[];
  programIds: string[];
  experienceIds: string[];
  accessLevelId: string;
  /** Orgs that host this session (lead planning / produce it). */
  hosted_by_org_ids?: string[];
  /** Orgs that present this session (primary attribution / naming rights). */
  presented_by_org_ids?: string[];
  /** Optional display override, e.g. "Powered by" instead of "Hosted by". */
  host_label?: string | null;
  /** Optional display override, e.g. "Supported by" instead of "Presented by". */
  presenter_label?: string | null;
  /** 'public' (default), 'invitation_only', or 'private'. */
  gating?: 'public' | 'invitation_only' | 'private';
  eventId?: string;
}

export interface SessionType {
  id: string;
  name: string;
  color?: string;
  /** High-level grouping: Session / Showcase / Activation / Networking / Other. */
  category?: string;
  eventId?: string;
}

export interface Track {
  id: string;
  name: string;
  color?: string;
  eventId?: string;
}

export interface Organization {
  id: string;
  name: string;
  /** Sponsorship/role tier (Presenting, Partner, Steel, Iron, Carbon, Nickel, General, Community, Organizer, Media). */
  tier?: string | null;
  /** Legacy boolean — true if any in-kind contribution. Superseded by in_kind_amount; kept for back-compat. */
  in_kind?: boolean;
  /** Confirmed cash contribution, in USD. */
  cash_amount?: number | null;
  /** Estimated in-kind contribution value, in USD. */
  in_kind_amount?: number | null;
  /** Free-form notes about the relationship, displayed in the org list. */
  notes?: string | null;
  eventId?: string;
}

export interface Program {
  id: string;
  name: string;
  /** Orgs hosting this program. Lead planning / produce role. */
  hosted_by_org_ids?: string[];
  /** Orgs presenting this program. Primary attribution / naming rights. */
  presented_by_org_ids?: string[];
  /** Orgs contributing as sponsors of the program. */
  sponsor_org_ids?: string[];
  /** Optional display override, e.g. "Powered by" instead of "Hosted by". */
  host_label?: string | null;
  /** Optional display override, e.g. "Supported by" instead of "Presented by". */
  presenter_label?: string | null;
  eventId?: string;
}

export interface Experience {
  id: string;
  name: string;
  eventId?: string;
}

export interface AccessLevel {
  id: string;
  name: string;
  eventId?: string;
}

/** A person allowed to sign in and use the tool. Doubles as the access
 *  allowlist and as the "who" referenced by the audit trail. */
export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
}

/** A row from the audit_log table — written by triggers on every
 *  insert/update/delete of an audited table. INSERTs are recorded too but
 *  the History panel only surfaces UPDATEs and DELETEs (the destructive ones). */
export interface AuditEntry {
  id: string;
  tableName: string;
  recordId: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy: string | null;
  changedByEmail: string | null;
  changedAt: string;
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
}

// Calendar event shape consumed by FullCalendar in the grid/timeline views.
export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  resourceId: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    description: string;
    speakers: string[];
    sessionTypeId: string;
    trackIds: string[];
  };
}
