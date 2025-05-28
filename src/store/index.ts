// src/store/index.ts
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../utils/supabaseClient'

export interface Speaker    { id: string; name: string; title: string; company: string; bio: string; photoUrl: string }
export interface Venue      { id: string; name: string; location?: string; capacity?: number }
export interface Session    { id: string; title: string; description: string; startTime: string; endTime: string; venueId: string; date: string; speakerIds: string[]; sessionTypeId: string; trackIds: string[]; organizationIds: string[]; programIds: string[]; experienceIds: string[]; accessLevelId: string }
export interface SessionType{ id: string; name: string; color?: string }
export interface Track      { id: string; name: string; color?: string }
export interface Organization { id: string; name: string }
export interface Program    { id: string; name: string }
export interface Experience { id: string; name: string }
export interface AccessLevel{ id: string; name: string }

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
  selectedFilters: Record<keyof Omit<State, 'selectedFilters'>, string[]>

  addSpeaker: (speaker: Omit<Speaker,'id'>) => Promise<void>
  updateSpeaker: (id: string, updates: Partial<Speaker>) => Promise<void>
  deleteSpeaker: (id: string) => Promise<void>

  addVenue: (venue: Omit<Venue,'id'>) => Promise<void>
  updateVenue: (id: string, updates: Partial<Venue>) => Promise<void>
  deleteVenue: (id: string) => Promise<void>

  addSession: (session: Omit<Session,'id'>) => Promise<void>
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  addSessionType: (st: Omit<SessionType,'id'>) => Promise<void>
  updateSessionType: (id: string, updates: Partial<SessionType>) => Promise<void>
  deleteSessionType: (id: string) => Promise<void>

  addTrack: (track: Omit<Track,'id'>) => Promise<void>
  updateTrack: (id: string, updates: Partial<Track>) => Promise<void>
  deleteTrack: (id: string) => Promise<void>

  addOrganization: (org: Omit<Organization,'id'>) => Promise<void>
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>
  deleteOrganization: (id: string) => Promise<void>

  addProgram: (prog: Omit<Program,'id'>) => Promise<void>
  updateProgram: (id: string, updates: Partial<Program>) => Promise<void>
  deleteProgram: (id: string) => Promise<void>

  addExperience: (exp: Omit<Experience,'id'>) => Promise<void>
  updateExperience: (id: string, updates: Partial<Experience>) => Promise<void>
  deleteExperience: (id: string) => Promise<void>

  addAccessLevel: (al: Omit<AccessLevel,'id'>) => Promise<void>
  updateAccessLevel: (id: string, updates: Partial<AccessLevel>) => Promise<void>
  deleteAccessLevel: (id: string) => Promise<void>

  toggleFilter: (filterType: keyof State['selectedFilters'], id: string) => void
  clearFilters: () => void
}

export const useStore = create<State>((set, get) => {
  // 1) seed from Supabase on startup
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
      sessionTypes:  sessiontypes ?? [],
      tracks:        tracks       ?? [],
      organizations: organizations?? [],
      programs:      programs     ?? [],
      experiences:   experiences  ?? [],
      accessLevels:  accesslevels ?? [],
    })
  }
  loadAll()

  return {
    // 2) start empty—Supabase is source of truth
    speakers: [], venues: [], sessions: [], sessionTypes: [], tracks: [],
    organizations: [], programs: [], experiences: [], accessLevels: [],
    selectedFilters: { venues: [], sessionTypes: [], tracks: [], organizations: [], programs: [], experiences: [], accessLevels: [] },

    // 3) CRUD with .select().single()

    // — Speakers —
    addSpeaker: async (speaker) => {
      const newSpeaker = { id: uuidv4(), ...speaker }
      
      const { data, error } = await supabase
        .from('speakers')
        .insert(speaker, { returning: 'representation' })
        .single()
        console.log('→ speakers.insert:', { data, error })
      
      if (error) console.error('insert speaker failed', error)
      else      set(state => ({ speakers: [...state.speakers, data] }))
    },
    updateSpeaker: async (id, updates) => {
      const { data, error } = await supabase
        .from('speakers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ speakers: s.speakers.map(x => x.id === id ? data : x) }))
    },
    deleteSpeaker: async (id) => {
      const { error } = await supabase.from('speakers').delete().eq('id', id)
      if (!error) set(s => ({
        speakers: s.speakers.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => ({ 
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
        .select()
        .single()
      if (!error) set(s => ({ venues: [...s.venues, data] }))
    },
    updateVenue: async (id, updates) => {
      const { data, error } = await supabase
        .from('venues')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ venues: s.venues.map(v => v.id === id ? data : v) }))
    },
    deleteVenue: async (id) => {
      const { error } = await supabase.from('venues').delete().eq('id', id)
      if (!error) set(s => ({
        venues: s.venues.filter(v => v.id !== id),
        sessions: s.sessions.map(sess => sess.venueId === id ? { ...sess, venueId: '' } : sess)
      }))
    },

    // — Sessions —
    addSession: async (session) => {
      const newSession = { id: uuidv4(), ...session }
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(session, { returning: 'representation' })
        .single()
      console.log('→ sessions.insert:', { data, error })
      
      if (error) console.error('insert session failed', error)
      else      set(state => ({ sessions: [...state.sessions, data] }))
    },
    updateSession: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ sessions: s.sessions.map(x => x.id === id ? data : x) }))
    },
    deleteSession: async (id) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (!error) set(s => ({ sessions: s.sessions.filter(x => x.id !== id) }))
    },

    // — Session Types —
    addSessionType: async (st) => {
      const { data, error } = await supabase
        .from('sessiontypes')
        .insert(st)
        .select()
        .single()
      if (!error) set(s => ({ sessionTypes: [...s.sessionTypes, data] }))
    },
    updateSessionType: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessiontypes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ sessionTypes: s.sessionTypes.map(x => x.id === id ? data : x) }))
    },
    deleteSessionType: async (id) => {
      const { error } = await supabase.from('sessiontypes').delete().eq('id', id)
      if (!error) set(s => ({
        sessionTypes: s.sessionTypes.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => sess.sessionTypeId === id ? { ...sess, sessionTypeId: '' } : sess)
      }))
    },

    // — Tracks —
    addTrack: async (track) => {
      const { data, error } = await supabase
        .from('tracks')
        .insert(track)
        .select()
        .single()
      if (!error) set(s => ({ tracks: [...s.tracks, data] }))
    },
    updateTrack: async (id, updates) => {
      const { data, error } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ tracks: s.tracks.map(x => x.id === id ? data : x) }))
    },
    deleteTrack: async (id) => {
      const { error } = await supabase.from('tracks').delete().eq('id', id)
      if (!error) set(s => ({
        tracks: s.tracks.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => ({ 
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
        .select()
        .single()
      if (!error) set(s => ({ organizations: [...s.organizations, data] }))
    },
    updateOrganization: async (id, updates) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ organizations: s.organizations.map(x => x.id === id ? data : x) }))
    },
    deleteOrganization: async (id) => {
      const { error } = await supabase.from('organizations').delete().eq('id', id)
      if (!error) set(s => ({
        organizations: s.organizations.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => ({ 
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
        .select()
        .single()
      if (!error) set(s => ({ programs: [...s.programs, data] }))
    },
    updateProgram: async (id, updates) => {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ programs: s.programs.map(x => x.id === id ? data : x) }))
    },
    deleteProgram: async (id) => {
      const { error } = await supabase.from('programs').delete().eq('id', id)
      if (!error) set(s => ({
        programs: s.programs.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => ({ 
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
        .select()
        .single()
      if (!error) set(s => ({ experiences: [...s.experiences, data] }))
    },
    updateExperience: async (id, updates) => {
      const { data, error } = await supabase
        .from('experiences')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ experiences: s.experiences.map(x => x.id === id ? data : x) }))
    },
    deleteExperience: async (id) => {
      const { error } = await supabase.from('experiences').delete().eq('id', id)
      if (!error) set(s => ({
        experiences: s.experiences.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => ({ 
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
        .select()
        .single()
      if (!error) set(s => ({ accessLevels: [...s.accessLevels, data] }))
    },
    updateAccessLevel: async (id, updates) => {
      const { data, error } = await supabase
        .from('accesslevels')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({ accessLevels: s.accessLevels.map(x => x.id === id ? data : x) }))
    },
    deleteAccessLevel: async (id) => {
      const { error } = await supabase.from('accesslevels').delete().eq('id', id)
      if (!error) set(s => ({
        accessLevels: s.accessLevels.filter(x => x.id !== id),
        sessions: s.sessions.map(sess => sess.accessLevelId === id
          ? { ...sess, accessLevelId: '' }
          : sess
        )
      }))
    },

    // — Filters —
    toggleFilter: (filterType, id) => {
      set(s => {
        const curr = s.selectedFilters[filterType]
        const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
        return { selectedFilters: { ...s.selectedFilters, [filterType]: next } }
      })
    },
    clearFilters: () => {
      set(() => ({
        selectedFilters: {
          venues: [], sessionTypes: [], tracks: [],
          organizations: [], programs: [],
          experiences: [], accessLevels: []
        }
      }))
    },
  }
})