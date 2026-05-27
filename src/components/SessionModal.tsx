import React, { useState, useEffect } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import Select, { MultiValue, SingleValue, StylesConfig } from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { useStore, useIsAdmin, Session } from '../store'
import { useConfirm } from './ConfirmDialog'
import {
  computeSessionConflicts,
  type SponsorshipConflict,
} from '../utils/sponsorshipConflicts'

// Amber soft-warning chip rendered under a role section when a parent
// program has different orgs in that role. Doesn't block — humans decide.
const ConflictChip: React.FC<{ conflict: SponsorshipConflict }> = ({ conflict }) => {
  const where = conflict.entityType === 'program' ? 'Program' : 'Session'
  return (
    <div className="mt-2 flex items-start gap-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <span>
        {where} <strong>"{conflict.entityName}"</strong> has{' '}
        <strong>{conflict.conflictingOrgNames.join(', ') || '(unknown org)'}</strong> as{' '}
        {conflict.role}.
      </span>
    </div>
  )
}

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string | null
  initialVenueId: string | null
  initialTimeRange: { start: string; end: string } | null
  initialDate: string
}

interface Option { label: string; value: string }

// Cap multi-select tag container to ~3 lines and scroll internally
// so the form layout stays predictable as session metadata grows.
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

// Section heading + thin divider — used to group related fields.
const SectionHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="md:col-span-2 border-b border-gray-200 pb-2 mb-1">
    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</h3>
    {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
  </div>
)

const GATING_OPTIONS: Option[] = [
  { value: 'public',           label: 'Public (anyone with appropriate badge)' },
  { value: 'invitation_only',  label: 'Invitation only (invite list managed externally)' },
  { value: 'private',          label: 'Private (not on public schedule)' },
]

export const SessionModal: React.FC<SessionModalProps> = ({
  isOpen, onClose, sessionId,
  initialVenueId, initialTimeRange, initialDate,
}) => {
  const {
    sessions, venues, speakers, sessionTypes, tracks,
    organizations, programs, experiences, accessLevels,
    addSession, updateSession, deleteSession, addSpeaker,
  } = useStore()
  const isAdmin = useIsAdmin()
  const confirm = useConfirm()

  const existing = sessionId
    ? sessions.find(s => s.id === sessionId) || null
    : null

  type FormState = Omit<Session, 'id'> & {
    hosted_by_org_ids: string[]
    presented_by_org_ids: string[]
    host_label: string
    presenter_label: string
    gating: 'public' | 'invitation_only' | 'private'
  }

  const blank: FormState = {
    title: '', description: '',
    startTime: '09:00', endTime: '10:00',
    venueId: '', date: initialDate,
    speakerIds: [], sessionTypeId: '',
    trackIds: [], organizationIds: [],
    programIds: [], experienceIds: [],
    accessLevelId: '',
    hosted_by_org_ids: [],
    presented_by_org_ids: [],
    host_label: '',
    presenter_label: '',
    gating: 'public',
  }

  const [formData, setFormData] = useState<FormState>(blank)

  // map store items into react-select Option[]
  const toOpts = (arr: { id:string; name:string }[]): Option[] =>
    arr.map(x => ({ label: x.name, value: x.id }))

  const venueOpts = toOpts(venues)
  const speakerOpts = speakers.map(s => ({
    label: s.company ? `${s.name} (${s.company})` : s.name,
    value: s.id,
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
      const ex = existing as any
      // Normalize null/undefined to empty string so the inputs render
      // empty instead of falling back to React's "uncontrolled" behavior
      // (which can silently keep the previous value visible).
      setFormData({
        title: existing.title ?? '',
        description: existing.description ?? '',
        startTime: existing.startTime ?? '',
        endTime: existing.endTime ?? '',
        venueId: existing.venueId ?? '',
        date: existing.date ?? initialDate,
        speakerIds: existing.speakerIds ?? [],
        sessionTypeId: existing.sessionTypeId ?? '',
        trackIds: existing.trackIds ?? [],
        organizationIds: existing.organizationIds ?? [],
        programIds: existing.programIds ?? [],
        experienceIds: existing.experienceIds ?? [],
        accessLevelId: existing.accessLevelId ?? '',
        hosted_by_org_ids: ex.hosted_by_org_ids ?? [],
        presented_by_org_ids: ex.presented_by_org_ids ?? [],
        host_label: ex.host_label ?? '',
        presenter_label: ex.presenter_label ?? '',
        gating: ex.gating ?? 'public',
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

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(fd => ({ ...fd, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Normalize empty strings to null so the DB stores NULL rather than ''.
    // - Label fields use NULL as the "use default label" signal.
    // - Empty endTime stays NULL rather than being silently set to a value.
    // - Empty venue/type/access stay NULL rather than ''.
    const payload = {
      ...formData,
      endTime: formData.endTime || null,
      venueId: formData.venueId || null,
      sessionTypeId: formData.sessionTypeId || null,
      accessLevelId: formData.accessLevelId || null,
      host_label: formData.host_label.trim() || null,
      presenter_label: formData.presenter_label.trim() || null,
    } as any
    sessionId
      ? updateSession(sessionId, payload)
      : addSession(payload)
    onClose()
  }

  const handleDelete = async () => {
    if (!sessionId) return
    const ok = await confirm({
      title: 'Delete this session?',
      body: existing
        ? <>This permanently removes <strong>{existing.title || 'this session'}</strong>.</>
        : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) {
      deleteSession(sessionId)
      onClose()
    }
  }

  if (!isOpen) return null

  // Soft conflicts: parent programs that have different Host/Presenter orgs
  // than what's currently selected on this session. Recomputed each render
  // so chips appear/disappear live as the user edits the form.
  const conflicts = computeSessionConflicts(
    {
      hosted_by_org_ids: formData.hosted_by_org_ids,
      presented_by_org_ids: formData.presented_by_org_ids,
      programIds: formData.programIds,
    },
    programs,
    organizations,
  )
  const hostConflicts = conflicts.filter(c => c.role === 'Host')
  const presenterConflicts = conflicts.filter(c => c.role === 'Presenter')

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl"
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

        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(100vh-10rem)]">
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            {/* ─── BASICS ──────────────────────────────────────────────── */}
            <SectionHeader title="Basics" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Title
              </label>
              <input
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter session title"
                autoFocus
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* ─── SCHEDULE & VENUE ────────────────────────────────────── */}
            <SectionHeader title="Schedule & Venue" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => updateField('date', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <Select
                options={venueOpts}
                value={venueOpts.find(o => o.value===formData.venueId) || null}
                onChange={v => updateField('venueId', (v as SingleValue<Option>)?.value ?? '')}
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => updateField('startTime', e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => updateField('endTime', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {formData.endTime && formData.startTime && formData.endTime < formData.startTime && (
                <p className="text-xs text-amber-700 mt-1">
                  End time is before start time — session will appear to span overnight (+1 day).
                </p>
              )}
            </div>

            {/* ─── PEOPLE ──────────────────────────────────────────────── */}
            <SectionHeader title="People" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Speakers</label>
              <CreatableSelect
                options={speakerOpts}
                isMulti
                placeholder="Select speakers — or type a name to add a new one"
                value={speakerOpts.filter(o => formData.speakerIds.includes(o.value))}
                onChange={v => updateField('speakerIds', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
                formatCreateLabel={(name) => `+ Add new speaker "${name}"`}
                // Case-insensitive duplicate check — suppress the "Create"
                // option when the typed name matches an existing speaker so
                // users don't accidentally make near-duplicates.
                isValidNewOption={(input, _val, opts) => {
                  const v = input.trim().toLowerCase()
                  if (!v) return false
                  return !opts.some(o => (o as Option).label.trim().toLowerCase() === v)
                }}
                onCreateOption={async (rawName) => {
                  const name = rawName.trim()
                  if (!name) return
                  const created = await addSpeaker({
                    name, title: '', company: '', bio: '', photoUrl: '',
                  })
                  if (created) {
                    updateField('speakerIds', [...formData.speakerIds, created.id])
                  }
                }}
              />
            </div>

            {/* ─── CATEGORIZATION ──────────────────────────────────────── */}
            <SectionHeader title="Categorization" description="How this session shows up in filtering and color-coding." />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
              <Select
                options={sessionTypeOpts}
                value={sessionTypeOpts.find(o => o.value===formData.sessionTypeId) || null}
                onChange={v => updateField('sessionTypeId', (v as SingleValue<Option>)?.value ?? '')}
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracks</label>
              <Select
                options={trackOpts}
                isMulti
                value={trackOpts.filter(o => formData.trackIds.includes(o.value))}
                onChange={v => updateField('trackIds', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programs</label>
              <Select
                options={progOpts}
                isMulti
                value={progOpts.filter(o => formData.programIds.includes(o.value))}
                onChange={v => updateField('programIds', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiences</label>
              <Select
                options={expOpts}
                isMulti
                value={expOpts.filter(o => formData.experienceIds.includes(o.value))}
                onChange={v => updateField('experienceIds', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
            </div>

            {/* ─── ATTRIBUTION ─────────────────────────────────────────── */}
            <SectionHeader
              title="Attribution"
              description="Orgs that lead, present, or sponsor this session. Tier (Iron / Carbon / etc.) is managed on the Org itself; the role here is contextual."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hosted By</label>
              <Select
                options={orgOpts}
                isMulti
                value={orgOpts.filter(o => formData.hosted_by_org_ids.includes(o.value))}
                onChange={v => updateField('hosted_by_org_ids', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
              {hostConflicts.map(c => (
                <ConflictChip key={`host-${c.entityId}`} conflict={c} />
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host Label <span className="text-gray-400 font-normal">(optional override)</span>
              </label>
              <input
                value={formData.host_label}
                onChange={e => updateField('host_label', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder='Default: "Hosted by"'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Presented By</label>
              <Select
                options={orgOpts}
                isMulti
                value={orgOpts.filter(o => formData.presented_by_org_ids.includes(o.value))}
                onChange={v => updateField('presented_by_org_ids', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
              {presenterConflicts.map(c => (
                <ConflictChip key={`pres-${c.entityId}`} conflict={c} />
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presenter Label <span className="text-gray-400 font-normal">(optional override)</span>
              </label>
              <input
                value={formData.presenter_label}
                onChange={e => updateField('presenter_label', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder='Default: "Presented by"'
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Sponsors <span className="text-gray-400 font-normal">(everyone else contributing)</span>
              </label>
              <Select
                options={orgOpts}
                isMulti
                value={orgOpts.filter(o => formData.organizationIds.includes(o.value))}
                onChange={v => updateField('organizationIds', (v as MultiValue<Option>).map(o => o.value))}
                styles={multiSelectStyles}
              />
            </div>

            {/* ─── ACCESS ──────────────────────────────────────────────── */}
            <SectionHeader title="Access" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
              <Select
                options={accessOpts}
                value={accessOpts.find(o => o.value===formData.accessLevelId) || null}
                onChange={v => updateField('accessLevelId', (v as SingleValue<Option>)?.value ?? '')}
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <Select
                options={GATING_OPTIONS}
                value={GATING_OPTIONS.find(o => o.value === formData.gating) || GATING_OPTIONS[0]}
                onChange={v => updateField('gating', (v as SingleValue<Option>)?.value as FormState['gating'] ?? 'public')}
              />
            </div>
          </div>

          {/* footer */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            {existing && isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Delete Session
              </button>
            ) : <div />}
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
