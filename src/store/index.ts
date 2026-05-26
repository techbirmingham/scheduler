// src/store/index.ts
import { create } from 'zustand'
import { supabase } from '../utils/supabaseClient'
import type {
  ConferenceEvent, Speaker, Venue, Session, SessionType, Track,
  Organization, Program, Experience, AccessLevel, AuditEntry,
} from '../types'

// Re-export the entity types so existing imports like
// `import { Session } from '../store'` continue to work unchanged.
export type {
  ConferenceEvent, Speaker, Venue, Session, SessionType, Track,
  Organization, Program, Experience, AccessLevel, AuditEntry,
} from '../types'

export type UserRole = 'admin' | 'editor'

interface State {
  events: ConferenceEvent[]
  currentEventId: string | null
  setCurrentEventId: (id: string) => Promise<void>

  // Identity of the signed-in team member, set by AuthGate after the
  // team_members lookup succeeds. null while we don't know yet. The role
  // drives admin-only UI gating; it is not a security boundary — RLS /
  // is_admin() in Postgres is.
  currentUserEmail: string | null
  currentUserRole: UserRole | null
  setCurrentUser: (email: string | null, role: UserRole | null) => void

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
  /** Set the filter for `filterType` to just this id, leaving other
   *  categories' filters untouched. Powers the "Only" hover link. */
  selectOnlyFilter: (filterType: keyof State['selectedFilters'], id: string) => void
  clearFilters: () => void

  // Audit log + restore. auditLog is fetched on demand (not on initial load)
  // since the History panel is the only consumer. restoreFromAudit reapplies
  // an old state — INSERT for DELETE entries, UPDATE for UPDATE entries.
  auditLog: AuditEntry[]
  fetchAuditLog: (limit?: number) => Promise<void>
  restoreFromAudit: (entry: AuditEntry) => Promise<{ success: boolean; error?: string }>
}

export const useStore = create<State>((set, get) => {
  // Stamp the current event's id onto an insert payload. Returns null
  // (and logs) when no event is selected, which blocks the insert
  // rather than letting it 500 against the schema's NOT NULL constraint.
  function withEventId<T extends { eventId?: string }>(
    payload: T,
    op: string,
  ): (T & { eventId: string }) | null {
    const eid = payload.eventId ?? get().currentEventId
    if (!eid) {
      console.error(`${op}: no current event selected`)
      return null
    }
    return { ...payload, eventId: eid }
  }

  // Fetch all event-scoped tables for a given event id. Speakers are
  // global so they're fetched without a filter.
  async function loadScopedData(eid: string) {
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
      supabase.from('venues').select('*').eq('eventId', eid),
      supabase.from('sessions').select('*').eq('eventId', eid),
      supabase.from('sessiontypes').select('*').eq('eventId', eid),
      supabase.from('tracks').select('*').eq('eventId', eid),
      supabase.from('organizations').select('*').eq('eventId', eid),
      supabase.from('programs').select('*').eq('eventId', eid),
      supabase.from('experiences').select('*').eq('eventId', eid),
      supabase.from('accesslevels').select('*').eq('eventId', eid),
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

  // Seed from Supabase on startup. Events first so we know which event
  // to scope the rest of the queries to. Preserves the user's currently-
  // selected event if it still exists in the refreshed list; otherwise
  // falls back to the newest event by startDate.
  async function loadAll() {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('startDate', { ascending: false })

    if (eventsError) {
      console.error('load events failed', eventsError)
      return
    }

    const existing = get().currentEventId
    const stillValid = existing && events?.some(e => e.id === existing)
    const targetId = stillValid ? existing : events?.[0]?.id ?? null
    set({ events: events ?? [], currentEventId: targetId })
    if (targetId) await loadScopedData(targetId)
  }

  function clearAll() {
    set({
      events: [], currentEventId: null,
      currentUserEmail: null,
      currentUserRole: null,
      speakers: [], venues: [], sessions: [], sessionTypes: [], tracks: [],
      organizations: [], programs: [], experiences: [], accessLevels: [],
      auditLog: [],
    })
  }

  // Drive (re)loads from auth state rather than module init: pre-auth
  // fetches would hit RLS and silently return nothing, so without this
  // the store would stay empty even after sign-in. INITIAL_SESSION
  // fires immediately on subscription, so this handles both first
  // load and subsequent sign-in/out.
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) loadAll()
    else clearAll()
  })

  return {
    events: [],
    currentEventId: null,
    currentUserEmail: null,
    currentUserRole: null,
    setCurrentUser: (email, role) => set({ currentUserEmail: email, currentUserRole: role }),

    // Switch the active event. Clears stale filter selections (filter
    // ids belong to the old event) and re-fetches all event-scoped
    // data for the new event. Speakers are global so they don't need
    // a refetch, but loadScopedData does it anyway for simplicity.
    setCurrentEventId: async (id: string) => {
      set({
        currentEventId: id,
        selectedFilters: {
          venues: [], sessionTypes: [], tracks: [],
          organizations: [], programs: [],
          experiences: [], accessLevels: [],
        },
      })
      await loadScopedData(id)
    },

    // start empty—Supabase is source of truth
    speakers: [], venues: [], sessions: [], sessionTypes: [], tracks: [],
    organizations: [], programs: [], experiences: [], accessLevels: [],
    selectedFilters: { venues: [], sessionTypes: [], tracks: [], organizations: [], programs: [], experiences: [], accessLevels: [] },

    // — Speakers — (global, no eventId stamping)
    addSpeaker: async (speaker) => {
      const { id, ...payload } = speaker
      const { data, error } = await supabase
        .from('speakers')
        .insert(payload)
        .select()
        .single()
      if (error) {
        console.error('insert speaker failed', error)
      } else {
        set((s) => ({ speakers: [...s.speakers, data] }))
      }
    },
    updateSpeaker: async (id, updates) => {
      const { data, error } = await supabase
        .from('speakers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('update speaker failed', error)
      } else {
        set((s) => ({
          speakers: s.speakers.map((x) => (x.id === id ? data : x)),
        }))
      }
    },
    deleteSpeaker: async (id) => {
      const { error } = await supabase
        .from('speakers')
        .delete()
        .eq('id', id)
      if (error) {
        console.error('delete speaker failed', error)
      } else {
        set((s) => ({
          speakers: s.speakers.filter((x) => x.id !== id),
          sessions: s.sessions.map((sess) => ({
            ...sess,
            speakerIds: sess.speakerIds.filter((sid) => sid !== id),
          })),
        }))
      }
    },

    // — Venues —
    addVenue: async (venue) => {
      const stamped = withEventId(venue, 'addVenue')
      if (!stamped) return
      const { data, error } = await supabase
        .from('venues')
        .insert(stamped)
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
      const { id, sessionTypeId, accessLevelId, ...rest } = session

      const cleanArrays = {
        speakerIds:      (rest.speakerIds      || []).filter(Boolean),
        trackIds:        (rest.trackIds        || []).filter(Boolean),
        organizationIds: (rest.organizationIds || []).filter(Boolean),
        programIds:      (rest.programIds      || []).filter(Boolean),
        experienceIds:   (rest.experienceIds   || []).filter(Boolean),
      }

      const stamped = withEventId({ ...rest, ...cleanArrays }, 'addSession')
      if (!stamped) return

      const payload: Record<string, any> = { ...stamped }
      if (sessionTypeId)   payload.sessionTypeId  = sessionTypeId
      if (accessLevelId)   payload.accessLevelId  = accessLevelId

      const { data, error } = await supabase
        .from('sessions')
        .insert(payload)
        .select()
        .single()

      if (error) console.error('insert session failed', error)
      else       set(s => ({ sessions: [...s.sessions, data] }))
    },

    updateSession: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (!error) set(s => ({
        sessions: s.sessions.map(x => x.id === id ? data : x)
      }))
    },
    deleteSession: async (id) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (!error) set(s => ({ sessions: s.sessions.filter(x => x.id !== id) }))
    },

    // — Session Types —
    addSessionType: async (newType) => {
      const stamped = withEventId(newType, 'addSessionType')
      if (!stamped) return
      const { data, error } = await supabase
        .from('sessiontypes')
        .insert(stamped)
        .select()
        .single()
      if (error) {
        console.error('addSessionType failed', error)
      } else {
        set(state => ({
          sessionTypes: [...state.sessionTypes, data]
        }))
      }
    },
    updateSessionType: async (id, updates) => {
      const { data, error } = await supabase
        .from('sessiontypes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('updateSessionType failed', error)
      } else {
        set(state => ({
          sessionTypes: state.sessionTypes.map(t =>
            t.id === id ? data : t
          )
        }))
      }
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
      const stamped = withEventId(track, 'addTrack')
      if (!stamped) return
      const { data, error } = await supabase
        .from('tracks')
        .insert(stamped)
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
      const stamped = withEventId(org, 'addOrganization')
      if (!stamped) return
      const { data, error } = await supabase
        .from('organizations')
        .insert(stamped)
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
      const stamped = withEventId(prog, 'addProgram')
      if (!stamped) return
      const { data, error } = await supabase
        .from('programs')
        .insert(stamped)
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
      const stamped = withEventId(exp, 'addExperience')
      if (!stamped) return
      const { data, error } = await supabase
        .from('experiences')
        .insert(stamped)
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
      const stamped = withEventId(al, 'addAccessLevel')
      if (!stamped) return
      const { data, error } = await supabase
        .from('accesslevels')
        .insert(stamped)
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
    selectOnlyFilter: (filterType, id) => {
      set(s => ({
        selectedFilters: { ...s.selectedFilters, [filterType]: [id] },
      }))
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

    // — Audit log —
    auditLog: [],

    fetchAuditLog: async (limit = 50) => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .in('action', ['UPDATE', 'DELETE'])
        .order('changedAt', { ascending: false })
        .limit(limit)
      if (error) {
        console.error('fetchAuditLog failed', error)
        return
      }
      set({ auditLog: (data ?? []) as AuditEntry[] })
    },

    // Restore a row to the state captured in entry.oldData.
    //  - DELETE entry: re-insert the old row (with its original id so any
    //    surviving FK references still resolve).
    //  - UPDATE entry: write oldData back over the current row.
    // After either path, reload event-scoped data so the UI reflects the
    // change. Returns { success, error? } so the caller can surface failures.
    restoreFromAudit: async (entry) => {
      if (!entry.oldData) {
        return { success: false, error: 'Nothing to restore (no oldData on this entry).' }
      }
      const payload = { ...entry.oldData }
      // updated_at / created_at on the old row would be stale; let the DB
      // reassign updated_at via its trigger.
      delete payload.updated_at
      delete payload.updated_by

      if (entry.action === 'DELETE') {
        const { error } = await supabase.from(entry.tableName).insert(payload)
        if (error) return { success: false, error: error.message }
      } else if (entry.action === 'UPDATE') {
        if (!entry.recordId) return { success: false, error: 'Missing recordId on UPDATE entry.' }
        const { id: _id, ...rest } = payload
        const { error } = await supabase
          .from(entry.tableName)
          .update(rest)
          .eq('id', entry.recordId)
        if (error) return { success: false, error: error.message }
      } else {
        return { success: false, error: `Cannot restore from ${entry.action} entries.` }
      }

      const eid = get().currentEventId
      if (eid) await loadScopedData(eid)
      await get().fetchAuditLog()
      return { success: true }
    },
  }
})

// Convenience selector for admin-gated UI. Returns false when the role
// isn't known yet, so destructive buttons stay hidden until auth resolves.
export const useIsAdmin = () => useStore((s) => s.currentUserRole === 'admin')
