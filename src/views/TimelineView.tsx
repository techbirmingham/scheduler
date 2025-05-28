import React, { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus } from 'lucide-react'
import { useStore } from '../store'
import { SessionModal } from '../components/SessionModal'
import { DateNavigator } from '../components/DateNavigator'
import { getInitialDate } from '../utils/dates' 
import { format } from 'date-fns' // added for resizing functionality

export const TimelineView: React.FC = () => {
  const { venues, sessions, sessionTypes, selectedFilters } = useStore()

  const calendarRef = useRef<FullCalendar>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions))
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)

  // sync our date navigator with the calendar
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.gotoDate(selectedDate)
  }, [selectedDate])

  // apply sidebar filters
  const filteredSessions = sessions.filter(session => {
    if (selectedFilters.venues.length && !selectedFilters.venues.includes(session.venueId)) return false
    if (selectedFilters.sessionTypes.length && !selectedFilters.sessionTypes.includes(session.sessionTypeId)) return false
    if (selectedFilters.tracks.length && !session.trackIds.some(id => selectedFilters.tracks.includes(id))) return false
    if (selectedFilters.organizations.length && !session.organizationIds.some(id => selectedFilters.organizations.includes(id))) return false
    if (selectedFilters.programs.length && !session.programIds.some(id => selectedFilters.programs.includes(id))) return false
    if (selectedFilters.experiences.length && !session.experienceIds.some(id => selectedFilters.experiences.includes(id))) return false
    if (selectedFilters.accessLevels.length && !selectedFilters.accessLevels.includes(session.accessLevelId)) return false
    return true
  })

  // map to FullCalendar events
  const events = filteredSessions
    .filter(s => s.date === selectedDate)
    .map(session => {
      const type = sessionTypes.find(t => t.id === session.sessionTypeId)
      return {
        id: session.id,
        title: session.title,
        start: `${session.date}T${session.startTime}`,
        end: `${session.date}T${session.endTime}`,
        resourceId: String(session.venueId), // convert to string to match resources[].id > old: resourceId: session.venueId,
        backgroundColor: type?.color || '#3788d8',
        borderColor: type?.color || '#3788d8',
        extendedProps: { description: session.description }
      }
    })

// in src/views/TimelineView.tsx, replace your `resources = …` with:

const resources = venues
  // only keep the top-level venues (i.e. those without a parent):
  .filter(venue => !venue.parentId)
  // now map to FullCalendar’s shape
  .map(venue => ({
    id: String(venue.id),   // make sure this is a string
    title: venue.name
  }));

  const handleDateSelect = (arg: any) => {
    const venueId = arg.resource?.id
    const [ , startTime ] = arg.startStr.split('T')
    const [ , endTime ]   = arg.endStr.split('T')
    setSelectedTimeRange({ start: startTime.slice(0,5), end: endTime.slice(0,5) })
    setSelectedVenue(venueId)
    setEditingSession(null)
    setModalOpen(true)
  }

  const handleEventClick = (info: any) => {
    setEditingSession(info.event.id)
    setModalOpen(true)
  }

  const handleEventDrop = (info: any) => {
    const { event } = info
    const sessionId = event.id
    const newVenue  = event.getResources()[0]?.id.replace('venue-','') || ''
    const newStart  = event.start.toTimeString().slice(0,5)
    const newEnd    = event.end.toTimeString().slice(0,5)
    useStore.getState().updateSession(sessionId, { venueId: newVenue, startTime: newStart, endTime: newEnd })
  }

  const handleAddClick = () => {
    setEditingSession(null)
    setSelectedTimeRange(null)
    setSelectedVenue(null)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingSession(null)
    setSelectedTimeRange(null)
    setSelectedVenue(null)
  }

  console.log('▶ resources passed:', resources.map(r => r.id))
  console.log('▶ events rendered:', events.map(e => e.resourceId))

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Timeline View</h1>
        <button
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center"
        >
          <Plus size={16} className="mr-1" /> Add Session
        </button>
      </div>

      <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />

      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden mt-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          initialDate={selectedDate}
          headerToolbar={false}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:15:00"
          snapDuration="00:15:00"
          height="100%"
          events={events}
          resources={resources}
          resourceAreaWidth="150px"
          selectable
          selectMirror
          editable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventResizableFromStart={true}
          resourceAreaHeaderContent="Venues"
          resourceLabelDidMount={info => {
            const name = venues.find(v => `venue-${v.id}` === info.resource.id)?.name
            if (name) info.el.innerHTML = `<div class="venue-label"><div class="font-medium">${name}</div></div>`
          }}
        />
      </div>

      {modalOpen && (
        <SessionModal
          isOpen={modalOpen}
          onClose={closeModal}
          sessionId={editingSession}
          initialVenueId={selectedVenue?.replace('venue-','') || null}
          initialTimeRange={selectedTimeRange}
          initialDate={selectedDate}
        />
      )}
    </div>
  )
}