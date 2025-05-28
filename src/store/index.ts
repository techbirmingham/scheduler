// src/store/index.ts
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../utils/supabaseClient'

export interface Speaker { /* … */ }
export interface Venue     { /* … */ }
export interface Session   { /* … */ }
export interface SessionType { /* … */ }
export interface Track      { /* … */ }
export interface Organization { /* … */ }
export interface Program    { /* … */ }
export interface Experience { /* … */ }
export interface AccessLevel { /* … */ }

interface State {
  speakers: Speaker[]
  venues: Venue[]
  sessions: Session[]
  sessionTypes: SessionType[]
  tracks: Track[]
  organizations: Organization[]
  programs: Program[]
  experiences: Experience[]
  accessLevels: AccessLevel[]
  selectedFilters: { [K in keyof State as K extends 'selectedFilters' ? 'selectedFilters' : never]: string[] }

  addSpeaker: (speaker: Omit<Speaker,'id'>) => void
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void
  deleteSpeaker: (id: string) => void

  addVenue: (venue: Omit<Venue,'id'>) => void
  updateVenue: (id: string, updates: Partial<Venue>) => void
  deleteVenue: (id: string) => void

  addSession: (session: Omit<Session,'id'>) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  deleteSession: (id: string) => void

  addSessionType: (st: Omit<SessionType,'id'>) => void
  updateSessionType: (id: string, updates: Partial<SessionType>) => void
  deleteSessionType: (id: string) => void

  addTrack: (track: Omit<Track,'id'>) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  deleteTrack: (id: string) => void

  addOrganization: (org: Omit<Organization,'id'>) => void
  updateOrganization: (id: string, updates: Partial<Organization>) => void
  deleteOrganization: (id: string) => void

  addProgram: (prog: Omit<Program,'id'>) => void
  updateProgram: (id: string, updates: Partial<Program>) => void
  deleteProgram: (id: string) => void

  addExperience: (exp: Omit<Experience,'id'>) => void
  updateExperience: (id: string, updates: Partial<Experience>) => void
  deleteExperience: (id: string) => void

  addAccessLevel: (al: Omit<AccessLevel,'id'>) => void
  updateAccessLevel: (id: string, updates: Partial<AccessLevel>) => void
  deleteAccessLevel: (id: string) => void

  toggleFilter: (filterType: keyof State['selectedFilters'], id: string) => void
  clearFilters: () => void
}

export const useStore = create<State>((set, get) => {
  // helper to seed from Supabase
  async function loadAll() {
    const [
      { data: speakers },
      { data: venues },
      { data: sessions },
      { data: sessionTypes },
      { data: tracks },
      { data: organizations },
      { data: programs },
      { data: experiences },
      { data: accessLevels },
    ] = await Promise.all([
      supabase.from('speakers').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('sessions').select('*'),
      supabase.from('sessionTypes').select('*'),
      supabase.from('tracks').select('*'),
      supabase.from('organizations').select('*'),
      supabase.from('programs').select('*'),
      supabase.from('experiences').select('*'),
      supabase.from('accessLevels').select('*'),
    ])
    set({
      speakers: speakers ?? [],
      venues: venues ?? [],
      sessions: sessions ?? [],
      sessionTypes: sessionTypes ?? [],
      tracks: tracks ?? [],
      organizations: organizations ?? [],
      programs: programs ?? [],
      experiences: experiences ?? [],
      accessLevels: accessLevels ?? [],
    })
  }

  // immediately load on startup
  loadAll()

  return {
    // start empty; Supabase is source of truth
    speakers: [],
    venues: [],
    sessions: [],
    sessionTypes: [],
    tracks: [],
    organizations: [],
    programs: [],
    experiences: [],
    accessLevels: [],

    selectedFilters: {
      venues: [],
      sessionTypes: [],
      tracks: [],
      organizations: [],
      programs: [],
      experiences: [],
      accessLevels: [],
    },

    // -- actions wired to Zustand only (we’ll hook Supabase next) --
    addSpeaker: (speaker) =>
      set((state) => ({
        speakers: [...state.speakers, { id: uuidv4(), ...speaker }],
      })),
    updateSpeaker: (id, updates) =>
      set((state) => ({
        speakers: state.speakers.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
    deleteSpeaker: (id) =>
      set((state) => ({
        speakers: state.speakers.filter((s) => s.id !== id),
        sessions: state.sessions.map((session) => ({
          ...session,
          speakerIds: session.speakerIds.filter((sid) => sid !== id),
        })),
      })),

    addVenue: (venue) =>
      set((state) => ({
        venues: [...state.venues, { id: uuidv4(), ...venue }],
      })),
    updateVenue: (id, updates) =>
      set((state) => ({
        venues: state.venues.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      })),
    deleteVenue: (id) =>
      set((state) => ({
        venues: state.venues.filter((v) => v.id !== id),
        sessions: state.sessions.map((session) =>
          session.venueId === id ? { ...session, venueId: '' } : session
        ),
      })),

    addSession: (session) =>
      set((state) => ({
        sessions: [...state.sessions, { id: uuidv4(), ...session }],
      })),
    updateSession: (id, updates) =>
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
    deleteSession: (id) =>
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      })),

    addSessionType: (sessionType) =>
      set((state) => ({
        sessionTypes: [...state.sessionTypes, { id: uuidv4(), ...sessionType }],
      })),
    updateSessionType: (id, updates) =>
      set((state) => ({
        sessionTypes: state.sessionTypes.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
    deleteSessionType: (id) =>
      set((state) => ({
        sessionTypes: state.sessionTypes.filter((t) => t.id !== id),
        sessions: state.sessions.map((session) =>
          session.sessionTypeId === id
            ? { ...session, sessionTypeId: '' }
            : session
        ),
      })),

    addTrack: (track) =>
      set((state) => ({
        tracks: [...state.tracks, { id: uuidv4(), ...track }],
      })),
    updateTrack: (id, updates) =>
      set((state) => ({
        tracks: state.tracks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
    deleteTrack: (id) =>
      set((state) => ({
        tracks: state.tracks.filter((t) => t.id !== id),
        sessions: state.sessions.map((session) => ({
          ...session,
          trackIds: session.trackIds.filter((tid) => tid !== id),
        })),
      })),

    addOrganization: (org) =>
      set((state) => ({
        organizations: [...state.organizations, { id: uuidv4(), ...org }],
      })),
    updateOrganization: (id, updates) =>
      set((state) => ({
        organizations: state.organizations.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      })),
    deleteOrganization: (id) =>
      set((state) => ({
        organizations: state.organizations.filter((o) => o.id !== id),
        sessions: state.sessions.map((session) => ({
          ...session,
          organizationIds: session.organizationIds.filter(
            (oid) => oid !== id
          ),
        })),
      })),

    addProgram: (prog) =>
      set((state) => ({
        programs: [...state.programs, { id: uuidv4(), ...prog }],
      })),
    updateProgram: (id, updates) =>
      set((state) => ({
        programs: state.programs.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
    deleteProgram: (id) =>
      set((state) => ({
        programs: state.programs.filter((p) => p.id !== id),
        sessions: state.sessions.map((session) => ({
          ...session,
          programIds: session.programIds.filter((pid) => pid !== id),
        })),
      })),

    addExperience: (exp) =>
      set((state) => ({
        experiences: [...state.experiences, { id: uuidv4(), ...exp }],
      })),
    updateExperience: (id, updates) =>
      set((state) => ({
        experiences: state.experiences.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),
    deleteExperience: (id) =>
      set((state) => ({
        experiences: state.experiences.filter((e) => e.id !== id),
        sessions: state.sessions.map((session) => ({
          ...session,
          experienceIds: session.experienceIds.filter(
            (eid) => eid !== id
          ),
        })),
      })),

    addAccessLevel: (level) =>
      set((state) => ({
        accessLevels: [...state.accessLevels, { id: uuidv4(), ...level }],
      })),
    updateAccessLevel: (id, updates) =>
      set((state) => ({
        accessLevels: state.accessLevels.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      })),
    deleteAccessLevel: (id) =>
      set((state) => ({
        accessLevels: state.accessLevels.filter((l) => l.id !== id),
        sessions: state.sessions.map((session) =>
          session.accessLevelId === id
            ? { ...session, accessLevelId: '' }
            : session
        ),
      })),

    toggleFilter: (filterType, id) =>
      set((state) => {
        const current = state.selectedFilters[filterType]
        const next = current.includes(id)
          ? current.filter((x) => x !== id)
          : [...current, id]
        return {
          selectedFilters: {
            ...state.selectedFilters,
            [filterType]: next,
          },
        }
      }),

    clearFilters: () =>
      set(() => ({
        selectedFilters: {
          venues: [],
          sessionTypes: [],
          tracks: [],
          organizations: [],
          programs: [],
          experiences: [],
          accessLevels: [],
        },
      })),
  }
)