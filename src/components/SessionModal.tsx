import React, { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import Select, { MultiValue, SingleValue } from 'react-select'
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

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  initialVenueId,
  initialTimeRange,
  initialDate,
}) => {
  const {
    sessions,
    venues,
    speakers,
    sessionTypes,
    tracks,
    organizations,
    programs,
    experiences,
    accessLevels,
    addSession,
    updateSession,
    deleteSession,
  } = useStore()

  const existingSession = sessionId
    ? sessions.find((s) => s.id === sessionId) || null
    : null

  const [formData, setFormData] = useState<Omit<Session, 'id'>>({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    venueId: '',
    date: initialDate,
    speakerIds: [],
    sessionTypeId: '',
    trackIds: [],
    organizationIds: [],
    programIds: [],
    experienceIds: [],
    accessLevelId: '',
  })

  // Build react-select options
  const toOptions = (arr: { id: string; name: string }[]): Option[] =>
    arr.map((x) => ({ label: x.name, value: x.id }))

  const venueOptions = toOptions(venues)
  const speakerOptions = speakers.map((s) => ({
    label: `${s.name} (${s.company})`,
    value: s.id,
  }))
  const sessionTypeOptions = toOptions(sessionTypes)
  const trackOptions = toOptions(tracks)
  const organizationOptions = toOptions(organizations)
  const programOptions = toOptions(programs)
  const experienceOptions = toOptions(experiences)
  const accessLevelOptions = toOptions(accessLevels)

  // Sync existingSession into formData
  useEffect(() => {
    if (existingSession) {
      setFormData({
        title: existingSession.title,
        description: existingSession.description,
        startTime: existingSession.startTime,
        endTime: existingSession.endTime,
        venueId: existingSession.venueId,
        date: existingSession.date,
        speakerIds: existingSession.speakerIds,
        sessionTypeId: existingSession.sessionTypeId,
        trackIds: existingSession.trackIds,
        organizationIds: existingSession.organizationIds,
        programIds: existingSession.programIds,
        experienceIds: existingSession.experienceIds,
        accessLevelId: existingSession.accessLevelId,
      })
    } else {
      setFormData((fd) => ({
        ...fd,
        startTime: initialTimeRange?.start || fd.startTime,
        endTime: initialTimeRange?.end || fd.endTime,
        venueId: initialVenueId || fd.venueId,
        date: initialDate,
      }))
    }
  }, [existingSession, initialVenueId, initialTimeRange, initialDate])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector<HTMLFormElement>('form')?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | SingleValue<Option>
      | MultiValue<Option>,
    name: keyof Omit<Session, 'id'>
  ) => {
    if (!e) return
    if (Array.isArray(e)) {
      setFormData((f) => ({ ...f, [name]: e.map((o) => o.value) }))
    } else if ('value' in e && 'label' in e) {
      setFormData((f) => ({ ...f, [name]: e.value }))
    } else {
      const target = e.target as HTMLInputElement
      setFormData((f) => ({ ...f, [name]: target.value }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sessionId) updateSession(sessionId, formData)
    else addSession(formData)
    onClose()
  }

  const handleDelete = () => {
    if (
      sessionId &&
      window.confirm('Are you sure you want to delete this session?')
    ) {
      deleteSession(sessionId)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        {/* header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {sessionId ? 'Edit Session' : 'Add Session'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-[calc(100vh-20rem)]"
        >
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={(e) => handleChange(e, 'title')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter session title"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => handleChange(e, 'description')}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Date, Venue, Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => handleChange(e, 'date')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <Select
                options={venueOptions}
                value={venueOptions.find((o) => o.value === formData.venueId)}
                onChange={(v) => handleChange(v as SingleValue<Option>, 'venueId')}
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={(e) => handleChange(e, 'startTime')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
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
                onChange={(e) => handleChange(e, 'endTime')}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Session Type & Access Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Type
              </label>
              <Select
                options={sessionTypeOptions}
                value={sessionTypeOptions.find(
                  (o) => o.value === formData.sessionTypeId
                )}
                onChange={(v) =>
                  handleChange(v as SingleValue<Option>, 'sessionTypeId')
                }
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <Select
                options={accessLevelOptions}
                value={accessLevelOptions.find(
                  (o) => o.value === formData.accessLevelId
                )}
                onChange={(v) =>
                  handleChange(v as SingleValue<Option>, 'accessLevelId')
                }
                className="react-select-container"
              />
            </div>

            {/* Multi-select fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracks
              </label>
              <Select
                options={trackOptions}
                isMulti
                value={trackOptions.filter((o) =>
                  formData.trackIds.includes(o.value)
                )}
                onChange={(v) =>
                  handleChange(v as MultiValue<Option>, 'trackIds')
                }
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speakers
              </label>
              <Select
                options={speakerOptions}
                isMulti
                value={speakerOptions.filter((o) =>
                  formData.speakerIds.includes(o.value)
                )}
                onChange={(v) =>
                  handleChange(v as MultiValue<Option>, 'speakerIds')
                }
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organizations
              </label>
              <Select
                options={organizationOptions}
                isMulti
                value={organizationOptions.filter((o) =>
                  formData.organizationIds.includes(o.value)
                )}
                onChange={(v) =>
                  handleChange(v as MultiValue<Option>, 'organizationIds')
                }
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programs
              </label>
              <Select
                options={programOptions}
                isMulti
                value={programOptions.filter((o) =>
                  formData.programIds.includes(o.value)
                )}
                onChange={(v) =>
                  handleChange(v as MultiValue<Option>, 'programIds')
                }
                className="react-select-container"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiences
              </label>
              <Select
                options={experienceOptions}
                isMulti
                value={experienceOptions.filter((o) =>
                  formData.experienceIds.includes(o.value)
                )}
                onChange={(v) =>
                  handleChange(v as MultiValue<Option>, 'experienceIds')
                }
                className="react-select-container"
              />
            </div>
          </div>

          {/* footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            {sessionId && (
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
                {sessionId ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 