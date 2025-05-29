import React, { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import Select, { MultiValue, SingleValue, StylesConfig } from 'react-select'
import { useStore, Session } from '../store'

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
  initialVenueId: string | null
  initialTimeRange: { start: string; end: string } | null
  initialDate: string
}

interface Option { label: string; value: string }

// cap tag container to ~3 lines and scroll internally
const multiSelectStyles: StylesConfig<Option, true> = {
  valueContainer: base => ({
    ...base,
    maxHeight: '4.5rem',
    overflowY: 'auto',
    flexWrap: 'wrap',
  }),
  multiValue: base => ({
    ...base,
    margin: '2px',
    padding: '0 4px',
  }),
}

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen, onClose, sessionId,
  initialVenueId, initialTimeRange, initialDate,
}) => {
  const {
    sessions, venues, speakers, sessionTypes, tracks,
    organizations, programs, experiences, accessLevels,
    addSession, updateSession, deleteSession,
  } = useStore()

  const existing = sessionId
    ? sessions.find(s => s.id === sessionId) || null
    : null

  const [formData, setFormData] = useState<Omit<Session,'id'>>({
    title: '', description: '',
    startTime: '09:00', endTime: '10:00',
    venueId: '', date: initialDate,
    speakerIds: [], sessionTypeId: '',
    trackIds: [], organizationIds: [],
    programIds: [], experienceIds: [],
    accessLevelId: '',
  })

  // map store items into react-select Option[]
  const toOpts = (arr: { id:string; name:string }[]): Option[] =>
    arr.map(x => ({ label: x.name, value: x.id }))

  const venueOpts = toOpts(venues)
  const speakerOpts = speakers.map(s => ({
    label: `${s.name} (${s.company})`, value: s.id,
  }))
  const sessionTypeOpts = toOpts(sessionTypes)
  const trackOpts = toOpts(tracks)
  const orgOpts = toOpts(organizations)
  const progOpts = toOpts(programs)
  const expOpts = toOpts(experiences)
  const accessOpts = toOpts(accessLevels)

  // sync into formData when editing or opening
  useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        description: existing.description,
        startTime: existing.startTime,
        endTime: existing.endTime,
        venueId: existing.venueId,
        date: existing.date,
        speakerIds: existing.speakerIds,
        sessionTypeId: existing.sessionTypeId,
        trackIds: existing.trackIds,
        organizationIds: existing.organizationIds,
        programIds: existing.programIds,
        experienceIds: existing.experienceIds,
        accessLevelId: existing.accessLevelId,
      })
    } else {
      setFormData(fd => ({
        ...fd,
        startTime: initialTimeRange?.start  || fd.startTime,
        endTime:   initialTimeRange?.end    || fd.endTime,
        venueId:   initialVenueId           || fd.venueId,
        date:      initialDate,
      }))
    }
  }, [existing, initialVenueId, initialTimeRange, initialDate])

  // ESC to close, Cmd/Ctrl+Enter to submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      else if ((e.metaKey||e.ctrlKey) && e.key==='Enter') {
        e.preventDefault()
        document.querySelector<HTMLFormElement>('form')?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleChange = (
    v:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | SingleValue<Option>
      | MultiValue<Option>,
    field: keyof Omit<Session,'id'>
  ) => {
    if (Array.isArray(v)) {
      setFormData(fd => ({ ...fd, [field]: v.map(o => o.value) }))
    } else if ('value' in (v as any)) {
      setFormData(fd => ({ ...fd, [field]: (v as SingleValue<Option>)!.value }))
    } else {
      const tgt = v.target as HTMLInputElement
      setFormData(fd => ({ ...fd, [field]: tgt.value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sessionId
      ? updateSession(sessionId, formData)
      : addSession(formData)
    onClose()
  }

  const handleDelete = () => {
    if (sessionId && window.confirm('Delete this session?')) {
      deleteSession(sessionId)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {existing ? 'Edit Session' : 'Add Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-16rem)]">
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={e => handleChange(e, 'title')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter session title"
                autoFocus
              />
            </div>

            {/* Description (2 rows) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={e => handleChange(e, 'description')}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Speakers (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speakers
              </label>
              <Select
                options={speakerOpts}
                isMulti
                value={speakerOpts.filter(o =>
                  formData.speakerIds.includes(o.value)
                )}
                onChange={v => handleChange(v as MultiValue<Option>, 'speakerIds')}
                styles={multiSelectStyles}
                className="react-select-container"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={e => handleChange(e, 'date')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <Select
                options={venueOpts}
                value={venueOpts.find(o => o.value===formData.venueId) || null}
                onChange={v => handleChange(v as SingleValue<Option>, 'venueId')}
                className="react-select-container"
              />
            </div>

            {/* Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={e => handleChange(e, 'startTime')}
                required
                className="w-full p-2 border	border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={e => handleChange(e, 'endTime')}
                required
                className="w-full p-2 border	border-gray-300 rounded-md"
              />
            </div>

            {/* Session Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Type
              </label>
              <Select
                options={sessionTypeOpts}
                value={sessionTypeOpts.find(o => o.value===formData.sessionTypeId) || null}
                onChange={v => handleChange(v as SingleValue<Option>, 'sessionTypeId')}
                className="react-select-container"
              />
            </div>

            {/* Access Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <Select
                options={accessOpts}
                value={accessOpts.find(o => o.value===formData.accessLevelId) || null}
                onChange={v => handleChange(v as SingleValue<Option>, 'accessLevelId')}
                className="react-select-container"
              />
            </div>

            {/* Tracks (multi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracks
              </label>
              <Select
                options={trackOpts}
                isMulti
                value={trackOpts.filter(o => formData.trackIds.includes(o.value))}
                onChange={v => handleChange(v as MultiValue<Option>, 'trackIds')}
                styles={multiSelectStyles}
                className="react-select-container"
              />
            </div>

            {/* Organizations (multi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organizations
              </label>
              <Select
                options={orgOpts}
                isMulti
                value={orgOpts.filter(o => formData.organizationIds.includes(o.value))}
                onChange={v => handleChange(v as MultiValue<Option>, 'organizationIds')}
                styles={multiSelectStyles}
                className="react-select-container"
              />
            </div>

            {/* Programs (multi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programs
              </label>
              <Select
                options={progOpts}
                isMulti
                value={progOpts.filter(o => formData.programIds.includes(o.value))}
                onChange={v => handleChange(v as MultiValue<Option>, 'programIds')}
                styles={multiSelectStyles}
                className="react-select-container"
              />
            </div>

            {/* Experiences (multi) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiences
              </label>
              <Select
                options={expOpts}
                isMulti
                value={expOpts.filter(o => formData.experienceIds.includes(o.value))}
                onChange={v => handleChange(v as MultiValue<Option>, 'experienceIds')}
                styles={multiSelectStyles}
                className="react-select-container"
              />
            </div>
          </div>

          {/* footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            {existing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Delete Session
              </button>
            )}
            <div className="flex space-x-3">
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
                {existing ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}