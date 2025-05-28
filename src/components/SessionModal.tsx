import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore, Session } from '../store';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  initialVenueId: string | null;
  initialTimeRange: { start: string; end: string } | null;
  initialDate: string;
}

export const SessionModal: React.FC<SessionModalProps> = ({ 
  isOpen, 
  onClose, 
  sessionId, 
  initialVenueId,
  initialTimeRange,
  initialDate
}) => {
  const { 
    sessions, venues, speakers, sessionTypes, tracks, 
    organizations, programs, experiences, accessLevels,
    addSession, updateSession, deleteSession
  } = useStore();
  
  const existingSession = sessionId ? sessions.find(s => s.id === sessionId) : null;
  
  const [formData, setFormData] = useState<Omit<Session, 'id'>>({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    venueId: '',
    date: initialDate,
    speakerIds: [],
    sessionTypeId: '',
    trackIds: [],
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: ''
  });

  // Update form data when session changes
  useEffect(() => {
    if (existingSession) {
      setFormData({
        title: existingSession.title,
        description: existingSession.description,
        startTime: existingSession.startTime,
        endTime: existingSession.endTime,
        venueId: existingSession.venueId,
        date: existingSession.date,
        speakerIds: existingSession.speakerIds,
        sessionTypeId: existingSession.sessionTypeId,
        trackIds: existingSession.trackIds,
        organizationIds: existingSession.organizationIds,
        programIds: existingSession.programIds,
        experienceIds: existingSession.experienceIds,
        accessLevelId: existingSession.accessLevelId
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startTime: initialTimeRange?.start || '09:00',
        endTime: initialTimeRange?.end || '10:00',
        venueId: initialVenueId || '',
        date: initialDate,
        speakerIds: [],
        sessionTypeId: '',
        trackIds: [],
        organizationIds: [],
        programIds: [],
        experienceIds: [],
        accessLevelId: ''
      });
    }
  }, [existingSession, initialVenueId, initialTimeRange, initialDate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, fieldName: string) => {
    const options = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, [fieldName]: options }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sessionId) {
      updateSession(sessionId, formData);
    } else {
      addSession(formData);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (sessionId && window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {sessionId ? 'Edit Session' : 'Add Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-20rem)]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter session title"
                  autoFocus
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter session description"
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="venueId" className="block text-sm font-medium text-gray-700 mb-1">
                  Venue
                </label>
                <select
                  id="venueId"
                  name="venueId"
                  value={formData.venueId}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="sessionTypeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  id="sessionTypeId"
                  name="sessionTypeId"
                  value={formData.sessionTypeId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a session type</option>
                  {sessionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="accessLevelId" className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level
                </label>
                <select
                  id="accessLevelId"
                  name="accessLevelId"
                  value={formData.accessLevelId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select access level</option>
                  {accessLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="trackIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Tracks
                </label>
                <select
                  id="trackIds"
                  name="trackIds"
                  multiple
                  value={formData.trackIds}
                  onChange={(e) => handleMultiSelectChange(e, 'trackIds')}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                >
                  {tracks.map(track => (
                    <option key={track.id} value={track.id}>
                      {track.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>
              
              <div>
                <label htmlFor="speakerIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Speakers
                </label>
                <select
                  id="speakerIds"
                  name="speakerIds"
                  multiple
                  value={formData.speakerIds}
                  onChange={(e) => handleMultiSelectChange(e, 'speakerIds')}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                >
                  {speakers.map(speaker => (
                    <option key={speaker.id} value={speaker.id}>
                      {speaker.name} ({speaker.company})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>
              
              <div>
                <label htmlFor="organizationIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Organizations
                </label>
                <select
                  id="organizationIds"
                  name="organizationIds"
                  multiple
                  value={formData.organizationIds}
                  onChange={(e) => handleMultiSelectChange(e, 'organizationIds')}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>
              
              <div>
                <label htmlFor="programIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Programs
                </label>
                <select
                  id="programIds"
                  name="programIds"
                  multiple
                  value={formData.programIds}
                  onChange={(e) => handleMultiSelectChange(e, 'programIds')}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                >
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>
              
              <div>
                <label htmlFor="experienceIds" className="block text-sm font-medium text-gray-700 mb-1">
                  Experiences
                </label>
                <select
                  id="experienceIds"
                  name="experienceIds"
                  multiple
                  value={formData.experienceIds}
                  onChange={(e) => handleMultiSelectChange(e, 'experienceIds')}
                  className="w-full p-2 border border-gray-300 rounded-md h-24"
                >
                  {experiences.map(exp => (
                    <option key={exp.id} value={exp.id}>
                      {exp.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            {/* Delete button - only show when editing */}
            {sessionId && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Session
              </button>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              >
                {sessionId ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};