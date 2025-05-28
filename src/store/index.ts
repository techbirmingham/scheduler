// src/store/index.ts
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../utils/supabaseClient'

export interface Speaker    { /* … */ }
export interface Venue      { /* … */ }
export interface Session    { /* … */ }
export interface SessionType{ /* … */ }
export interface Track      { /* … */ }
export interface Organization { /* … */ }
export interface Program    { /* … */ }
export interface Experience { /* … */ }
export interface AccessLevel{ /* … */ }

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
  selectedFilters: {
    venues: string[]
    sessionTypes: string[]
    tracks: string[]
    organizations: string[]
    programs: string[]
    experiences: string[]
    accessLevels: string[]
  }

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
  // 1) on startup, load every table from Supabase
  async function loadAll() {
    const [
      { data: speakers },
      { data: venues },
      { data: sessions },
      { data: session_types },
      { data: tracks },
      { data: organizations },
      { data: programs },
      { data: experiences },
      { data: access_levels },
    ] = await Promise.all([
      supabase.from('speakers').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('sessions').select('*'),
      supabase.from('session_types').select('*'),
      supabase.from('tracks').select('*'),
      supabase.from('organizations').select('*'),
      supabase.from('programs').select('*'),
      supabase.from('experiences').select('*'),
      supabase.from('access_levels').select('*'),
    ])

    set({
      speakers:      speakers      ?? [],
      venues:        venues        ?? [],
      sessions:      sessions      ?? [],
      sessionTypes:  session_types ?? [],
      tracks:        tracks        ?? [],
      organizations: organizations ?? [],
      programs:      programs      ?? [],
      experiences:   experiences   ?? [],
      accessLevels:  access_levels ?? [],
    })
  }

  // immediately fetch them
  loadAll()

  return {
    // 2) initial empty state—Supabase is our source of truth
    speakers:      [],
    venues:        [],
    sessions:      [],
    sessionTypes:  [],
    tracks:        [],
    organizations: [],
    programs:      [],
    experiences:   [],
    accessLevels:  [],

    selectedFilters: {
      venues:        [],
      sessionTypes:  [],
      tracks:        [],
      organizations: [],
      programs:      [],
      experiences:   [],
      accessLevels:  [],
    },

    // 3) your add/update/delete/toggle/clear actions go here (unchanged)
    /* … */

    toggleFilter: (filterType, id) =>
      set(state => {
        const curr = state.selectedFilters[filterType]
        const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
        return { selectedFilters: { ...state.selectedFilters, [filterType]: next } }
      }),

    clearFilters: () =>
      set(() => ({
        selectedFilters: {
          venues:        [],
          sessionTypes:  [],
          tracks:        [],
          organizations: [],
          programs:      [],
          experiences:   [],
          accessLevels:  [],
        },
      })),
  }
})