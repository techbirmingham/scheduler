import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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

export interface SessionType {
  id: string;
  name: string;
  color?: string;
}

export interface Track {
  id: string;
  name: string;
  color?: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Program {
  id: string;
  name: string;
}

export interface Experience {
  id: string;
  name: string;
}

export interface AccessLevel {
  id: string;
  name: string;
}

interface State {
  speakers: Speaker[];
  venues: Venue[];
  sessions: Session[];
  sessionTypes: SessionType[];
  tracks: Track[];
  organizations: Organization[];
  programs: Program[];
  experiences: Experience[];
  accessLevels: AccessLevel[];
  selectedFilters: {
    venues: string[];
    sessionTypes: string[];
    tracks: string[];
    organizations: string[];
    programs: string[];
    experiences: string[];
    accessLevels: string[];
  };
  // Actions
  addSpeaker: (speaker: Omit<Speaker, 'id'>) => void;
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  deleteSpeaker: (id: string) => void;
  
  addVenue: (venue: Omit<Venue, 'id'>) => void;
  updateVenue: (id: string, updates: Partial<Venue>) => void;
  deleteVenue: (id: string) => void;
  
  addSession: (session: Omit<Session, 'id'>) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  
  addSessionType: (sessionType: Omit<SessionType, 'id'>) => void;
  updateSessionType: (id: string, updates: Partial<SessionType>) => void;
  deleteSessionType: (id: string) => void;
  
  addTrack: (track: Omit<Track, 'id'>) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  
  addOrganization: (organization: Omit<Organization, 'id'>) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  
  addProgram: (program: Omit<Program, 'id'>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  
  addExperience: (experience: Omit<Experience, 'id'>) => void;
  updateExperience: (id: string, updates: Partial<Experience>) => void;
  deleteExperience: (id: string) => void;
  
  addAccessLevel: (accessLevel: Omit<AccessLevel, 'id'>) => void;
  updateAccessLevel: (id: string, updates: Partial<AccessLevel>) => void;
  deleteAccessLevel: (id: string) => void;

  toggleFilter: (filterType: keyof State['selectedFilters'], id: string) => void;
  clearFilters: () => void;
}

// Initial data
const initialVenues: Venue[] = [
  { id: '1', name: 'Innovation Depot', location: 'Downtown', capacity: 400 },
  { id: '2', name: 'Lyric Theatre', location: 'Downtown', capacity: 750 },
  { id: '3', name: 'The Pizitz', location: 'Business District', capacity: 200 },
  { id: '4', name: 'Saturn', location: 'Avondale', capacity: 250 },
  { id: '5', name: 'WorkPlay Theater', location: 'Lakeview', capacity: 300 },
];

const initialSessionTypes: SessionType[] = [
  { id: '1', name: 'Keynote', color: '#4F46E5' },
  { id: '2', name: 'Workshop', color: '#8B5CF6' },
  { id: '3', name: 'Panel', color: '#EC4899' },
  { id: '4', name: 'Fireside Chat', color: '#F59E0B' },
  { id: '5', name: 'Breakout Session', color: '#10B981' },
  { id: '6', name: 'Networking', color: '#0EA5E9' },
  { id: '7', name: 'Meal', color: '#6B7280' },
];

const initialTracks: Track[] = [
  { id: '1', name: 'Business', color: '#2563EB' },
  { id: '2', name: 'Design', color: '#EC4899' },
  { id: '3', name: 'Technology', color: '#10B981' },
  { id: '4', name: 'Marketing', color: '#F59E0B' },
  { id: '5', name: 'Career Development', color: '#8B5CF6' },
  { id: '6', name: 'Diversity & Access', color: '#EF4444' },
];

const initialOrganizations: Organization[] = [
  { id: '1', name: 'Innovate Alabama' },
  { id: '2', name: 'BASE' },
];

const initialPrograms: Program[] = [
  { id: '1', name: 'Next In Tech' },
];

const initialExperiences: Experience[] = [
  { id: '1', name: 'Parties & Mixers' },
  { id: '2', name: 'Dinners' },
];

const initialAccessLevels: AccessLevel[] = [
  { id: '1', name: 'Public' },
  { id: '2', name: 'VIP' },
  { id: '3', name: 'Invite Only' },
];

const initialSpeakers: Speaker[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    title: 'CTO',
    company: 'TechForward',
    bio: 'Alex is a seasoned technology leader with over 15 years of experience.',
    photoUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'CEO',
    company: 'Innovate AI',
    bio: 'Michael is a visionary entrepreneur focused on artificial intelligence.',
    photoUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    id: '3',
    name: 'Samantha Williams',
    title: 'Design Director',
    company: 'CreativeSphere',
    bio: 'Samantha leads design strategy for Fortune 500 companies.',
    photoUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    id: '4',
    name: 'Priya Patel',
    title: 'VP of Engineering',
    company: 'CodeBridge',
    bio: 'Priya specializes in scalable infrastructure and developer productivity.',
    photoUrl: 'https://images.pexels.com/photos/3796217/pexels-photo-3796217.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
];

// Sample initial sessions
const initialSessions: Session[] = [
  {
    id: '1',
    title: 'Welcome to Sloss Tech',
    description: 'Opening remarks and conference overview',
    startTime: '09:00',
    endTime: '09:30',
    venueId: '2', // Lyric Theatre
    date: '2025-05-26',
    speakerIds: ['2'], // Michael Chen
    sessionTypeId: '1', // Keynote
    trackIds: ['1'], // Business
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: '1', // Public
  },
  {
    id: '2',
    title: 'The Future of AI in Everyday Tech',
    description: 'Industry experts discuss how AI is transforming consumer technology',
    startTime: '10:00',
    endTime: '11:00',
    venueId: '2', // Lyric Theatre
    date: '2025-05-26',
    speakerIds: ['1', '2'], // Alex Johnson, Michael Chen
    sessionTypeId: '3', // Panel
    trackIds: ['3'], // Technology
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: '1', // Public
  },
  {
    id: '3',
    title: 'Design Systems at Scale',
    description: 'Hands-on workshop on building and maintaining design systems',
    startTime: '10:00',
    endTime: '11:30',
    venueId: '3', // The Pizitz
    date: '2025-05-26',
    speakerIds: ['3'], // Samantha Williams
    sessionTypeId: '2', // Workshop
    trackIds: ['2'], // Design
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: '1', // Public
  },
  {
    id: '4',
    title: 'Engineering Leadership Roundtable',
    description: 'Discussion on building and leading engineering teams',
    startTime: '13:00',
    endTime: '14:30',
    venueId: '5', // WorkPlay Theater
    date: '2025-05-26',
    speakerIds: ['4'], // Priya Patel
    sessionTypeId: '3', // Panel
    trackIds: ['3', '5'], // Technology, Career Development
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: '2', // VIP
  }
];

export const useStore = create<State>()(
  persist(
    (set) => ({
      speakers: initialSpeakers,
      venues: initialVenues,
      sessions: initialSessions,
      sessionTypes: initialSessionTypes,
      tracks: initialTracks,
      organizations: initialOrganizations,
      programs: initialPrograms,
      experiences: initialExperiences,
      accessLevels: initialAccessLevels,
      selectedFilters: {
        venues: [],
        sessionTypes: [],
        tracks: [],
        organizations: [],
        programs: [],
        experiences: [],
        accessLevels: [],
      },
      
      // Speakers
      addSpeaker: (speaker) => set((state) => ({
        speakers: [...state.speakers, { id: uuidv4(), ...speaker }]
      })),
      updateSpeaker: (id, updates) => set((state) => ({
        speakers: state.speakers.map(speaker => 
          speaker.id === id ? { ...speaker, ...updates } : speaker
        )
      })),
      deleteSpeaker: (id) => set((state) => ({
        speakers: state.speakers.filter(speaker => speaker.id !== id),
        // Also remove this speaker from any sessions
        sessions: state.sessions.map(session => ({
          ...session,
          speakerIds: session.speakerIds.filter(speakerId => speakerId !== id)
        }))
      })),
      
      // Venues
      addVenue: (venue) => set((state) => ({
        venues: [...state.venues, { id: uuidv4(), ...venue }]
      })),
      updateVenue: (id, updates) => set((state) => ({
        venues: state.venues.map(venue => 
          venue.id === id ? { ...venue, ...updates } : venue
        )
      })),
      deleteVenue: (id) => set((state) => ({
        venues: state.venues.filter(venue => venue.id !== id),
        // Update any sessions at this venue to have no venue
        sessions: state.sessions.map(session => 
          session.venueId === id 
            ? { ...session, venueId: '' } 
            : session
        )
      })),
      
      // Sessions
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, { id: uuidv4(), ...session }]
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(session => 
          session.id === id ? { ...session, ...updates } : session
        )
      })),
      deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter(session => session.id !== id)
      })),
      
      // Session Types
      addSessionType: (sessionType) => set((state) => ({
        sessionTypes: [...state.sessionTypes, { id: uuidv4(), ...sessionType }]
      })),
      updateSessionType: (id, updates) => set((state) => ({
        sessionTypes: state.sessionTypes.map(sessionType => 
          sessionType.id === id ? { ...sessionType, ...updates } : sessionType
        )
      })),
      deleteSessionType: (id) => set((state) => ({
        sessionTypes: state.sessionTypes.filter(sessionType => sessionType.id !== id),
        // Update any sessions with this type to have no type
        sessions: state.sessions.map(session => 
          session.sessionTypeId === id 
            ? { ...session, sessionTypeId: '' } 
            : session
        )
      })),
      
      // Tracks
      addTrack: (track) => set((state) => ({
        tracks: [...state.tracks, { id: uuidv4(), ...track }]
      })),
      updateTrack: (id, updates) => set((state) => ({
        tracks: state.tracks.map(track => 
          track.id === id ? { ...track, ...updates } : track
        )
      })),
      deleteTrack: (id) => set((state) => ({
        tracks: state.tracks.filter(track => track.id !== id),
        // Remove this track from any sessions
        sessions: state.sessions.map(session => ({
          ...session,
          trackIds: session.trackIds.filter(trackId => trackId !== id)
        }))
      })),
      
      // Organizations
      addOrganization: (organization) => set((state) => ({
        organizations: [...state.organizations, { id: uuidv4(), ...organization }]
      })),
      updateOrganization: (id, updates) => set((state) => ({
        organizations: state.organizations.map(org => 
          org.id === id ? { ...org, ...updates } : org
        )
      })),
      deleteOrganization: (id) => set((state) => ({
        organizations: state.organizations.filter(org => org.id !== id),
        // Remove this organization from any sessions
        sessions: state.sessions.map(session => ({
          ...session,
          organizationIds: session.organizationIds.filter(orgId => orgId !== id)
        }))
      })),
      
      // Programs
      addProgram: (program) => set((state) => ({
        programs: [...state.programs, { id: uuidv4(), ...program }]
      })),
      updateProgram: (id, updates) => set((state) => ({
        programs: state.programs.map(program => 
          program.id === id ? { ...program, ...updates } : program
        )
      })),
      deleteProgram: (id) => set((state) => ({
        programs: state.programs.filter(program => program.id !== id),
        // Remove this program from any sessions
        sessions: state.sessions.map(session => ({
          ...session,
          programIds: session.programIds.filter(progId => progId !== id)
        }))
      })),
      
      // Experiences
      addExperience: (experience) => set((state) => ({
        experiences: [...state.experiences, { id: uuidv4(), ...experience }]
      })),
      updateExperience: (id, updates) => set((state) => ({
        experiences: state.experiences.map(exp => 
          exp.id === id ? { ...exp, ...updates } : exp
        )
      })),
      deleteExperience: (id) => set((state) => ({
        experiences: state.experiences.filter(exp => exp.id !== id),
        // Remove this experience from any sessions
        sessions: state.sessions.map(session => ({
          ...session,
          experienceIds: session.experienceIds.filter(expId => expId !== id)
        }))
      })),
      
      // Access Levels
      addAccessLevel: (accessLevel) => set((state) => ({
        accessLevels: [...state.accessLevels, { id: uuidv4(), ...accessLevel }]
      })),
      updateAccessLevel: (id, updates) => set((state) => ({
        accessLevels: state.accessLevels.map(level => 
          level.id === id ? { ...level, ...updates } : level
        )
      })),
      deleteAccessLevel: (id) => set((state) => ({
        accessLevels: state.accessLevels.filter(level => level.id !== id),
        // Update any sessions with this access level to have no access level
        sessions: state.sessions.map(session => 
          session.accessLevelId === id 
            ? { ...session, accessLevelId: '' } 
            : session
        )
      })),
      
      // Filters
      toggleFilter: (filterType, id) => set((state) => {
        const currentFilters = state.selectedFilters[filterType];
        const newFilters = currentFilters.includes(id)
          ? currentFilters.filter(filterId => filterId !== id)
          : [...currentFilters, id];
          
        return {
          selectedFilters: {
            ...state.selectedFilters,
            [filterType]: newFilters
          }
        };
      }),
      
      clearFilters: () => set((state) => ({
        selectedFilters: {
          venues: [],
          sessionTypes: [],
          tracks: [],
          organizations: [],
          programs: [],
          experiences: [],
          accessLevels: [],
        }
      })),
    }),
    {
      name: 'conference-agenda-store',
    }
  )
);