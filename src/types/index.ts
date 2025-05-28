import { EventInput } from '@fullcalendar/core';

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
}

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