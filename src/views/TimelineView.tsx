import React, { useState, useRef, useEffect } from 'react'
import FullCalendar, { EventApi, EventResizeDoneArg } from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'
import { useStore } from '../store'
import { SessionModal } from '../components/SessionModal'
import { DateNavigator } from '../components/DateNavigator'
import { getInitialDate } from '../utils/dates'
import { format } from 'date-fns'

export const TimelineView: React.FC = () => {
  const { venues, sessions, sessionTypes, selectedFilters } = useStore()
  const calendarRef = useRef<FullCalendar>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions))
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)

  // keep date navigator and calendar in sync
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.gotoDate(selectedDate)
  }, [selectedDate])

  // apply sidebar filters
  const filtered = sessions.filter(s => {
    if (selectedFilters.venues.length && !selectedFilters.venues.includes(s.venueId)) return false
    if (selectedFilters.sessionTypes.length && !selectedFilters.sessionTypes.includes(s.sessionTypeId)) return false
    if (selectedFilters.tracks.length && !s.trackIds.some(id => selectedFilters.tracks.includes(id))) return false
    if (selectedFilters.organizations.length && !s.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false
    if (selectedFilters.programs.length && !s.programIds.some(id => selectedFilters.programs.includes(id))) return false
    if (selectedFilters.experiences.length && !s.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false
    if (selectedFilters.accessLevels.length && !selectedFilters.accessLevels.includes(s.accessLevelId)) return false
    return true
  })

  // turn them into calendar events
  const events = filtered
    .filter(s => s.date === selectedDate)
    .map(s => {
      const type = sessionTypes.find(t => t.id === s.sessionTypeId)
      return {
        id: s.id,
        title: s.title,
        start: `${s.date}T${s.startTime}`,
        end:   `${s.date}T${s.endTime}`,
        resourceId: s.venueId,          // already a string
        backgroundColor: type?.color || '#3788d8',
        borderColor:     type?.color || '#3788d8',
        extendedProps: { description: s.description }
      }
    })

  // only top-level venues with string IDs
  const resources = venues.map(v => ({
    id: v.id,    // must match event.resourceId
    title: v.name
  }))

  // shared open-modal logic
  const handleAddClick = () => {
    setEditingSession(null)
    setSelectedTimeRange(null)
    setSelectedVenue(null)
    setModalOpen(true)
  }
  
const closeModal = () => {
  const api = calendarRef.current?.getApi();
  if (api) api.unselect();
  setModalOpen(false);
  setEditingSession(null);
  setSelectedTimeRange(null);
  setSelectedVenue(null);
}

  // when you drag a session to a new slot
  const handleEventDrop = (info: any) => {
    const ev = info.event
    const id = ev.id
    const newVenue = ev.getResources()[0]?.id || ''
    const start   = format(ev.start!, 'HH:mm')
    const end     = format(ev.end!,   'HH:mm')
    useStore.getState().updateSession(id, { venueId: newVenue, startTime: start, endTime: end })
  }

  // when you grab the end of an event and resize
  const handleEventResize = (info: EventResizeDoneArg) => {
    const ev = info.event
    const id = ev.id
    const start = format(ev.start!, 'HH:mm')
    const end   = format(ev.end!,   'HH:mm')
    useStore.getState().updateSession(id, { startTime: start, endTime: end })
  }

  // click on an existing session
  const handleEventClick = (info: any) => {
    setEditingSession(info.event.id)
    setModalOpen(true)
  }

  // click on an empty slot
  const handleDateSelect = (arg: any) => {
    const [, start] = arg.startStr.split('T')
    const [, end]   = arg.endStr.split('T')
    setSelectedTimeRange({ start: start.slice(0,5), end: end.slice(0,5) })
    setSelectedVenue(arg.resource?.id || null)
    setEditingSession(null)
    setModalOpen(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Timeline View</h1>
        <button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center">
          <Plus size={16} className="mr-1" /> Add Session
        </button>
      </div>

      <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden mt-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[ resourceTimelinePlugin, interactionPlugin ]}
          initialView="resourceTimelineDay"
          initialDate={selectedDate}
          headerToolbar={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:15:00"
          snapDuration="00:15:00"
          height="100%"
          events={events}
          resources={resources}
          resourceAreaWidth="150px"
          selectable={true}
          selectMirror={true}
          editable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventResizableFromStart={true}
          resourceAreaHeaderContent="Venues"
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
  ) 
}