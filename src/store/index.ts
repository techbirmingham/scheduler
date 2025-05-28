import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface Speaker {
  id: string
  name: string
  title: string
  company: string
  bio: string
  photoUrl: string
}

export interface Venue {
  id: string
  name: string
  location?: string
  capacity?: number
}

export interface Session {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  venueId: string
  date: string
  speakerIds: string[]
  sessionTypeId: string
  trackIds: string[]
  organizationIds: string[]
  programIds: string[]
  experienceIds: string[]
  accessLevelId: string
}

export interface SessionType {
  id: string
  name: string
  color?: string
}

export interface Track {
  id: string
  name: string
  color?: string
}

export interface Organization {
  id: string
  name: string
}

export interface Program {
  id: string
  name: string
}

export interface Experience {
  id: string
  name: string
}

export interface AccessLevel {
  id: string
  name: string
}

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

  addSpeaker: (speaker: Omit<Speaker, 'id'>) => void
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void
  deleteSpeaker: (id: string) => void

  addVenue: (venue: Omit<Venue, 'id'>) => void
  updateVenue: (id: string, updates: Partial<Venue>) => void
  deleteVenue: (id: string) => void

  addSession: (session: Omit<Session, 'id'>) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  deleteSession: (id: string) => void

  addSessionType: (sessionType: Omit<SessionType, 'id'>) => void
  updateSessionType: (id: string, updates: Partial<SessionType>) => void
  deleteSessionType: (id: string) => void

  addTrack: (track: Omit<Track, 'id'>) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  deleteTrack: (id: string) => void

  addOrganization: (organization: Omit<Organization, 'id'>) => void
  updateOrganization: (id: string, updates: Partial<Organization>) => void
  deleteOrganization: (id: string) => void

  addProgram: (program: Omit<Program, 'id'>) => void
  updateProgram: (id: string, updates: Partial<Program>) => void
  deleteProgram: (id: string) => void

  addExperience: (experience: Omit<Experience, 'id'>) => void
  updateExperience: (id: string, updates: Partial<Experience>) => void
  deleteExperience: (id: string) => void

  addAccessLevel: (accessLevel: Omit<AccessLevel, 'id'>) => void
  updateAccessLevel: (id: string, updates: Partial<AccessLevel>) => void
  deleteAccessLevel: (id: string) => void

  toggleFilter: (filterType: keyof State['selectedFilters'], id: string) => void
  clearFilters: () => void
}

export const useStore = create<State>()(
  persist(
    set => ({
      // start empty!
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

      // --- actions ---
      addSpeaker: speaker =>
        set(state => ({
          speakers: [...state.speakers, { id: uuidv4(), ...speaker }],
        })),
      updateSpeaker: (id, updates) =>
        set(state => ({
          speakers: state.speakers.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      deleteSpeaker: id =>
        set(state => ({
          speakers: state.speakers.filter(s => s.id !== id),
          sessions: state.sessions.map(session => ({
            ...session,
            speakerIds: session.speakerIds.filter(sid => sid !== id),
          })),
        })),

      addVenue: venue =>
        set(state => ({
          venues: [...state.venues, { id: uuidv4(), ...venue }],
        })),
      updateVenue: (id, updates) =>
        set(state => ({
          venues: state.venues.map(v =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),
      deleteVenue: id =>
        set(state => ({
          venues: state.venues.filter(v => v.id !== id),
          sessions: state.sessions.map(session =>
            session.venueId === id
              ? { ...session, venueId: '' }
              : session
          ),
        })),

      addSession: session =>
        set(state => ({
          sessions: [...state.sessions, { id: uuidv4(), ...session }],
        })),
      updateSession: (id, updates) =>
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      deleteSession: id =>
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== id),
        })),

      addSessionType: sessionType =>
        set(state => ({
          sessionTypes: [
            ...state.sessionTypes,
            { id: uuidv4(), ...sessionType },
          ],
        })),
      updateSessionType: (id, updates) =>
        set(state => ({
          sessionTypes: state.sessionTypes.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteSessionType: id =>
        set(state => ({
          sessionTypes: state.sessionTypes.filter(t => t.id !== id),
          sessions: state.sessions.map(session =>
            session.sessionTypeId === id
              ? { ...session, sessionTypeId: '' }
              : session
          ),
        })),

      addTrack: track =>
        set(state => ({
          tracks: [...state.tracks, { id: uuidv4(), ...track }],
        })),
      updateTrack: (id, updates) =>
        set(state => ({
          tracks: state.tracks.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTrack: id =>
        set(state => ({
          tracks: state.tracks.filter(t => t.id !== id),
          sessions: state.sessions.map(session => ({
            ...session,
            trackIds: session.trackIds.filter(tid => tid !== id),
          })),
        })),

      addOrganization: org =>
        set(state => ({
          organizations: [
            ...state.organizations,
            { id: uuidv4(), ...org },
          ],
        })),
      updateOrganization: (id, updates) =>
        set(state => ({
          organizations: state.organizations.map(o =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
      deleteOrganization: id =>
        set(state => ({
          organizations: state.organizations.filter(o => o.id !== id),
          sessions: state.sessions.map(session => ({
            ...session,
            organizationIds: session.organizationIds.filter(
              oid => oid !== id
            ),
          })),
        })),

      addProgram: prog =>
        set(state => ({
          programs: [...state.programs, { id: uuidv4(), ...prog }],
        })),
      updateProgram: (id, updates) =>
        set(state => ({
          programs: state.programs.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProgram: id =>
        set(state => ({
          programs: state.programs.filter(p => p.id !== id),
          sessions: state.sessions.map(session => ({
            ...session,
            programIds: session.programIds.filter(pid => pid !== id),
          })),
        })),

      addExperience: exp =>
        set(state => ({
          experiences: [...state.experiences, { id: uuidv4(), ...exp }],
        })),
      updateExperience: (id, updates) =>
        set(state => ({
          experiences: state.experiences.map(e =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteExperience: id =>
        set(state => ({
          experiences: state.experiences.filter(e => e.id !== id),
          sessions: state.sessions.map(session => ({
            ...session,
            experienceIds: session.experienceIds.filter(
              eid => eid !== id
            ),
          })),
        })),

      addAccessLevel: level =>
        set(state => ({
          accessLevels: [
            ...state.accessLevels,
            { id: uuidv4(), ...level },
          ],
        })),
      updateAccessLevel: (id, updates) =>
        set(state => ({
          accessLevels: state.accessLevels.map(l =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      deleteAccessLevel: id =>
        set(state => ({
          accessLevels: state.accessLevels.filter(
            l => l.id !== id
          ),
          sessions: state.sessions.map(session =>
            session.accessLevelId === id
              ? { ...session, accessLevelId: '' }
              : session
          ),
        })),

      toggleFilter: (filterType, id) =>
        set(state => {
          const current = state.selectedFilters[filterType]
          const next = current.includes(id)
            ? current.filter(x => x !== id)
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
    }),
    {
      name: 'conference-agenda-store',
    }
  )
)