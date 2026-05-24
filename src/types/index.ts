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
  organizationIds: string[];
  programIds: string[];
  experienceIds: string[];
  accessLevelId: string;
  eventId?: string;
}

export interface SessionType {
  id: string;
  name: string;
  color?: string;
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
  eventId?: string;
}

export interface Program {
  id: string;
  name: string;
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
