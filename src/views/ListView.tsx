import React, { useState } from 'react';
import dayjs from 'dayjs' // added to fix the UTC issue where the list date header was a day behind
import { ChevronUp, ChevronDown, ChevronsUpDown, Plus, Search, Edit, Trash, Lock } from 'lucide-react';
import { useStore, useIsAdmin, Session } from '../store';
import { SessionModal } from '../components/SessionModal';
import { useConfirm } from '../components/ConfirmDialog';
import { getInitialDate } from '../utils/dates';

export const ListView: React.FC = () => {
  const { sessions, venues, speakers, sessionTypes, tracks, accessLevels, selectedFilters, deleteSession, events, currentEventId } = useStore();
  const isAdmin = useIsAdmin();
  const confirm = useConfirm();
  const currentEvent = events.find(e => e.id === currentEventId);
  
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

  const handleDeleteClick = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent row click from triggering
    const session = sessions.find(s => s.id === sessionId);
    const ok = await confirm({
      title: 'Delete this session?',
      body: session ? <>This permanently removes <strong>{session.title || 'this session'}</strong>.</> : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) deleteSession(sessionId);
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

  // Format "08:00" → "8:00 AM", "16:30" → "4:30 PM". Returns ''
  // for falsy input so we can render time ranges robustly.
  const formatTime = (t: string | undefined | null) => {
    if (!t) return ''
    return dayjs(`2000-01-01T${t}`).format('h:mm A')
  }
  const formatTimeRange = (start: string | undefined | null, end: string | undefined | null) => {
    const s = formatTime(start)
    const e = formatTime(end)
    if (s && e) return `${s} – ${e}`
    if (s) return s
    if (e) return `Until ${e}`
    return ''
  }
  // True when endTime is set and earlier than startTime — visualizes
  // as a "+1" badge so accidental overnight ranges are obvious.
  const isOvernight = (start?: string | null, end?: string | null) =>
    !!(start && end && end < start)

  const getVenueName = (venueId: string) => venues.find(v => v.id === venueId)?.name || 'No venue';
  const getSessionTypeName = (typeId: string) => sessionTypes.find(t => t.id === typeId)?.name || 'No type';
  const getSpeakerNames = (ids: string[]) => ids.map(id => speakers.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'No speakers';
  const getAccessLevelName = (id: string) => accessLevels.find(a => a.id === id)?.name || '';
  // First track's color, used for the left-border accent on each row.
  const getRowAccent = (trackIds: string[]) => {
    if (!trackIds.length) return '#e5e7eb' // gray-200 fallback
    return tracks.find(t => t.id === trackIds[0])?.color || '#6366f1'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Sessions</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
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
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    {/* Fixed widths so columns align across all per-date tables. */}
                    <colgroup>
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '5%'  }} />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group" onClick={() => requestSort('title')}>
                          <div className="flex items-center">
                            Title
                            {getSortDirection('title') === 'ascending' ? (
                              <ChevronUp size={14} className="ml-1 text-gray-700" />
                            ) : getSortDirection('title') === 'descending' ? (
                              <ChevronDown size={14} className="ml-1 text-gray-700" />
                            ) : (
                              <ChevronsUpDown size={14} className="ml-1 text-gray-300 group-hover:text-gray-500 transition" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group" onClick={() => requestSort('startTime')}>
                          <div className="flex items-center">
                            Time
                            {getSortDirection('startTime') === 'ascending' ? (
                              <ChevronUp size={14} className="ml-1 text-gray-700" />
                            ) : getSortDirection('startTime') === 'descending' ? (
                              <ChevronDown size={14} className="ml-1 text-gray-700" />
                            ) : (
                              <ChevronsUpDown size={14} className="ml-1 text-gray-300 group-hover:text-gray-500 transition" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speakers</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
                        <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessionsByDate[date].map(session => {
                        const accent = getRowAccent(session.trackIds)
                        const accessName = getAccessLevelName(session.accessLevelId)
                        const isVIP = accessName === 'VIP'
                        const gating = (session as any).gating || 'public'
                        return (
                          <tr
                            key={session.id}
                            onClick={() => handleRowClick(session.id)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                            style={{ boxShadow: `inset 4px 0 0 ${accent}` }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <div className="text-sm font-medium text-gray-900">{session.title}</div>
                                {gating === 'invitation_only' && (
                                  <span className="px-1.5 py-0.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase rounded bg-amber-100 text-amber-800">
                                    <Lock size={10} />
                                    Invite Only
                                  </span>
                                )}
                                {gating === 'private' && (
                                  <span className="px-1.5 py-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase rounded bg-red-700 text-white">
                                    <Lock size={10} />
                                    Private
                                  </span>
                                )}
                                {isVIP && (
                                  <span className="px-1.5 py-0.5 inline-flex text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800">
                                    VIP
                                  </span>
                                )}
                              </div>
                              {session.description && (
                                <div className="text-xs text-gray-500 truncate max-w-md mt-0.5">{session.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                {formatTimeRange(session.startTime, session.endTime)}
                                {isOvernight(session.startTime, session.endTime) && (
                                  <span
                                    className="px-1 py-0 text-[10px] font-medium rounded bg-amber-100 text-amber-800"
                                    title="Session ends on the next day"
                                  >
                                    +1
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {session.venueId ? (
                                <span className="text-gray-600">{getVenueName(session.venueId)}</span>
                              ) : (
                                <span className="px-1.5 py-0.5 inline-flex text-[10px] font-medium uppercase rounded bg-red-50 text-red-700 border border-red-200">
                                  No venue
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {session.sessionTypeId && (
                                <span className="px-2 py-0.5 inline-flex text-xs font-medium rounded border border-gray-200 bg-gray-50 text-gray-700">
                                  {getSessionTypeName(session.sessionTypeId)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {getSpeakerNames(session.speakerIds)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {session.trackIds.map(id => {
                                  const track = tracks.find(t => t.id === id)
                                  if (!track) return null
                                  return (
                                    <span
                                      key={id}
                                      className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full text-white whitespace-nowrap"
                                      style={{ backgroundColor: track.color || '#6366f1' }}
                                    >
                                      {track.name}
                                    </span>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => handleEditClick(e, session.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit session"
                                >
                                  <Edit size={16} />
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => handleDeleteClick(e, session.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete session"
                                  >
                                    <Trash size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
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
          initialDate={sortedDates[0] || getInitialDate(sessions, currentEvent?.startDate)}
        />
      )}
    </div>
  );
};