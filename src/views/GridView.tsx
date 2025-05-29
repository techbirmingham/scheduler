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

  // sync calendar with date changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(selectedDate);
  }, [selectedDate]);

  // slot durations for zoom
  const slotDurations = [
    '01:00:00', '00:50:00', '00:40:00',
    '00:30:00', '00:20:00', '00:15:00',
    '00:10:00', '00:05:00',
  ];
  const [zoomLevel, setZoomLevel] = useState(3); // 30m
  const currentSlotDuration = slotDurations[zoomLevel];
  const handleZoomIn  = () => setZoomLevel(z => Math.min(z+1, slotDurations.length-1));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z-1, 0));

  useEffect(() => {
    document.body.classList.add(`zoom-${zoomLevel}`);
    return () => { document.body.classList.remove(`zoom-${zoomLevel}`); };
  }, [zoomLevel]);

  // filter sessions
  const filtered = sessions.filter(s => {
    if (selectedFilters.venues.length && !selectedFilters.venues.includes(s.venueId)) return false;
    if (selectedFilters.sessionTypes.length && !selectedFilters.sessionTypes.includes(s.sessionTypeId)) return false;
    if (selectedFilters.tracks.length && !s.trackIds.some(id => selectedFilters.tracks.includes(id))) return false;
    if (selectedFilters.organizations.length && !s.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false;
    if (selectedFilters.programs.length && !s.programIds.some(id => selectedFilters.programs.includes(id))) return false;
    if (selectedFilters.experiences.length && !s.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false;
    if (selectedFilters.accessLevels.length && !selectedFilters.accessLevels.includes(s.accessLevelId)) return false;
    return true;
  });

  // map to FullCalendar events
  const events = filtered
    .filter(s => s.date === selectedDate)
    .map(session => {
      const type = sessionTypes.find(t => t.id === session.sessionTypeId);
      return {
        id: session.id,
        title: session.title,
        start: `${session.date}T${session.startTime}`,
        end:   `${session.date}T${session.endTime}`,
        resourceId: session.venueId,
        backgroundColor: type?.color || '#3788d8',
        borderColor:     type?.color || '#3788d8',
        extendedProps: { description: session.description, speakers: session.speakerIds, sessionTypeId: session.sessionTypeId, trackIds: session.trackIds }
      };
    });

  // resources
  const resources = venues.map(v => ({ id: v.id, title: v.name.toUpperCase() }));

  // selection handlers
  const handleDateSelect = (arg: any) => {
    const [ , start ] = arg.startStr.split('T');
    const [ , end ]   = arg.endStr.split('T');
    setSelectedTimeRange({ start: start.slice(0,5), end: end.slice(0,5) });
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
    await useStore.getState().updateSession(e.id, {
      date:      format(e.start!, 'yyyy-MM-dd'),
      startTime: format(e.start!, 'HH:mm'),
      endTime:   format(e.end!,   'HH:mm'),
      venueId:   info.resource?.id || e.getResources()[0]?.id || '',
    });
  };
  const handleEventResize = async (info: EventResizeDoneArg) => {
    const e = info.event;
    await useStore.getState().updateSession(e.id, {
      date:      format(e.start!, 'yyyy-MM-dd'),
      startTime: format(e.start!, 'HH:mm'),
      endTime:   format(e.end!,   'HH:mm'),
    });
  };

  const handleAddClick = () => {
    setEditingSession(null);
    setSelectedTimeRange(null);
    setSelectedVenue(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    calendarRef.current?.getApi().unselect();
    setModalOpen(false);
    setEditingSession(null);
    setSelectedTimeRange(null);
    setSelectedVenue(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── unified control bar ───────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Grid View</h1>

        <div className="flex items-center space-x-2">
          <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel === 0}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel === slotDurations.length - 1}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <button
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Add Session
        </button>
      </div>

      {/* ── calendar pane ──────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          initialDate={selectedDate}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration={currentSlotDuration}
          snapDuration={currentSlotDuration}
          height="100%"
          events={events}
          resources={resources}
          resourceAreaWidth="15%"
          selectable
          selectMirror
          editable
          droppable
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          resourceAreaHeaderContent="Venues"
          slotLabelFormat={[{ hour: 'numeric', minute: '2-digit', hour12: true, meridiem: 'short' }]}
        />
      </div>

      {modalOpen && (
        <SessionModal
          isOpen={modalOpen}
          onClose={closeModal}
          sessionId={editingSession}
          initialVenueId={selectedVenue}
          initialTimeRange={selectedTimeRange}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
};