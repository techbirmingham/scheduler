import React, { useState } from 'react';
import dayjs from 'dayjs' // added to fix the UTC issue where the list date header was a day behind
import { ChevronUp, ChevronDown, Plus, Search, Edit, Trash } from 'lucide-react';
import { useStore, Session } from '../store';
import { SessionModal } from '../components/SessionModal';
import { getInitialDate } from '../utils/dates';

export const ListView: React.FC = () => {
  const { sessions, venues, speakers, sessionTypes, tracks, selectedFilters, deleteSession } = useStore();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Session;
    direction: 'ascending' | 'descending';
  } | null>(null);

  const filteredSessions = sessions.filter(session => {
    if (searchTerm && !session.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !session.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedFilters.venues.length > 0 && !selectedFilters.venues.includes(session.venueId)) return false;
    if (selectedFilters.sessionTypes.length > 0 && !selectedFilters.sessionTypes.includes(session.sessionTypeId)) return false;
    if (selectedFilters.tracks.length > 0 && !session.trackIds.some(id => selectedFilters.tracks.includes(id))) return false;
    if (selectedFilters.organizations.length > 0 && !session.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false;
    if (selectedFilters.programs.length > 0 && !session.programIds.some(id => selectedFilters.programs.includes(id))) return false;
    if (selectedFilters.experiences.length > 0 && !session.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false;
    if (selectedFilters.accessLevels.length > 0 && !selectedFilters.accessLevels.includes(session.accessLevelId)) return false;
    return true;
  });

  const sortedSessions = React.useMemo(() => {
    let sortableSessions = [...filteredSessions];
    if (sortConfig !== null) {
      sortableSessions.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableSessions;
  }, [filteredSessions, sortConfig]);

  const requestSort = (key: keyof Session) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: keyof Session) => {
    return sortConfig?.key === key ? sortConfig.direction : null;
  };

  const sessionsByDate = sortedSessions.reduce((groups, session) => {
    const date = session.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {} as Record<string, typeof sessions>);

  const sortedDates = Object.keys(sessionsByDate).sort();

  const handleAddClick = () => {
    setEditingSession(null);
    setModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent row click from triggering
    setEditingSession(sessionId);
    setModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent row click from triggering
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSession(sessionId);
    }
  };

  const handleRowClick = (sessionId: string) => {
    setEditingSession(sessionId);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSession(null);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    // fix UTC issue where date is a day behind > OLD: return new Date(dateString).toLocaleDateString('en-US', options);
    return dayjs(dateString).format('dddd, MMMM D, YYYY')
  };

  const getVenueName = (venueId: string) => venues.find(v => v.id === venueId)?.name || 'No venue';
  const getSessionTypeName = (typeId: string) => sessionTypes.find(t => t.id === typeId)?.name || 'No type';
  const getSpeakerNames = (ids: string[]) => ids.map(id => speakers.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'No speakers';
  const getTrackNames = (ids: string[]) => ids.map(id => tracks.find(t => t.id === id)?.name).filter(Boolean).join(', ') || 'No tracks';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">List View</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button 
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {sortedDates.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <p className="text-gray-500">No sessions found. Try adjusting your filters or add a new session.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-medium text-gray-800">
                    {formatDate(date)}
                    <span className="ml-2 text-sm text-gray-500">
                      ({sessionsByDate[date].length} sessions)
                    </span>
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('title')}>
                          <div className="flex items-center">
                            Title
                            {getSortDirection('title') === 'ascending' && <ChevronUp size={14} className="ml-1" />}
                            {getSortDirection('title') === 'descending' && <ChevronDown size={14} className="ml-1" />}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('startTime')}>
                          <div className="flex items-center">
                            Time
                            {getSortDirection('startTime') === 'ascending' && <ChevronUp size={14} className="ml-1" />}
                            {getSortDirection('startTime') === 'descending' && <ChevronDown size={14} className="ml-1" />}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speakers</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessionsByDate[date].map(session => (
                        console.log('New session object:', session) ||
                        <tr 
                          key={session.id} 
                          onClick={() => handleRowClick(session.id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{session.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{session.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.startTime} - {session.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getVenueName(session.venueId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {session.sessionTypeId && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                {getSessionTypeName(session.sessionTypeId)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getSpeakerNames(session.speakerIds)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getTrackNames(session.trackIds)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={(e) => handleEditClick(e, session.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit session"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(e, session.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete session"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <SessionModal
          isOpen={modalOpen}
          onClose={closeModal}
          sessionId={editingSession}
          initialVenueId={null}
          initialTimeRange={null}
          initialDate={sortedDates[0] || getInitialDate(sessions)}
        />
      )}
    </div>
  );
};