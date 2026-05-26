import React, { useState, useRef, useEffect } from 'react';
import FullCalendar, { EventDropArg, EventResizeDoneArg } from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, ZoomIn, ZoomOut, Eye, EyeOff, Calendar, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store';
import { SessionModal } from '../components/SessionModal';
import { DateTabs } from '../components/DateTabs';
import { SessionTooltip, computeTooltipPosition, type SessionTooltipState } from '../components/SessionTooltip';
import { getInitialDate } from '../utils/dates';

export const GridView: React.FC = () => {
  const { venues, sessions, sessionTypes, speakers, tracks, selectedFilters } = useStore();
  const currentEvent = useStore(s => s.events.find(e => e.id === s.currentEventId));
  const calendarRef = useRef<FullCalendar>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions, currentEvent?.startDate));
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [hideEmptyVenues, setHideEmptyVenues] = useState(false);
  const [tooltipState, setTooltipState] = useState<SessionTooltipState | null>(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(selectedDate);
  }, [selectedDate]);

  // Snap selectedDate into the event range once the event loads. The
  // initial useState value can fall back to TODAY (when store is empty
  // on first mount) — and FullCalendar's `initialDate` is only honored
  // on first mount, so without this the calendar gets stranded on
  // today, showing the empty grid + yellow "today" column highlight.
  useEffect(() => {
    if (!currentEvent?.startDate) return;
    const inRange =
      selectedDate >= currentEvent.startDate &&
      (!currentEvent.endDate || selectedDate <= currentEvent.endDate);
    if (!inRange) {
      setSelectedDate(getInitialDate(sessions, currentEvent.startDate));
    }
    // sessions intentionally omitted from deps — once the calendar is
    // in range we don't want it bouncing on every store refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent?.startDate, currentEvent?.endDate]);

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
// Default to index 4 ('00:20:00') — 20-min slots give more vertical
// density than 30-min and use the page's available height better.
const DEFAULT_ZOOM = 4
const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM)
const handleZoomReset = () => setZoomLevel(DEFAULT_ZOOM);
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
      // Color priority: first track > session type > neutral indigo.
      // Tracks have a defined palette; types are usually NULL today.
      const firstTrack = session.trackIds.length
        ? tracks.find(t => t.id === session.trackIds[0])
        : null
      const type = sessionTypes.find(t => t.id === session.sessionTypeId)
      const color = firstTrack?.color || type?.color || '#6366f1'
      // Only set `end` when we actually have one — interpolating null as
      // a string produced "2026-06-25Tnull" before, which FullCalendar
      // handled by sharing a fallback across events without ends.
      const ev: any = {
        id: session.id,
        title: session.title,
        start: `${session.date}T${session.startTime}`,
        resourceId: session.venueId,
        backgroundColor: color,
        borderColor: color,
        extendedProps: { description: session.description, speakers: session.speakerIds, sessionTypeId: session.sessionTypeId, trackIds: session.trackIds }
      }
      if (session.endTime) ev.end = `${session.date}T${session.endTime}`
      return ev
    });

  const visibleVenueIds = selectedFilters.venues.length
  ? selectedFilters.venues
  : venues.map(v => v.id)

  // Venues that have at least one session (post-filter) on the active date.
  const venueIdsWithSessions = new Set(events.map(e => e.resourceId))

  const resources = venues
    .filter(v => visibleVenueIds.includes(v.id))
    .filter(v => !hideEmptyVenues || venueIdsWithSessions.has(v.id))
    .map(v => ({ id: v.id, title: v.name }));

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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setHideEmptyVenues(v => !v)}
            title={hideEmptyVenues ? 'Show all venues' : 'Hide venues with no sessions today'}
            className={`p-2 rounded-md text-sm font-medium flex items-center ${
              hideEmptyVenues
                ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {hideEmptyVenues ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel === 0}
            title="Zoom out"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleZoomReset}
            disabled={zoomLevel === DEFAULT_ZOOM}
            title="Reset zoom"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel === slotDurations.length - 1}
            title="Zoom in"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleAddClick}
            className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" /> Add Session
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <DateTabs
          startDate={currentEvent?.startDate}
          endDate={currentEvent?.endDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {/* Picker stays around for jumping outside the event range (e.g.,
            setup-day rehearsals). No min/max so it accepts any date. */}
        <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-md px-2 py-1 hover:border-gray-300 transition cursor-pointer">
          <Calendar size={14} />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs bg-transparent border-none focus:outline-none p-0"
          />
        </label>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden mt-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          initialDate={selectedDate}
          headerToolbar={false}
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration={currentSlotDuration}
          snapDuration={currentSlotDuration}
          defaultTimedEventDuration="00:30:00"
          forceEventDuration={true}
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
          eventDidMount={(info) => {
            // Native title is kept as an a11y fallback; the rich tooltip
            // below replaces it visually for sighted users.
            info.el.setAttribute('title', info.event.title)
          }}
          eventMouseEnter={(info) => {
            const rect = info.el.getBoundingClientRect()
            setTooltipState({
              sessionId: info.event.id,
              position: computeTooltipPosition(rect),
            })
          }}
          eventMouseLeave={() => setTooltipState(null)}
          resourceAreaHeaderContent="Venues"
          slotLabelFormat={[{ hour: 'numeric', minute: '2-digit', hour12: true, meridiem: 'short' }]}
        />
      </div>

      {modalOpen && (
        <SessionModal isOpen={modalOpen} onClose={closeModal} sessionId={editingSession} initialVenueId={selectedVenue} initialTimeRange={selectedTimeRange} initialDate={selectedDate} />
      )}

      <SessionTooltip state={tooltipState} />
    </div>
  );
};