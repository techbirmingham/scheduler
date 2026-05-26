import React, { useState, useRef, useEffect } from 'react'
import FullCalendar, { EventResizeDoneArg } from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus, ZoomIn, ZoomOut, Eye, EyeOff, Calendar } from 'lucide-react'
import { useStore } from '../store'
import { SessionModal } from '../components/SessionModal'
import { DateTabs } from '../components/DateTabs'
import { getInitialDate } from '../utils/dates'
import { format } from 'date-fns'

export const TimelineView: React.FC = () => {
  const { venues, sessions, sessionTypes, tracks, selectedFilters } = useStore()
  const currentEvent = useStore(s => s.events.find(e => e.id === s.currentEventId))
  const calendarRef = useRef<FullCalendar>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(getInitialDate(sessions, currentEvent?.startDate))
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [hideEmptyVenues, setHideEmptyVenues] = useState(false)

  // ── ZOOM SETUP ───────────────────────────────────────────────────
  const slotDurations = [
    '00:20:00',
    '00:15:00',
    '00:10:00',
    '00:05:00',
  ]
  const [zoomLevel, setZoomLevel] = useState(5) // start at '00:15:00'
  const currentSlot = slotDurations[zoomLevel]

  const handleZoomIn = () =>
    setZoomLevel(z => Math.min(z + 1, slotDurations.length - 1))
  const handleZoomOut = () =>
    setZoomLevel(z => Math.max(z - 1, 0))

  // ── keep date navigator and calendar in sync ────────────────────
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.gotoDate(selectedDate)
  }, [selectedDate])

  // ── filters, events, resources ─────────────────────────────────
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

  const events = filtered
    .filter(s => s.date === selectedDate)
    .map(s => {
      // Color priority: first track > session type > neutral indigo.
      // Matches Grid view's logic so colors are consistent across views.
      const firstTrack = s.trackIds.length
        ? tracks.find(t => t.id === s.trackIds[0])
        : null
      const type = sessionTypes.find(t => t.id === s.sessionTypeId)
      const color = firstTrack?.color || type?.color || '#6366f1'
      // Only set `end` when we have one. Otherwise FullCalendar's
      // defaultTimedEventDuration kicks in per-event independently.
      const ev: any = {
        id: s.id,
        title: s.title,
        start: `${s.date}T${s.startTime}`,
        resourceId: s.venueId,
        backgroundColor: color,
        borderColor:     color,
        extendedProps: { description: s.description }
      }
      if (s.endTime) ev.end = `${s.date}T${s.endTime}`
      return ev
    })

  const visibleVenueIds = selectedFilters.venues.length
  ? selectedFilters.venues
  : venues.map(v => v.id)

  // Venues with at least one session (post-filter) on the active date.
  const venueIdsWithSessions = new Set(events.map(e => e.resourceId))

  const resources = venues
    .filter(v => visibleVenueIds.includes(v.id))
    .filter(v => !hideEmptyVenues || venueIdsWithSessions.has(v.id))
    .map(v => ({ id: v.id, title: v.name }))

  // ── modal controls ─────────────────────────────────────────────
  const handleAddClick = () => {
    setEditingSession(null)
    setSelectedTimeRange(null)
    setSelectedVenue(null)
    setModalOpen(true)
  }
  const closeModal = () => {
    const api = calendarRef.current?.getApi()
    if (api) api.unselect()
    setModalOpen(false)
    setEditingSession(null)
    setSelectedTimeRange(null)
    setSelectedVenue(null)
  }

  // ── drag & resize & click ───────────────────────────────────────
  const handleEventDrop = (info: any) => {
    const ev = info.event, id = ev.id
    const newVenue = ev.getResources()[0]?.id || ''
    const start = format(ev.start!, 'HH:mm')
    const end   = format(ev.end!,   'HH:mm')
    useStore.getState().updateSession(id, { venueId: newVenue, startTime: start, endTime: end })
  }
  const handleEventResize = (info: EventResizeDoneArg) => {
    const ev = info.event, id = ev.id
    const start = format(ev.start!, 'HH:mm')
    const end   = format(ev.end!,   'HH:mm')
    useStore.getState().updateSession(id, { startTime: start, endTime: end })
  }
  const handleEventClick = (info: any) => {
    setEditingSession(info.event.id)
    setModalOpen(true)
  }
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
      {/* header + Zoom buttons */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Timeline View</h1>
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
            {hideEmptyVenues ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel === 0}
            title="Zoom out"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            <ZoomOut size={16}/>
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel === slotDurations.length - 1}
            title="Zoom in"
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            <ZoomIn size={16}/>
          </button>
          <button
            onClick={handleAddClick}
            className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1"/> Add Session
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
        {/* Picker stays around for jumping outside the event range. */}
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
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          initialDate={selectedDate}
          headerToolbar={false}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"

          // ← use current zoom slot duration here:
          slotDuration={currentSlot}
          snapDuration={currentSlot}
          defaultTimedEventDuration="00:30:00"
          forceEventDuration={true}

          height="100%"
          events={events}
          resources={resources}
          resourceAreaWidth="150px"
          selectable
          selectMirror
          editable
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventResizableFromStart
          eventDidMount={(info) => {
            info.el.setAttribute('title', info.event.title)
          }}
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