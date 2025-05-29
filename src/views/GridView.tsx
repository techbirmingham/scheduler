import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { useStore } from '../store';
import { SessionModal } from '../components/SessionModal';
import { DateNavigator } from '../components/DateNavigator';
import { getInitialDate } from '../utils/dates';

export const GridView: React.FC = () => {
  const { venues, sessions, sessionTypes, speakers, tracks, selectedFilters } = useStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions));
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: string, end: string} | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  // run every time selectedDate changes
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) api.gotoDate(selectedDate);
  }, [selectedDate]);

  // Define available slot durations
  const slotDurations = ['00:60:00', '00:30:00', '00:15:00', '00:10:00', '00:05:00'];
  const [zoomLevel, setZoomLevel] = useState(2); // Start at '00:15:00'

  // Function to zoom in
  const handleZoomIn = () => {
    setZoomLevel(prevZoom => Math.min(prevZoom + 1, slotDurations.length - 1));
  };

  // Function to zoom out
  const handleZoomOut = () => {
    setZoomLevel(prevZoom => Math.max(prevZoom - 1, 0));
  };

  // Get current slot duration based on zoom level
  const currentSlotDuration = slotDurations[zoomLevel];

  // Apply zoom class to body for CSS tweaks
  useEffect(() => {
    document.body.classList.add(`zoom-${zoomLevel}`);
    return () => {
      document.body.classList.remove(`zoom-${zoomLevel}`);
    };
  }, [zoomLevel]);

  // Filter sessions based on active filters selected by user
  const filteredSessions = sessions.filter(session => {
    if (selectedFilters.venues.length > 0 && !selectedFilters.venues.includes(session.venueId)) return false;
    if (selectedFilters.sessionTypes.length > 0 && !selectedFilters.sessionTypes.includes(session.sessionTypeId)) return false;
    if (selectedFilters.tracks.length > 0 && !session.trackIds.some(id => selectedFilters.tracks.includes(id))) return false;
    if (selectedFilters.organizations.length > 0 && !session.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false;
    if (selectedFilters.programs.length > 0 && !session.programIds.some(id => selectedFilters.programs.includes(id))) return false;
    if (selectedFilters.experiences.length > 0 && !session.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false;
    if (selectedFilters.accessLevels.length > 0 && !selectedFilters.accessLevels.includes(session.accessLevelId)) return false;
    return true;
  });

  // Map filtered sessions into FullCalendar event format
  const events = filteredSessions
    .filter(session => session.date === selectedDate)
    .map(session => {
      const sessionType = sessionTypes.find(type => type.id === session.sessionTypeId);
      return {
        id: session.id,
        title: session.title,
        start: `${session.date}T${session.startTime}`,
        end: `${session.date}T${session.endTime}`,
        resourceId: session.venueId,
        backgroundColor: sessionType?.color || '#3788d8',
        borderColor: sessionType?.color || '#3788d8',
        extendedProps: {
          description: session.description,
          speakers: session.speakerIds,
          sessionTypeId: session.sessionTypeId,
          trackIds: session.trackIds
        }
      };
    });

  // Format venues for FullCalendar resource columns
  const resources = venues.map(venue => ({
    id: venue.id,
    title: venue.name.toUpperCase() // Convert venue names to uppercase
  }));

  // When a time slot is clicked in the calendar, prepare data and open modal
  const handleDateSelect = (arg: any) => {
    const venueId = arg.resource?.id;
    const startStr = arg.startStr;
    const endStr = arg.endStr;

    const startTime = startStr.split('T')[1].substring(0, 5);
    const endTime = endStr.split('T')[1].substring(0, 5);

    setSelectedTimeRange({ start: startTime, end: endTime });
    setSelectedVenue(venueId);
    setEditingSession(null);
    setModalOpen(true);
  };

  // When an existing session is clicked
  const handleEventClick = (info: any) => {
    setEditingSession(info.event.id);
    setModalOpen(true);
  };
  
  // When an existing session is resized (added May 28, 2025)   
  const handleEventResize = async (info: EventResizeDoneArg) => {
    const e = info.event
    await updateSession(e.id, {
      // format dates/times to what your DB expects
      date:        format(e.start!, 'yyyy-MM-dd'),
      startTime:   format(e.start!, 'HH:mm'),
      endTime:     format(e.end!,   'HH:mm'),
    })
  }

  // When a session is moved to another time or venue
  const handleEventDrop = (info: any) => {
    const { event } = info;
    const sessionId = event.id;
    const newVenueId = event.getResources()[0]?.id || '';

    const newStartTime = event.start.toTimeString().substring(0, 5);
    const newEndTime = event.end.toTimeString().substring(0, 5);

    useStore.getState().updateSession(sessionId, {
      venueId: newVenueId,
      startTime: newStartTime,
      endTime: newEndTime
    });
  };

  // Manually open modal to add new session
  const handleAddClick = () => {
    setEditingSession(null);
    setSelectedTimeRange(null);
    setSelectedVenue(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSession(null);
    setSelectedTimeRange(null);
    setSelectedVenue(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Grid View</h1>
        <button 
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Add Session
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <DateNavigator
          date={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Zoom controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel === slotDurations.length - 1}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel === 0}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut size={16} />
          </button>
        </div>
      </div>

      {/* FullCalendar configured with venue resources and time grid layout */}
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
          selectable={true}
          selectMirror={true}
          editable={true}
          droppable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          resourceAreaHeaderContent="Venues"
          slotLabelFormat={[{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            meridiem: 'short'
          }]}
        />
      </div>

      {/* Conditionally render session modal */}
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