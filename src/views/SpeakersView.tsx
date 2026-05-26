import React, { useState, useEffect } from 'react';
import { Grid, List, Search, Plus, Edit, Trash, X } from 'lucide-react';
import { useStore, useIsAdmin, Speaker } from '../store';
import { useConfirm } from '../components/ConfirmDialog';
import { findDuplicateByName } from '../utils/findDuplicateByName';

// Renders a speaker's photo if one exists, otherwise a CSS-generated
// initials avatar. Avoids a hardcoded external fallback URL that would
// break uniformly across every speaker missing a photo.
const SpeakerAvatar: React.FC<{
  name: string
  photoUrl?: string
  size: 'sm' | 'md'
  className?: string
}> = ({ name, photoUrl, size, className = '' }) => {
  const [failed, setFailed] = useState(false)
  const dim = size === 'md' ? 'h-16 w-16 text-lg' : 'h-10 w-10 text-sm'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (!photoUrl || failed) {
    return (
      <div
        className={`${dim} rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center justify-center flex-shrink-0 ${className}`}
        aria-label={name}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      className={`${dim} rounded-full object-cover flex-shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

interface SpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakerId: string | null;
  /** Called when the user picks "Open existing" on the dupe prompt —
   *  parent switches the modal into edit-mode for that id. */
  onOpenExisting?: (id: string) => void;
}

const SpeakerModal: React.FC<SpeakerModalProps> = ({ isOpen, onClose, speakerId, onOpenExisting }) => {
  const { speakers, addSpeaker, updateSpeaker } = useStore();
  const confirm = useConfirm();
  const existingSpeaker = speakerId ? speakers.find(s => s.id === speakerId) : null;
  
  const [formData, setFormData] = useState<Omit<Speaker, 'id'>>({
    name: '',
    title: '',
    company: '',
    bio: '',
    photoUrl: ''
  });
  
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
  
  useEffect(() => {
    if (existingSpeaker) {
      setFormData({
        name: existingSpeaker.name,
        title: existingSpeaker.title,
        company: existingSpeaker.company,
        bio: existingSpeaker.bio,
        photoUrl: existingSpeaker.photoUrl
      });
    } else {
      setFormData({
        name: '',
        title: '',
        company: '',
        bio: '',
        photoUrl: ''
      });
    }
  }, [existingSpeaker]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block exact case-insensitive name duplicates. Soft block — Cancel
    // leaves the user in the modal so they can disambiguate the name
    // (e.g., "Sarah Smith (NASA)" vs "Sarah Smith (Stripe)") if they
    // actually meant a separate speaker.
    const dupe = findDuplicateByName(formData.name, speakers, speakerId);
    if (dupe) {
      const openExisting = await confirm({
        title: `"${dupe.name}" already exists`,
        body: <>A speaker with this name already exists. Open the existing entry instead of creating a duplicate?</>,
        confirmLabel: 'Open existing',
        cancelLabel: 'Cancel',
      });
      if (openExisting && onOpenExisting) {
        onOpenExisting(dupe.id);
      }
      return;
    }

    if (speakerId) {
      updateSpeaker(speakerId, formData);
    } else {
      addSpeaker(formData);
    }

    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {speakerId ? 'Edit Speaker' : 'Add Speaker'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-20rem)]">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter speaker name"
                  autoFocus
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter speaker title"
                />
              </div>
              
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  id="photoUrl"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter photo URL"
                />
                {formData.photoUrl && (
                  <div className="mt-2">
                    <SpeakerAvatar name={formData.name || 'Speaker'} photoUrl={formData.photoUrl} size="md" />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter speaker bio"
                />
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
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
              {speakerId ? 'Save Changes' : 'Add Speaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SpeakersView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { speakers, sessions, deleteSpeaker } = useStore();
  const isAdmin = useIsAdmin();
  const confirm = useConfirm();
  
  // Filter speakers based on search term
  const filteredSpeakers = speakers.filter(speaker => 
    speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddClick = () => {
    setEditingSpeakerId(null);
    setModalOpen(true);
  };
  
  const handleEditClick = (speakerId: string) => {
    setEditingSpeakerId(speakerId);
    setModalOpen(true);
  };
  
  const handleDeleteClick = async (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    const speakerSessions = sessions.filter(session =>
      session.speakerIds.includes(speakerId)
    );

    const ok = await confirm({
      title: speaker ? `Delete "${speaker.name}"?` : 'Delete this speaker?',
      body: speakerSessions.length > 0
        ? <>This speaker is assigned to <strong>{speakerSessions.length} session{speakerSessions.length === 1 ? '' : 's'}</strong>. Removing them will also remove them from those sessions.</>
        : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteSpeaker(speakerId);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setEditingSpeakerId(null);
  };
  
  // Get sessions for a speaker
  const getSpeakerSessions = (speakerId: string) => {
    return sessions.filter(session => session.speakerIds.includes(speakerId));
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Speakers</h1>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search speakers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>

          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Speaker
          </button>
        </div>
      </div>
      
      {filteredSpeakers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow">
          <div className="text-center p-6">
            <p className="text-gray-500 mb-4">No speakers found. Try adjusting your search or add a new speaker.</p>
            <button
              onClick={handleAddClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md inline-flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Speaker
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min overflow-y-auto pb-4">
          {filteredSpeakers.map(speaker => {
            const speakerSessions = getSpeakerSessions(speaker.id);

            return (
              <div
                key={speaker.id}
                className="bg-white rounded-lg shadow overflow-hidden flex flex-col min-h-[8rem] cursor-pointer hover:shadow-md transition"
                onClick={() => handleEditClick(speaker.id)}
              >
                <div className="p-4 flex items-center">
                  <SpeakerAvatar name={speaker.name} photoUrl={speaker.photoUrl} size="md" className="mr-4" />
                  <div>
                    <h3 className="font-medium text-gray-900">{speaker.name}</h3>
                    <p className="text-sm text-gray-600">
                      {speaker.title}{speaker.company ? ` at ${speaker.company}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="p-4 pt-0 flex-1">
                  <p className="text-sm text-gray-600 mb-3">{speaker.bio}</p>
                  
                  {speakerSessions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">
                        Sessions ({speakerSessions.length}):
                      </h4>
                      <ul className="text-xs text-gray-600">
                        {speakerSessions.slice(0, 2).map(session => (
                          <li key={session.id} className="mb-1 truncate">• {session.title}</li>
                        ))}
                        {speakerSessions.length > 2 && (
                          <li className="text-indigo-600">+ {speakerSessions.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 border-t flex justify-end space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditClick(speaker.id); }}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <Edit size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(speaker.id); }}
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speaker
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSpeakers.map(speaker => {
                const speakerSessions = getSpeakerSessions(speaker.id);
                
                return (
                  <tr
                    key={speaker.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEditClick(speaker.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <SpeakerAvatar name={speaker.name} photoUrl={speaker.photoUrl} size="sm" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{speaker.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {speaker.title}{speaker.company ? ` at ${speaker.company}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">{speaker.bio}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {speakerSessions.length > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {speakerSessions.length} sessions
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No sessions
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditClick(speaker.id); }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(speaker.id); }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {modalOpen && (
        <SpeakerModal
          isOpen={modalOpen}
          onClose={closeModal}
          speakerId={editingSpeakerId}
          onOpenExisting={(id) => setEditingSpeakerId(id)}
        />
      )}
    </div>
  );
};