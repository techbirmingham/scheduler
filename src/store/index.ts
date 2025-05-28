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
      { data: sessiontypes },
      { data: tracks },
      { data: organizations },
      { data: programs },
      { data: experiences },
      { data: accesslevels },
    ] = await Promise.all([
      supabase.from('speakers').select('*'),
      supabase.from('venues').select('*'),
      supabase.from('sessions').select('*'),
      supabase.from('sessiontypes').select('*'),
      supabase.from('tracks').select('*'),
      supabase.from('organizations').select('*'),
      supabase.from('programs').select('*'),
      supabase.from('experiences').select('*'),
      supabase.from('accesslevels').select('*'),
    ])

    set({
      speakers:      speakers     ?? [],
      venues:        venues       ?? [],
      sessions:      sessions     ?? [],
      sessionTypes:  sessiontypes ?? [],  // ← lowercase key to match your table
      tracks:        tracks       ?? [],
      organizations: organizations?? [],
      programs:      programs     ?? [],
      experiences:   experiences  ?? [],
      accessLevels:  accesslevels ?? [],  // ← lowercase key to match your table
    })
  }

  // immediately load on startup
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





// 3) CRUD actions for each entity:

    // — Speakers —
    addSpeaker: async (speaker) => {
      const { data, error } = await supabase
        .from('speakers')
        .insert(speaker)
        .single()
      if (!error) set(state => ({ speakers: [...state.speakers, data] }))
    },
    updateSpeaker: async (id, updates) => {
      const { data, error } = await supabase
        .from('speakers')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        speakers: state.speakers.map(s => s.id === id ? data : s)
      }))
    },
    deleteSpeaker: async (id) => {
      const { error } = await supabase
        .from('speakers')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        speakers: state.speakers.filter(s => s.id !== id),
        sessions: state.sessions.map(sess => ({
          ...sess,
          speakerIds: sess.speakerIds.filter(sid => sid !== id)
        }))
      }))
    },

    // — Venues —
    addVenue: async (venue) => {
      const { data, error } = await supabase
        .from('venues')
        .insert(venue)
        .single()
      if (!error) set(state => ({ venues: [...state.venues, data] }))
    },
    updateVenue: async (id, updates) => {
      const { data, error } = await supabase
        .from('venues')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        venues: state.venues.map(v => v.id === id ? data : v)
      }))
    },
    deleteVenue: async (id) => {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        venues: state.venues.filter(v => v.id !== id),
        sessions: state.sessions.map(sess =>
          sess.venueId === id ? { ...sess, venueId: '' } : sess
        )
      }))
    },

    // — Sessions —
    addSession: async (session) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .single()
      if (!error) set(state => ({ sessions: [...state.sessions, data] }))
    },
    updateSession: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        sessions: state.sessions.map(s => s.id === id ? data : s)
      }))
    },
    deleteSession: async (id) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        sessions: state.sessions.filter(s => s.id !== id)
      }))
    },

    // — Session Types —
    addSessionType: async (st) => {
      const { data, error } = await supabase
        .from('sessiontypes')
        .insert(st)
        .single()
      if (!error) set(state => ({ sessionTypes: [...state.sessionTypes, data] }))
    },
    updateSessionType: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessiontypes')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        sessionTypes: state.sessionTypes.map(t => t.id === id ? data : t)
      }))
    },
    deleteSessionType: async (id) => {
      const { error } = await supabase
        .from('sessiontypes')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        sessionTypes: state.sessionTypes.filter(t => t.id !== id),
        sessions: state.sessions.map(sess =>
          sess.sessionTypeId === id ? { ...sess, sessionTypeId: '' } : sess
        )
      }))
    },

    // — Tracks —
    addTrack: async (track) => {
      const { data, error } = await supabase
        .from('tracks')
        .insert(track)
        .single()
      if (!error) set(state => ({ tracks: [...state.tracks, data] }))
    },
    updateTrack: async (id, updates) => {
      const { data, error } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        tracks: state.tracks.map(t => t.id === id ? data : t)
      }))
    },
    deleteTrack: async (id) => {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        tracks: state.tracks.filter(t => t.id !== id),
        sessions: state.sessions.map(sess => ({
          ...sess,
          trackIds: sess.trackIds.filter(tid => tid !== id)
        }))
      }))
    },

    // — Organizations —
    addOrganization: async (org) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert(org)
        .single()
      if (!error) set(state => ({ organizations: [...state.organizations, data] }))
    },
    updateOrganization: async (id, updates) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        organizations: state.organizations.map(o => o.id === id ? data : o)
      }))
    },
    deleteOrganization: async (id) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        organizations: state.organizations.filter(o => o.id !== id),
        sessions: state.sessions.map(sess => ({
          ...sess,
          organizationIds: sess.organizationIds.filter(oid => oid !== id)
        }))
      }))
    },

    // — Programs —
    addProgram: async (prog) => {
      const { data, error } = await supabase
        .from('programs')
        .insert(prog)
        .single()
      if (!error) set(state => ({ programs: [...state.programs, data] }))
    },
    updateProgram: async (id, updates) => {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        programs: state.programs.map(p => p.id === id ? data : p)
      }))
    },
    deleteProgram: async (id) => {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        programs: state.programs.filter(p => p.id !== id),
        sessions: state.sessions.map(sess => ({
          ...sess,
          programIds: sess.programIds.filter(pid => pid !== id)
        }))
      }))
    },

    // — Experiences —
    addExperience: async (exp) => {
      const { data, error } = await supabase
        .from('experiences')
        .insert(exp)
        .single()
      if (!error) set(state => ({ experiences: [...state.experiences, data] }))
    },
    updateExperience: async (id, updates) => {
      const { data, error } = await supabase
        .from('experiences')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        experiences: state.experiences.map(e => e.id === id ? data : e)
      }))
    },
    deleteExperience: async (id) => {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        experiences: state.experiences.filter(e => e.id !== id),
        sessions: state.sessions.map(sess => ({
          ...sess,
          experienceIds: sess.experienceIds.filter(eid => eid !== id)
        }))
      }))
    },

    // — Access Levels —
    addAccessLevel: async (al) => {
      const { data, error } = await supabase
        .from('accesslevels')
        .insert(al)
        .single()
      if (!error) set(state => ({ accessLevels: [...state.accessLevels, data] }))
    },
    updateAccessLevel: async (id, updates) => {
      const { data, error } = await supabase
        .from('accesslevels')
        .update(updates)
        .eq('id', id)
        .single()
      if (!error) set(state => ({
        accessLevels: state.accessLevels.map(l => l.id === id ? data : l)
      }))
    },
    deleteAccessLevel: async (id) => {
      const { error } = await supabase
        .from('accesslevels')
        .delete()
        .eq('id', id)
      if (!error) set(state => ({
        accessLevels: state.accessLevels.filter(l => l.id !== id),
        sessions: state.sessions.map(sess =>
          sess.accessLevelId === id ? { ...sess, accessLevelId: '' } : sess
        )
      }))
    },

    // — Filters —
    toggleFilter: (filterType, id) =>
      set(state => {
        const curr = state.selectedFilters[filterType]
        const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
        return { selectedFilters: { ...state.selectedFilters, [filterType]: next } }
      }),
    



    
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