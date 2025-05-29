import React, { useState, useRef, useEffect } from 'react';
import FullCalendar, { EventDropArg, EventResizeDoneArg } from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store';
import { SessionModal } from '../components/SessionModal';
import { DateNavigator } from '../components/DateNavigator';
import { getInitialDate } from '../utils/dates';

export const GridView: React.FC = () => {
  const { venues, sessions, sessionTypes, speakers, tracks, selectedFilters } = useStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions));
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(selectedDate);
  }, [selectedDate]);

// 1) Define available slot durations (from longest to shortest)
const slotDurations = [
  '01:00:00',  // 60 minutes
  '00:50:00',  // 50 minutes
  '00:40:00',  // 40 minutes
  '00:30:00',  // 30 minutes
  '00:20:00',  // 20 minutes
  '00:15:00',  // 15 minutes
  '00:10:00',  // 10 minutes
  '00:05:00',  // 5 minutes
];

// 2) Your zoom state
const [zoomLevel, setZoomLevel] = useState(3)  
// (starting at the 4th index, e.g. 30-minute slots)

  const handleZoomIn = () => setZoomLevel(z => Math.min(z + 1, slotDurations.length - 1));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z - 1, 0));
  const currentSlotDuration = slotDurations[zoomLevel];

  useEffect(() => {
    document.body.classList.add(`zoom-${zoomLevel}`);
    return () => { document.body.classList.remove(`zoom-${zoomLevel}`); };
  }, [zoomLevel]);

  const filteredSessions = sessions.filter(session => {
    if (selectedFilters.venues.length && !selectedFilters.venues.includes(session.venueId)) return false;
    if (selectedFilters.sessionTypes.length && !selectedFilters.sessionTypes.includes(session.sessionTypeId)) return false;
    if (selectedFilters.tracks.length && !session.trackIds.some(id => selectedFilters.tracks.includes(id))) return false;
    if (selectedFilters.organizations.length && !session.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false;
    if (selectedFilters.programs.length && !session.programIds.some(id => selectedFilters.programs.includes(id))) return false;
    if (selectedFilters.experiences.length && !session.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false;
    if (selectedFilters.accessLevels.length && !selectedFilters.accessLevels.includes(session.accessLevelId)) return false;
    return true;
  });

  const events = filteredSessions
    .filter(s => s.date === selectedDate)
    .map(session => {
      const type = sessionTypes.find(t => t.id === session.sessionTypeId);
      return {
        id: session.id,
        title: session.title,
        start: `${session.date}T${session.startTime}`,
        end: `${session.date}T${session.endTime}`,
        resourceId: session.venueId,
        backgroundColor: type?.color || '#3788d8',
        borderColor: type?.color || '#3788d8',
        extendedProps: { description: session.description, speakers: session.speakerIds, sessionTypeId: session.sessionTypeId, trackIds: session.trackIds }
      };
    });

  const resources = venues
  .filter(v => visibleVenueIds.includes(v.id))
  .map(v => ({ id: v.id, title: v.name.toUpperCase() }));

  const handleDateSelect = (arg: any) => {
    const startStr = arg.startStr;
    const endStr = arg.endStr;
    const start = startStr.split('T')[1].substring(0, 5);
    const end   = endStr.split('T')[1].substring(0, 5);
    setSelectedTimeRange({ start, end });
    setSelectedVenue(arg.resource?.id || null);
    setEditingSession(null);
    setModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    setEditingSession(info.event.id);
    setModalOpen(true);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const e = info.event;
    const newDate  = format(e.start!, 'yyyy-MM-dd');
    const newStart = format(e.start!, 'HH:mm');
    const newEnd   = format(e.end!,   'HH:mm');
    const newVenueId = info.resource?.id || e.getResources()[0]?.id || '';

    await useStore.getState().updateSession(e.id, { date: newDate, startTime: newStart, endTime: newEnd, venueId: newVenueId });
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const e = info.event;
    const newDate  = format(e.start!, 'yyyy-MM-dd');
    const newStart = format(e.start!, 'HH:mm');
    const newEnd   = format(e.end!,   'HH:mm');

    await useStore.getState().updateSession(e.id, { date: newDate, startTime: newStart, endTime: newEnd });
  };

  const handleAddClick = () => {
    setEditingSession(null);
    setSelectedTimeRange(null);
    setSelectedVenue(null);
    setModalOpen(true);
  };

const closeModal = () => {
  // 1) clear FullCalendar’s select highlight
  const api = calendarRef.current?.getApi();
  if (api) api.unselect();

  // 2) then reset your React state
  setModalOpen(false);
  setEditingSession(null);
  setSelectedTimeRange(null);
  setSelectedVenue(null);
};

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Grid View</h1>
        <button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
          <Plus size={16} className="mr-1" /> Add Session
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />
        <div className="flex items-center space-x-2">
          <button onClick={handleZoomIn} disabled={zoomLevel === slotDurations.length - 1} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50">
            <ZoomIn size={16} />
          </button>
          <button onClick={handleZoomOut} disabled={zoomLevel === 0} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50">
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          initialDate={selectedDate}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration={currentSlotDuration}
          snapDuration={currentSlotDuration}
          height="100%"
          events={events}
          resources={resources}
          resourceAreaWidth="15%"
          selectable={true}
          selectMirror={true}
          editable={true}
          droppable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          resourceAreaHeaderContent="Venues"
          slotLabelFormat={[{ hour: 'numeric', minute: '2-digit', hour12: true, meridiem: 'short' }]}
        />
      </div>

      {modalOpen && (
        <SessionModal isOpen={modalOpen} onClose={closeModal} sessionId={editingSession} initialVenueId={selectedVenue} initialTimeRange={selectedTimeRange} initialDate={selectedDate} />
      )}
    </div>
  );
};